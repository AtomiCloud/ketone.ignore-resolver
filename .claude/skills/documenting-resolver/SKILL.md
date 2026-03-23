---
name: documenting-resolver
description: Document this CyanPrint resolver into README.MD. Use when the user asks to document the resolver, write a README, explain conflict resolution strategy, or describe merge behavior. Reads cyan.yaml and entry point code to extract config schema and resolution logic.
---

# Documenting this Resolver

## Step 1: Understand the artifact

Read `cyan.yaml` to extract:

- **name**: The resolver's full identifier (e.g., `username/resolver-name`)
- **description**: What the resolver does
- **tags**: Categories for discoverability
- **build**: Image registry information

Read the entry point code (`cyan/index.ts` or equivalent for other languages) to extract:

- What `input.config` keys the resolver reads
- How it ensures commutativity (same result regardless of input order)
- How it ensures associativity (pair-wise resolution same as all-at-once)
- How config keys affect merge behavior

## Step 2: Generate README.MD

Follow the section template in [reference.md](./reference.md).

The README must include:

1. **Title** — the resolver name from `cyan.yaml`
2. **Description** — from `cyan.yaml`
3. **Purpose** — what resolution strategy is used
4. **Configuration Schema** — a table of key, type, default, description for each config entry, and how it affects merge behavior
5. **Guarantees** — how commutativity, associativity, and determinism are ensured (sort, deduplicate, etc.)
6. **Merge Examples** — showing input files with different origins and the resolved output

## Step 3: Write README.MD

Write the generated README.MD to the project root.
