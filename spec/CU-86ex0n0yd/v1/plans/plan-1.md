# Plan 1: Implement Ignore Resolver

**Scope:** Complete resolver implementation with preprocessing, section parsing, merging, and comprehensive tests.

## Goal

Build the full `atomi/ignore` resolver that merges ignore files from multiple templates using section-based parsing with source tracking.

## Files to Modify

- `index.ts` — Replace stub with full resolver implementation
- `test.cyan.yaml` — Add comprehensive test cases (13+ scenarios)
- `inputs/` — Create input directories for each test case
- `snapshots/` — Create/update expected output snapshots

## Approach

### 1. Preprocessing Pipeline (`preprocess`)

Pure function: `string → string`. Chain of transforms on the raw file content:

1. **Backslash continuation** — join `\`-terminated lines to next line
2. **Split into lines**, strip trailing whitespace per line
3. **Discard comment lines** — first non-whitespace is `#` (but NOT `#### source:` lines)
4. **Strip inline comments** — remove ` #...` from pattern lines (after confirming not a `### ` or `#### ` header)
5. **Discard empty lines**

### 2. Section Parsing (`parseSections`)

Takes preprocessed lines + template name, returns `Section[]`:

- Scan for `### ` header lines
- Lines before first header → preamble section (header: null)
- Each `### ` line → new section with header text (everything after `### `)
- Lines starting with `#### source:` → extract comma-separated template names into the section's `sources` array; these are NOT patterns
- Remaining lines → patterns for current section
- If no headers found at all → wrap everything in `### <template-name>`

### 3. Merge Logic (`mergeSections`)

Takes `Section[]` from all files, returns `Section[]`:

1. Group by header (case-insensitive, preserve first-occurrence casing)
2. Preamble (null header) stays as preamble
3. For each group: collect patterns, dedupe, sort; collect sources, dedupe, sort
4. Sort sections: preamble first, then named sections alphabetically

### 4. Global Dedup (`globalDedup`)

After reconstruction, scan all pattern lines in order (preamble first, then sections A→Z). Remove duplicate lines, keeping first occurrence. Skip `#### source:` lines (they are metadata, not patterns).

### 5. Output Formatting (`formatOutput`)

Reconstruct the final file string from merged sections:

- Preamble patterns (no header, no source line)
- Blank line separator
- Each named section:
  - `### <name>` (header only, no inline source)
  - `#### source: <source-a, source-b>` (source line, always present)
  - Pattern lines, sorted alphabetically
- One blank line between sections

### 6. Entry Point

Wire it all together in `index.ts` using `StartResolverWithLambda`. Validate inputs (empty files list, mismatched paths). Sort files by layer/template for commutativity.

## Test Cases

| # | Name | Inputs | Key Behavior |
|---|------|--------|-------------|
| 1 | single_file_resolve | 1 file with sections | Passthrough + `#### source:` line |
| 2 | two_files_shared_section | 2 files, same section name | Dedup + sort + merged sources |
| 3 | two_files_no_shared_sections | 2 files, different sections | All included, alphabetical |
| 4 | no_sections | 2 files, no `### ` headers | Wrapped in `### <template>` |
| 5 | mixed_with_without_sections | 1 with sections, 1 without | Wrapping + normal merge |
| 6 | preamble_and_sections | 2 files with preambles | Preamble merged, sections sorted |
| 7 | negation_patterns | Files with `!keep-this` | Treated as opaque, deduped |
| 8 | trailing_whitespace | Files with trailing spaces | Stripped |
| 9 | empty_file | 1 empty + 1 normal | Empty is no-op |
| 10 | three_files_same_section | 3 files, same section | Triple merge |
| 11 | comment_lines | Files with `# comments` | Comments discarded |
| 12 | inline_comments | `pattern # comment` | Inline comment stripped |
| 13 | backslash_continuation | `long-\npattern` | Lines joined |
| 14 | commutativity_ab | A then B | Same output as ba |
| 15 | commutativity_ba | B then A | Same snapshot as ab |

Tests 14+15 share the same snapshot directory to verify commutativity.

## Implementation Checklist (from task-spec)

- [ ] Preprocessing: strip trailing whitespace, backslash continuation, discard comments, strip inline comments, discard empty lines
- [ ] Parse sections: preamble detection, `### ` headers, `#### source:` extraction, wrapping for no-header files
- [ ] Merge: group by header (case-insensitive), dedupe patterns, sort patterns, merge sources
- [ ] Sort sections alphabetically (preamble first)
- [ ] Global dedup pass (keep first occurrence in file order, skip `#### source:` lines)
- [ ] Format output: `### name` header + `#### source:` line on separate line, blank line normalization
- [ ] Commutativity: sort inputs by layer/template before processing
- [ ] Input validation: empty files list, mismatched paths
- [ ] All 15 test cases passing
