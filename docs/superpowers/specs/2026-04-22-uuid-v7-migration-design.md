# UUIDv7 Migration — Design Spec

**Date:** 2026-04-22
**Status:** Draft
**Owner:** Thammanoon Semapru

## Goal

Migrate all UUID primary keys and application-generated UUIDs across the
Carmen backend from **UUIDv4** to **UUIDv7** to gain:

1. **Index locality** — sequential/time-sortable PKs reduce B-tree page
   fragmentation on insert-heavy tables (inventory transactions,
   procurement documents, audit logs).
2. **Time-ordering** — sort by PK is equivalent to sort by insertion time
   without depending on `created_at`.

## Scope

### In scope

- **Database defaults** — replace `gen_random_uuid()` with `uuidv7()`
  (Postgres 18 native) on **all 164 UUID columns** across both Prisma
  schemas:
  - `packages/prisma-shared-schema-platform` — 23 occurrences
  - `packages/prisma-shared-schema-tenant` — 141 occurrences
- **Application code** — bump `uuid` npm package to v13 and replace
  `v4()` generation with `v7()` in 5 files:
  - `packages/log-events-library/src/services/log-events.service.ts`
  - `packages/log-events-library/src/interceptors/audit-context.interceptor.ts`
  - `packages/log-events-library/src/middleware/prisma-audit.middleware.ts`
  - `apps/backend-gateway/src/common/interceptors/gateway-request-context.interceptor.ts`
  - `apps/micro-business/src/master/tax_profile/tax_profile.service.ts`
- **Package bumps:** root `package.json`, `packages/log-events-library`,
  `apps/backend-gateway` (others already on 13.x).

### Out of scope

- **Data backfill** — existing v4 rows remain v4. New rows are v7. Both
  coexist in the same column because the PostgreSQL type remains `uuid`.
- **Column type changes** — column type stays `uuid`.
- **FK rewrites** — no foreign keys change.
- **`app-id.guard.ts`** — uses only `uuid.validate()` which accepts any
  UUID version. No change needed.
- **External integrations / exported data** — historical UUIDs stored
  outside the system remain as-is.

### Non-goals

- Reducing storage size (v7 has identical 16-byte layout as v4).
- Unifying with ULID or other ID formats.

## Current State

- Both Prisma schemas use `@default(dbgenerated("gen_random_uuid()"))`
  on UUID PKs — 164 occurrences total.
- Mixed `uuid` npm versions: root/log-events-library on v8.3.2 (no v7
  support), backend-gateway on v11.1.0, micro-file/micro-keycloak-api on
  v13.0.0.
- Postgres 18+ provides built-in `uuidv7()` — no extension required.

## Decisions

| Decision | Choice | Reason |
|---|---|---|
| Scope | All 164 columns, both schemas | Uniform schema; avoids per-table reasoning later. |
| Generation strategy | DB-native `uuidv7()` via `@default(dbgenerated(...))` | Simplest; no extension; no app-side changes to inserts. |
| Existing data | Leave v4 rows untouched | Zero-downtime, no FK cascade risk, acceptable that time-ordering benefit applies only to new rows. |
| App code | Uniform v7 everywhere (bump package + swap `v4` → `v7`) | Audit event IDs and request correlation IDs become time-sortable; avoids mixed conventions. |
| Rollout | 3 separate PRs (platform schema, tenant schema, app code) | Smaller reviews; isolated rollback surface. |

## Architecture / Changes

### PR1 — Platform schema (23 columns)

**Files:**
- `packages/prisma-shared-schema-platform/prisma/schema.prisma` — replace
  every `@default(dbgenerated("gen_random_uuid()"))` with
  `@default(dbgenerated("uuidv7()"))`.
- New migration: `packages/prisma-shared-schema-platform/prisma/migrations/<timestamp>_uuid_v7_default/migration.sql`.

**Migration pattern (per column):**
```sql
ALTER TABLE "<table>" ALTER COLUMN "<col>" SET DEFAULT uuidv7();
```
No `UPDATE` statements. No `DROP DEFAULT` required (PostgreSQL `ALTER ...
SET DEFAULT` replaces the existing expression).

**Post-migration:** `bun run db:generate` to refresh the Prisma client.

### PR2 — Tenant schema (141 columns)

Identical approach to PR1, scoped to
`packages/prisma-shared-schema-tenant`. The critical operational step is
that tenant databases are provisioned per tenant — the migration must be
applied to **every existing tenant database**. A runbook step is
required (see Verification).

