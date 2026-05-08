# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Carmen is a multi-tenant SaaS ERP backend for hotel/procurement management. See `README.md` for product scope, core capabilities, and architecture overview. This file covers conventions and gotchas agents should know before editing.

## Agent-specific commands

README.md covers the core `dev` / `build` / `lint` / `format` / `check-types` / `db:generate` / `db:migrate` commands. The items below are less obvious and matter for agents working in the repo:

```bash
# Required before `dev` / `build` if shared packages haven't been built yet
bun run build:package

# Per-schema permission seed (runs only on platform schema)
cd packages/prisma-shared-schema-platform
bun run db:seed.permission

# Mock data variants (salvaged from WARP.md — verify variant availability)
bun run db:mock          # if present
bun run db:mock.tenant   # if present

# Coverage-enabled testing
bun run test:cov

# Sync Bruno API collection with gateway endpoints
bun run bruno:sync:dry   # preview add/update/archive
bun run bruno:sync       # apply changes
```

### Testing (per service)

```bash
cd apps/micro-business
bun run test
bun run test:watch
bun run test:e2e
bun run test:cov
```

## Architecture

### Service Topology

The system uses an **API Gateway pattern** with TCP-based microservice communication:

- **backend-gateway** (HTTP:4000, HTTPS:4001) — Single entry point. Routes requests to microservices via NestJS TCP clients. Handles auth (JWT/Keycloak), Swagger docs at `/swagger`, WebSocket at `/ws`.
- **micro-business** (TCP:5020, HTTP:6020) — Consolidated service containing most business logic: auth, clusters, inventory, master data, procurement, recipes, logging, notifications.
- **micro-file** (TCP:5007, HTTP:6007) — File storage.
- **micro-notification** (TCP:5006, HTTP:6006) — Real-time notifications via Socket.io.
- **micro-keycloak-api** (TCP:5013, HTTP:6013) — Keycloak integration.

Each NestJS microservice runs dual ports: TCP for inter-service RPC (`@MessagePattern()`) and HTTP for direct access/health checks.

### Multi-Tenancy via Dual Prisma Schemas

Two separate Prisma schemas, each generating its own client:

- **prisma-shared-schema-platform** (`SYSTEM_DATABASE_URL`) — System-wide: users, clusters, business units, roles, permissions, subscriptions. Imported as `@repo/prisma-shared-schema-platform`.
- **prisma-shared-schema-tenant** — Per-tenant business data: products, inventory, procurement, recipes, vendors, locations. Imported as `@repo/prisma-shared-schema-tenant`.

Both use UUID PKs (`gen_random_uuid()`), soft deletes (`deleted_at`), and audit fields (`created_at`, `created_by_id`, `updated_at`, `updated_by_id`).

### Gateway Routing Pattern

The gateway organizes routes into domain modules under `src/config/`, `src/application/`, and `src/platform/`. Each route module registers a controller that forwards requests to the appropriate microservice via TCP using `ClientsModule.register()`. The gateway applies global exception filters, Zod validation pipes, and auth guards.

### Authentication

Keycloak-based authentication via Passport.js:
- **Keycloak**: Bearer token forwarded to micro-keycloak-api via TCP for validation
- `JWT_SECRET` env var holds the JWT signing secret

Guards are applied at the route level: `KeycloakGuard` → `PermissionGuard` (order matters — PermissionGuard depends on user context set by KeycloakGuard).

### Shared Packages

- **@repo/eslint-config** — Shared ESLint configs (`base`, `nestjs`, `next-js`, `react-internal`)
- **@repo/log-events-library** — Audit logging with interceptors, Zod schemas, file-based writers
- **@repo/prisma-shared-schema-platform** — Platform Prisma client + generated types
- **@repo/prisma-shared-schema-tenant** — Tenant Prisma client + generated types

Shared packages must build before apps. This is handled by Turborepo task dependencies (`build:package` runs before `dev` and `build`).

### Path Aliases

