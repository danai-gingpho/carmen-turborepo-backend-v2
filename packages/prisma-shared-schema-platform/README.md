# @repo/prisma-shared-schema-platform

> Part of [Carmen Backend](../../README.md).

Platform Prisma schema + client — cross-tenant entities (users, clusters, business units, roles, permissions, subscriptions).

## Overview

Single Prisma schema shared by every service that reads platform-level
data. Consumers import the generated client; schema changes require
`bun run db:generate` here before dependent packages build successfully.

## Dev

```bash
cd packages/prisma-shared-schema-platform
bun run db:generate         # regenerate client after schema edits
bun run db:migrate          # apply pending migrations
bun run db:seed             # seed baseline data
bun run db:seed.permission  # seed permission catalog
```

## Interface

Import as `@repo/prisma-shared-schema-platform`. Main export: `PrismaClient`.

## Env

- `SYSTEM_DATABASE_URL` — primary connection string.
- `SYSTEM_DIRECT_URL` — direct (non-pooled) connection, used by migrations.

See the root [`CLAUDE.md`](../../CLAUDE.md) "Environment Setup" for the full env list.

## Links

- Root: [`README.md`](../../README.md) · [`CLAUDE.md`](../../CLAUDE.md)
- Deploy guide: [`docs/deploy-platform-schema.md`](../../docs/deploy-platform-schema.md)
- Conventions: [`CLAUDE.md`](../../CLAUDE.md) "Multi-Tenancy via Dual Prisma Schemas"

## Notes for agents

- UUID primary keys (`gen_random_uuid()`), soft deletes (`deleted_at`), audit fields (`created_at`, `created_by_id`, `updated_at`, `updated_by_id`) are expected on every model. Copy from an existing model when adding new ones.
- After editing `schema.prisma`, run `bun run db:generate` **before** running `bun run build` at the repo root, or consumer builds fail.
- Prisma with PostgreSQL `@db.Timestamptz` columns requires ISO strings at write time: `approval_date: date.toISOString()`.
