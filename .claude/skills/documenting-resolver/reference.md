# README Template for CyanPrint Resolvers

Use this template when generating README.MD for a resolver. Replace placeholders with actual values extracted from cyan.yaml and the entry point code.

---

# {artifact-name}

{description}

## Purpose

{purpose}

Explain what the resolver does at a high level: last-write-wins, priority-based selection, deep merge, concatenation, etc.

## Configuration Schema

| Key          | Type   | Default   | Description   |
| ------------ | ------ | --------- | ------------- |
| {config-key} | {type} | {default} | {description} |

List every key read from `input.config` in the resolver code. If the resolver has no configuration, state "This resolver requires no configuration."

## Resolution Strategy

{resolution-strategy}

Describe how the resolver decides the final content when multiple files conflict on the same path. Include:

- The algorithm used (e.g., sort by layer number, pick highest priority template, merge all)
- How ties are broken
- What happens with empty or missing content

## Commutativity and Associativity

CyanPrint may invoke the resolver with files in any order. The resolver must produce identical output regardless of input ordering. This resolver ensures commutativity by:

- (Describe sorting strategy)
- (Describe deduplication approach)
- (Describe deterministic priority rules)

## Merge Examples

### Example 1: {example-name}

**Input files** (all sharing the same path):

| Origin Template | Origin Layer | Content     |
| --------------- | ------------ | ----------- |
| {template-a}    | {layer-0}    | {content-a} |
| {template-b}    | {layer-1}    | {content-b} |

**Config**:

```yaml
{ config-values }
```

**Resolved output**:

```
{resolved-content}
```

{merge-examples}

Add additional examples as needed to illustrate edge cases and different configurations.

## Integration

Reference this resolver in a template's `cyan.yaml`:

```yaml
resolvers:
  - resolver: username/resolver-name:version
    config: {}
    files: ['**/*.json']
```
