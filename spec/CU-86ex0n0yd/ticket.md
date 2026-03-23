# Ticket: CU-86ex0n0yd

- **Type**: Task
- **Status**: in progress
- **URL**: https://app.clickup.com/t/86ex0n0yd
- **Parent**: none
- **Priority**: high
- **Tags**: dept:engineering, platform:ketone

## Description

Overview

Repo: ketone.ignore-resolver
Artifact: atomi/ignore
Language: TypeScript
Purpose: Merge .gitignore, .dockerignore, and similar ignore files when multiple CyanPrint templates contribute the same file.

Approach

Section-based parsing with source tracking. Split by ### headers, sort sections alphabetically, dedupe patterns globally, and tag each section with its source template(s).

Commutativity

Sort sections alphabetically and patterns alphabetically (deterministic regardless of input order).

File Matching

Config in template's cyan.yaml:

resolvers:
  - resolver: atomi/ignore:1
    files: ['.gitignore', '.dockerignore', '.prettierignore', '.eslintignore', '.stylelintignore']

Input Structure

node_modules/
dist/

### Node template
*.log
.env

### IDE
.vscode/
.idea/

### Build
out/

Convention

# lines are comments — ignored during merge (not preserved)
Lines starting with ###  (triple hash + space) are section headers
Everything else is a pattern line (including negation patterns like !keep-this)
Blank lines separate sections visually but don't affect merge logic
Globstar patterns (**/foo) are opaque text — deduped and sorted like any other line
Negation patterns (!foo) are also opaque text — deduped and sorted normally

Merge Strategy

Parse each input into sections:
Lines before the first ### header are the preamble (root section)
Each section = { header: "### Node template", patterns: ["*.log", ".env"], sources: ["template-a"] }
If a file has no ### headers at all: wrap its content in ### <template-name> as a section
Group sections by header name (case-insensitive)
For same-named sections:
Collect all pattern lines from all versions
Deduplicate (exact match)
Sort alphabetically
Collect all source template names, dedupe, sort
Sort all section names alphabetically
Global dedup pass: after reconstruction, scan all non-blank, non-header lines across the entire file and remove duplicates (keeps first occurrence). This catches patterns that appear in multiple sections.
Normalize blank lines: one blank line between sections, none within sections

Section Header Format

Each section header includes its source template(s):

Single source: ### Node template [template-a]
Multiple sources: ### Node template [template-a, template-b]

Example: Files with Sections

Template A (.gitignore):

node_modules/

### Node template
*.log

Template B (.gitignore):

.env
node_modules/

### Node template
*.log
build/

### IDE
.idea/

Merged:

.env
node_modules/

### IDE [template-b]
.idea/

### Node template [template-a, template-b]
build/
*.log

Example: Files without Sections

Template A (.dockerignore):

node_modules/
dist/

Template B (.dockerignore):

.env

Merged:

### template-a
dist/
node_modules/

### template-b
.env

Example: Mixed (some with sections, some without)

Template A (.gitignore):

node_modules/

Template B (.gitignore):

### IDE
.vscode/

Merged:

### IDE [template-b]
.vscode/

### template-a
node_modules/

Edge Cases

File with no ### headers → wrap in ### <template-name> per input
Single file resolution (1 input) → passthrough (still adds source tag to headers)
Pattern appearing in multiple sections → global dedup keeps first occurrence
Negation patterns (!keep-this) → treated as opaque text, deduped normally
Empty section after dedup → still include the section header
Trailing whitespace → strip from each line
Comment-only lines → discarded during merge
Multiple files to resolve (e.g., .gitignore + .dockerignore) → each file resolved independently

Testing Plan

Single file resolution (1 input → passthrough with source tag)
Two files, no shared sections → all sections included, alphabetically sorted
Two files, shared section name → patterns deduped + sorted, sources concatenated
Two files, no sections at all → wrapped in ### <template-name>, merged
Mixed: one input with sections, one without
Pattern appearing in both preamble and a section → global dedup catches it
Negation patterns preserved and deduped correctly
Trailing whitespace normalization
Empty content after dedup → section still included
Source tag: single source, multiple sources
Three files, all same section → triple dedup + sorted, three sources
Comment lines discarded
.dockerignore (typically shorter/simpler than .gitignore)
