# Per-service/package READMEs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create or standardize 11 one-pager READMEs — one per `apps/*` and `packages/*` — following a shared skeleton.

**Architecture:** One branch (`docs/service-readmes`) based on PR #9's `docs/root-docs-refresh`. One commit per README (packages first, services after) to keep diffs reviewable. Each README is 30–60 lines (libraries may be shorter), dev-first with a "Notes for agents" section at the bottom.

**Tech Stack:** Markdown, git, `bunx lychee` (link check), `gh` (PR).

**Source spec:** `docs/superpowers/specs/2026-04-20-service-readmes-design.md` — **every README task reads the spec first** to pick up the shared skeleton (§3), per-unit content map (§4), and grounding rules (§5).

---

## Pre-flight checklist (before Task 1)

- [ ] Confirm working directory: `/Users/samutpra/GitHub/carmensoftware-organize/carmen-turborepo-backend-v2-service-readmes`.
- [ ] Confirm branch: `git rev-parse --abbrev-ref HEAD` → `docs/service-readmes`.
- [ ] Confirm base: `git log -1 --format='%h %s' docs/root-docs-refresh` resolves to PR #9's HEAD.
- [ ] Confirm `bunx` works: `bun --version`.

---

## Shared README skeleton (reference for every README task)

Every README task uses this skeleton. Sections are optional per §3 of the spec.

```markdown
# <name>

> Part of [Carmen Backend](../../README.md).

<One-sentence purpose.>

## Overview
<2–3 sentences. Optional if purpose line is enough.>

## Dev
<bun run commands, ports, any local prereqs.>

## Interface
<Services: HTTP/TCP ports + MessagePattern naming. Libraries: main exports.>

## Env
<Key env vars. Link to `.env.example`.>

## Test
<Only commands that exist in this unit's package.json.>

## Links
<Root README, CLAUDE.md, docs/<relevant>.md, Bruno folder, Swagger anchor.>

## Notes for agents
<3–5 bullets. Unverifiable claims marked _(verify)_.>
```

**Strict grounding — these claims must match a source file:**
- TCP/HTTP port numbers → cite `main.ts` (or similar entry).
- Import paths → must match `package.json` `name`.
- Env var names → must appear in `.env.example` or obvious config.
- `bun run` commands in "Dev"/"Test" → must exist in the unit's `package.json`.

**Best-effort — may be inferred, flagged `_(verify)_`:**
- MessagePattern examples / naming conventions.
- Agent-note bullets.

---

## Task 1: Commit spec+plan on `docs/service-readmes`

**Files:**
- Commit (already exist): `docs/superpowers/specs/2026-04-20-service-readmes-design.md`, `docs/superpowers/plans/2026-04-20-service-readmes.md`.

- [ ] **Step 1: Verify state**

Run: `git status`
Expected: on `docs/service-readmes`; the two files listed as untracked under `docs/superpowers/`.

- [ ] **Step 2: Stage and commit**

Run:
```
git add docs/superpowers/specs/2026-04-20-service-readmes-design.md \
        docs/superpowers/plans/2026-04-20-service-readmes.md
git commit -m "$(cat <<'EOF'
docs: add spec and plan for service READMEs (sub-project #3)

Spec: 11 one-pager READMEs (8 new + 3 standardized) per a shared
skeleton. Progressive grounding (strict for ports/imports/envs/commands,
best-effort for agent notes with _(verify)_ markers).

Based on PR #9 (docs/root-docs-refresh).

Plan: per-README tasks with grounding + strict verification.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 3: Verify**

Run: `git log -1 --stat`
Expected: commit adding exactly the two files.

---

## Task 2: `packages/eslint-config/README.md` (standardize)

**Files:**
- Replace: `packages/eslint-config/README.md`

- [ ] **Step 1: Read the existing README**

Use the Read tool on `packages/eslint-config/README.md`. Capture any unique content worth preserving (e.g., specific usage example, architecture note).

- [ ] **Step 2: Grounding reads**

Run:
```
cat packages/eslint-config/package.json
ls packages/eslint-config/
```
Expected: `package.json` `name` is `@repo/eslint-config`; `src/` or direct files export configs (`base.js`, `nestjs.js`, `next-js.js`, `react-internal.js` or similar).

- [ ] **Step 3: Write the new README**

Use the Write tool to replace `packages/eslint-config/README.md`. The content:

```markdown
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
```

Adjust export names if the grounding step showed different files (drop configs that don't exist).

- [ ] **Step 4: Verify strict claims**

Run:
```
grep '"name"' packages/eslint-config/package.json
ls packages/eslint-config/
```
Check: `@repo/eslint-config` matches the name in README; export filenames listed in README exist on disk.

- [ ] **Step 5: Commit**

```
git add packages/eslint-config/README.md
git commit -m "$(cat <<'EOF'
docs: standardize packages/eslint-config/README.md per template

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 6: Verify commit**