TypeScript path alias `@repo/*` maps to `packages/*/src`. Individual services use `src/*` aliases configured in their own tsconfig.

## Code Conventions

- **Language**: English for code, Thai for documentation
- **Naming**: PascalCase for classes, camelCase for variables/methods, kebab-case for files/folders, UPPERCASE for env vars
- **Functions**: Max 20 statements, early returns, verb-prefixed names (`getUserById`, `validateToken`)
- **Booleans**: Prefixed with `is`/`has`/`can` (`isActive`, `hasError`, `canDelete`)
- **One export per file**
- **Validation**: Zod schemas with `nestjs-zod` for input DTOs; simple TypeScript types for output
- **Avoid**: `any` type, magic numbers, deep nesting
- **Timestamps**: Always use `.toISOString()` when writing `Date` values to Prisma timestamp fields (e.g., `approval_date: date.toISOString()`, not `approval_date: date`). Prisma with PostgreSQL `@db.Timestamptz` columns requires ISO string format.
- **Swagger sync**: When changing a DTO (add/remove/rename fields), always update the corresponding Swagger request/response DTOs, examples, and serializers in the gateway to stay in sync.
- **NestJS modules**: One module per domain/route. Controllers for routing, Services for business logic
- **Testing**: Arrange-Act-Assert pattern, Given-When-Then for acceptance tests

## Environment Setup

Each service needs a `.env` file (copy from `.env.example`). Key variables:
- `SYSTEM_DATABASE_URL` / `SYSTEM_DIRECT_URL` — Platform PostgreSQL connection
- `JWT_SECRET` — JWT signing secret
- Service host/port pairs for inter-service discovery (e.g., `BUSINESS_SERVICE_HOST`, `BUSINESS_SERVICE_PORT`)
- `LOKI_*` — Winston/Loki logging config
- `SMTP_*` — Email configuration
- `SENTRY_DSN` — Error tracking

### Keycloak Configuration (micro-keycloak-api)

- `KEYCLOAK_BASE_URL` — Keycloak server URL (e.g., `http://dev.blueledgers.com:8080`)
- `KEYCLOAK_REALM` — Application realm name
- `KEYCLOAK_CLIENT_ID` — Client ID for user authentication (OIDC Resource Owner Password grant)
- `KEYCLOAK_ADMIN_CLIENT_ID` — Admin client ID (defaults to `admin-cli` if empty)
- `KEYCLOAK_ADMIN_CLIENT_SECRET` — Admin client secret (empty for public `admin-cli` client)
- `KEYCLOAK_ADMIN_USERNAME` — Keycloak **admin** username (NOT a regular user — must have admin access to master realm)
- `KEYCLOAK_ADMIN_PASSWORD` — Keycloak admin password

**Important**: `KEYCLOAK_ADMIN_USERNAME`/`KEYCLOAK_ADMIN_PASSWORD` must be credentials for a Keycloak administrator account (the account used to log into the Keycloak Admin Console), not a regular application user. These are used for Admin API operations: user CRUD, password resets, role/group management, etc.

## Bruno API Collections

API collections for testing are located at `apps/bruno/carmen-inventory/`. Uses Bruno API client with `.bru` file format.

### Structure
- `environments/` — Environment configs (`localhost-4000.bru`, `dev.blueledgers.com-4001.bru`)
- `auth/` — Authentication endpoints (login, logout, refresh, change-password, user-info)
- `auth/login/` — Login variants for different user roles (test, requestor, HOD, purchaser, FC, GM, Owner)
- Domain folders: `stock-in/`, `stock-out/`, `purchase-request/`, `purchase-order/`, `good-received-note/`, etc.
- `config/` — Configuration endpoints (32 modules)
- `platform/` — Platform management endpoints (8 modules)

### Conventions
- All endpoints include `x-app-id: {{x_app_id}}` header
- Bearer token auth uses `{{access_token}}` environment variable
- Login scripts auto-set `access_token` and `refresh_token` via post-response scripts
- Multi-tenant endpoints use `{{bu_code}}` path parameter
- API response wrapper: `{ data: {...}, status, success, message, timestamp }`

