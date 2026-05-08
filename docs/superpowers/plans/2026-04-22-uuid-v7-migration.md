# UUIDv7 Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace UUIDv4 with UUIDv7 across all 164 Prisma UUID PK columns and all application-generated UUIDs (5 files + 3 package bumps), rolled out in 3 PRs.

**Architecture:** Database defaults switch from `gen_random_uuid()` to PostgreSQL 18 native `uuidv7()` via Prisma `@default(dbgenerated(...))`. Application code upgrades the `uuid` npm package to v13 and swaps `v4()` for `v7()`. No data backfill — existing v4 rows coexist with new v7 rows in the same columns.

**Tech Stack:** Prisma 6.19, PostgreSQL 18, Bun, NestJS (micro-business, backend-gateway), `uuid` npm v13.

**Spec:** `docs/superpowers/specs/2026-04-22-uuid-v7-migration-design.md`

---

## Pre-flight (blocks PR1 merge)

### Task 0: Environment audit

**Files:** None (manual operational step)

- [ ] **Step 1: Verify Postgres 18+ on every environment**

Run against every database the system connects to (dev, CI, staging, prod, every tenant DB):

```sql
SELECT version();
```

Expected: every result contains `PostgreSQL 18` or higher. If ANY environment is below 18, STOP. Do not proceed with this plan — either upgrade those environments first, or revise the spec to use the `pg_uuidv7` extension instead.

- [ ] **Step 2: Verify `uuidv7()` is callable**

Run on any target database:

```sql
SELECT uuidv7();
```

Expected: returns a UUID string (no function-not-found error).

- [ ] **Step 3: Inventory tenant databases**

List every existing tenant database that has run `prisma migrate deploy` on the tenant schema. Document the list (names / connection strings) in a scratch file — needed for PR2 rollout verification.

---

## PR1 — Platform schema

### Task 1.1: Create schema diff verification script

**Files:**
- Create: `scripts/verify-uuid-v7-defaults.sh`

- [ ] **Step 1: Write the verification script**

```bash
#!/usr/bin/env bash
# Usage: DATABASE_URL=... scripts/verify-uuid-v7-defaults.sh
# Exits 0 if every UUID column default is uuidv7(), non-zero otherwise.
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required" >&2
  exit 2
fi

BAD=$(psql "$DATABASE_URL" -tA -c "
  SELECT table_name || '.' || column_name || ' = ' || column_default
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND column_default LIKE '%uuid%'
    AND column_default NOT LIKE '%uuidv7%';
")

if [[ -n "$BAD" ]]; then
  echo "Columns still using non-v7 UUID defaults:" >&2
  echo "$BAD" >&2
  exit 1
fi

COUNT=$(psql "$DATABASE_URL" -tA -c "
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = 'public' AND column_default LIKE '%uuidv7%';
")

echo "OK: $COUNT columns using uuidv7()."
```

- [ ] **Step 2: Make it executable**

```bash
chmod +x scripts/verify-uuid-v7-defaults.sh
```

- [ ] **Step 3: Run it against the platform DB before changing anything**

```bash
cd packages/prisma-shared-schema-platform
DATABASE_URL="$SYSTEM_DATABASE_URL" ../../scripts/verify-uuid-v7-defaults.sh
```

Expected: **exits 1** with "Columns still using non-v7 UUID defaults:" — this proves the script catches the current state. Save this output as evidence that the baseline is v4.

- [ ] **Step 4: Commit the script**

```bash
git add scripts/verify-uuid-v7-defaults.sh
git commit -m "chore: add UUIDv7 default verification script"
```

---

### Task 1.2: Update platform `schema.prisma`

**Files:**
- Modify: `packages/prisma-shared-schema-platform/prisma/schema.prisma`

- [ ] **Step 1: Replace every `gen_random_uuid()` default with `uuidv7()`**

There are 23 occurrences. Use a single replace-all:

```bash
cd packages/prisma-shared-schema-platform
# sanity: confirm count before
grep -c 'gen_random_uuid()' prisma/schema.prisma
# expected: 23

# do the replacement
sed -i.bak 's/gen_random_uuid()/uuidv7()/g' prisma/schema.prisma

# verify
grep -c 'gen_random_uuid()' prisma/schema.prisma
# expected: 0
grep -c 'uuidv7()' prisma/schema.prisma
# expected: 23

# remove the sed backup
rm prisma/schema.prisma.bak
```

