# atomi/ignore

AtomiCloud's dot ignore merger. Merges `.gitignore`, `.dockerignore`, and similar dot-ignore files from multiple templates and layers into a single resolved output.

## Purpose

When multiple templates or layers contribute an ignore file (e.g., `.gitignore`, `.dockerignore`) to the same path, this resolver merges them into one file. Each template's patterns are combined into the final output.

## Resolution Strategy

The resolver picks the first file from the input and returns it as the resolved output. This is a stub implementation -- the full merge strategy (pattern concatenation with deduplication) has not yet been implemented.

When fully implemented, the resolver will:

- Concatenate all ignore patterns from every contributing file
- Deduplicate identical patterns
- Produce a single merged ignore file

## Configuration Schema

This resolver requires no configuration.

## Commutativity and Associativity

> **Note:** The current stub implementation is not commutative -- it always returns `files[0]`. The full implementation must guarantee commutativity and associativity.

The completed resolver will ensure commutativity by:

- Deduplicating patterns after concatenation, so input order does not affect the result
- Sorting patterns alphabetically, producing a deterministic output regardless of which template contributed which line

## Merge Examples

### Example 1: Single file, no conflict

**Input files** (all sharing the same path `.gitignore`):

| Origin Template | Origin Layer | Content                        |
| --------------- | ------------ | ------------------------------ |
| base            | 0            | `node_modules/\ndist/\n`      |

**Config**:

```yaml
{}
```

**Resolved output**:

```
node_modules/
dist/
```

## Integration

Reference this resolver in a template's `cyan.yaml`:

```yaml
resolvers:
  - resolver: atomi/ignore:1
    config: {}
    files: ['.gitignore', '.dockerignore', '.ignore']
```
