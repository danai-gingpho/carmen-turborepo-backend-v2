# Remove Transfer Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Delete the standalone Transfer module across `backend-gateway`, `micro-business`, `micro-file`, Bruno collections, and tenant Prisma schema; drop the four `tb_transfer*` tables. Preserve `transfer_in`/`transfer_out` transaction enum + `transfer_header`/`transfer_detail` workflow enum + transfer-related report templates (still used elsewhere).

**Architecture:** Pure removal — no new code. Each task deletes a coherent slice, then runs the matching verification command (typecheck/build/lint/swagger:verify) and only commits when green. The Prisma schema edits + migration come last so the SQL drop runs against an already-quiet codebase.

**Tech Stack:** Bun (Turborepo), NestJS (backend-gateway, micro-business, micro-file), Prisma + PostgreSQL (tenant schema), Bruno (`.bru`).

**Spec:** `docs/superpowers/specs/2026-04-29-remove-transfer-module-design.md`

---

## Task 1: Delete backend-gateway transfer modules + register

**Files:**
- Delete: `apps/backend-gateway/src/application/transfer/` (folder)
- Delete: `apps/backend-gateway/src/application/transfer-detail/` (folder)
- Delete: `apps/backend-gateway/src/application/transfer-comment/` (folder)
- Delete: `apps/backend-gateway/src/application/transfer-detail-comment/` (folder)
- Modify: `apps/backend-gateway/src/application/route-application.ts` (lines 57-58, 87-88, 153-154, 183-184)

- [ ] **Step 1: Delete the four transfer module folders**

```bash
rm -rf apps/backend-gateway/src/application/transfer \
       apps/backend-gateway/src/application/transfer-detail \
       apps/backend-gateway/src/application/transfer-comment \
       apps/backend-gateway/src/application/transfer-detail-comment
```

- [ ] **Step 2: Edit `apps/backend-gateway/src/application/route-application.ts` — drop 4 imports**

Remove these four lines (do NOT renumber surrounding imports — just delete):

```ts
import { TransferCommentModule } from './transfer-comment/transfer-comment.module';
import { TransferDetailCommentModule } from './transfer-detail-comment/transfer-detail-comment.module';
```

```ts
import { TransferModule } from './transfer/transfer.module';
import { TransferDetailModule } from './transfer-detail/transfer-detail.module';
```

- [ ] **Step 3: Edit `apps/backend-gateway/src/application/route-application.ts` — drop 4 array entries**

Remove these four lines from the modules array (note trailing comma):

```ts
    TransferCommentModule,
    TransferDetailCommentModule,
```

```ts
    TransferModule,
    TransferDetailModule,
```

- [ ] **Step 4: Verify gateway typecheck still works for non-transfer code (will surface DTO export break in next task)**

```bash
cd apps/backend-gateway && bun run check-types 2>&1 | tail -20
```

Expected: errors will mention `./transfer/index` (handled in Task 2). No errors about missing `TransferModule`.

- [ ] **Step 5: Do not commit yet — combine with Tasks 2 & 3**

---

## Task 2: Delete backend-gateway common DTO transfer

**Files:**
- Delete: `apps/backend-gateway/src/common/dto/transfer/` (folder)
- Modify: `apps/backend-gateway/src/common/dto/index.ts:67`

- [ ] **Step 1: Delete the folder**

```bash
rm -rf apps/backend-gateway/src/common/dto/transfer
```

- [ ] **Step 2: Edit `apps/backend-gateway/src/common/dto/index.ts` — remove line 67**

Old:
```ts
export * from './transfer/index'
```

New: (remove the line entirely; no replacement)

- [ ] **Step 3: Verify**

```bash
cd apps/backend-gateway && bun run check-types 2>&1 | tail -20
```

Expected: no errors referencing `transfer` or `TransferModule`. If errors point to other files importing from `@/common/dto/transfer`, grep for them and fix:

```bash
grep -rn "common/dto/transfer\|from.*transfer\.dto\|from.*transfer\.serializer" apps/backend-gateway/src
```

Expected: zero matches.

- [ ] **Step 4: Do not commit yet — combine with Task 3**

---

## Task 3: Remove `Inventory: Transfers` swagger tag + tag-mapping

**Files:**
- Modify: `apps/backend-gateway/src/swagger/tag-groups.ts` (lines ~55, ~136)
- Modify: `scripts/swagger-sync/tag-mapping.json` (lines 138-141)

