# Design: `decimal_place` for `tb_unit` and `tb_unit_conversion`

**Date:** 2026-04-22
**Status:** Draft — pending user review
**Author:** brainstormed via `superpowers:brainstorming`

## Goal

Add a `decimal_place` field to control how unit quantities are displayed and
(later) rounded during calculations. Values like `0` for `EA`/`PCS`, `2` for
general-purpose units, and `3` for `KG`/`L` should be representable per unit
master and optionally overridable per conversion row.

## Scope

**In scope (Phase 1):**

- Add `decimal_place` column to `tb_unit` and `tb_unit_conversion` in the
  tenant schema.
- Fallback resolver used by serializers / display layer.
- DTO, Zod validation, serializer, Swagger, and example updates for the
  unit-conversion endpoint surface.
- Migration defaulting existing rows to `2`.
- Seed file updates.
- Unit + integration tests.

**Out of scope (deferred to Phase 2):**

- Applying rounding at calculation time in PR / PO / GRN / Credit Note /
  Stock-in / Stock-out / Transfer / Store Requisition / Price List.
- E2E tests through the gateway (covered by existing Bruno collections).
- Per-side `from_decimal_place` / `to_decimal_place` (Approach 2 was
  considered and rejected — upgrade path remains open).

## Decisions

| Topic | Decision |
|---|---|
| Purpose | Single source of truth for both display and calculation (Phase 2 will consume it). |
| Placement | Both `tb_unit` (default) and `tb_unit_conversion` (override). |
| Allowed values | Non-negative integer (`>= 0`). No upper bound. |
| Default | `2` on both tables (DB default + Zod default). |
| Fallback | Context-dependent: single-unit display uses `tb_unit`; conversion-row display uses `tb_unit_conversion` first, then `tb_unit` for the relevant side, then `2`. |
| Rounding mode | `HALF_UP` (applied in Phase 2). |
| Calculation scope | Display only for Phase 1. Calculation integration deferred to Phase 2. |
| API surface | Optional on every endpoint (create / update / get / list). Missing input falls back to DB default. |
| Existing data | Rely on `DEFAULT 2` during `ADD COLUMN`. No manual backfill. |
| Seed | Seed files explicitly set `decimal_place: 2` for new tenants to stay self-documenting. |
| Testing | Unit tests for helpers and Zod schema; integration tests for service create / update / list and default-on-insert. |

## Schema Changes

### `tb_unit`

```prisma
model tb_unit {
  // ...existing fields...
  is_active     Boolean? @default(true)
  decimal_place Int      @default(2)
  // ...rest unchanged...
}
```

### `tb_unit_conversion`

```prisma
model tb_unit_conversion {
  // ...existing fields...
  to_unit_qty   Decimal? @default(0) @db.Decimal(20, 5)
  decimal_place Int      @default(2)
  // ...rest unchanged...
}
```

### Migration SQL

```sql
ALTER TABLE "tb_unit"
  ADD COLUMN "decimal_place" INTEGER NOT NULL DEFAULT 2;

ALTER TABLE "tb_unit_conversion"
  ADD COLUMN "decimal_place" INTEGER NOT NULL DEFAULT 2;
```

Notes:

- Existing rows receive `2` automatically via `DEFAULT 2`. No backfill script.
- No DB-level `CHECK` constraint. Non-negativity is enforced at the Zod layer.
- No impact on existing unique or index definitions.
- Tenant schema only; the platform schema has no unit tables.

## Fallback Resolver

**Location:** `apps/micro-business/src/master/unit-conversion/utils/decimal-place.util.ts`
(re-exported via `@/common` for reuse).

```ts
const DEFAULT_DECIMAL_PLACE = 2;

type ResolveUnitDecimalInput = {
  unit: { decimal_place: number } | null | undefined;
};

export function resolveUnitDecimalPlace(
  input: ResolveUnitDecimalInput,
): number {
  return input.unit?.decimal_place ?? DEFAULT_DECIMAL_PLACE;
}

type ResolveConversionDecimalInput = {
  conversion: { decimal_place: number } | null | undefined;
  fallbackUnit: { decimal_place: number } | null | undefined;
};

export function resolveConversionDecimalPlace(
  input: ResolveConversionDecimalInput,
): number {
  return (
    input.conversion?.decimal_place
    ?? input.fallbackUnit?.decimal_place
    ?? DEFAULT_DECIMAL_PLACE
  );
}
```

