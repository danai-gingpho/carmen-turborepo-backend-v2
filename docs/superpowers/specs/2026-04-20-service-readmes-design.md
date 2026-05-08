# Per-service/package READMEs — Design Spec

**Date:** 2026-04-20
**Status:** Draft (awaiting user review)
**Sub-project:** #3 of 4 in the larger "update all docs" effort
**Depends on:** PR #8 (sub-project #1), PR #9 (sub-project #2). This branch is based on `docs/root-docs-refresh` (PR #9) so root README + `docs/` exist in context. Rebases onto `main` after both merge.
**Follow-up:** #4 Architecture docs verification — promotes or removes entries marked `_(verify)_` in this sub-project's agent notes.

---

## 1. Purpose

Close the gap where 8 of the repo's 11 first-level services and packages have no README. Standardize the 3 existing ones so every `apps/*` and `packages/*` entry follows the same shape. Each README is a one-pager (~30–60 lines) covering: what the unit does, how to run it, its interface, env vars, tests, links back into the wider doc graph, and a short "Notes for agents" section.

This does not add architecture docs, testing guides, or deep references — those live in `docs/` or `CLAUDE.md`. Per-service READMEs are navigational entry points.

## 2. Scope

### In scope (11 files)

**New READMEs (8):**
- `apps/bruno/README.md`
- `apps/micro-business/README.md`
- `apps/micro-cluster/README.md`
- `apps/micro-keycloak-api/README.md`
- `apps/micro-notification/README.md`
- `packages/log-events-library/README.md`
- `packages/prisma-shared-schema-platform/README.md`
- `packages/prisma-shared-schema-tenant/README.md`

**Standardized READMEs (3):**
- `apps/backend-gateway/README.md`
- `apps/micro-file/README.md`
- `packages/eslint-config/README.md`

### Out of scope

- Nested READMEs below first level (e.g., inside `apps/bruno/carmen-inventory/`). `apps/bruno/README.md` mentions the nested collection location but does not duplicate it.
- Any documentation outside `apps/*/README.md` and `packages/*/README.md` (no touches to root `README.md`, `CLAUDE.md`, `docs/`, or code).
- Content accuracy verification for claims marked `_(verify)_` — sub-project #4 handles those.

### Non-goals

- Exhaustive reference per unit. README is one-pager; deeper docs live elsewhere.
- Duplicating root `README.md` / `CLAUDE.md` content. Each sub-README links out instead of re-describing.
- Promoting agent notes to authoritative status. Unverifiable claims stay marked.

## 3. Shared Skeleton

Each README follows this shape. Sections are optional — adapt or omit when a section doesn't fit the unit.

```markdown
# <name>

> Part of [Carmen Backend](../../README.md).

<One-sentence purpose.>

## Overview
<2–3 sentences on what this unit does and where it fits. Optional if purpose line is enough.>

## Dev
<bun run commands, ports, any local prereqs.>

## Interface
<Services: HTTP/TCP ports + MessagePattern naming convention. Libraries: main exports. Bruno: environments + auth flow.>

## Env
<Key env vars this unit reads. Link to `.env.example`.>

## Test
<Only the test commands that exist in this unit's package.json.>

## Links
<Pointers to root README, CLAUDE.md, docs/<relevant>.md, related Bruno folder, Swagger anchor.>

## Notes for agents
<3–5 bullets. Gotchas, MessagePattern conventions, TCP port, schema-specific quirks. Unverifiable claims marked _(verify)_.>
```

### Section optionality rules

- **`eslint-config`** — omits Dev, Env, Interface (ports sense), Test. Keeps Overview, Interface (exports), Links, Notes for agents.
- **`prisma-shared-schema-*`** — omits Interface (ports sense). Keeps Dev (db commands), Interface (exports + client name), Env, Links, Notes for agents.
- **`log-events-library`** — omits Env. Keeps Overview, Interface (exports), Test, Links, Notes for agents.
- **`bruno`** — omits Interface (ports), Test. Keeps Dev (bru run), Interface (environments, auth flow), Links, Notes for agents.
- **Services (`micro-*`, `backend-gateway`)** — keep all sections.

