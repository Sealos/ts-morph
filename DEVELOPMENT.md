# Prerequisites

This project requires Node.js 22.12 or newer and npm. It uses the native TypeScript 7.1 compiler.

# Getting Started

Install Node.js 22.12 or newer.

Run in root of repo:

```bash
# installs, sets up, and builds all the packages for development
npm run setup
```

# Packages

- [packages/ts-morph](packages/ts-morph)
- [packages/bootstrap](packages/bootstrap)
- [packages/common](packages/common) - Common code used by both of the packages above.
- [packages/scripts](packages/scripts) - Common scripts used at development time by both packages.

# Commands

```bash
# build (run in root dir or per package)
npm run build
# run tests (run in root dir or per package)
npm test
# format
npm run format
```

Run `npm run type-check` to check all packages. See [the migration guide](docs/typescript-7.1.md) for native resource ownership and API changes.