Rules:

| Context | Resolver | Order |
|---|---|---|
| Display quantity of a standalone `tb_unit` (stock-on-hand, product base) | `resolveUnitDecimalPlace` | `tb_unit.decimal_place` → `2` |
| Display `from_unit_qty` or `to_unit_qty` inside a conversion row | `resolveConversionDecimalPlace` | `tb_unit_conversion.decimal_place` → `tb_unit.decimal_place` (of the relevant side) → `2` |

Implementation notes:

- Pure functions with RO-RO input objects. No Prisma or request-context
  coupling. Easy to unit-test.
- Use `??` (nullish coalescing), not `||`, so `0` is respected as valid.
- Because the DB column is `NOT NULL DEFAULT 2`, callers normally pass a
  non-null value. The `?? 2` tail handles callers that pass partial objects.

## DTO, Zod, Serializer, Swagger

### Zod schema

Add to both `tb_unit` and `tb_unit_conversion` schemas:

```ts
// Input schema (create / update)
decimal_place: z.number().int().nonnegative().optional(),

// Output schema (response)
decimal_place: z.number().int().nonnegative(),
```

- Input: `.optional()` without `.default()` — when the client omits the
  field, Zod leaves it `undefined`. The service then omits it from the
  Prisma `data` object so the DB default (`2`) applies.
- Output: always present (non-optional) because the column is `NOT NULL`
  after migration.

### Serializers / Response shape

Update to expose `decimal_place: number`:

- `apps/backend-gateway/src/common/dto/unit-conversion/unit-conversion.serializer.ts`
- `apps/backend-gateway/src/common/dto/product/product.serializer.ts` (where
  it embeds unit-conversion)
- `apps/backend-gateway/src/application/unit-conversion/swagger/response.ts`

Nested consumers (PR / PO / GRN response serializers) inherit the field
automatically through the shared unit-conversion serializer; no duplicated
wiring needed there.

### Swagger

Add `@ApiProperty` to request/response DTOs in
`apps/backend-gateway/src/application/unit-conversion/`:

```ts
@ApiProperty({
  type: Number,
  required: false,
  example: 2,
  minimum: 0,
  description:
    'Number of decimal places for display and rounding. Defaults to 2 if omitted.',
})
decimal_place?: number;
```

Regenerate or manually update `apps/backend-gateway/swagger.json` and
`apps/backend-gateway/swagger_https.json` if they are checked in.

### Examples and Bruno

- Add `"decimal_place": 2` to example payloads in
  `apps/backend-gateway/src/application/unit-conversion/swagger/response.ts`.
- Update `apps/bruno/carmen-inventory/` entries that directly hit the
  unit-conversion or unit endpoints. Collections that merely embed
  unit-conversion do not need changes.

### Service layer

In `apps/micro-business/src/master/unit-conversion/unit-conversion.service.ts`:

- `create`: when `input.decimal_place` is `undefined`, omit the field from the
  Prisma `data` object so the DB default applies.
- `update`: pass through when provided; otherwise leave the column untouched.

Aligns with the project's `{ details: { add: [...] } }` create pattern —
`decimal_place` is an optional field per item in `add[]`.

## Seed and Docs

### Seed files

- `packages/prisma-shared-schema-tenant/prisma/seeds-a01/seed-tb_unit_conversion.ts`
  — explicitly set `decimal_place: 2` on every created row.
- `packages/prisma-shared-schema-tenant/prisma/seed-data-a01/tb_unit_conversion.json`
  (if present) — add `"decimal_place": 2` to each entry.
- If a `seed-tb_unit.ts` exists, add `decimal_place: 2`. Otherwise leave the
  unit master seed path untouched.

### Docs sync

