import { type ResolverOutput, StartResolverWithLambda, type ResolverInput } from '@atomicloud/cyan-sdk';

interface Section {
  header: string | null; // null for preamble
  patterns: string[];
  sources: string[];
}

// ─── 1. Preprocessing ───────────────────────────────────────────────

function preprocess(raw: string): string[] {
  // 1. Backslash continuation — join lines ending with \ (handles both LF and CRLF)
  let joined = raw.replace(/\\\r?\n/g, '');

  // 2. Split into lines, strip trailing whitespace
  const lines = joined.split('\n').map((l) => l.replace(/\s+$/, ''));

  // 3. Discard comment lines (first non-whitespace is #)
  // 4. Strip inline comments (but not ### or #### headers)
  // 5. Discard empty lines
  const result: string[] = [];
  for (const line of lines) {
    const trimmed = line.trimStart();
    // Full comment line — keep #### source: lines (they carry source metadata)
    if (/^#/.test(trimmed)) {
      // Keep ### and #### headers — they are section/source markers
      if (/^### /.test(trimmed) || /^#### source:/.test(trimmed)) {
        result.push(trimmed);
      }
      // Skip all other comment lines
      continue;
    }
    // Strip inline comments — remove " #..." from pattern lines
    // but NOT if it's ###  or ####  (those are headers)
    const commentIdx = line.indexOf(' #');
    let stripped: string;
    if (commentIdx >= 0) {
      // Check if this looks like a header line before stripping
      const beforeComment = line.slice(0, commentIdx);
      if (/^### |^#### source:/.test(beforeComment)) {
        stripped = line;
      } else {
        stripped = beforeComment.replace(/\s+$/, '');
      }
    } else {
      stripped = line;
    }
    // Discard empty lines
    if (stripped.length > 0) {
      result.push(stripped);
    }
  }
  return result;
}

// ─── 2. Section Parsing ─────────────────────────────────────────────

function parseSections(lines: string[], templateName: string): Section[] {
  const sections: Section[] = [];
  let current: Section | null = null;

  for (const line of lines) {
    if (/^### /.test(line)) {
      // New section header
      let header = line.slice(4).trim();
      // Handle inline source tags like "### node [template-a, template-b]"
      // These come from old-format output or manual formatting
      let extractedSources: string[] = [templateName];
      const tagMatch = header.match(/\s+\[([^\]]+)\]$/);
      if (tagMatch) {
        const sourceStr = tagMatch[1];
        const items = sourceStr
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
        // Strip as source tag if all items look like identifiers
        // (e.g. [v18], [base, foo] — but NOT [edition 2021] which has spaces)
        const allIdentifiers = items.every((item) => /^[\w.\-]+$/.test(item));
        if (allIdentifiers) {
          header = header.slice(0, tagMatch.index!).trimEnd();
          extractedSources = items;
        }
        // Otherwise keep bracket as part of the header name
      }
      current = { header, patterns: [], sources: extractedSources };
      sections.push(current);
    } else if (/^#### source:/.test(line)) {
      // Extract sources from #### source: line (new format)
      const sourceContent = line.slice(12).trim(); // "#### source:".length = 12
      const sources = sourceContent
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      if (current !== null) {
        // Merge sources, avoiding duplicates
        for (const src of sources) {
          if (!current.sources.includes(src)) {
            current.sources.push(src);
          }
        }
      }
      // This line is NOT a pattern — skip adding to patterns
    } else {
      if (current === null) {
        current = { header: null, patterns: [], sources: [templateName] };
        sections.push(current);
      }
      current.patterns.push(line);
    }
  }

  // If no headers found, wrap everything in ### <template-name>
  const hasHeaders = sections.some((s) => s.header !== null);
  if (!hasHeaders && sections.length > 0) {
    // All content is preamble — wrap in a named section
    const allPatterns = sections.flatMap((s) => s.patterns);
    return [{ header: templateName, patterns: allPatterns, sources: [templateName] }];
  }

  return sections;
}

// ─── 3. Merge Sections ──────────────────────────────────────────────

