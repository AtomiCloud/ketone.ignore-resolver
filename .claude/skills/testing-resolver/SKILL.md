---
name: testing-resolver
description: Test this CyanPrint resolver. Use when the user asks to write resolver tests, add test cases with conflicting files, update snapshots, or debug resolver test failures. Covers test.cyan.yaml format with resolver_inputs (directory paths with origin), config, and expected output.
---

# Testing this Resolver

## Step 1: Understand what to test

Read the entry point code (`cyan/index.ts` or equivalent) to find:

- What `input.config` keys the resolver reads (e.g., `config.strategy`, `config.preserveKeys`)
- What resolution strategy it uses (last-wins, deep-merge, priority-based)
- How it uses `FileOrigin` (template name, layer number)

## Step 2: Prepare input directories

Create separate directories for each template/layer's version of the conflicting file(s):

```
inputs/
└── deep-merge/
    ├── template-a/
    │   └── package.json
    └── template-b/
        └── package.json
```

Each directory contains the files as produced by that template/layer.

## Step 3: Write test.cyan.yaml

Create a `test.cyan.yaml` file in the resolver root:

```yaml
tests:
  - name: 'merge-two-files'
    expected:
      type: snapshot
      value:
        path: ./snapshots/merge-two-files
    resolver_inputs:
      - path: ./inputs/deep-merge/template-a
        origin:
          template: template-a
          layer: 0
      - path: ./inputs/deep-merge/template-b
        origin:
          template: template-b
          layer: 1
    config:
      strategy: deep-merge
```

### resolver_inputs

Each entry specifies a directory path containing conflicting files and the origin metadata:

```yaml
resolver_inputs:
  - path: ./inputs/deep-merge/template-a
    origin:
      template: template-a
      layer: 0
  - path: ./inputs/deep-merge/template-b
    origin:
      template: template-b
      layer: 1
```

- `path`: directory containing the template's files
- `origin.template`: which template produced these files (string)
- `origin.layer`: layer number (number, NOT string — do NOT quote it)

### config

Keys must match the `input.config` keys your resolver actually reads. Extract them from the entry point code — do NOT invent fictional config keys.

### expected

Declares expected resolved output using a snapshot path:

```yaml
expected:
  type: snapshot
  value:
    path: ./snapshots/merge-two-files
```

## Step 4: Run and iterate

```bash
# Run all resolver tests
cyanprint test resolver .

# Update snapshots after intentional changes
cyanprint test resolver . --update-snapshots
```

## Commutativity Testing

Always include tests that verify the resolver produces the same output regardless of input order:

**Note**: There is no official commutativity checker. You must manually verify commutativity by writing tests with swapped input order that snapshot to the same output directory:

```yaml
tests:
  - name: 'commutativity-order-1'
    expected:
      type: snapshot
      value:
        path: ./snapshots/commutative-result
    resolver_inputs:
      - path: ./inputs/commutative/template-a
        origin:
          template: template-a
          layer: 0
      - path: ./inputs/commutative/template-b
        origin:
          template: template-b
          layer: 1
    config:
      strategy: deep-merge

  - name: 'commutativity-order-2'
    expected:
      type: snapshot
      value:
        path: ./snapshots/commutative-result
    resolver_inputs:
      - path: ./inputs/commutative/template-b
        origin:
          template: template-b
          layer: 1
      - path: ./inputs/commutative/template-a
        origin:
          template: template-a
          layer: 0
    config:
      strategy: deep-merge
```

Both tests snapshot to the same `commutative-result` directory.

See [reference.md](./reference.md) for complete examples.