- [ ] **Step 1: Edit `apps/backend-gateway/src/swagger/tag-groups.ts` — remove tag definition**

Old (line 55):
```ts
  { name: 'Inventory: Transfers',        description: 'Transfer header, details, comments' },
```

New: (remove the line entirely)

- [ ] **Step 2: Edit `apps/backend-gateway/src/swagger/tag-groups.ts` — remove from Inventory group**

Old (line 136):
```ts
      'Inventory: Transfers',
```

New: (remove the line entirely)

- [ ] **Step 3: Edit `scripts/swagger-sync/tag-mapping.json` — remove 4 entries (lines 138-141)**

Remove these four JSON keys/values entirely:

```json
  "apps/backend-gateway/src/application/transfer/transfer.controller.ts": "Inventory: Transfers",
  "apps/backend-gateway/src/application/transfer-detail/transfer-detail.controller.ts": "Inventory: Transfers",
  "apps/backend-gateway/src/application/transfer-comment/transfer-comment.controller.ts": "Inventory: Transfers",
  "apps/backend-gateway/src/application/transfer-detail-comment/transfer-detail-comment.controller.ts": "Inventory: Transfers",
```

Also remove the blank lines that surrounded the deleted block so the JSON stays clean. Confirm the file is still valid JSON:

```bash
python3 -c "import json; json.load(open('scripts/swagger-sync/tag-mapping.json'))" && echo OK
```

Expected: `OK`

- [ ] **Step 4: Verify gateway typecheck + build**

```bash
cd apps/backend-gateway && bun run check-types && bun run build 2>&1 | tail -20
```

Expected: both pass.

- [ ] **Step 5: Verify swagger consistency**

```bash
bun run swagger:verify 2>&1 | tail -20
```

Expected: PASS. If it complains about a missing tag mapping, find any remaining gateway controller that still uses `@ApiTags('Inventory: Transfers')`:

```bash
grep -rn "Inventory: Transfers" apps/backend-gateway/src
```

Expected: zero matches.

- [ ] **Step 6: Commit gateway changes**

```bash
git add apps/backend-gateway scripts/swagger-sync/tag-mapping.json
git commit -m "chore(gateway): remove transfer routes, dto, swagger tag"
```

---

## Task 4: Delete micro-business transfer modules + register + workflow mapping

**Files:**
- Delete: `apps/micro-business/src/inventory/transfer/` (folder)
- Delete: `apps/micro-business/src/inventory/transfer-comment/` (folder)
- Delete: `apps/micro-business/src/inventory/transfer-detail-comment/` (folder)
- Modify: `apps/micro-business/src/app.module.ts:32, 131`
- Modify: `apps/micro-business/src/common/dto/index.ts:55`
- Modify: `apps/micro-business/src/master/workflows/workflows.service.ts:709`

- [ ] **Step 1: Delete the three transfer folders**

```bash
rm -rf apps/micro-business/src/inventory/transfer \
       apps/micro-business/src/inventory/transfer-comment \
       apps/micro-business/src/inventory/transfer-detail-comment
```

- [ ] **Step 2: Edit `apps/micro-business/src/app.module.ts` — drop import (line 32) and array entry (line 131)**

Old (line 32):
```ts
import { TransferModule } from './inventory/transfer/transfer.module';
```

New: (remove the line)

Old (line 131):
```ts
    TransferModule,
```

New: (remove the line)

- [ ] **Step 3: Edit `apps/micro-business/src/common/dto/index.ts` — drop line 55**

Old:
```ts
export * from '@/inventory/transfer/dto/index';
```

New: (remove the line)

- [ ] **Step 4: Edit `apps/micro-business/src/master/workflows/workflows.service.ts` — drop `tf` mapping (line 709)**

Old:
```ts
  private static readonly DOCUMENT_TABLE_MAP: Record<string, string> = {
    po: 'tb_purchase_order',
    pr: 'tb_purchase_request',
    sr: 'tb_store_requisition',
    grn: 'tb_good_received_note',
    cn: 'tb_credit_note',
    si: 'tb_stock_in',
    so: 'tb_stock_out',
    tf: 'tb_transfer',
    jv: 'tb_jv_header',
  };
```

New:
```ts
  private static readonly DOCUMENT_TABLE_MAP: Record<string, string> = {
    po: 'tb_purchase_order',
    pr: 'tb_purchase_request',
    sr: 'tb_store_requisition',
    grn: 'tb_good_received_note',
    cn: 'tb_credit_note',
    si: 'tb_stock_in',
    so: 'tb_stock_out',
    jv: 'tb_jv_header',
  };
```

