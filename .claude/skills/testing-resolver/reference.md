# CyanPrint Resolver Test Reference

## test.cyan.yaml Format

```yaml
tests:
  - name: 'test-case-name'
    expected:
      type: snapshot
      value:
        path: ./snapshots/test-case-name
    resolver_inputs:
      - path: ./inputs/test/template-a
        origin:
          template: template-a
          layer: 0
      - path: ./inputs/test/template-b
        origin:
          template: template-b
          layer: 1
    config:
      strategy: deep-merge
```

## Complete Examples

### Deep Merge JSON

```
inputs/
└── deep-merge/
    ├── base-template/
    │   └── package.json
    └── extended-template/
        └── package.json
```

```yaml
tests:
  - name: 'deep-merge-json'
    expected:
      type: snapshot
      value:
        path: ./snapshots/deep-merge-json
    resolver_inputs:
      - path: ./inputs/deep-merge/base-template
        origin:
          template: base-template
          layer: 0
      - path: ./inputs/deep-merge/extended-template
        origin:
          template: extended-template
          layer: 1
    config:
      strategy: deep-merge
      preserveKeys:
        - name
        - version
```

### Priority by Layer

```
inputs/
└── priority/
    ├── base/
    │   └── settings.yaml
    ├── production/
    │   └── settings.yaml
    └── dev-overlay/
        └── settings.yaml
```

```yaml
tests:
  - name: 'priority-by-layer'
    expected:
      type: snapshot
      value:
        path: ./snapshots/priority-by-layer
    resolver_inputs:
      - path: ./inputs/priority/base
        origin:
          template: base
          layer: 0
      - path: ./inputs/priority/production
        origin:
          template: production
          layer: 1
      - path: ./inputs/priority/dev-overlay
        origin:
          template: dev-overlay
          layer: 2
    config:
      strategy: highest-layer-wins
```

### Commutativity Check

```
inputs/
└── commutative/
    ├── template-a/
    │   └── config.json
    └── template-b/
        └── config.json
```

```yaml
tests:
  - name: 'commutativity-order-1'
    expected:
      type: snapshot
      value:
        path: ./snapshots/commutative-merge-result
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
        path: ./snapshots/commutative-merge-result
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

Both tests snapshot to the same `commutative-merge-result` directory.

## Key Points

### resolver_inputs

- Each entry specifies a **directory path** containing that template/layer's files
- Each entry has an `origin` with `template` (string) and `layer` (number)
- **`layer` is a number** (0, 1, 2, etc.), NOT a string — do not quote it

### origin structure

```yaml
origin:
  template: template-name # string: which template produced this file
  layer: 0 # number: layer number (numeric priority)
```

### config

The `config` section maps directly to `input.config` in the resolver code. Use keys that match what the resolver reads.

### expected

Declares expected resolved output via snapshot directory path:

```yaml
expected:
  type: snapshot
  value:
    path: ./snapshots/test-case-name
```

## Directory Layout

```
resolver-root/
├── inputs/
│   ├── deep-merge/
│   │   ├── base-template/
│   │   │   └── package.json
│   │   └── extended-template/
│   │       └── package.json
│   └── commutative/
│       ├── template-a/
│       │   └── config.json
│       └── template-b/
│           └── config.json
├── snapshots/
│   ├── deep-merge-json/
│   │   └── package.json
│   └── commutative-merge-result/
│       └── config.json
├── cyan/
│   └── index.ts
├── cyan.yaml
└── test.cyan.yaml
```

## Running Tests

```bash
# Run all tests
cyanprint test resolver .

# Update snapshots
cyanprint test resolver . --update-snapshots
```