- [ ] **Step 2: Sanity-check the diff**

```bash
git diff prisma/schema.prisma | head -50
```

Expected: only `dbgenerated("gen_random_uuid()")` → `dbgenerated("uuidv7()")` changes, 23 of them, no other modifications.

---

### Task 1.3: Generate the Prisma migration

**Files:**
- Create: `packages/prisma-shared-schema-platform/prisma/migrations/<timestamp>_uuid_v7_default/migration.sql`

- [ ] **Step 1: Generate migration from local dev DB**

```bash
cd packages/prisma-shared-schema-platform
bun run db:migrate -- --name uuid_v7_default
```

Expected: Prisma creates a new migration folder `prisma/migrations/<timestamp>_uuid_v7_default/` containing a `migration.sql` file. The SQL should consist entirely of `ALTER TABLE ... ALTER COLUMN ... SET DEFAULT uuidv7();` statements — one per column.

- [ ] **Step 2: Inspect the generated SQL**

```bash
cat prisma/migrations/$(ls -t prisma/migrations | head -1)/migration.sql
```

Expected: 23 `ALTER TABLE ... SET DEFAULT uuidv7();` lines. No `UPDATE`, no `DROP COLUMN`, no `CREATE TABLE`. If you see anything else, STOP and investigate — the schema diff was wrong.

---

### Task 1.4: Verify the migration on the local DB

**Files:** None

- [ ] **Step 1: Confirm migration was applied**

`db:migrate` in step 1.3 already applies the migration to the local dev DB. Verify now:

```bash
DATABASE_URL="$SYSTEM_DATABASE_URL" ../../scripts/verify-uuid-v7-defaults.sh
```

Expected: `OK: 23 columns using uuidv7().`

- [ ] **Step 2: Verify `uuidv7()` generates v7 UUIDs**

This avoids inserting into real tables (which may have FK/NOT NULL constraints):

```bash
psql "$SYSTEM_DATABASE_URL" -c "
  SELECT
    uuidv7() AS generated,
    substring(uuidv7()::text, 15, 1) AS version_digit,
    substring(uuidv7()::text, 15, 1) = '7' AS is_v7;
"
```

Expected: `version_digit = 7` and `is_v7 = t`. If `is_v7 = f`, STOP — the function is returning a non-v7 UUID.

- [ ] **Step 3: Confirm a sample column's default resolves to v7 at insert time**

Test via a CTE so we don't need to satisfy any table's NOT NULL constraints:

```bash
psql "$SYSTEM_DATABASE_URL" -c "
  SELECT
    column_default,
    column_default LIKE '%uuidv7%' AS default_is_v7
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'tb_user'
    AND column_name = 'id';
"
```

Expected: `column_default = uuidv7()` and `default_is_v7 = t`.

---

### Task 1.5: Regenerate the Prisma client and build

**Files:** None (regenerated artifacts)

- [ ] **Step 1: Regenerate the client**

```bash
cd packages/prisma-shared-schema-platform
bun run db:generate
```

Expected: no errors; `generated/` is updated.

- [ ] **Step 2: Rebuild the shared package**

```bash
cd ../..
bun run build:package
```

Expected: no TypeScript errors. The `@repo/prisma-shared-schema-platform` package builds cleanly.

- [ ] **Step 3: Smoke-test the gateway can still start**

```bash
cd apps/backend-gateway
bun run build
```

Expected: build succeeds. This confirms the regenerated client is type-compatible with consumer code.

---

### Task 1.6: Commit PR1

**Files:** All changes from Tasks 1.2 – 1.5

- [ ] **Step 1: Review the diff one more time**

```bash
git status
git diff --stat
```

Expected: only files under `packages/prisma-shared-schema-platform/prisma/` (schema + one new migration dir) and possibly `packages/prisma-shared-schema-platform/generated/` (if committed in this repo).

- [ ] **Step 2: Stage and commit**