## 4. Per-unit content map

Brief content pointers per README. Not a template — the implementation task will draft from grounding reads (see §5).

### `apps/backend-gateway/README.md` (standardize)

- **Purpose:** HTTP gateway — single entry point forwarding to microservices via TCP.
- **Interface:** HTTP :4000, HTTPS :4001 (from `main.ts`). `/swagger`, `/ws`. Route modules under `src/config/`, `src/application/`, `src/platform/`.
- **Env:** `JWT_SECRET`, per-service host/port pairs (`BUSINESS_SERVICE_HOST/PORT`, etc.), Keycloak envs.
- **Agent notes:** Guard order `KeycloakGuard → PermissionGuard`; routes registered via `ClientsModule.register()`; global Zod validation pipe + exception filter.

### `apps/micro-business/README.md` (new)

- **Purpose:** Consolidated business logic — auth, clusters, inventory, master data, procurement, recipes, logging, notifications.
- **Interface:** TCP :5020, HTTP :6020 (from `main.ts`). `@MessagePattern()` handlers across per-domain modules.
- **Env:** `SYSTEM_DATABASE_URL`, tenant DB connection, port pair, `JWT_SECRET` (if used locally).
- **Agent notes:** Merged from former `micro-authen`, `micro-tenant-*` services; `@MessagePattern` names must match gateway `@Client.send()`; both Prisma clients (platform + tenant) consumed; tenant DB recipe tables historically lagged migrations _(verify)_.

### `apps/micro-file/README.md` (standardize)

- **Purpose:** File storage service — uploads, downloads, object storage backing.
- **Interface:** TCP :5007, HTTP :6007 (from `main.ts`). MessagePatterns for file CRUD.
- **Env:** MinIO/S3 config (endpoint, bucket, access keys); link to `.env.example`.
- **Agent notes:** Storage backend configurable via env; binary streams served on HTTP side; presigned URLs may be generated for clients.

### `apps/micro-keycloak-api/README.md` (new)

- **Purpose:** Keycloak integration — Bearer token validation + Admin API (user/role/group CRUD).
- **Interface:** TCP :5013, HTTP :6013 (from `main.ts`). MessagePatterns for auth verify + admin ops.
- **Env:** `KEYCLOAK_BASE_URL`, `KEYCLOAK_REALM`, `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_ADMIN_CLIENT_ID`, `KEYCLOAK_ADMIN_CLIENT_SECRET`, `KEYCLOAK_ADMIN_USERNAME`, `KEYCLOAK_ADMIN_PASSWORD`. One-liner: `KEYCLOAK_ADMIN_*` must be Keycloak admin credentials (master realm), not regular users.
- **Agent notes:** Admin-cli client for admin ops; OIDC Resource Owner Password grant for user auth; gateway forwards bearer tokens for validation.

### `apps/micro-notification/README.md` (new)

- **Purpose:** Real-time notifications via Socket.io; optional email dispatch.
- **Interface:** TCP :5006, HTTP :6006 (from `main.ts`). WebSocket on HTTP port; gateway proxies at `/ws`.
- **Env:** `SMTP_*` if email enabled; port pair.
- **Agent notes:** Socket.io room conventions; emit events via TCP message handler; gateway WS proxies maintain client connection.

### `apps/micro-cluster/README.md` (new)

- **Purpose:** Cluster management — cluster/business-unit CRUD and routing config.
- **Interface:** TCP/HTTP ports per `main.ts` (read during grounding — not guessed in spec).
- **Env:** `SYSTEM_DATABASE_URL` (platform schema only).
- **Agent notes:** Platform-schema-only; consumed by gateway cluster routes; cluster codes `{{bu_code}}` appear in multi-tenant URL patterns.

### `apps/bruno/README.md` (new)