- [ ] **Step 5: Verify no other code in micro-business still references transfer module symbols**

```bash
grep -rn "inventory/transfer\|TransferModule\|TransferService\|TransferController\b" apps/micro-business/src 2>&1 | grep -v "/dist/" | head -20
```

Expected: zero matches. (Hits like `executeTransfer`, `ITransferParams`, `transfer_in`/`transfer_out` in `inventory-transaction.service.ts` are kept by spec — those should NOT match the patterns above.)

- [ ] **Step 6: Verify typecheck + build**

```bash
cd apps/micro-business && bun run check-types && bun run build 2>&1 | tail -20
```

Expected: both pass.

- [ ] **Step 7: Commit micro-business changes**

```bash
git add apps/micro-business
git commit -m "chore(micro-business): remove transfer module + workflow mapping"
```

---

## Task 5: Delete micro-file transfer DTO

**Files:**
- Delete: `apps/micro-file/src/common/dto/transfer/` (folder)
- Modify: `apps/micro-file/src/common/dto/index.ts:66`

- [ ] **Step 1: Delete folder + remove export**

```bash
rm -rf apps/micro-file/src/common/dto/transfer
```

Old (line 66 of `apps/micro-file/src/common/dto/index.ts`):
```ts
export * from './transfer/index'
```

New: (remove the line)

- [ ] **Step 2: Verify**

```bash
cd apps/micro-file && bun run check-types 2>&1 | tail -10
grep -rn "common/dto/transfer\|TransferCreateDto\|TransferUpdateDto\|TransferDetailCreateDto" apps/micro-file/src 2>&1 | head
```

Expected: typecheck passes; grep returns zero matches.

- [ ] **Step 3: Commit**

```bash
git add apps/micro-file
git commit -m "chore(micro-file): remove transfer dto"
```

---

## Task 6: Delete Bruno transfer collections

**Files:**
- Delete: `apps/bruno/carmen-inventory/inventory/transfer/` (folder, includes nested `details/`)
- Delete: `apps/bruno/carmen-inventory/inventory/transfer-comment/` (folder)
- Delete: `apps/bruno/carmen-inventory/inventory/transfer-detail-comment/` (folder)

- [ ] **Step 1: Delete folders**

```bash
rm -rf apps/bruno/carmen-inventory/inventory/transfer \
       apps/bruno/carmen-inventory/inventory/transfer-comment \
       apps/bruno/carmen-inventory/inventory/transfer-detail-comment
```

- [ ] **Step 2: Verify with bruno:sync:dry**

```bash
bun run bruno:sync:dry 2>&1 | tail -30
```

Expected: no entries proposing to **add** transfer endpoints (since gateway transfer controllers are gone, and Bruno files are also gone — the script should report no orphan and no missing). If the script complains about archived items relating to transfer, leave them as-is — `_archived/` is housekeeping per CLAUDE.md.

- [ ] **Step 3: Commit**

```bash
git add apps/bruno
git commit -m "chore(bruno): remove transfer collections"
```

---

## Task 7: Edit Prisma tenant schema — drop 4 transfer models + relations

**Files:**
- Modify: `packages/prisma-shared-schema-tenant/prisma/schema.prisma`

Edits to make (exact line numbers will shift as you delete; use the `Edit` tool with surrounding context):

**A. Remove `tb_transfer_detail tb_transfer_detail[]` from `tb_inventory_transaction` model (line 1061)**

Old:
```prisma
  tb_credit_note_detail           tb_credit_note_detail[]
  tb_inventory_transaction_detail tb_inventory_transaction_detail[]
  tb_stock_in_detail              tb_stock_in_detail[]
  tb_stock_out_detail             tb_stock_out_detail[]
  tb_transfer_detail              tb_transfer_detail[]
  tb_store_requisition_detail     tb_store_requisition_detail[]
```

New:
```prisma
  tb_credit_note_detail           tb_credit_note_detail[]
  tb_inventory_transaction_detail tb_inventory_transaction_detail[]
  tb_stock_in_detail              tb_stock_in_detail[]
  tb_stock_out_detail             tb_stock_out_detail[]
  tb_store_requisition_detail     tb_store_requisition_detail[]
```

**B. Remove the two `tb_transfer_*` relations from `tb_location` model (lines 1323-1324)**