```bash
git add packages/prisma-shared-schema-platform/prisma/schema.prisma
git add packages/prisma-shared-schema-platform/prisma/migrations/
# include generated/ only if the repo tracks it (check git status)
git commit -m "feat(platform-schema): use Postgres 18 uuidv7() for UUID defaults

Replaces gen_random_uuid() with uuidv7() on all 23 UUID PK columns in
the platform schema. Existing v4 rows remain unchanged; new rows get
v7 IDs that sort chronologically by PK.

Requires PostgreSQL 18+ on the target database."
```

---

## PR2 — Tenant schema

### Task 2.1: Baseline verification on tenant DB

**Files:** None

- [ ] **Step 1: Confirm current tenant DB is on v4**

Pick one test tenant DB:

```bash
DATABASE_URL="<tenant_db_url>" scripts/verify-uuid-v7-defaults.sh
```

Expected: exits 1 with the list of 141 columns using `gen_random_uuid()`.

---

### Task 2.2: Update tenant `schema.prisma`

**Files:**
- Modify: `packages/prisma-shared-schema-tenant/prisma/schema.prisma`

- [ ] **Step 1: Replace every `gen_random_uuid()` default with `uuidv7()`**

```bash
cd packages/prisma-shared-schema-tenant
grep -c 'gen_random_uuid()' prisma/schema.prisma
# expected: 141

sed -i.bak 's/gen_random_uuid()/uuidv7()/g' prisma/schema.prisma

grep -c 'gen_random_uuid()' prisma/schema.prisma
# expected: 0
grep -c 'uuidv7()' prisma/schema.prisma
# expected: 141

rm prisma/schema.prisma.bak
```

- [ ] **Step 2: Sanity-check the diff**

```bash
git diff prisma/schema.prisma | wc -l
# expected: ~282 lines changed (141 removed + 141 added)
git diff prisma/schema.prisma | grep -c '^-.*gen_random_uuid'
# expected: 141
git diff prisma/schema.prisma | grep -c '^+.*uuidv7'
# expected: 141
```

---

### Task 2.3: Generate and inspect the tenant migration

**Files:**
- Create: `packages/prisma-shared-schema-tenant/prisma/migrations/<timestamp>_uuid_v7_default/migration.sql`

- [ ] **Step 1: Generate migration**

```bash
cd packages/prisma-shared-schema-tenant
bun run db:migrate -- --name uuid_v7_default
```

Expected: a new migration folder with `migration.sql` containing 141 `ALTER TABLE ... SET DEFAULT uuidv7();` statements and nothing else.

- [ ] **Step 2: Inspect**

```bash
LATEST=$(ls -t prisma/migrations | head -1)
wc -l prisma/migrations/$LATEST/migration.sql
# expected: ~141-150 lines (141 ALTERs + some blank lines)

grep -c 'uuidv7()' prisma/migrations/$LATEST/migration.sql
# expected: 141

grep -cE '^(UPDATE|DROP|CREATE TABLE|DELETE)' prisma/migrations/$LATEST/migration.sql
# expected: 0
```

STOP if any of the expected counts don't match — the migration captured something beyond the default change.

---

### Task 2.4: Verify tenant migration on local DB

**Files:** None

- [ ] **Step 1: Verify defaults**

```bash
DATABASE_URL="<tenant_db_url>" scripts/verify-uuid-v7-defaults.sh
```

Expected: `OK: 141 columns using uuidv7().`

- [ ] **Step 2: Verify `uuidv7()` generates v7 UUIDs**

```bash
psql "$TENANT_DATABASE_URL" -c "
  SELECT substring(uuidv7()::text, 15, 1) = '7' AS is_v7;
"
```

Expected: `is_v7 = t`.

- [ ] **Step 3: Time-ordering smoke test — 5 generated UUIDv7s sort in generation order**

This uses `generate_series` to avoid touching any real table:

```bash
psql "$TENANT_DATABASE_URL" <<'SQL'
WITH generated AS (
  SELECT gs AS gen_order, uuidv7() AS id, clock_timestamp() AS gen_time
  FROM generate_series(1, 5) AS gs
)
SELECT
  gen_order,
  row_number() OVER (ORDER BY id) AS pk_order,
  gen_order = row_number() OVER (ORDER BY id) AS matches
FROM generated
ORDER BY gen_order;
SQL
```

Expected: `matches = t` for all 5 rows. This validates that UUIDv7 values generated in sequence sort in the same order as their generation time.

---

