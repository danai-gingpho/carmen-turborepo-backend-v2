# micro-keycloak-api

> Part of [Carmen Backend](../../README.md).

Keycloak integration microservice — token validation and Admin API (user/role/group CRUD, password resets).

## Overview

Two responsibilities: (1) validate bearer tokens the gateway forwards over TCP, (2) proxy Admin API operations (user CRUD, role mapping, password reset) into Keycloak. Uses the OIDC Resource Owner Password grant for user authentication and an admin-cli client for admin ops.

## Dev

```bash
cd apps/micro-keycloak-api
bun run start:dev
```

Ports (from `src/main.ts`):
- TCP: `:5013`
- HTTP: `:6013`

## Interface

TCP `@MessagePattern()` handlers for auth verify and admin operations.

## Env

See [`apps/micro-keycloak-api/.env.example`](.env.example) for the full list. Key variables:

- `KEYCLOAK_BASE_URL` — Keycloak server (e.g., `http://dev.blueledgers.com:8080`).
- `KEYCLOAK_REALM` — application realm name.
- `KEYCLOAK_CLIENT_ID` — OIDC client used for user auth.
- `KEYCLOAK_ADMIN_CLIENT_ID` / `KEYCLOAK_ADMIN_CLIENT_SECRET` — admin client (defaults to public `admin-cli`).
- `KEYCLOAK_ADMIN_USERNAME` / `KEYCLOAK_ADMIN_PASSWORD` — **Keycloak admin** credentials (master realm). Not a regular application user.

## Test

```bash
bun run test
bun run test:watch
bun run test:cov
bun run test:e2e
```

## Links

- Root: [`README.md`](../../README.md) · [`CLAUDE.md`](../../CLAUDE.md)
- Keycloak config details: [`CLAUDE.md`](../../CLAUDE.md) "Keycloak Configuration"
- Architecture: [`docs/architecture-system.md`](../../docs/architecture-system.md)

## Notes for agents

- `KEYCLOAK_ADMIN_USERNAME` must have admin access to the master realm — a regular user will fail admin API calls with confusing errors.
- User auth uses OIDC Resource Owner Password grant; admin ops use the admin-cli client separately.
- Gateway forwards bearer tokens to this service over TCP for validation; don't bypass this by calling Keycloak directly from other services.