- **Purpose:** Bruno API test collections. Not a runtime — test artifact.
- **Dev:** `bru run <path>`; switch environments via the environments folder; auto-login via post-response scripts.
- **Interface (environments, auth):** `environments/localhost-4000.bru`, `environments/dev.blueledgers.com-4001.bru`; login scripts set `{{access_token}}` + `{{refresh_token}}`. Top-level collection: `apps/bruno/carmen-inventory/`.
- **Agent notes:** Multi-tenant endpoints use `{{bu_code}}`; every request sends `x-app-id: {{x_app_id}}`; response wrapper `{ data, status, success, message, timestamp }`.

### `packages/eslint-config/README.md` (standardize)

- **Purpose:** Shared ESLint configs for Carmen packages and apps.
- **Interface (exports):** `base`, `nestjs`, `next-js`, `react-internal`. Usage snippet in a consumer `eslint.config.js`.
- **Agent notes:** Adjust rules here so all consumers inherit; do not override in per-app configs unless necessary.

### `packages/log-events-library/README.md` (new)

- **Purpose:** Audit logging library — interceptors + Zod schemas + file-based writers.
- **Interface (exports):** Import as `@repo/log-events-library`. Export names captured during grounding (interceptor class, schema names).
- **Test:** `bun run test` (if configured).
- **Agent notes:** Interceptor registered globally in services; log shape is Zod-validated; file writer appends JSON lines (`.log` files).

### `packages/prisma-shared-schema-platform/README.md` (new)

- **Purpose:** Platform Prisma client — cross-tenant entities (users, clusters, business units, roles, subscriptions).
- **Interface (exports):** `PrismaClient`; import as `@repo/prisma-shared-schema-platform`.
- **Dev:** `bun run db:generate`, `db:migrate`, `db:seed`, `db:seed.permission`.
- **Env:** `SYSTEM_DATABASE_URL`, `SYSTEM_DIRECT_URL`.
- **Agent notes:** UUID primary keys, soft deletes (`deleted_at`), audit fields (`created_at`, `created_by_id`, `updated_at`, `updated_by_id`); regenerate client after schema changes; `build:package` before consuming services build.

### `packages/prisma-shared-schema-tenant/README.md` (new)

- **Purpose:** Tenant Prisma client — per-tenant entities (products, inventory, procurement, recipes, vendors, locations).
- **Interface (exports):** `PrismaClient`; import as `@repo/prisma-shared-schema-tenant`.
- **Dev:** `bun run db:generate`, `db:migrate`, `db:seed`.
- **Env:** tenant DB connection pattern.
- **Agent notes:** Same conventions as platform (UUID, soft delete, audit); recipe tables historically lagged behind master data on new-tenant deploys — re-run `db:migrate` after adding a tenant _(verify)_.

## 5. Grounding approach (progressive)

For each README, the implementer does a bounded grounding read:

1. Read the unit's entry point: `src/main.ts` (services) or `src/index.ts` / top-level export file (libraries).
2. Read the unit's `package.json` — extract scripts that actually exist.
3. Read `.env.example` if present.
4. Skim the `src/` tree one level deep.