### Task 2.5: Regenerate tenant client and build

**Files:** None

- [ ] **Step 1: Regenerate + build**

```bash
cd packages/prisma-shared-schema-tenant
bun run db:generate
cd ../..
bun run build:package
```

Expected: clean build.

- [ ] **Step 2: Build the service that uses tenant schema heaviest**

```bash
cd apps/micro-business
bun run build
```

Expected: clean build.

---

### Task 2.6: Commit PR2

**Files:** All changes from Tasks 2.2 – 2.5

- [ ] **Step 1: Diff review**

```bash
git status
git diff --stat
```

Expected: only files under `packages/prisma-shared-schema-tenant/prisma/`.

- [ ] **Step 2: Commit**

```bash
git add packages/prisma-shared-schema-tenant/prisma/schema.prisma
git add packages/prisma-shared-schema-tenant/prisma/migrations/
git commit -m "feat(tenant-schema): use Postgres 18 uuidv7() for UUID defaults

Replaces gen_random_uuid() with uuidv7() on all 141 UUID PK columns
across the tenant schema. Existing v4 rows remain unchanged.

Rollout note: the migration must be applied to EVERY existing tenant
database via 'prisma migrate deploy' — see PR description for the
tenant inventory from Task 0 Step 3."
```

---

## PR3 — Application code

### Task 3.1: Bump the `uuid` package

**Files:**
- Modify: `package.json` (root)
- Modify: `packages/log-events-library/package.json`
- Modify: `apps/backend-gateway/package.json`

- [ ] **Step 1: Update root `package.json`**

Change:

```json
"uuid": "^8.3.2"
```

to:

```json
"uuid": "^13.0.0"
```

- [ ] **Step 2: Update `packages/log-events-library/package.json`**

Change:

```json
"uuid": "^8.3.2",
```

to:

```json
"uuid": "^13.0.0",
```

- [ ] **Step 3: Update `apps/backend-gateway/package.json`**

Change:

```json
"uuid": "^11.1.0",
```

to:

```json
"uuid": "^13.0.0",
```

- [ ] **Step 4: Install**

```bash
bun install
```

Expected: lockfile updated, no install errors. Verify installed versions:

```bash
bun pm ls | grep '^ *uuid'
```

Expected: every `uuid` entry shows a 13.x version (e.g. `uuid@13.0.0`).

- [ ] **Step 5: Type-check everything**

```bash
bun run check-types
```

Expected: no errors. uuid v13 is API-compatible with v8/v11 for the `v4`/`v7` named exports.

---

### Task 3.2: Swap `v4` → `v7` in `log-events-library` (3 files)

**Files:**
- Modify: `packages/log-events-library/src/services/log-events.service.ts:2`
- Modify: `packages/log-events-library/src/interceptors/audit-context.interceptor.ts:4`
- Modify: `packages/log-events-library/src/middleware/prisma-audit.middleware.ts:1`

- [ ] **Step 1: Edit `log-events.service.ts`**

Change line 2:

```ts
import { v4 as uuidv4 } from 'uuid';
```

to:

```ts
import { v7 as uuidv7 } from 'uuid';
```

Then replace every `uuidv4(` with `uuidv7(` in the file:

```bash
sed -i.bak 's/uuidv4(/uuidv7(/g' packages/log-events-library/src/services/log-events.service.ts
rm packages/log-events-library/src/services/log-events.service.ts.bak
```

Verify no `uuidv4` occurrences remain:

```bash
grep -n uuidv4 packages/log-events-library/src/services/log-events.service.ts
# expected: no output
```

- [ ] **Step 2: Edit `audit-context.interceptor.ts`**

Change line 4:

```ts
import { v4 as uuidv4 } from 'uuid';
```

to:

```ts
import { v7 as uuidv7 } from 'uuid';
```

Then:

```bash
sed -i.bak 's/uuidv4(/uuidv7(/g' packages/log-events-library/src/interceptors/audit-context.interceptor.ts
rm packages/log-events-library/src/interceptors/audit-context.interceptor.ts.bak
grep -n uuidv4 packages/log-events-library/src/interceptors/audit-context.interceptor.ts
# expected: no output
```

- [ ] **Step 3: Edit `prisma-audit.middleware.ts`**

Change line 1:

```ts
import { v4 as uuidv4 } from 'uuid';
```

to:

```ts
import { v7 as uuidv7 } from 'uuid';
```

Then:

```bash
sed -i.bak 's/uuidv4(/uuidv7(/g' packages/log-events-library/src/middleware/prisma-audit.middleware.ts
rm packages/log-events-library/src/middleware/prisma-audit.middleware.ts.bak
grep -n uuidv4 packages/log-events-library/src/middleware/prisma-audit.middleware.ts
# expected: no output
```

- [ ] **Step 4: Build the library**

```bash
cd packages/log-events-library
bun run build
```

Expected: clean build.

---

### Task 3.3: Swap `v4` → `v7` in `backend-gateway`

**Files:**
- Modify: `apps/backend-gateway/src/common/interceptors/gateway-request-context.interceptor.ts:8`

- [ ] **Step 1: Edit the file**

Change the import:

```ts
import { v4 as uuidv4 } from 'uuid';
```

to:

```ts
import { v7 as uuidv7 } from 'uuid';
```

Then replace all usages in the file:

```bash
sed -i.bak 's/uuidv4(/uuidv7(/g' apps/backend-gateway/src/common/interceptors/gateway-request-context.interceptor.ts
rm apps/backend-gateway/src/common/interceptors/gateway-request-context.interceptor.ts.bak
grep -n uuidv4 apps/backend-gateway/src/common/interceptors/gateway-request-context.interceptor.ts
# expected: no output
```

- [ ] **Step 2: Build the gateway**

```bash
cd apps/backend-gateway
bun run build
```

Expected: clean build.

---

### Task 3.4: Swap `v4` → `v7` in `micro-business`

**Files:**
- Modify: `apps/micro-business/src/master/tax_profile/tax_profile.service.ts:11`

- [ ] **Step 1: Edit the file**

Change line 11:

```ts
import { v4 as uuidv4 } from 'uuid';
```

to:

```ts
import { v7 as uuidv7 } from 'uuid';
```

Then:

```bash
sed -i.bak 's/uuidv4(/uuidv7(/g' apps/micro-business/src/master/tax_profile/tax_profile.service.ts
rm apps/micro-business/src/master/tax_profile/tax_profile.service.ts.bak
grep -n uuidv4 apps/micro-business/src/master/tax_profile/tax_profile.service.ts
# expected: no output
```

- [ ] **Step 2: Build**

```bash
cd apps/micro-business
bun run build
```

Expected: clean build.

---

### Task 3.5: Global grep check — no `v4` stragglers

**Files:** None

- [ ] **Step 1: Confirm no `v4 as uuidv4` imports remain**

```bash
cd /Users/samutpra/GitHub/carmensoftware-organize/carmen-turborepo-backend-v2
grep -rn "v4 as uuidv4" --include='*.ts' --exclude-dir=node_modules --exclude-dir=generated --exclude-dir=dist
```

Expected: **no output** (or only matches inside `node_modules` / `generated` / `dist`, which are filtered above).

- [ ] **Step 2: Confirm no bare `uuidv4(` calls remain**

```bash
grep -rn "uuidv4(" --include='*.ts' --exclude-dir=node_modules --exclude-dir=generated --exclude-dir=dist
```

Expected: **no output**.

- [ ] **Step 3: Confirm `uuid.validate` usage in `app-id.guard.ts` is intact (no accidental edit)**

```bash
grep -n "uuidValidate\|validate as uuidValidate" apps/backend-gateway/src/common/guard/app-id.guard.ts
```

Expected: one line showing `import { validate as uuidValidate } from 'uuid';` (unchanged).

---

### Task 3.6: Runtime assertion — generated IDs are v7

**Files:**
- Create: `scripts/assert-uuid-v7.ts`

- [ ] **Step 1: Write a runnable assertion script**

```ts
// scripts/assert-uuid-v7.ts
// Run: bun scripts/assert-uuid-v7.ts
// Exits 0 on success, 1 on failure.
import { v7 as uuidv7, validate, version } from 'uuid';

const id = uuidv7();
const ok = validate(id) && version(id) === 7;

if (!ok) {
  console.error(`FAIL: generated id=${id} valid=${validate(id)} version=${version(id)}`);
  process.exit(1);
}

console.log(`OK: ${id} is a valid UUIDv7`);
```

