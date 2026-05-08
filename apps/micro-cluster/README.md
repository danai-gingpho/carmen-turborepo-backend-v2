# micro-cluster

> Part of [Carmen Backend](../../README.md).

Cluster management microservice — cluster, business-unit, user, currency, and news CRUD operations.

## Overview

Platform-schema-only service. Resolves cluster and business-unit
metadata for multi-tenant requests — the gateway queries this service
to map a `{{bu_code}}` path segment to the tenant database connection
and business-unit context used downstream.

## Dev

```bash
cd apps/micro-cluster
bun run start:dev
```

Ports (from `src/main.ts`):
- TCP: `5014`
- HTTP: `6014`

## Interface

TCP `@MessagePattern()` handlers for cluster, business-unit, user, currency, and news CRUD operations.

## Env

- `SYSTEM_DATABASE_URL` — platform DB (no tenant DB here).
- `CLUSTER_SERVICE_HOST` — service host.
- `CLUSTER_SERVICE_TCP_PORT` — TCP port for microservice communication.
- `CLUSTER_SERVICE_HTTP_PORT` — HTTP port.

See [`apps/micro-cluster/.env.example`](.env.example) for the full list.

## Test

```bash
bun run test
bun run test:watch
bun run test:cov
bun run test:e2e
```

## Links

- Root: [`README.md`](../../README.md) · [`CLAUDE.md`](../../CLAUDE.md)
- Architecture: [`docs/architecture-system.md`](../../docs/architecture-system.md)

## Notes for agents

- Platform-schema only — do not import `@repo/prisma-shared-schema-tenant` here.
- Gateway cluster routes depend on this service. Port changes require updating the gateway env `CLUSTER_SERVICE_*`.
