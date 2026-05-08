# Remove Transfer Module — Design

**Date:** 2026-04-29
**Status:** Draft (awaiting review)
**Type:** Removal / cleanup

## Goal

Remove the standalone "Transfer" module (HTTP/TCP endpoints, DTOs, prisma models) from the Carmen backend. The Transfer module duplicates capabilities now covered by Store Requisition, which already moves stock between locations on completion.

## Out of scope (explicitly preserved)

The decision is to remove the **module** but keep all *underlying mechanisms* that other features still depend on:

- `enum_transaction_type.transfer_in` / `transfer_out` — used by `inventory-transaction.service.ts::executeTransfer()` which is invoked by Store Requisition completion logic. Stock movement between locations continues to exist; only the standalone Transfer document/workflow is removed.
- `enum_workflow_type.transfer_header` / `transfer_detail` — kept in schema (no callers after removal, but harmless).
- Report templates referencing "Transfer In/Out" columns and the "Type Transfer" template — kept; they describe inventory movement totals which still occur via SR.
- Wording in unrelated controller `@ApiOperation` descriptions that mentions "transfer" as part of inventory movement (e.g. locations, user-location, stock-in-detail) — kept; refers to general movement, not the deleted module.

## Files removed (full delete)

### `apps/backend-gateway/src/`
- `application/transfer/` (controller, service, module, swagger/)
- `application/transfer-detail/`
- `application/transfer-comment/` (incl. `dto/`, `swagger/`)
- `application/transfer-detail-comment/`
- `common/dto/transfer/` (dto, serializer, index)

### `apps/micro-business/src/`
- `inventory/transfer/` (controller, service, module, dto/, interface/)
- `inventory/transfer-comment/`
- `inventory/transfer-detail-comment/`

### `apps/micro-file/src/`
- `common/dto/transfer/` (dto, serializer, index)

### `apps/bruno/carmen-inventory/inventory/`
- `transfer/`, `transfer-comment/`, `transfer-detail-comment/`

## Edits (partial changes)

### `apps/backend-gateway/src/`
- `application/route-application.ts` — drop `TransferModule`, `TransferDetailModule`, `TransferCommentModule`, `TransferDetailCommentModule` imports + array entries.
- `common/dto/index.ts` — drop `export * from './transfer/index'`.
- `swagger/tag-groups.ts` — remove `'Inventory: Transfers'` tag (line ~55) and its entry under the Inventory group (line ~136).

### `apps/micro-business/src/`
- `app.module.ts` — drop `TransferModule` import + array entry.
- `common/dto/index.ts` — drop `export * from '@/inventory/transfer/dto/index'`.
- `master/workflows/workflows.service.ts:709` — drop `tf: 'tb_transfer'` mapping line.

### `apps/micro-file/src/common/dto/index.ts`
- Drop `export * from './transfer/index'`.

### `scripts/swagger-sync/tag-mapping.json`
- Remove the 4 entries pointing to `apps/backend-gateway/src/application/transfer*/...controller.ts`.

### `packages/prisma-shared-schema-tenant/prisma/schema.prisma`
- Delete models: `tb_transfer`, `tb_transfer_comment`, `tb_transfer_detail`, `tb_transfer_detail_comment`.
- Remove relations on `tb_location`:
  - `tb_transfer_from` / `tb_transfer_to` (lines ~1323-1324)
- Remove relation on `tb_product`:
  - `tb_transfer_detail` (line ~1512)
- Keep enum values `transfer_in`, `transfer_out`, `transfer_header`, `transfer_detail`.

## Database migration

New migration: `packages/prisma-shared-schema-tenant/prisma/migrations/20260429100000_drop_tb_transfer/migration.sql`

Order matters (FK dependency): drop child tables first.

```sql
-- Drop transfer module tables (data is dropped per design decision Q1+Q5)
DROP TABLE IF EXISTS "tb_transfer_detail_comment" CASCADE;
DROP TABLE IF EXISTS "tb_transfer_comment" CASCADE;
DROP TABLE IF EXISTS "tb_transfer_detail" CASCADE;
DROP TABLE IF EXISTS "tb_transfer" CASCADE;
```

`CASCADE` is used to drop dependent indexes/FKs in one shot since the tables themselves are going away.

## Verification steps

1. `bun run db:generate` — regenerates the tenant Prisma client without `tb_transfer*` types.
2. `bun run check-types` — must pass; surfaces any code referencing deleted types/imports we missed.
3. `bun run lint` — must pass.
4. `bun run build` — must pass for both `backend-gateway` and `micro-business`.
5. `bun run swagger:verify` — confirms the tag-groups / tag-mapping changes are consistent.
6. `bun run bruno:sync:dry` — confirms no orphaned Bruno endpoints (transfer collections already deleted manually).
7. Manually check `backend-gateway` Swagger at `/swagger` after `dev` start: no "Inventory: Transfers" tag, no `/transfer*` routes.
8. Run `bun run test` in `apps/micro-business` and `apps/backend-gateway`: must pass. (Transfer-related unit/e2e tests are deleted along with their modules.)
9. Apply the migration on a dev tenant DB: `bun run db:migrate` inside `packages/prisma-shared-schema-tenant`. Confirm `\dt tb_transfer*` returns no rows.

## Risks & mitigations

- **Hidden caller**: a service or job somewhere may still call a transfer endpoint. Mitigation: `check-types` + `lint` + grep for `TransferModule|tb_transfer\b|/transfers?` after edits.
- **Workflow/report breakage**: workflows.service.ts mapping `tf` is removed; if any workflow row in the DB references `tf`/`tb_transfer`, it will become inert (not crash) since the lookup just won't match. Confirm with a quick query before merging.
- **Report templates**: kept by decision, but if any report query joins on `tb_transfer*`, it will break post-migration. Mitigation: grep report templates for `tb_transfer` before applying migration.
- **Tenant DB drift**: per existing CLAUDE.md gotcha, run `db:migrate` inside the tenant package on every existing tenant DB after deploy.

## Execution order

1. Edit code (delete folders + edit imports/exports).
2. Edit prisma schema (delete models + relations).
3. Generate migration SQL file manually (do not autogenerate to avoid touching unrelated drift).
4. `bun run db:generate`.
5. Run all verification steps above.
6. `bun run bruno:sync` if needed.
7. Commit as one change: `chore: remove transfer module`.

## Open question for reviewer

- Should we also delete any `*.spec.ts` / `*.e2e-spec.ts` files outside the deleted folders that test transfer flows? (Initial scan found none, but worth confirming during execution.)