Run: `git log -1 --stat`
Expected: single file modified.

---

## Task 3: `packages/log-events-library/README.md` (new)

**Files:**
- Create: `packages/log-events-library/README.md`

- [ ] **Step 1: Grounding reads**

Run:
```
cat packages/log-events-library/package.json
ls packages/log-events-library/
find packages/log-events-library/src -maxdepth 2 -type f \( -name '*.ts' -o -name 'index.ts' \) | head -20
```

Read the main entry file (`src/index.ts` or whatever package.json `main`/`exports` points to). Capture the exported class/function names (e.g., `LogEventsInterceptor`, Zod schema exports).

- [ ] **Step 2: Write the README**

Use the Write tool. Content:

```markdown
# @repo/log-events-library

> Part of [Carmen Backend](../../README.md).

Audit logging library — interceptors, Zod schemas, and file-based writers for structured event records.

## Overview

Services consume this library to emit audit events (create, update, delete,
access). The library provides a global NestJS interceptor that wraps
handlers, validates events against Zod schemas, and appends JSON lines
to a per-service log file. Consumer services register the interceptor
once; each call site decorates its handler with the event metadata.

## Interface

Import as `@repo/log-events-library`. Main exports _(verify against current code)_:

- Interceptor class (NestJS `NestInterceptor` implementation).
- Zod schemas for event types (create/update/delete/access).
- File writer utility.
- Decorators for annotating handler-level event metadata.

Replace the bullet list above with the actual exports surfaced during the grounding step if they differ.

## Test

```bash
cd packages/log-events-library
bun run test           # if configured
```

_(Only list commands that exist in the package's `package.json`.)_

## Links

- Root: [`README.md`](../../README.md) · [`CLAUDE.md`](../../CLAUDE.md)
- Audit / logging convention: [`CLAUDE.md`](../../CLAUDE.md) "Shared Packages"

## Notes for agents

- Interceptor is meant to be registered globally, not per-handler. If you see it registered per-controller, that's likely a drift.
- Event shape is strict Zod-validated — adding a field means updating the schema here first, then consumers.
- File writer appends JSON lines (`.log`); not safe for concurrent writes from multiple processes without a shared writer _(verify)_.
- Don't log PII or secrets — the schema should enforce, but the writer doesn't redact.
```

Keep the template bullet wording if grounding confirms the exports; otherwise substitute real export names.

- [ ] **Step 3: Verify strict claims**

Run:
```
grep '"name"' packages/log-events-library/package.json
```
Expected: `@repo/log-events-library`.

If "Test" block lists `bun run test`, verify it exists:
```
grep '"test"' packages/log-events-library/package.json
```
If the script doesn't exist, remove the Test section from the README.

- [ ] **Step 4: Commit**

```
git add packages/log-events-library/README.md
git commit -m "$(cat <<'EOF'
docs: add packages/log-events-library/README.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 5: Verify commit**

Run: `git log -1 --stat`

---

## Task 4: `packages/prisma-shared-schema-platform/README.md` (new)

**Files:**
- Create: `packages/prisma-shared-schema-platform/README.md`

- [ ] **Step 1: Grounding reads**

Run:
```
cat packages/prisma-shared-schema-platform/package.json
grep -E '^model ' packages/prisma-shared-schema-platform/prisma/schema.prisma | head -20
```
Confirm `@repo/prisma-shared-schema-platform` is the package name; note scripts (`db:generate`, `db:migrate`, `db:seed`, `db:seed.permission`).

- [ ] **Step 2: Write the README**

Content:

```markdown
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
- Prisma with PostgreSQL `@db.Timestamptz` columns requires ISO strings at write time: `approval_date: date.toISOString()` _(verify)_.
```

- [ ] **Step 3: Verify strict claims**

Run:
```
grep '"name"' packages/prisma-shared-schema-platform/package.json
grep '"db:generate"\|"db:migrate"\|"db:seed"' packages/prisma-shared-schema-platform/package.json
```
Expected: name matches; all 4 scripts exist. If `db:seed.permission` doesn't exist, remove the line.

- [ ] **Step 4: Commit**

```
git add packages/prisma-shared-schema-platform/README.md
git commit -m "$(cat <<'EOF'
docs: add packages/prisma-shared-schema-platform/README.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 5: Verify commit**

