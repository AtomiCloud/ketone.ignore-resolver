# CLAUDE.md - CyanPrint Resolver

This file provides guidance to Claude Code when working with CyanPrint resolvers.

## Project Overview

This is a CyanPrint resolver project. Resolvers handle conflicts when multiple templates or layers contribute files to the same path. They receive all conflicting files and produce a single resolved output.

## Key Files

```
├── cyan/
│   ├── index.ts              # Resolver entry point - StartResolverWithLambda
│   ├── src/
│   │   └── *.ts              # Resolver logic modules
│   ├── package.json          # Dependencies (@atomicloud/cyan-sdk)
│   └── tsconfig.json         # TypeScript configuration
├── resolver/                  # Resolver artifact files (language-specific)
│   ├── {language}/           # Language-specific implementations
│   └── common/               # Shared files
├── .claude/skills/            # Claude Code skills
├── cyan.yaml                 # Resolver metadata and configuration
├── cyan/Dockerfile           # Resolver runtime container
├── cyan/blob.Dockerfile      # Blob storage container
├── test.cyan.yaml            # Test configuration
└── scripts/
    └── publish.sh            # Build and push script
```

## Development Workflow

### 1. Edit Resolver Files

Modify files in `resolver/` directories to change conflict resolution behavior.

### 2. Test Locally

```bash
cyanprint test resolver .
cyanprint test resolver . --verbose
cyanprint test resolver . --update-snapshots
```

### 3. Publish

Authentication is required via `--token` flag or `CYAN_TOKEN` environment variable. The `--token` and `--message` flags must come before the artifact type subcommand.

```bash
# Build and push (requires tag argument for --build)
cyanprint push --token TOKEN --message "commit message" resolver --build v1.0.0

# Push only (no build)
cyanprint push --token TOKEN --message "commit message" resolver
```

## Skill Workflow

When working on this resolver, follow this skill sequence:

1. **Writing skill** (`writing-resolver-{language}`) — implement resolver logic, entry point, and conflict resolution
2. **Testing skill** (`testing-resolver`) — write and run test cases in `test.cyan.yaml`
3. **Documenting skill** (`documenting-resolver`) — update `CLAUDE.md` and documentation

Detailed SDK types (ResolverInput, ResolvedFile, ResolverOutput) and commutativity requirements are documented in the writing skill. Refer to it for implementation details.

## Using in Templates

Reference resolver in template's cyan.yaml:

```yaml
resolvers:
  - resolver: username/resolver-name:1
    config: {}
    files: ['**/*.json']
```

## Registry

- Browse: https://cyanprint.dev/registry
- API: `https://api.zinc.sulfone.raichu.cluster.atomi.cloud/api/v1/Resolver`