function mergeSections(allSections: Section[]): Section[] {
  // Group by header (case-insensitive, preserve first-occurrence casing)
  const headerOrder: string[] = [];
  const headerCasingMap = new Map<string, string>();
  const groups = new Map<string, Section[]>();

  for (const section of allSections) {
    const key = section.header === null ? '\0preamble' : section.header.toLowerCase();
    if (!groups.has(key)) {
      groups.set(key, []);
      headerOrder.push(key);
    }
    if (section.header !== null && !headerCasingMap.has(key)) {
      headerCasingMap.set(key, section.header);
    }
    groups.get(key)!.push(section);
  }

  const merged: Section[] = [];
  for (const key of headerOrder) {
    const group = groups.get(key)!;
    const isPreamble = key === '\0preamble';
    const header = isPreamble ? null : headerCasingMap.get(key)!;

    const patternSet = new Set<string>();
    const patterns: string[] = [];
    for (const s of group) {
      for (const p of s.patterns) {
        if (!patternSet.has(p)) {
          patternSet.add(p);
          patterns.push(p);
        }
      }
    }
    patterns.sort();

    const sourceSet = new Set<string>();
    const sources: string[] = [];
    for (const s of group) {
      for (const src of s.sources) {
        if (!sourceSet.has(src)) {
          sourceSet.add(src);
          sources.push(src);
        }
      }
    }
    sources.sort();

    merged.push({ header, patterns, sources });
  }

  // Sort sections: preamble first, then named sections alphabetically
  merged.sort((a, b) => {
    if (a.header === null) return -1;
    if (b.header === null) return 1;
    return a.header.localeCompare(b.header);
  });

  return merged;
}

// ─── 4. Global Dedup ────────────────────────────────────────────────

function globalDedup(sections: Section[]): Section[] {
  const seen = new Set<string>();
  const result: Section[] = [];

  for (const section of sections) {
    const dedupedPatterns: string[] = [];
    for (const p of section.patterns) {
      if (!seen.has(p)) {
        seen.add(p);
        dedupedPatterns.push(p);
      }
    }
    // Per spec: "Empty section after dedup → Section header still included (with sources)"
    result.push({ ...section, patterns: dedupedPatterns });
  }

  return result;
}

// ─── 5. Output Formatting ───────────────────────────────────────────

function formatOutput(sections: Section[]): string {
  const lines: string[] = [];

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];

    // Add blank line separator between sections (not before first)
    if (i > 0) {
      lines.push('');
    }

    if (section.header !== null) {
      // Named section: header on one line, source on next
      lines.push(`### ${section.header}`);
      lines.push(`#### source: ${section.sources.join(', ')}`);
    }

    for (const pattern of section.patterns) {
      lines.push(pattern);
    }
  }

  return lines.join('\n') + '\n';
}

// ─── Entry Point ────────────────────────────────────────────────────

StartResolverWithLambda(async (input: ResolverInput): Promise<ResolverOutput> => {
  const { files } = input;

  if (files.length === 0) {
    throw new Error('Resolver received no files — at least 1 file is required');
  }

  const uniquePaths = new Set(files.map((f) => f.path));
  if (uniquePaths.size > 1) {
    throw new Error(
      `Resolver received files with different paths: ${[...uniquePaths].join(', ')} — all files must have the same path`,
    );
  }

  const path = files[0].path;

  // Sort for commutativity (layer ascending, then template name)
  const sorted = [...files].sort((a, b) => {
    if (a.origin.layer !== b.origin.layer) return a.origin.layer - b.origin.layer;
    return a.origin.template.localeCompare(b.origin.template);
  });

  // Filter out empty files
  const nonEmpty = sorted.filter((f) => f.content.trim().length > 0);
  if (nonEmpty.length === 0) {
    return { path, content: '' };
  }

  // Parse sections for each file
  const allSections: Section[] = [];
  for (const file of nonEmpty) {
    const lines = preprocess(file.content);
    if (lines.length > 0) {
      const sections = parseSections(lines, file.origin.template);
      allSections.push(...sections);
    }
  }

  if (allSections.length === 0) {
    return { path, content: '' };
  }

  // Merge sections
  const merged = mergeSections(allSections);

  // Global dedup
  const deduped = globalDedup(merged);

  // Format output
  const content = formatOutput(deduped);

  return { path, content };
});