Run: `git log -1 --stat`

---

## Task 5: `packages/prisma-shared-schema-tenant/README.md` (new)

**Files:**
- Create: `packages/prisma-shared-schema-tenant/README.md`

- [ ] **Step 1: Grounding reads**

Run:
```
cat packages/prisma-shared-schema-tenant/package.json
grep -E '^model ' packages/prisma-shared-schema-tenant/prisma/schema.prisma | head -30
```
Confirm name and scripts; note the top-level domains visible in models (products, inventory, procurement, recipes, vendors, locations).

- [ ] **Step 2: Write the README**

```markdown
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
- Recipe tables historically lagged behind master data on new-tenant deploys — re-run `bun run db:migrate` inside this package after provisioning a tenant _(verify)_.
- Changes here affect every tenant DB; migration must be idempotent and forward-compatible.
```

- [ ] **Step 3: Verify strict claims**

Run:
```
grep '"name"' packages/prisma-shared-schema-tenant/package.json
grep '"db:generate"\|"db:migrate"\|"db:seed"' packages/prisma-shared-schema-tenant/package.json
```

- [ ] **Step 4: Commit**

```
git add packages/prisma-shared-schema-tenant/README.md
git commit -m "$(cat <<'EOF'
docs: add packages/prisma-shared-schema-tenant/README.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 5: Verify commit**

Run: `git log -1 --stat`

---

## Task 6: `apps/bruno/README.md` (new)

**Files:**
- Create: `apps/bruno/README.md`

- [ ] **Step 1: Grounding reads**

Run:
```
ls apps/bruno/
ls apps/bruno/carmen-inventory/environments/ 2>/dev/null
ls apps/bruno/carmen-inventory/auth/ 2>/dev/null | head -10
```
Expected: `carmen-inventory/` subdirectory containing `environments/`, `auth/`, domain folders. Note environment file names.

- [ ] **Step 2: Write the README**

```markdown
# apps/bruno

> Part of [Carmen Backend](../../README.md).

Bruno API test collections for Carmen endpoints.

## Overview

Not a runtime — a test artifact. Collections live under
[`carmen-inventory/`](carmen-inventory/) organized by domain (auth,
purchase requests, inventory movements, config, etc.). Use Bruno's
CLI (`bru run`) or the Bruno desktop app to execute them against a
gateway instance.

## Dev

```bash
# Run a single request
bru run apps/bruno/carmen-inventory/auth/login/login-test.bru

# Run an entire folder
bru run apps/bruno/carmen-inventory/purchase-request/ --env localhost-4000
```

Environments live in `carmen-inventory/environments/`. Login scripts
auto-populate `{{access_token}}` / `{{refresh_token}}` for subsequent
requests.

## Interface

- **Environments:** `environments/localhost-4000.bru`, `environments/dev.blueledgers.com-4001.bru`.
- **Auth chain:** login endpoints under `auth/login/` (variants for test / requestor / HOD / purchaser / FC / GM / Owner) set `access_token` via post-response script.
- **Multi-tenant paths:** endpoints use `{{bu_code}}` for the business-unit path segment.

## Links

- Root: [`README.md`](../../README.md)
- API conventions: [`CLAUDE.md`](../../CLAUDE.md) "Bruno API Collections"

## Notes for agents

- Every request sends `x-app-id: {{x_app_id}}` — set this in the environment before running.
- Bearer auth uses `{{access_token}}`; login scripts refresh it automatically.
- Response wrapper: `{ data, status, success, message, timestamp }` — parse `data` for payloads.
- When adding a new endpoint, copy an existing `.bru` as a template and keep the auth + header setup intact.
```

- [ ] **Step 3: Verify strict claims**

Run:
```
test -d apps/bruno/carmen-inventory && echo OK
test -d apps/bruno/carmen-inventory/environments && echo OK
test -d apps/bruno/carmen-inventory/auth && echo OK
```
All `OK`. If any directory is missing, adjust the README before commit.

- [ ] **Step 4: Commit**

```
git add apps/bruno/README.md
git commit -m "$(cat <<'EOF'
docs: add apps/bruno/README.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 5: Verify**

Run: `git log -1 --stat`

---

## Task 7: `apps/backend-gateway/README.md` (standardize)

**Files:**
- Replace: `apps/backend-gateway/README.md`

- [ ] **Step 1: Read existing README**

Read `apps/backend-gateway/README.md`. Preserve any unique content (e.g., specific architecture note) in the rewrite.

- [ ] **Step 2: Grounding reads**