- `packages/prisma-shared-schema-tenant/docs/pg_schema.sql` — patch to match.
- `packages/prisma-shared-schema-tenant/docs/database.dbml` — update both
  `tb_unit` and `tb_unit_conversion`.

### Local dev sequence

```bash
cd packages/prisma-shared-schema-tenant
bun run db:migrate
bun run db:generate
cd ../..
bun run build:package
```

## Testing

### Unit tests

**File:** `apps/micro-business/src/master/unit-conversion/utils/decimal-place.util.spec.ts`

| Case | Input | Expected |
|---|---|---|
| Unit has value | `{ unit: { decimal_place: 3 } }` | `3` |
| Unit is `0` (EA) | `{ unit: { decimal_place: 0 } }` | `0` |
| Unit null | `{ unit: null }` | `2` |
| Unit undefined | `{ unit: undefined }` | `2` |
| Conversion has value | `{ conversion: { decimal_place: 3 }, fallbackUnit: { decimal_place: 2 } }` | `3` |
| Conversion `0` overrides fallback `3` | `{ conversion: { decimal_place: 0 }, fallbackUnit: { decimal_place: 3 } }` | `0` |
| Conversion null → fallback unit | `{ conversion: null, fallbackUnit: { decimal_place: 4 } }` | `4` |
| Both null | `{ conversion: null, fallbackUnit: null }` | `2` |

**Zod schema tests:**

| Case | Input | Expected |
|---|---|---|
| Valid `0` | `{ decimal_place: 0 }` | parses |
| Valid `5` | `{ decimal_place: 5 }` | parses |
| Negative | `{ decimal_place: -1 }` | `ZodError` |
| Non-integer | `{ decimal_place: 2.5 }` | `ZodError` |
| Missing (input) | `{}` | parses to `{}` (no `decimal_place` key); service omits from Prisma and DB default `2` applies |

### Integration tests

**File:** `apps/micro-business/src/master/unit-conversion/unit-conversion.service.spec.ts`
(use `describe('Integration Tests', ...)` per existing convention).

| Scenario | Steps | Assert |
|---|---|---|
| Default on create | `service.create({ ...valid payload, no decimal_place })` | Row has `decimal_place = 2` |
| Explicit on create | `service.create({ ..., decimal_place: 3 })` | Row has `decimal_place = 3` |
| `0` allowed | `service.create({ ..., decimal_place: 0 })` | Row has `decimal_place = 0` |
| Update | `service.update(id, { decimal_place: 4 })` | Row updated to `4` |
| List returns field | `service.getOrderUnits(...)` | Response contains `decimal_place` |
| Migration backfill | Existing fixture row + run migration | Row has `decimal_place = 2` post-migration |

### Out of scope for this phase

- E2E tests through the gateway (Bruno collections are the coverage path).
- Rounding / calculation-time tests (Phase 2).
- DB-level `CHECK` constraint tests — no such constraint exists.

### Commands

```bash
cd apps/micro-business
bun run test
bun run test:cov
bun run test -- unit-conversion
```

## Migration and Rollout

1. Apply Prisma migration (adds column with default `2`).
2. Regenerate Prisma client and rebuild shared packages.
3. Ship service + gateway DTO / Zod / serializer / Swagger updates in the
   same PR so the API surface stays consistent.
4. Update seed files in the same PR; re-seed is not required for existing
   tenants because `DEFAULT 2` already populates their rows.

Rollback: drop the two columns. No data loss because the field is new.

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Consumers assume `decimal_place` exists on older rows created before the column was added. | `ADD COLUMN ... DEFAULT 2` backfills every row, so the Prisma client never returns `null` / `undefined`. |
| Frontend double-rounds or ignores the new field. | Field is additive and optional. Existing clients keep working; updated clients opt in. |
| Phase 2 calculation integration introduces rounding drift. | Deliberately deferred. Phase 2 must specify where rounding is applied and avoid accumulating rounding errors through intermediate multiplications. |
| Swagger JSON files drift from decorators. | Regenerate or patch `swagger.json` / `swagger_https.json` in the same PR. |

## Open Questions

None at time of writing. Anything deferred is captured under Phase 2 scope.