### PR3 — Application code

**Package bumps:**
- `package.json` (root): `uuid` → `^13.0.0`
- `packages/log-events-library/package.json`: `uuid` → `^13.0.0`
- `apps/backend-gateway/package.json`: `uuid` → `^13.0.0`

**Code changes (5 files):**
```ts
// before
import { v4 as uuidv4 } from 'uuid';
const id = uuidv4();

// after
import { v7 as uuidv7 } from 'uuid';
const id = uuidv7();
```

**Untouched:** `app-id.guard.ts` (validation only — accepts v7 by
default), `seed.ts` / `mock.ts` under tenant schema (use DB defaults;
inspected and confirmed no hardcoded v4 generation of business IDs).

## Data Flow

No data flow changes. UUIDs remain 16-byte binary values in
PostgreSQL `uuid` columns and 36-char hyphenated strings in JS. All
serialization, FK constraints, and query paths are unchanged.

## Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| An environment runs Postgres < 18 | Migration fails (`uuidv7()` does not exist) | Pre-flight: run `SELECT version()` on every env (dev, CI, staging, prod, and every tenant DB) before merging PR1. Block merge if any env is below 18. |
| A tenant DB is missed during rollout | New rows in that tenant still use v4 | Migration is idempotent. Post-deploy verification query iterates all tenant DBs and confirms defaults. |
| Stale Prisma client after schema change | Build/runtime mismatch | Run `bun run db:generate` then `bun run build:package` as part of each PR's verification. |
| `uuid` v8 → v13 breaking changes | Runtime error in log-events-library | v8→v13 is pure-ESM and drops Node < 16 support. Codebase runs on Bun/modern Node. Unit and e2e tests verify. |
| UUIDv7 leaks insertion timestamp | Third parties can read creation time from IDs | Accepted. `created_at` is already exposed; no new information leakage. |
| Need to rollback after PR1 merged | Mixed v4/v7 in DB | `ALTER ... SET DEFAULT gen_random_uuid()` reverts defaults. Existing v7 rows remain valid `uuid` values — no FK or storage issue. |

## Verification Plan

### Pre-flight (before PR1 merge)

- On every environment (dev, CI, staging, prod, every tenant DB):
  ```sql
  SELECT version();
  ```
  All must report PostgreSQL 18 or newer.

### PR1 (platform schema)

- Post-migration, on the platform DB:
  ```sql
  SELECT table_name, column_name, column_default
  FROM information_schema.columns
  WHERE column_default LIKE '%uuid%'
    AND table_schema = 'public';
  ```
  Every row must show `uuidv7()` as the default.
- Insert one test row and assert v7:
  ```sql
  SELECT (substring(id::text, 15, 1) = '7') AS is_v7
  FROM tb_user
  ORDER BY created_at DESC
  LIMIT 1;
  ```

### PR2 (tenant schema)

- Same two queries as PR1, run against the tenant schema.
- Repeat on at least two existing tenant databases.

### PR3 (application code)

- Unit test: `uuid.version(generated)` returns `7`.
- E2E: create a purchase request → audit entry is written → audit event
  ID's version is 7.
- Regression: audit logging pipeline, gateway request-correlation
  header, `tax_profile` create flow.
- `bun run lint` + `bun run check-types` + `bun run test` in every
  affected service.
- Grep check: no occurrences of `v4 as uuidv4` remain in the codebase.

### Acceptance criteria

- Postgres 18+ confirmed on all environments.
- All 164 UUID columns report `uuidv7()` as the default after migration.
- `uuid` package is at 13.x in root, `log-events-library`, and
  `backend-gateway`.
- No `import { v4 as uuidv4 }` occurrences remain.
- Existing v4 records read/update/delete normally.
- A batch of newly inserted rows sorted by PK is identical to the same
  rows sorted by `created_at`.

## Open Items

1. **Postgres version audit** — confirm every production, staging,
   development, and tenant DB is on Postgres 18+. If any is below,
   upgrade first or re-evaluate the generation strategy.
2. **Tenant inventory** — enumerate all existing tenant databases and
   assign an owner for running the PR2 migration against each.

## Rollout Order

1. Confirm open items 1 and 2.
2. Merge PR1 → deploy → run verification on platform DB.
3. Merge PR2 → deploy tenant migrations to every tenant DB → run
   verification on each.
4. Merge PR3 → deploy services → run regression tests.