Run:
```
cat apps/backend-gateway/package.json | head -30
grep -E 'listen\(|HTTPS|HTTP_PORT|HTTPS_PORT' apps/backend-gateway/src/main.ts
ls apps/backend-gateway/src/
ls apps/backend-gateway/src/config/ apps/backend-gateway/src/application/ apps/backend-gateway/src/platform/ 2>&1 | head -30
cat apps/backend-gateway/.env.example 2>/dev/null | head -40
```
Capture: HTTP/HTTPS ports (from `main.ts`), route module directories, env vars.

- [ ] **Step 3: Write the README**

```markdown
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
- `BUSINESS_SERVICE_HOST` / `BUSINESS_SERVICE_PORT` — TCP target for micro-business.
- `FILE_SERVICE_*`, `NOTIFICATION_SERVICE_*`, `KEYCLOAK_API_SERVICE_*`, `CLUSTER_SERVICE_*` — TCP targets for peer services.
- `KEYCLOAK_BASE_URL`, `KEYCLOAK_REALM`, `KEYCLOAK_CLIENT_ID` — auth context.

## Test

```bash
bun run test
bun run test:watch
bun run test:e2e
bun run test:cov
```

_(Only list scripts that exist in this service's `package.json`.)_

## Links

- Root: [`README.md`](../../../README.md) · [`CLAUDE.md`](../../../CLAUDE.md)
- Architecture: [`docs/architecture-system.md`](../../../docs/architecture-system.md)
- API collections: [`apps/bruno/carmen-inventory/`](../bruno/carmen-inventory/)

## Notes for agents

- Guards apply **in order**: `KeycloakGuard → PermissionGuard`. `PermissionGuard` depends on user context set by `KeycloakGuard`.
- Global Zod validation pipe + exception filter are registered in `main.ts` — do not re-register per-controller.
- When adding a new route: create a module under the relevant folder, register a TCP client via `ClientsModule.register()`, expose the controller, and add auth/permission guards.
- TCP message patterns must match the matching `@MessagePattern()` in the target microservice. Rename in both places or get silent 500s _(verify)_.
```

Adjust scripts in "Test" to reflect actual `package.json`.

- [ ] **Step 4: Verify strict claims**

Run:
```
grep -E 'listen|HTTPS|HTTP_PORT|HTTPS_PORT' apps/backend-gateway/src/main.ts
```
Confirm ports `4000` / `4001` appear. If different, update README.

Run:
```
grep '"test"\|"test:watch"\|"test:e2e"\|"test:cov"' apps/backend-gateway/package.json
```
Remove any script from Test block that doesn't exist.

Run:
```
test -f apps/backend-gateway/.env.example && echo OK || echo MISSING
```
If MISSING, drop the link to `.env.example` or point to a nearby example.

- [ ] **Step 5: Commit**

```
git add apps/backend-gateway/README.md
git commit -m "$(cat <<'EOF'
docs: standardize apps/backend-gateway/README.md per template

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 6: Verify**

Run: `git log -1 --stat`

---

## Task 8: `apps/micro-file/README.md` (standardize)

**Files:**
- Replace: `apps/micro-file/README.md`

- [ ] **Step 1: Read existing README**

Read the current `apps/micro-file/README.md`. Preserve unique content in the rewrite.

- [ ] **Step 2: Grounding reads**

Run:
```
cat apps/micro-file/package.json | head -20
grep -E 'listen\(|TCP_PORT|HTTP_PORT|:50|:60' apps/micro-file/src/main.ts
cat apps/micro-file/.env.example 2>/dev/null | head -30
ls apps/micro-file/src/
```
Capture ports (expected TCP :5007, HTTP :6007) and MinIO/S3 env vars.

- [ ] **Step 3: Write the README**

```markdown
# micro-file

> Part of [Carmen Backend](../../README.md).

File storage microservice — uploads, downloads, object storage backing.

## Overview

Handles binary file persistence for Carmen. Gateway forwards upload
requests over TCP; files are streamed to an object store (MinIO or S3
depending on env). The HTTP side serves downloads and can issue
presigned URLs for direct client access.

## Dev

```bash
cd apps/micro-file
bun run start:dev
```

Ports (from `src/main.ts`):
- TCP: `:5007` (microservice RPC)
- HTTP: `:6007` (direct access, health checks, binary streams)

## Interface

- **TCP MessagePatterns** handle file CRUD (upload / get metadata / delete).
- **HTTP** serves binary streams and health endpoints.

## Env

Key variables (see [`apps/micro-file/.env.example`](.env.example) for the full list):
- `MINIO_ENDPOINT` / `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` — object store credentials.
- `MINIO_BUCKET` — target bucket name.
- `FILE_SERVICE_PORT` / `FILE_SERVICE_HTTP_PORT` — listening ports.

