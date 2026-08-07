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

| Key            | Type   | Default        | Description                                                                                    |
| -------------- | ------ | -------------- | ---------------------------------------------------------------------------------------------- |
| `sectionOrder` | string | `alphabetical` | Strategy for ordering `### <group>` sections in the final output. See [Strategies](#strategies). |

### Strategies

`sectionOrder` accepts one of four values — the same four, with the same names and the same meanings, as `atomi/md`:

| Value                  | Behavior                                                    |
| ---------------------- | ------------------------------------------------------------- |
| `alphabetical`         | Sort by group name (A–Z)                                      |
| `reverse-alphabetical` | Sort by group name (Z–A)                                      |
| `lowest-layer-first`   | Sort by origin layer ascending (layer 0 before layer 1)       |
| `highest-layer-first`  | Sort by origin layer descending (layer 1 before layer 0)      |

Any other value throws, naming the field and the valid set.

Two details that follow from the mechanism:

- **The unnamed preamble sorts as the empty string.** Under `alphabetical` it stays first, which is the historical behaviour; under `reverse-alphabetical` it lands last; under the layer strategies it sits at its own layer's position.
- **A group contributed by several templates takes one origin.** Under `highest-layer-first` that is its highest-layer contributor; under every other strategy, its lowest. Layer ties break on template name ascending.

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