**Strict grounding — the following claims must match a file:**
- TCP/HTTP port numbers (cite `main.ts`).
- Import paths (must match `package.json` `name` field).
- Env var names (must appear in `.env.example` or obvious config).
- Bun scripts listed in "Dev" / "Test" (must exist in unit's `package.json`).

**Best-effort grounding — these may be written from inference:**
- `@MessagePattern` naming conventions (unless a specific name is load-bearing).
- Agent-notes bullets.

Any claim that cannot be directly verified is marked `_(verify)_`. Sub-project #4 will promote or remove these.

## 6. Process

1. Branch is `docs/service-readmes` in worktree `../carmen-turborepo-backend-v2-service-readmes`, based on `docs/root-docs-refresh` (PR #9). Spec + plan commit first.
2. One commit per README, ordered packages first (libraries smaller, no cross-deps), then apps (services that consume libraries).
3. `bunx lychee --offline` after all READMEs are committed. Fix any real broken links; do not edit prose for false positives.
4. Push. Open PR. Base = `main` if #8 and #9 merged; else base = the lowest-still-open of those two.

### Commit order

1. `spec+plan` commit.
2. `packages/eslint-config/README.md` (standardize — smallest).
3. `packages/log-events-library/README.md` (new).
4. `packages/prisma-shared-schema-platform/README.md` (new).
5. `packages/prisma-shared-schema-tenant/README.md` (new).
6. `apps/bruno/README.md` (new; not a runtime).
7. `apps/backend-gateway/README.md` (standardize).
8. `apps/micro-file/README.md` (standardize).
9. `apps/micro-business/README.md` (new; largest).
10. `apps/micro-cluster/README.md` (new).
11. `apps/micro-keycloak-api/README.md` (new).
12. `apps/micro-notification/README.md` (new).
13. Link-check fixes (optional commit).
14. Push + PR.

## 7. Done criteria

- All 11 README paths exist in the expected locations.
- Each README begins with `# <name>`, immediately followed by the `> Part of [Carmen Backend](../../README.md).` link-back line and a one-sentence purpose.
- Each README follows the shared skeleton from §3 with only the documented adaptations from §3 applied.
- Every strict-grounded claim matches its source file:
  - Port numbers traceable to `main.ts`.
  - Import paths match `package.json` `name`.
  - Env var names exist in `.env.example` or obvious config.
  - `bun run` commands exist in the unit's `package.json`.
- Unverified claims marked `_(verify)_`.
- `bunx lychee --offline` exits 0 across all 11 files.
- One commit per README (no batched mega-commit).
- Working tree clean after final commit.
- PR opened with appropriate base branch.

### Explicitly NOT in done criteria

- Content accuracy of claims marked `_(verify)_` — sub-project #4.
- Any changes to root `README.md`, `CLAUDE.md`, or files under `docs/`.
- Nested README creation below first level.

## 8. Risks & Mitigations

| # | Risk | Mitigation |
|---|------|------------|
| 1 | Port drift when someone edits `main.ts`. | Port line cites `main.ts`; reviewer can verify in 5 seconds. |
| 2 | MessagePattern examples go stale. | Prefer convention text (`<domain>.<verb>`) over specific names. Keep examples in code comments, not READMEs. |
| 3 | Agent notes drift into unverified lore. | Each note is either derivable quickly from code or marked `_(verify)_`. Sub-project #4 cleans up. |
| 4 | Existing READMEs had unique content worth keeping. | Before rewriting each of the 3 existing ones, implementer reads it fully and preserves any unique content. Rewrite extends rather than wipes. |
| 5 | Rebasing this PR after #8/#9 merge causes conflicts. | This PR touches only `apps/*/README.md` and `packages/*/README.md`. No overlap with #8 (root + docs/) or #9 (root README/CLAUDE.md). Conflicts unlikely. |
| 6 | `micro-cluster` may have minimal entry surface; README becomes padding. | If the service is truly thin (< 2 handlers, < 3 env vars), the README stays short (~25 lines) and that's fine. Don't invent content to hit a length bar. |

## 9. Assumptions

- Each app/package has a `main.ts` (services) or clear top-level export file (libraries). If not, the implementer reports and the grounding step adapts.
- `package.json` `name` fields are `@repo/<dir-name>` pattern (already the case for the 4 packages verified in sub-project #1). Services generally don't export — their name is directory-based.
- `lychee` via `bunx` remains available (or `markdown-link-check` as fallback from sub-project #1).
- No existing README in the 8 "new" locations — confirmed by sub-project #1's inventory.

## 10. Implementation ordering (for the plan)

1. Create worktree `../carmen-turborepo-backend-v2-service-readmes` on branch `docs/service-readmes` based on `docs/root-docs-refresh`.
2. Commit spec + plan.
3. For each of the 11 READMEs (order per §6): grounding reads → draft → verify ports/paths/env → commit.
4. Run `bunx lychee --offline` across all 11 + root README/CLAUDE.md.
5. Fix real broken links only. Commit if needed.
6. Push. Open PR with base branch determined by PR #8/#9 merge state.

---

**Next step:** user reviews this spec, then invoke `writing-plans` for the implementation plan.
