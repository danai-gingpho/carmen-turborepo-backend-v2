# @repo/eslint-config

> Part of [Carmen Backend](../../README.md).

Shared ESLint configurations used by every Carmen package and app.

## Overview

Four shareable configs: `base` (core rules), `nestjs` (NestJS-specific),
`next-js` (Next.js), `react-internal` (React internals). Consumer
packages import one of them into their `eslint.config.js` and inherit
the full ruleset — no per-app rule drift.

## Interface

Exports:
- `@repo/eslint-config/base`
- `@repo/eslint-config/nestjs`
- `@repo/eslint-config/next-js`
- `@repo/eslint-config/react-internal`

Usage in a consumer `eslint.config.js`:

```js
import nestJsConfig from "@repo/eslint-config/nestjs";
export default [...nestJsConfig];
```

## Links

- Root: [`README.md`](../../README.md) · [`CLAUDE.md`](../../CLAUDE.md)
- Code conventions: [`CLAUDE.md`](../../CLAUDE.md) "Code Conventions"

## Notes for agents

- Adjust rules **here**, not in per-app `eslint.config.js`. Every consumer inherits.
- When adding a new rule, run `bun run lint` in at least one consumer package (e.g., `apps/backend-gateway`) to catch breakages before merging.
