# backend-gateway

> Part of [Carmen Backend](../../README.md).

HTTP/HTTPS gateway — single entry point, routes requests to microservices via TCP.

## Overview

Acts as the only HTTP-facing component of the system. Inbound requests
hit this service, get authenticated (Keycloak), authorized (permission
guard), validated (Zod), and then forwarded over TCP to the appropriate
microservice using NestJS `ClientsModule`. Responses are wrapped into
the standard shape before returning.

## Dev

```bash
cd apps/backend-gateway
bun run start:dev
```

Ports (from `src/main.ts`):
- HTTP: `:4000`
- HTTPS: `:4001`
- Swagger: `/swagger`
- WebSocket: `/ws`

## Interface

Route modules are organized by domain under three top-level folders:
- `src/config/` — configuration/admin endpoints.
- `src/application/` — business-domain endpoints (procurement, inventory, recipes, etc.).
- `src/platform/` — platform-level endpoints (clusters, business units, subscriptions).

Each route module registers a controller that forwards to a microservice
via TCP `ClientsModule.register()`.

## Env

Key variables (see [`apps/backend-gateway/.env.example`](.env.example) for the full list):
- `JWT_SECRET` — JWT signing secret.
- `BUSINESS_SERVICE_HOST` / `BUSINESS_SERVICE_TCP_PORT` — TCP target for micro-business.
- `FILE_SERVICE_HOST` / `FILE_SERVICE_TCP_PORT`, `NOTIFICATION_SERVICE_*`, `KEYCLOAK_API_SERVICE_*`, `CLUSTER_SERVICE_*` — TCP targets for peer services.
- `KEYCLOAK_BASE_URL`, `KEYCLOAK_REALM`, `KEYCLOAK_CLIENT_ID` — auth context.

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

## Notes for agents

- Guards apply **in order**: `KeycloakGuard → PermissionGuard`. `PermissionGuard` depends on user context set by `KeycloakGuard`.
- Global Zod validation pipe + exception filter are registered in `main.ts` — do not re-register per-controller.
- When adding a new route: create a module under the relevant folder, register a TCP client via `ClientsModule.register()`, expose the controller, and add auth/permission guards.
- TCP message patterns must match the matching `@MessagePattern()` in the target microservice. Rename in both places or get silent 500s.