### Syncing with gateway
When adding or renaming gateway endpoints, run `bun run bruno:sync` before opening a PR so the Bruno collection stays in sync with `apps/backend-gateway/src/`. `_archived/` holds orphan files whose endpoints no longer exist in the gateway — review and delete periodically. The sync tool preserves `environments/`, `auth/`, and user-authored `script:*`, `tests`, `docs` sections on updates. See `scripts/bruno-sync/README.md`.

## Gotchas

Non-obvious behaviors to know before touching the code. Entries marked
_(verify against current code)_ are salvaged from a historical report
(see `docs/design-legacy-notes.md`) and should be re-confirmed before
being treated as authoritative.

- **Service consolidation history.** Earlier branches had `micro-authen`, `micro-tenant-inventory`, `micro-tenant-master`, `micro-tenant-procurement`, `micro-tenant-recipe` as separate services. They were merged into `micro-business`. Don't expect to find them.
- **TCP message pattern drift.** When refactoring a `@MessagePattern()` handler in `micro-business`, also update the matching `@Client.send()` call in `backend-gateway`. Mismatches cause silent 500s.
- **Prisma `findMany` with spread + select conflict.** `prisma.x.findMany({ ...query, select: {...} })` throws if `query` also sets `select`. Build the query object without spread, or strip `select` from the spread.
- **Tenant DB migration gap — recipe tables.** _(stale — needs rewrite)_ Recipe tables historically lagged behind master data on new-tenant schema deploys. Re-run `db:migrate` inside `packages/prisma-shared-schema-tenant` after adding a tenant.
- **Credentials in pre-PR-#8 git history.** A Supabase-style token `8wzw8O77O0VAGDnt` and dev password `123456` are present in commits on `main` predating sub-project #1. Rotate the Supabase token and scrub history separately; redacting going forward doesn't un-leak them.

## Additional Code Conventions (from legacy notes — verified 2026-04-20)

Supplementary conventions from `cursorrule.cursor` not explicitly captured above:

- **JSDoc**: Required for public classes and methods
- **No blank lines inside functions**
- **`const` over `let`** when value is not reassigned
- **Full words over abbreviations** — exceptions: `i`, `j`, `err`, `ctx`, `req`, `res`, `next`
- **Class size limits**: max 200 statements, 10 public methods, 10 properties per class
- **RO-RO pattern**: Use objects for both input params and return values when reducing param count
- **Single abstraction level** per function
- **Immutable data**: prefer `readonly` and `as const`
- **SOLID principles** for classes; prefer composition over inheritance
- **Arrow functions** only for simple functions ≤ 3 statements; use named functions for longer ones
- **Void-returning functions**: use `executeX`, `saveX` naming pattern (in addition to the verb-prefix rule)
- **Swagger tags**: `@ApiTags(...)` on a gateway controller must match the mapping in `scripts/swagger-sync/tag-mapping.json`. The tag set and 2-level group structure are defined in `apps/backend-gateway/src/swagger/tag-groups.ts`. Run `bun run swagger:retag:dry` to preview, `bun run swagger:retag` to apply, and `bun run swagger:verify` to confirm consistency. New gateway controllers must add their mapping entry before commit.

### micro-cronjob Framework (from legacy notes — verified 2026-04-20)

`micro-cronjob` (TCP:5012, HTTP:6012) uses **Elysia + Bun** (not NestJS). This is the only
non-NestJS service in the stack. Confirmed in the architecture Mermaid diagram in
`docs/architecture-system.md`. Do not apply NestJS patterns (decorators, modules, guards)
when editing `apps/micro-cronjob`.

## Build Dependencies

The Turborepo pipeline enforces: `db:generate` → `build:package` → `build`/`dev`. If Prisma clients are missing, run `bun run db:generate`. If shared packages fail to resolve, run `bun run build:package`.
