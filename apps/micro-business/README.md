# micro-business

> Part of [Carmen Backend](../../README.md).

Consolidated business-logic microservice — auth, clusters, inventory, master data, procurement, recipes, logging, notifications.

## Overview

`micro-business` absorbed what used to be five separate services
(`micro-authen`, `micro-tenant-inventory`, `micro-tenant-master`,
`micro-tenant-procurement`, `micro-tenant-recipe`). It exposes domain
modules as TCP `@MessagePattern()` handlers that the gateway forwards
to. Both Prisma clients (`platform` + `tenant`) are consumed here —
platform for user/role/cluster resolution, tenant for business data.

## Dev

```bash
cd apps/micro-business
bun run start:dev
```

Ports (from `src/main.ts`):
- TCP: `:5020`
- HTTP: `:6020`

## Interface

Domain modules under `src/`: `authen`, `inventory`, `master`, `procurement`,
`log`, `notification`, `tenant`. Each module registers TCP `@MessagePattern()`
handlers consumed by the gateway's per-route `@Client.send()`.

MessagePattern naming convention: `<domain>.<verb>`.

## Env

Key variables (see [`apps/micro-business/.env.example`](.env.example) for the full list):
- `SYSTEM_DATABASE_URL` / `SYSTEM_DIRECT_URL` — platform DB.
- Tenant DB connection pattern (resolved per-request by cluster lookup).
- `JWT_SECRET` — shared with gateway.
- Service port pair: `BUSINESS_SERVICE_TCP_PORT` (5020), `BUSINESS_SERVICE_HTTP_PORT` (6020).

## Test

```bash
bun run test
bun run test:watch
bun run test:e2e
bun run test:cov
```

## Links

- Root: [`README.md`](../../README.md) · [`CLAUDE.md`](../../CLAUDE.md)
- Architecture: [`docs/architecture-system.md`](../../docs/architecture-system.md)
- API collections: [`apps/bruno/carmen-inventory/`](../bruno/carmen-inventory/)
- Domain rules: [`docs/domain-inventory-calculations.md`](../../docs/domain-inventory-calculations.md)

## Notes for agents

- Earlier separate services (`micro-authen`, `micro-tenant-*`) no longer exist. Don't expect them.
- When adding a `@MessagePattern()` handler here, also update the matching `@Client.send()` call in `backend-gateway`. Silent 500s on mismatch.
- Both Prisma clients are consumed — don't mix tenant and platform models in a single transaction.
- Prisma `findMany({ ...query, select })` conflict: if `query` already carries a `select`, spreading breaks. Build the query without spread or strip `select` from the spread.
- Audit logging interceptor from `@repo/log-events-library` is registered globally; handler-level decorators drive which events fire.