Old:
```prisma
  tb_store_requisition_from                     tb_store_requisition[]                                @relation("store_requisition_from_location")
  tb_store_requisition_to                       tb_store_requisition[]                                @relation("store_requisition_to_location")
  tb_transfer_from                              tb_transfer[]                                         @relation("transfer_from_location")
  tb_transfer_to                                tb_transfer[]                                         @relation("transfer_to_location")
  tb_spot_check                                 tb_spot_check[]
```

New:
```prisma
  tb_store_requisition_from                     tb_store_requisition[]                                @relation("store_requisition_from_location")
  tb_store_requisition_to                       tb_store_requisition[]                                @relation("store_requisition_to_location")
  tb_spot_check                                 tb_spot_check[]
```

**C. Remove `tb_transfer_detail tb_transfer_detail[]` from `tb_product` model (line 1512)**

Old:
```prisma
  tb_stock_in_detail                  tb_stock_in_detail[]
  tb_stock_out_detail                 tb_stock_out_detail[]
  tb_transfer_detail                  tb_transfer_detail[]
  tb_store_requisition_detail         tb_store_requisition_detail[]
```

New:
```prisma
  tb_stock_in_detail                  tb_stock_in_detail[]
  tb_stock_out_detail                 tb_stock_out_detail[]
  tb_store_requisition_detail         tb_store_requisition_detail[]
```

**D. Delete the four model definitions (lines 2919-3048)**

Delete the entire block starting with `model tb_transfer {` (line 2919) through the closing `}` of `model tb_transfer_detail_comment {` (line 3048). The next model after the block is `model tb_store_requisition {` — leave it untouched.

- [ ] **Step 1: Apply edits A, B, C, D using Edit tool with the exact old/new blocks above**

- [ ] **Step 2: Verify schema parses (no client gen yet)**

```bash
cd packages/prisma-shared-schema-tenant && bunx prisma format
```

Expected: file reformats and exits 0. If errors mention undefined references (e.g. `tb_transfer` referenced by something we missed), grep:

```bash
grep -n "tb_transfer\b\|tb_transfer_detail\b\|tb_transfer_comment\b\|tb_transfer_detail_comment\b" packages/prisma-shared-schema-tenant/prisma/schema.prisma
```

Expected: zero matches.

- [ ] **Step 3: Confirm enum lines we are KEEPING are still present**

```bash
grep -n "transfer_header\|transfer_detail$\|transfer_in\|transfer_out" packages/prisma-shared-schema-tenant/prisma/schema.prisma
```

Expected: 4 lines — `transfer_header`, `transfer_detail` (workflow enum, lines ~177-180), `transfer_in`, `transfer_out` (transaction enum, lines ~1097-1101). These stay per spec.

- [ ] **Step 4: Do not commit yet — combine with Task 8**

---

## Task 8: Create migration SQL + regenerate Prisma client

**Files:**
- Create: `packages/prisma-shared-schema-tenant/prisma/migrations/20260429100000_drop_tb_transfer/migration.sql`

- [ ] **Step 1: Create the migration directory + file**

```bash
mkdir -p packages/prisma-shared-schema-tenant/prisma/migrations/20260429100000_drop_tb_transfer
```

Write `packages/prisma-shared-schema-tenant/prisma/migrations/20260429100000_drop_tb_transfer/migration.sql`:

```sql
-- Drop transfer module tables (data is dropped per design decision Q1+Q5)
DROP TABLE IF EXISTS "tb_transfer_detail_comment" CASCADE;
DROP TABLE IF EXISTS "tb_transfer_comment" CASCADE;
DROP TABLE IF EXISTS "tb_transfer_detail" CASCADE;
DROP TABLE IF EXISTS "tb_transfer" CASCADE;
```

- [ ] **Step 2: Sanity-check there's no other migration with the same timestamp**

```bash
ls packages/prisma-shared-schema-tenant/prisma/migrations | grep ^20260429100000
```

Expected: only the new folder.

- [ ] **Step 3: Regenerate Prisma client**

```bash
bun run db:generate 2>&1 | tail -20
```

Expected: success, no warnings about `tb_transfer*`. The generated client at `packages/prisma-shared-schema-tenant/generated/client/` will no longer expose those models.

- [ ] **Step 4: Repo-wide typecheck**

```bash
bun run check-types 2>&1 | tail -40
```

Expected: PASS across the workspace. If anything still references generated `Prisma.Tb_transfer*` types, grep:

```bash
grep -rn "Prisma\.Tb_transfer\|tb_transfer\b\|tb_transfer_detail\b\|tb_transfer_comment\b\|tb_transfer_detail_comment\b" apps packages --include="*.ts" 2>&1 | grep -v "/dist/" | grep -v "/generated/" | head -20
```

Expected: zero matches.

- [ ] **Step 5: Repo-wide lint + build**

```bash
bun run lint 2>&1 | tail -20 && bun run build 2>&1 | tail -20
```

Expected: both pass.

- [ ] **Step 6: Run service unit tests**

```bash
cd apps/micro-business && bun run test 2>&1 | tail -30
```

```bash
cd apps/backend-gateway && bun run test 2>&1 | tail -30
```

Expected: both pass. (Transfer-only tests were deleted with the modules; nothing should remain that imports from a deleted path.)

- [ ] **Step 7: Run swagger:verify one more time end-to-end**

```bash
bun run swagger:verify 2>&1 | tail -20
```

Expected: PASS.

- [ ] **Step 8: Commit schema + migration**

```bash
git add packages/prisma-shared-schema-tenant/prisma/schema.prisma \
        packages/prisma-shared-schema-tenant/prisma/migrations/20260429100000_drop_tb_transfer \
        packages/prisma-shared-schema-tenant/generated
git commit -m "chore(tenant-schema): drop tb_transfer* tables + models"
```

---

## Task 9: Apply migration to dev tenant DB and verify

**Files:** none — runtime verification only.

- [ ] **Step 1: Apply migration on dev tenant DB**

```bash
cd packages/prisma-shared-schema-tenant && bun run db:migrate 2>&1 | tail -30
```

Expected: `Applying migration 20260429100000_drop_tb_transfer ... done`. If `db:migrate` is not the right alias, check `package.json` scripts in this package — equivalent is `bunx prisma migrate dev` or `bunx prisma migrate deploy`.

- [ ] **Step 2: Confirm tables are gone**

```bash
psql "$TENANT_DATABASE_URL" -c "\dt tb_transfer*" 2>&1 | tail -10
```

Expected: `Did not find any relation named "tb_transfer*"` or empty result. (`TENANT_DATABASE_URL` env var must point at the dev tenant DB used during the migration.)

- [ ] **Step 3: Smoke-test the gateway dev server**

```bash
bun run dev --filter=backend-gateway &
sleep 8
curl -sS http://localhost:4000/swagger-json | python3 -c "import json,sys; d=json.load(sys.stdin); paths=[p for p in d.get('paths',{}) if 'transfer' in p.lower()]; print('transfer paths:', paths)"
kill %1 2>/dev/null
```

Expected: `transfer paths: []`.

- [ ] **Step 4: Optionally run bruno:sync:dry once more**

```bash
bun run bruno:sync:dry 2>&1 | tail -20
```

Expected: clean — no add/update/archive proposed for transfer.

- [ ] **Step 5: Tag the work as done**

No additional commit; the previous Task 8 commit is the final code change. Move on to PR creation per the user's preferred workflow.

---

## Self-Review

**Spec coverage:**
- Files-removed § (gateway/micro-business/micro-file/Bruno) → Tasks 1, 2, 4, 5, 6.
- Edits § (route-application, common/dto/index, swagger tag-groups, app.module, workflows.service.ts:709, tag-mapping.json, schema.prisma) → Tasks 1-7.
- Database migration § → Task 8 (file + db:generate) + Task 9 (apply).
- Verification steps § (db:generate, check-types, lint, build, swagger:verify, bruno:sync:dry, swagger smoke, db:migrate) → covered across Tasks 3, 4, 5, 6, 8, 9.
- Risks § (hidden caller, workflow/report breakage, tenant DB drift) → Step 5 in Task 4 (grep for survivors), Step 4 in Task 8 (repo-wide grep), Step 1 in Task 9 (apply migration), Step 2 in Task 9 (verify tables gone).
- Out-of-scope preservation § (`transfer_in`/`out`, `transfer_header`/`detail`, report templates, controller wording) → Step 3 in Task 7 confirms enum survival; report templates and unrelated wording are not touched by any task.

**Placeholders:** none — every step has the exact command, file path, and expected output.

**Type/symbol consistency:** `TransferModule`, `TransferDetailModule`, `TransferCommentModule`, `TransferDetailCommentModule` (gateway), `TransferModule` (micro-business) — all matched by what's actually in the source. Schema model names `tb_transfer`, `tb_transfer_detail`, `tb_transfer_comment`, `tb_transfer_detail_comment` are consistent across Tasks 7-9.
