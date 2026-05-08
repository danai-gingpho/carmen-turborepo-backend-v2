# @repo/prisma-shared-schema-tenant

> Part of [Carmen Backend](../../README.md).

Tenant Prisma schema + client — per-tenant entities (products, inventory, procurement, recipes, vendors, locations).

## Overview

One schema per tenant, generated from a single shared definition.
Services connect to tenant databases at runtime using the connection
details resolved by `micro-cluster` / `micro-business`.

## Dev

```bash
cd packages/prisma-shared-schema-tenant
bun run db:generate     # regenerate client after schema edits
bun run db:migrate      # apply pending migrations to a tenant DB
bun run db:seed         # seed baseline tenant data
```

## Interface

Import as `@repo/prisma-shared-schema-tenant`. Main export: `PrismaClient`.

## Env

Tenant DB connection strings follow the pattern used by the platform schema
(see [`CLAUDE.md`](../../CLAUDE.md) "Environment Setup"). Each tenant DB uses
its own schema name within a shared PostgreSQL server; connection details
are resolved by `micro-cluster` / `micro-business`.

## Links

- Root: [`README.md`](../../README.md) · [`CLAUDE.md`](../../CLAUDE.md)
- Deploy guide: [`docs/deploy-tenant-schema.md`](../../docs/deploy-tenant-schema.md)
- Conventions: [`CLAUDE.md`](../../CLAUDE.md) "Multi-Tenancy via Dual Prisma Schemas"

## Notes for agents

- Same conventions as platform schema: UUID PKs, soft deletes, audit fields.
- Recipe tables historically lagged behind master data on new-tenant deploys — re-run `bun run db:migrate` inside this package after provisioning a tenant _(stale — needs rewrite)_.
- Changes here affect every tenant DB; migration must be idempotent and forward-compatible.