- [ ] **Step 2: Run it**

```bash
bun scripts/assert-uuid-v7.ts
```

Expected: `OK: <uuid> is a valid UUIDv7` and exit code 0.

- [ ] **Step 3: Commit the script**

```bash
git add scripts/assert-uuid-v7.ts
```

---

### Task 3.7: Run the full test and lint pipeline

**Files:** None

- [ ] **Step 1: Lint**

```bash
bun run lint
```

Expected: zero lint errors.

- [ ] **Step 2: Type-check**

```bash
bun run check-types
```

Expected: zero type errors.

- [ ] **Step 3: Run tests in every affected service**

```bash
cd apps/micro-business && bun run test && cd ../..
cd apps/backend-gateway && bun run test && cd ../..
```

Expected: all tests pass. Any pre-existing failing tests unrelated to UUID should be documented in the PR description — don't fix unrelated failures in this PR.

---

### Task 3.8: Commit PR3

**Files:** All changes from Tasks 3.1 – 3.7

- [ ] **Step 1: Diff review**

```bash
git status
git diff --stat
```

Expected: `package.json` (3 files), 5 `.ts` source files, `bun.lock`, `scripts/assert-uuid-v7.ts`.

- [ ] **Step 2: Commit**

```bash
git add package.json bun.lock
git add packages/log-events-library/package.json
git add apps/backend-gateway/package.json
git add packages/log-events-library/src/services/log-events.service.ts
git add packages/log-events-library/src/interceptors/audit-context.interceptor.ts
git add packages/log-events-library/src/middleware/prisma-audit.middleware.ts
git add apps/backend-gateway/src/common/interceptors/gateway-request-context.interceptor.ts
git add apps/micro-business/src/master/tax_profile/tax_profile.service.ts
git add scripts/assert-uuid-v7.ts
git commit -m "feat: use UUIDv7 for app-generated IDs

Bumps the uuid package to v13 in root, log-events-library, and
backend-gateway, then replaces v4() with v7() in:
- log-events.service.ts, audit-context.interceptor.ts,
  prisma-audit.middleware.ts (audit event IDs)
- gateway-request-context.interceptor.ts (request correlation IDs)
- tax_profile.service.ts (tax profile IDs)

app-id.guard.ts is untouched — its validate() call accepts v7 as-is.

Pairs with the DB-side changes in the two earlier schema PRs; together
they give the system uniform time-sortable UUIDs."
```

---

## Post-merge Operational Steps

### Task 4.1: Deploy tenant migrations to all tenant DBs

**Files:** None (operational)

- [ ] **Step 1: Use the tenant inventory from Task 0 Step 3**

For each tenant database in the inventory:

```bash
DATABASE_URL="<tenant_db_url>" bunx prisma migrate deploy \
  --schema packages/prisma-shared-schema-tenant/prisma/schema.prisma
```

Expected: `All migrations have been successfully applied.`

- [ ] **Step 2: Verify each tenant DB**

```bash
DATABASE_URL="<tenant_db_url>" scripts/verify-uuid-v7-defaults.sh
```

Expected for every tenant: `OK: 141 columns using uuidv7().`

- [ ] **Step 3: Record rollout completion**

Mark each tenant DB as migrated in the inventory. If any tenant DB fails to migrate, STOP the rollout and triage — do not leave the fleet in a mixed state longer than necessary.

---

## Acceptance checklist (copy to PR descriptions)

- [ ] `SELECT version()` shows PostgreSQL 18+ on every environment.
- [ ] Platform DB: `scripts/verify-uuid-v7-defaults.sh` reports 23 columns.
- [ ] Tenant DB(s): `scripts/verify-uuid-v7-defaults.sh` reports 141 columns on every tenant DB.
- [ ] No `import { v4 as uuidv4 }` anywhere under `apps/` or `packages/` (`grep -rn 'v4 as uuidv4'`).
- [ ] `uuid` package is 13.x in root, `log-events-library`, `backend-gateway`.
- [ ] `bun run lint && bun run check-types` both clean.
- [ ] Existing v4 rows still read, update, and delete normally.
- [ ] Time-ordering smoke test: 5 rows inserted in order → PK sort equals `created_at` sort.
