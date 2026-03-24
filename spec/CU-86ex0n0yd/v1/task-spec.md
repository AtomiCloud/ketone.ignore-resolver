# Task Spec: Ignore Resolver (atomi/ignore)

**Ticket:** CU-86ex0n0yd
**Version:** 1
**Language:** TypeScript (Bun runtime)
**Artifact:** `atomi/ignore`

## Objective

Build a CyanPrint resolver that merges `.gitignore`, `.dockerignore`, `.prettierignore`, `.eslintignore`, `.stylelintignore`, and similar ignore files when multiple templates contribute the same file path.

The resolver receives multiple file contents (each tagged with an origin template name) and produces a single merged file.

## Core Merge Algorithm

### Preprocessing

1. **Strip trailing whitespace** from every line
2. **Backslash line continuation** — join lines ending with `\` to the next line (gitignore spec). The `\` and newline are removed; the lines become one.
3. **Discard comment lines** — lines where the first non-whitespace character is `#`. These are NOT preserved in output.
4. **Strip inline comments** — on pattern lines, remove everything from the first ` #` to end-of-line. Only applies to non-header lines.
5. **Discard empty lines** after stripping

### Parsing

- **Lines before the first `### ` header** are the **preamble** (root section).
- **Lines starting with `### ` (triple hash + space)** are **section headers**. The header text is everything after `### `.
- **Lines starting with `#### source:` (four hashes + space + "source:")** are **source metadata lines**. These are extracted during parsing to populate the `sources` field; they are NOT treated as patterns. Multiple comma-separated template names follow the `:` prefix.
- **Everything else** is a **pattern line** (including negation `!foo`, globstar `**/foo`, directory patterns `foo/`, etc.).
- If a file has **no `### ` headers at all**, wrap its entire content in `### <template-name>` where `<template-name>` comes from `file.origin.template`.
- If a file has a preamble (content before first `### `), that preamble content belongs to the root section.

### Section Data Model

```
Section = {
  header: string | null,       // null for preamble, "### Section Name" otherwise
  patterns: string[],          // deduped, sorted
  sources: string[]            // sorted template names
}
```

### Merge Logic

1. Parse each input file into sections (preamble + named sections), tagged with its source template name.
2. **Group sections by header name** (case-insensitive). Preserve the original casing from first occurrence.
3. **For same-named sections:**
   - Collect all pattern lines from all versions
   - Deduplicate (exact string match)
   - Sort alphabetically
   - Collect all source template names, dedupe, sort
4. **Sort all section names alphabetically** (preamble always comes first, before any named sections).
5. **Global dedup pass:** After reconstruction, scan all non-blank, non-header lines across the entire file. Remove duplicates, keeping the first occurrence (preamble first, then sections in alphabetical order).
6. **Normalize blank lines:** One blank line between sections, none within sections.

### Section Header Format

- **Section header:** `### Node template` (no source info inline)
- **Source line:** `#### source: template-a, template-b` — always on its own line immediately after the section header
- **Single source:** `#### source: template-a`
- **Multiple sources:** `#### source: template-a, template-b`
- **Preamble:** No header line. Preamble patterns appear at the top of the file, before any named sections.

### Output Construction

1. Preamble patterns (if any), one per line
2. Blank line (if preamble exists and named sections follow)
3. For each named section (alphabetically):
   - Blank line (between sections)
   - Header line: `### <section-name>`
   - Source line: `#### source: <source-a, source-b>`
   - Pattern lines, sorted alphabetically

## Commutativity

The merge result MUST be identical regardless of input file order. This is guaranteed by:
- Case-insensitive section grouping
- Alphabetical sorting of sections and patterns
- Sorted source template lists
- Global dedup keeping first occurrence in deterministic (alphabetical) order

## Edge Cases

| Case | Behavior |
|------|----------|
| Single file input (1 input) | Passthrough — still adds `#### source:` line under headers, still normalizes |
| File with no `### ` headers | Wrap content in `### <template-name>`, merge normally |
| Pattern in multiple sections | Global dedup keeps first occurrence (preamble first, then alphabetical sections) |
| Negation patterns (`!keep-this`) | Treated as opaque text, deduped and sorted normally |
| Empty section after dedup | Section header still included (with sources) |
| Empty file as input | No-op contributor — no section created, no preamble contribution |
| Mixed: some files with sections, some without | Files without sections get wrapped, then all merge normally |
| Trailing whitespace | Stripped from every line during preprocessing |
| Comment-only lines | Discarded during preprocessing |
| Inline comments (`pattern # comment`) | `# comment` stripped, only pattern portion kept |
| Backslash continuation | Lines joined before any other processing |
| Three files, same section | Triple dedup + sort, all three sources listed |
| `#### source:` lines in input | Parsed as source metadata, not patterns; sources merged into the section's source list |
| Previously-resolved output reprocessed | `#### source:` lines are unambiguously parsed — no heuristic needed, full associativity |

## Constraints

- Each file path is resolved independently (e.g., `.gitignore` and `.dockerignore` are separate invocations)
- Output must be deterministic for the same set of inputs
- External dependencies allowed if they simplify the implementation
- Must pass `cyanprint test resolver .` with comprehensive test coverage

## Out of Scope

- Line continuation beyond trailing `\` (e.g., `\\` escaping)
- Pattern validation or gitignore syntax checking
- Handling of files that are not ignore files