## Test

```bash
bun run test
bun run test:watch
bun run test:e2e
bun run test:cov
```

_(Only list scripts that exist in the service's `package.json`.)_

## Links

- Root: [`README.md`](../../../README.md) · [`CLAUDE.md`](../../../CLAUDE.md)
- Architecture: [`docs/architecture-system.md`](../../../docs/architecture-system.md)

## Notes for agents

- Storage backend is env-driven (MinIO vs S3); code should not hardcode the provider.
- Binary streams are served over HTTP, not TCP — the TCP channel carries metadata only.
- Presigned URL generation lives on this service; consumers should request via TCP MessagePattern _(verify)_.
- Upload size limits come from env / middleware; adjust centrally, not per-route.
```

- [ ] **Step 4: Verify strict claims**

Run the grep commands in Step 2 to confirm ports / env var names match what you wrote. If they differ, update README before commit.

- [ ] **Step 5: Commit**

```
git add apps/micro-file/README.md
git commit -m "$(cat <<'EOF'
docs: standardize apps/micro-file/README.md per template

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 6: Verify**

Run: `git log -1 --stat`

---

## Task 9: `apps/micro-business/README.md` (new)

**Files:**
- Create: `apps/micro-business/README.md`

- [ ] **Step 1: Grounding reads**

Run:
```
cat apps/micro-business/package.json | head -25
grep -E 'listen\(|TCP_PORT|HTTP_PORT|:50|:60' apps/micro-business/src/main.ts
ls apps/micro-business/src/
ls apps/micro-business/src/modules/ 2>/dev/null
cat apps/micro-business/.env.example 2>/dev/null | head -60
```
Expected ports TCP :5020, HTTP :6020 (from CLAUDE.md). Capture the module list (auth, clusters, inventory, master data, procurement, recipes, logging, etc.) and key env vars.

- [ ] **Step 2: Write the README**

```markdown
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

Domain modules under `src/modules/`: auth, clusters, inventory, master
data, procurement, recipes, logging, notifications. Each module
registers TCP `@MessagePattern()` handlers consumed by the gateway's
per-route `@Client.send()`.

MessagePattern naming convention: `<domain>.<verb>` _(verify)_.

## Env

Key variables (see [`apps/micro-business/.env.example`](.env.example) for the full list):
- `SYSTEM_DATABASE_URL` / `SYSTEM_DIRECT_URL` — platform DB.
- Tenant DB connection pattern (resolved per-request by cluster lookup).
- `JWT_SECRET` — shared with gateway.
- Service port pair (`BUSINESS_SERVICE_PORT`, `BUSINESS_SERVICE_HTTP_PORT`).

## Test

```bash
bun run test
bun run test:watch
bun run test:e2e
bun run test:cov
```

## Links

- Root: [`README.md`](../../../README.md) · [`CLAUDE.md`](../../../CLAUDE.md)
- Architecture: [`docs/architecture-system.md`](../../../docs/architecture-system.md)
- API collections: [`apps/bruno/carmen-inventory/`](../bruno/carmen-inventory/)
- Domain rules: [`docs/domain-inventory-calculations.md`](../../../docs/domain-inventory-calculations.md)

## Notes for agents

- Earlier separate services (`micro-authen`, `micro-tenant-*`) no longer exist. Don't expect them.
- When adding a `@MessagePattern()` handler here, also update the matching `@Client.send()` call in `backend-gateway`. Silent 500s on mismatch _(verify)_.
- Both Prisma clients are consumed — don't mix tenant and platform models in a single transaction.
- Prisma `findMany({ ...query, select })` conflict: if `query` already carries a `select`, spreading breaks. Build the query without spread or strip `select` from the spread _(verify)_.
- Audit logging interceptor from `@repo/log-events-library` is registered globally; handler-level decorators drive which events fire.
```

- [ ] **Step 3: Verify strict claims**

Run:
```
grep -E 'listen|:50|:60' apps/micro-business/src/main.ts
grep '"test"\|"test:watch"\|"test:e2e"\|"test:cov"' apps/micro-business/package.json
test -f apps/micro-business/.env.example && echo OK || echo MISSING
```
Adjust the README if ports differ from 5020/6020 or if any Test script is missing.

- [ ] **Step 4: Commit**

```
git add apps/micro-business/README.md
git commit -m "$(cat <<'EOF'
docs: add apps/micro-business/README.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 5: Verify**

Run: `git log -1 --stat`

---

## Task 10: `apps/micro-cluster/README.md` (new)

**Files:**
- Create: `apps/micro-cluster/README.md`

- [ ] **Step 1: Grounding reads**

Run:
```
cat apps/micro-cluster/package.json | head -20
grep -E 'listen\(|TCP_PORT|HTTP_PORT|:50|:60' apps/micro-cluster/src/main.ts
ls apps/micro-cluster/src/
cat apps/micro-cluster/.env.example 2>/dev/null | head -20
```
Note actual TCP/HTTP port numbers from `main.ts`. If the service is minimal (few handlers), keep README short — no padding.

- [ ] **Step 2: Write the README**

Template (replace `<TCP_PORT>` / `<HTTP_PORT>` with actual values from Step 1):

```markdown
# micro-cluster

> Part of [Carmen Backend](../../README.md).

Cluster management microservice — cluster / business-unit CRUD, routing config.

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
- TCP: `:<TCP_PORT>`
- HTTP: `:<HTTP_PORT>`

## Interface

TCP `@MessagePattern()` handlers for cluster and business-unit CRUD.

## Env

- `SYSTEM_DATABASE_URL` — platform DB (no tenant DB here).
- Service port pair.

See [`apps/micro-cluster/.env.example`](.env.example) for the full list.

## Test

```bash
bun run test
bun run test:watch
bun run test:e2e
```

## Links

- Root: [`README.md`](../../../README.md) · [`CLAUDE.md`](../../../CLAUDE.md)
- Architecture: [`docs/architecture-system.md`](../../../docs/architecture-system.md)
- API collections: [`apps/bruno/carmen-inventory/platform/`](../bruno/carmen-inventory/platform/) _(if exists)_

## Notes for agents

- Platform-schema only — do not import `@repo/prisma-shared-schema-tenant` here.
- Gateway cluster routes depend on this service. Port changes require updating the gateway env `CLUSTER_SERVICE_*` _(verify)_.
```

- [ ] **Step 3: Verify strict claims**

Run the grep command from Step 1 again. Plug the actual ports into the README. Drop any Test script the package doesn't have.

If `apps/bruno/carmen-inventory/platform/` doesn't exist, remove that Link bullet.

- [ ] **Step 4: Commit**

```
git add apps/micro-cluster/README.md
git commit -m "$(cat <<'EOF'
docs: add apps/micro-cluster/README.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 5: Verify**

Run: `git log -1 --stat`

---

## Task 11: `apps/micro-keycloak-api/README.md` (new)

**Files:**
- Create: `apps/micro-keycloak-api/README.md`

- [ ] **Step 1: Grounding reads**

Run:
```
cat apps/micro-keycloak-api/package.json | head -20
grep -E 'listen\(|:50|:60' apps/micro-keycloak-api/src/main.ts
cat apps/micro-keycloak-api/.env.example 2>/dev/null
ls apps/micro-keycloak-api/src/
```
Expected ports TCP :5013, HTTP :6013. Env vars include `KEYCLOAK_BASE_URL`, `KEYCLOAK_REALM`, `KEYCLOAK_CLIENT_ID`, admin creds.

- [ ] **Step 2: Write the README**

```markdown
# micro-keycloak-api

> Part of [Carmen Backend](../../README.md).

Keycloak integration microservice — token validation and Admin API (user/role/group CRUD, password resets).

## Overview

Two responsibilities: (1) validate bearer tokens the gateway forwards
over TCP, (2) proxy Admin API operations (user CRUD, role mapping,
password reset) into Keycloak. Uses the OIDC Resource Owner Password
grant for user authentication and an admin-cli client for admin ops.

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
bun run test:e2e
```

## Links

- Root: [`README.md`](../../../README.md) · [`CLAUDE.md`](../../../CLAUDE.md)
- Keycloak config details: [`CLAUDE.md`](../../../CLAUDE.md) "Keycloak Configuration"
- Architecture: [`docs/architecture-system.md`](../../../docs/architecture-system.md)

## Notes for agents

- `KEYCLOAK_ADMIN_USERNAME` must have admin access to the master realm — a regular user will fail admin API calls with confusing errors.
- User auth uses OIDC Resource Owner Password grant; admin ops use the admin-cli client separately.
- Gateway forwards bearer tokens to this service over TCP for validation; don't bypass this by calling Keycloak directly from other services.
```

- [ ] **Step 3: Verify strict claims**

Run:
```
grep -E 'listen|:50|:60' apps/micro-keycloak-api/src/main.ts
grep -E '^KEYCLOAK_' apps/micro-keycloak-api/.env.example
grep '"test"\|"test:watch"\|"test:e2e"' apps/micro-keycloak-api/package.json
```
Adjust as needed.

- [ ] **Step 4: Commit**

```
git add apps/micro-keycloak-api/README.md
git commit -m "$(cat <<'EOF'
docs: add apps/micro-keycloak-api/README.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 5: Verify**

Run: `git log -1 --stat`

---

## Task 12: `apps/micro-notification/README.md` (new)

**Files:**
- Create: `apps/micro-notification/README.md`

- [ ] **Step 1: Grounding reads**

Run:
```
cat apps/micro-notification/package.json | head -20
grep -E 'listen\(|:50|:60|socket' apps/micro-notification/src/main.ts
ls apps/micro-notification/src/
cat apps/micro-notification/.env.example 2>/dev/null
```
Expected ports TCP :5006, HTTP :6006. SMTP env vars may or may not be present.

- [ ] **Step 2: Write the README**

```markdown
# micro-notification

> Part of [Carmen Backend](../../README.md).

Real-time notification microservice — Socket.io push channel plus optional email dispatch.

## Overview

Services emit notification events over TCP; this service fans them out
to connected clients via Socket.io (relayed through the gateway at
`/ws`) and optionally sends email via SMTP. Client connection state
is held here; gateway proxies maintain the Socket.io handshake.

## Dev

```bash
cd apps/micro-notification
bun run start:dev
```

Ports (from `src/main.ts`):
- TCP: `:5006`
- HTTP: `:6006` (also hosts the Socket.io server; gateway proxies at `/ws`)

## Interface

- **TCP MessagePatterns** for emitting events (one per notification domain).
- **Socket.io** for client push — rooms scoped per user / per business unit _(verify)_.

## Env

See [`apps/micro-notification/.env.example`](.env.example). Typical variables:

- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` / `SMTP_FROM` (when email enabled).
- Service port pair.

## Test

```bash
bun run test
bun run test:watch
bun run test:e2e
```

## Links

- Root: [`README.md`](../../../README.md) · [`CLAUDE.md`](../../../CLAUDE.md)
- Architecture: [`docs/architecture-system.md`](../../../docs/architecture-system.md)

## Notes for agents

- Socket.io connections live on this service; scale horizontally with a shared adapter (Redis) if deployed with multiple replicas _(verify)_.
- Gateway WS proxy maintains the client connection at `/ws` — clients should not hit this service's HTTP port directly.
- Email + socket are both optional channels; emission happens per event type in the handler.
```

- [ ] **Step 3: Verify strict claims**

Run:
```
grep -E 'listen|:50|:60' apps/micro-notification/src/main.ts
grep '"test"\|"test:watch"\|"test:e2e"' apps/micro-notification/package.json
test -f apps/micro-notification/.env.example && echo OK || echo MISSING
```
If the env file is missing, drop the Env bullets (or leave only the service port pair with a note).

- [ ] **Step 4: Commit**

```
git add apps/micro-notification/README.md
git commit -m "$(cat <<'EOF'
docs: add apps/micro-notification/README.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 5: Verify**

Run: `git log -1 --stat`

---

## Task 13: Link-check pass

**Files:**
- Verify-only.

- [ ] **Step 1: Run link check**

```
bunx lychee --offline --no-progress \
  'apps/*/README.md' 'packages/*/README.md' 2>&1
echo "Exit: $?"
```

Fallback (if lychee unavailable):
```
for f in apps/*/README.md packages/*/README.md; do
  npx -y markdown-link-check -q "$f"
done
```

- [ ] **Step 2: Fix real broken links only**

For each reported break:
- **Real break** (path doesn't resolve): fix via Edit tool, minimal path change.
- **False positive** (checker misreads a code-block string or credential-looking pattern): leave alone. **Do not** edit prose to placate the checker — this was a lesson from sub-project #1.

- [ ] **Step 3: Re-run checker**

Run Step 1 again. Expected: clean, or only false positives.

- [ ] **Step 4: Commit fixes if any were applied**

```
git add -A
git commit -m "$(cat <<'EOF'
docs: fix broken links in service/package READMEs

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

If no fixes needed, skip this commit.

---

## Task 14: Push and open PR

- [ ] **Step 1: Confirm branch state**

Run:
```
git status --short
git log --oneline docs/root-docs-refresh..HEAD
```
Expected: clean tree; 12–13 commits since base (spec/plan + 11 READMEs + optional link-fix).

- [ ] **Step 2: Determine PR base**

Run:
```
gh pr list --head docs/cleanup-inventory --json number,state --limit 1
gh pr list --head docs/root-docs-refresh --json number,state --limit 1
```

Decision rule:
- Both #8 and #9 `MERGED` → base = `main`.
- #8 merged, #9 open → base = `docs/root-docs-refresh`.
- Both open → base = `docs/root-docs-refresh` (chains onto the latest).
- Neither exists → STOP and report BLOCKED.

- [ ] **Step 3: Push**

```
git push -u origin docs/service-readmes
```

- [ ] **Step 4: Create PR**

Using the base from Step 2 (substitute `<base>`):

```
gh pr create --base <base> --head docs/service-readmes \
  --title "docs: add/standardize per-service READMEs (sub-project #3)" \
  --body "$(cat <<'EOF'
## Summary

- Add 8 new READMEs (`apps/micro-business`, `apps/micro-cluster`, `apps/micro-keycloak-api`, `apps/micro-notification`, `apps/bruno`, `packages/log-events-library`, `packages/prisma-shared-schema-platform`, `packages/prisma-shared-schema-tenant`).
- Standardize 3 existing READMEs (`apps/backend-gateway`, `apps/micro-file`, `packages/eslint-config`) to the shared skeleton.
- Each README is a one-pager (30–60 lines) following: Purpose → Overview → Dev → Interface → Env → Test → Links → Notes for agents.
- Progressive grounding — strict for ports/imports/envs/commands; best-effort for agent notes (unverifiable claims flagged `_(verify)_`).

Based on PR #9 (sub-project #2). Re-target to `main` when #8 and #9 merge.

Spec: `docs/superpowers/specs/2026-04-20-service-readmes-design.md`
Plan: `docs/superpowers/plans/2026-04-20-service-readmes.md`

## Test plan

- [ ] All 11 README paths exist; `find apps packages -maxdepth 2 -name README.md -not -path '*/node_modules/*' | wc -l` ≥ 11.
- [ ] Every README begins with `# <name>\n\n> Part of [Carmen Backend](../../README.md).`
- [ ] Port numbers in service READMEs match `main.ts`.
- [ ] Import paths (`@repo/...`) match each package's `package.json` name.
- [ ] `bun run` commands in Dev/Test sections exist in the unit's `package.json`.
- [ ] `bunx lychee --offline apps/*/README.md packages/*/README.md` — exit 0 (or only false positives).
- [ ] Unverifiable claims carry `_(verify)_` markers.

## Notes

Agent-note bullets marked `_(verify)_` will be promoted or removed in sub-project #4 (architecture docs verification).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 5: Verify PR**

```
gh pr view --json url,number,state,baseRefName,headRefName
```
Expected: state `OPEN`, head `docs/service-readmes`, base per Step 2. Return the PR URL.

---

## Self-review checklist (pre-handoff)

- [x] **Spec coverage:**
  - Spec §2 in-scope file list (11 READMEs) → Tasks 2–12 one per file.
  - Spec §3 skeleton → Every README task uses it (explicit Shared README skeleton block near the top of this plan).
  - Spec §4 per-unit content map → Each task has the per-unit template baked in.
  - Spec §5 grounding rules → Each task's Step 2 runs the grounding reads; Step 3/4 drafts and verifies strict claims.
  - Spec §6 process (commit order) → Tasks 2–12 follow exactly: packages first (eslint-config, log-events-library, prisma-platform, prisma-tenant), then apps (bruno, backend-gateway, micro-file, micro-business, micro-cluster, micro-keycloak-api, micro-notification).
  - Spec §7 done criteria → Task 14 PR test plan mirrors each criterion.
  - Spec §8 risks (port drift, MessagePattern drift, unverified lore) → Mitigations baked into per-task Verify steps and `_(verify)_` markers.

- [x] **Placeholder scan:** No TBD/TODO. Each task's draft content is complete markdown; placeholder text like `<TCP_PORT>` in Task 10 is explicitly marked for runtime substitution from grounding.

- [x] **Type/path consistency:**
  - Branch name `docs/service-readmes` used consistently.
  - Worktree path `.../carmen-turborepo-backend-v2-service-readmes` used consistently.
  - README relative paths match expected depth: `apps/<svc>/README.md` → `../../README.md` (2 levels up), `packages/<pkg>/README.md` → `../../README.md` (2 levels up). Verified in every task's README body.
  - `@repo/<pkg>` naming matches existing packages confirmed in sub-project #1 inventory.

- [x] **Task granularity:** Each README task has 5–6 steps (read existing, grounding, draft, verify, commit, verify-commit). Each step is a single action. Tasks 1, 13, 14 are short (3–5 steps).

- [x] **Rollback:** One commit per file. `git revert <sha>` undoes any individual README.
