# Unit `decimal_place` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `decimal_place` integer column to `tb_unit` and `tb_unit_conversion` (tenant schema) and thread it through every create / update / read path plus serializers, Swagger, seed, and docs. Phase 1 is display-only; calculation-time rounding is deferred.

**Architecture:** One new Prisma column per table (`Int NOT NULL DEFAULT 2`). A pure fallback resolver util picks which `decimal_place` to apply at display time. No new controller or route is added — the field rides along on existing `Unit` CRUD and `Product` mutation endpoints (unit conversion rows are written inside the product service, not via a standalone controller). Zod input schemas make the field optional; response serializers always include it.

**Tech Stack:** NestJS (micro-business, backend-gateway), Prisma (tenant schema), Zod (+ nestjs-zod), Jest, Bun, Bruno.

**Spec:** [`docs/superpowers/specs/2026-04-22-unit-decimal-place-design.md`](../specs/2026-04-22-unit-decimal-place-design.md)

---

## File Structure

**New files**
- `apps/micro-business/src/master/unit-conversion/utils/decimal-place.util.ts` — pure fallback resolver (no Prisma coupling)
- `apps/micro-business/src/master/unit-conversion/utils/decimal-place.util.spec.ts` — unit tests
- `packages/prisma-shared-schema-tenant/prisma/migrations/<timestamp>_add_decimal_place_to_unit_tables/migration.sql` — additive SQL

**Modified files**
- `packages/prisma-shared-schema-tenant/prisma/schema.prisma` (tb_unit + tb_unit_conversion)
- `packages/prisma-shared-schema-tenant/prisma/seed-data-a01/tb_unit.json`
- `packages/prisma-shared-schema-tenant/prisma/seed-data-a01/tb_unit_conversion.json`
- `packages/prisma-shared-schema-tenant/docs/pg_schema.sql`
- `packages/prisma-shared-schema-tenant/docs/database.dbml`
- `apps/micro-business/src/master/units/dto/unit.dto.ts`
- `apps/micro-business/src/master/units/dto/unit.serializer.ts`
- `apps/micro-business/src/master/units/units.service.spec.ts`
- `apps/micro-business/src/master/unit-conversion/dto/unit-conversion.serializer.ts`
- `apps/micro-business/src/master/unit-conversion/unit-conversion.service.ts`
- `apps/micro-business/src/master/products/dto/product.dto.ts`
- `apps/micro-business/src/master/products/products.service.ts`
- `apps/backend-gateway/src/common/dto/unit/unit.dto.ts`
- `apps/backend-gateway/src/common/dto/unit/unit.serializer.ts`
- `apps/backend-gateway/src/common/dto/unit-conversion/unit-conversion.serializer.ts`
- `apps/backend-gateway/src/config/config_units/dto/units.dto.ts`
- `apps/backend-gateway/src/config/config_units/swagger/request.ts`
- `apps/backend-gateway/src/config/config_units/swagger/response.ts`
- `apps/backend-gateway/src/application/unit-conversion/swagger/response.ts`
- `apps/bruno/carmen-inventory/config/units/03 - Create Unit.bru`
- `apps/bruno/carmen-inventory/config/units/04 - Update Unit.bru`

---

### Task 1: Fallback Resolver Utility (TDD)

**Files:**
- Create: `apps/micro-business/src/master/unit-conversion/utils/decimal-place.util.ts`
- Test: `apps/micro-business/src/master/unit-conversion/utils/decimal-place.util.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/micro-business/src/master/unit-conversion/utils/decimal-place.util.spec.ts`:

```ts
import {
  DEFAULT_DECIMAL_PLACE,
  resolveConversionDecimalPlace,
  resolveUnitDecimalPlace,
} from './decimal-place.util';

describe('resolveUnitDecimalPlace', () => {
  it('returns unit.decimal_place when present', () => {
    expect(resolveUnitDecimalPlace({ unit: { decimal_place: 3 } })).toBe(3);
  });

  it('respects 0 (EA-style) without falling back to default', () => {
    expect(resolveUnitDecimalPlace({ unit: { decimal_place: 0 } })).toBe(0);
  });

  it('falls back to default when unit is null', () => {
    expect(resolveUnitDecimalPlace({ unit: null })).toBe(DEFAULT_DECIMAL_PLACE);
  });

  it('falls back to default when unit is undefined', () => {
    expect(resolveUnitDecimalPlace({ unit: undefined })).toBe(DEFAULT_DECIMAL_PLACE);
  });
});

describe('resolveConversionDecimalPlace', () => {
  it('prefers conversion.decimal_place over fallback unit', () => {
    expect(
      resolveConversionDecimalPlace({
        conversion: { decimal_place: 3 },
        fallbackUnit: { decimal_place: 2 },
      }),
    ).toBe(3);
  });

  it('respects conversion 0 over fallback unit 3', () => {
    expect(
      resolveConversionDecimalPlace({
        conversion: { decimal_place: 0 },
        fallbackUnit: { decimal_place: 3 },
      }),
    ).toBe(0);
  });

  it('falls back to unit when conversion is null', () => {
    expect(
      resolveConversionDecimalPlace({
        conversion: null,
        fallbackUnit: { decimal_place: 4 },
      }),
    ).toBe(4);
  });

  it('falls back to DEFAULT_DECIMAL_PLACE when both are null', () => {
    expect(
      resolveConversionDecimalPlace({ conversion: null, fallbackUnit: null }),
    ).toBe(DEFAULT_DECIMAL_PLACE);
  });

  it('DEFAULT_DECIMAL_PLACE is 2', () => {
    expect(DEFAULT_DECIMAL_PLACE).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/micro-business
bun run test -- decimal-place.util
```

Expected: FAIL — `Cannot find module './decimal-place.util'`.

- [ ] **Step 3: Implement the resolver**

Create `apps/micro-business/src/master/unit-conversion/utils/decimal-place.util.ts`:

```ts
export const DEFAULT_DECIMAL_PLACE = 2;

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

- [ ] **Step 4: Run test to verify it passes**

```bash
cd apps/micro-business
bun run test -- decimal-place.util
```

Expected: PASS — all 9 assertions green.

- [ ] **Step 5: Commit**

```bash
git add apps/micro-business/src/master/unit-conversion/utils/
git commit -m "$(cat <<'EOF'
feat(unit-conversion): add decimal_place fallback resolver util

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Prisma Schema + Migration

**Files:**
- Modify: `packages/prisma-shared-schema-tenant/prisma/schema.prisma:3237-3252` (tb_unit)
- Modify: `packages/prisma-shared-schema-tenant/prisma/schema.prisma:3313-3348` (tb_unit_conversion)
- Create: `packages/prisma-shared-schema-tenant/prisma/migrations/<timestamp>_add_decimal_place_to_unit_tables/migration.sql`

- [ ] **Step 1: Add `decimal_place` to `tb_unit`**

In `packages/prisma-shared-schema-tenant/prisma/schema.prisma`, edit the `tb_unit` model. The column goes immediately after `is_active`:

Before:
```prisma
model tb_unit {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name        String   @db.VarChar
  description String?  @db.VarChar
  is_active   Boolean? @default(true)

  note      String? @db.VarChar
```

After:
```prisma
model tb_unit {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name        String   @db.VarChar
  description String?  @db.VarChar
  is_active   Boolean? @default(true)

  decimal_place Int @default(2)

  note      String? @db.VarChar
```

- [ ] **Step 2: Add `decimal_place` to `tb_unit_conversion`**

In the same file, edit the `tb_unit_conversion` model. The column goes after `to_unit_qty`:

Before:
```prisma
  to_unit_id   String?  @db.Uuid
  to_unit_name String   @db.VarChar
  to_unit_qty  Decimal? @default(0) @db.Decimal(20, 5)

  is_default  Boolean? @default(false)
```

After:
```prisma
  to_unit_id   String?  @db.Uuid
  to_unit_name String   @db.VarChar
  to_unit_qty  Decimal? @default(0) @db.Decimal(20, 5)

  decimal_place Int @default(2)

  is_default  Boolean? @default(false)
```

- [ ] **Step 3: Generate the migration**

```bash
cd packages/prisma-shared-schema-tenant
bun run db:migrate -- --name add_decimal_place_to_unit_tables
```

Expected: creates `prisma/migrations/<ts>_add_decimal_place_to_unit_tables/migration.sql`, regenerates the client, applies migration locally.

- [ ] **Step 4: Verify migration SQL content**

Open the new `migration.sql` and confirm it contains exactly these two `ALTER TABLE` statements (Prisma generates them automatically; edit if different to match the spec):

```sql
ALTER TABLE "tb_unit"
  ADD COLUMN "decimal_place" INTEGER NOT NULL DEFAULT 2;

ALTER TABLE "tb_unit_conversion"
  ADD COLUMN "decimal_place" INTEGER NOT NULL DEFAULT 2;
```

If Prisma generated something functionally different (e.g. additional clauses), normalize to exactly the above.

- [ ] **Step 5: Rebuild shared package**

```bash
cd ../..
bun run build:package
```

Expected: `@repo/prisma-shared-schema-tenant` rebuilds cleanly and the new `decimal_place` field is visible on the generated `tb_unit` and `tb_unit_conversion` types.

- [ ] **Step 6: Type-check to confirm the client surface**

```bash
cd apps/micro-business
bun run check-types
```

Expected: PASS. No new type errors (callers don't reference `decimal_place` yet, so the additive field is safe).

- [ ] **Step 7: Commit**

```bash
cd ../..
git add packages/prisma-shared-schema-tenant/prisma/schema.prisma packages/prisma-shared-schema-tenant/prisma/migrations/
git commit -m "$(cat <<'EOF'
feat(tenant-db): add decimal_place column to tb_unit and tb_unit_conversion

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Tenant Schema Docs Sync

**Files:**
- Modify: `packages/prisma-shared-schema-tenant/docs/pg_schema.sql`
- Modify: `packages/prisma-shared-schema-tenant/docs/database.dbml`

- [ ] **Step 1: Patch `pg_schema.sql`**

Search for the `CREATE TABLE ... tb_unit` and `tb_unit_conversion` blocks. Add `decimal_place integer DEFAULT 2 NOT NULL` (or the exact style used by other columns in that file) in the same positions as in `schema.prisma`:

- In the `tb_unit` block, after the `is_active` column declaration.
- In the `tb_unit_conversion` block, after the `to_unit_qty` column declaration.

Use Grep first to locate the two `CREATE TABLE` statements:

```bash
grep -n 'CREATE TABLE.*tb_unit' packages/prisma-shared-schema-tenant/docs/pg_schema.sql
```

- [ ] **Step 2: Patch `database.dbml`**

In `packages/prisma-shared-schema-tenant/docs/database.dbml`, locate the `Table tb_unit { ... }` and `Table tb_unit_conversion { ... }` definitions. Add a line in the same positions:

```dbml
decimal_place int [not null, default: 2]
```

- [ ] **Step 3: Sanity-check both docs**

```bash
grep -n 'decimal_place' packages/prisma-shared-schema-tenant/docs/pg_schema.sql
grep -n 'decimal_place' packages/prisma-shared-schema-tenant/docs/database.dbml
```

Expected: two hits each (one per table).

- [ ] **Step 4: Commit**

```bash
git add packages/prisma-shared-schema-tenant/docs/
git commit -m "$(cat <<'EOF'
docs(tenant-db): sync decimal_place into pg_schema.sql and database.dbml

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Seed Data Updates

**Files:**
- Modify: `packages/prisma-shared-schema-tenant/prisma/seed-data-a01/tb_unit.json`
- Modify: `packages/prisma-shared-schema-tenant/prisma/seed-data-a01/tb_unit_conversion.json`

Both seed scripts (`seed-tb_unit.ts`, `seed-tb_unit_conversion.ts`) call `prisma.<table>.upsert({ ..., create: record, update: record })`. Adding `decimal_place` to the JSON records makes it flow through `...record` automatically — no TS code change required.

- [ ] **Step 1: Add `decimal_place: 2` to every record in `tb_unit.json`**

Use a scripted patch to stay precise. Run:

```bash
cd packages/prisma-shared-schema-tenant/prisma/seed-data-a01
bun -e '
  const fs = require("fs");
  const path = "tb_unit.json";
  const data = JSON.parse(fs.readFileSync(path, "utf-8"));
  const patched = data.map((row) => ({ ...row, decimal_place: row.decimal_place ?? 2 }));
  fs.writeFileSync(path, JSON.stringify(patched, null, 2) + "\n");
  console.log(`patched ${patched.length} tb_unit records`);
'
```

Expected stdout: `patched N tb_unit records` where N matches the existing row count.

- [ ] **Step 2: Add `decimal_place: 2` to every record in `tb_unit_conversion.json`**

```bash
bun -e '
  const fs = require("fs");
  const path = "tb_unit_conversion.json";
  const data = JSON.parse(fs.readFileSync(path, "utf-8"));
  const patched = data.map((row) => ({ ...row, decimal_place: row.decimal_place ?? 2 }));
  fs.writeFileSync(path, JSON.stringify(patched, null, 2) + "\n");
  console.log(`patched ${patched.length} tb_unit_conversion records`);
'
```

- [ ] **Step 3: Spot-check the patched files**

```bash
head -20 tb_unit.json
head -20 tb_unit_conversion.json
```

Expected: each record object contains `"decimal_place": 2`.

- [ ] **Step 4: Commit**

```bash
cd ../../../..
git add packages/prisma-shared-schema-tenant/prisma/seed-data-a01/tb_unit.json packages/prisma-shared-schema-tenant/prisma/seed-data-a01/tb_unit_conversion.json
git commit -m "$(cat <<'EOF'
chore(seed): set decimal_place to 2 on tb_unit and tb_unit_conversion seed records

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Units — Zod DTO and Response Serializer (micro-business)

**Files:**
- Modify: `apps/micro-business/src/master/units/dto/unit.dto.ts`
- Modify: `apps/micro-business/src/master/units/dto/unit.serializer.ts`

- [ ] **Step 1: Add `decimal_place` to the Zod input schemas**

Edit `apps/micro-business/src/master/units/dto/unit.dto.ts`:

```ts
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export {
  validateUnitIdExists,
  validateUnitIdsExist,
} from '@/common/validate/unit.validate';

export const UnitsCreate = z.object({
  name: z.string(),
  description: z.string().optional(),
  is_active: z.boolean().default(true).nullable().optional(),
  decimal_place: z.number().int().nonnegative().optional(),
});

export type ICreateUnits = z.infer<typeof UnitsCreate>;
export class UnitsCreateDto extends createZodDto(UnitsCreate) {}

export const UnitsUpdate = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
  decimal_place: z.number().int().nonnegative().optional(),
});

export type IUpdateUnits = z.infer<typeof UnitsUpdate> & { id: string };
export class UnitsUpdateDto extends createZodDto(UnitsUpdate) {}
```

- [ ] **Step 2: Add `decimal_place` to the response serializer schema**

Edit `apps/micro-business/src/master/units/dto/unit.serializer.ts`:

```ts
import { z } from 'zod';

export const UnitResponseSchema = z.object({
  id: z.string(),
  code: z.string().nullable().optional(),
  name: z.string(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
  decimal_place: z.number().int().nonnegative(),
  info: z.any().nullable().optional(),
  dimension: z.any().nullable().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export type UnitResponse = z.infer<typeof UnitResponseSchema>;

export const UnitDetailResponseSchema = UnitResponseSchema;
export type UnitDetailResponse = z.infer<typeof UnitDetailResponseSchema>;

export const UnitListItemResponseSchema = UnitResponseSchema;
export type UnitListItemResponse = z.infer<typeof UnitListItemResponseSchema>;

export const UnitMutationResponseSchema = z.object({
  id: z.string(),
});

export type UnitMutationResponse = z.infer<typeof UnitMutationResponseSchema>;
```

Note: `decimal_place` on the response is **non-optional** — the column is `NOT NULL DEFAULT 2`, so Prisma always returns a number.

- [ ] **Step 3: Verify the service already spreads input correctly**

`apps/micro-business/src/master/units/units.service.ts:206-211` uses:

```ts
const createdUnit = await this.prismaService.tb_unit.create({
  data: {
    ...data,
    created_by_id: this.userId,
  },
});
```

and `units.service.ts:256-266` uses `data: { ...data, updated_by_id: this.userId }`. Because `decimal_place` is already in `data` (from Zod), no service change is needed. Undefined values in Prisma creates / updates are treated as "not set" and let the DB default apply.

- [ ] **Step 4: Type-check**

```bash
cd apps/micro-business
bun run check-types
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd ../..
git add apps/micro-business/src/master/units/dto/
git commit -m "$(cat <<'EOF'
feat(units): accept and return decimal_place in unit DTO and serializer

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Units — Integration Tests (micro-business)

**Files:**
- Modify: `apps/micro-business/src/master/units/units.service.spec.ts`

The existing spec is a skeleton (`should be defined`). Append an "Integration Tests" block that exercises Prisma via a mock.

- [ ] **Step 1: Write failing integration tests**

Replace the content of `apps/micro-business/src/master/units/units.service.spec.ts` with:

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { UnitsService } from './units.service';
import { TenantService } from '@/tenant/tenant.service';

describe('UnitsService', () => {
  let service: UnitsService;
  let prisma: { tb_unit: Record<string, jest.Mock> };

  const mockTenantService = {
    prismaTenantInstance: jest.fn(),
    getTenantInfo: jest.fn(),
    getdb_connection: jest.fn(),
  };

  beforeEach(async () => {
    prisma = {
      tb_unit: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    mockTenantService.prismaTenantInstance.mockResolvedValue(prisma);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UnitsService,
        { provide: TenantService, useValue: mockTenantService },
      ],
    }).compile();

    service = module.get<UnitsService>(UnitsService);
    service.bu_code = 'BU001';
    service.userId = '00000000-0000-4000-8000-000000000001';
    await service.initializePrismaService('BU001', service.userId);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Integration Tests: decimal_place', () => {
    it('omits decimal_place on create when not provided so DB default applies', async () => {
      prisma.tb_unit.findFirst.mockResolvedValue(null);
      prisma.tb_unit.create.mockResolvedValue({ id: 'unit-1' });

      await service.create({ name: 'KG' });

      const call = prisma.tb_unit.create.mock.calls[0][0];
      expect(call.data.decimal_place).toBeUndefined();
    });

    it('passes decimal_place to Prisma when provided on create', async () => {
      prisma.tb_unit.findFirst.mockResolvedValue(null);
      prisma.tb_unit.create.mockResolvedValue({ id: 'unit-2' });

      await service.create({ name: 'G', decimal_place: 3 });

      const call = prisma.tb_unit.create.mock.calls[0][0];
      expect(call.data.decimal_place).toBe(3);
    });

    it('accepts decimal_place = 0 without coercing to default', async () => {
      prisma.tb_unit.findFirst.mockResolvedValue(null);
      prisma.tb_unit.create.mockResolvedValue({ id: 'unit-3' });

      await service.create({ name: 'EA', decimal_place: 0 });

      const call = prisma.tb_unit.create.mock.calls[0][0];
      expect(call.data.decimal_place).toBe(0);
    });

    it('passes decimal_place to Prisma on update when provided', async () => {
      prisma.tb_unit.findFirst.mockResolvedValue({ id: 'unit-4', name: 'KG' });
      prisma.tb_unit.update.mockResolvedValue({ id: 'unit-4' });

      await service.update({ id: 'unit-4', decimal_place: 4 });

      const call = prisma.tb_unit.update.mock.calls[0][0];
      expect(call.data.decimal_place).toBe(4);
    });

    it('returns decimal_place in findOne response', async () => {
      prisma.tb_unit.findFirst.mockResolvedValue({
        id: 'unit-5',
        name: 'KG',
        is_active: true,
        decimal_place: 3,
      });

      const result = await service.findOne('unit-5');

      expect((result as any).success).toBe(true);
      expect((result as any).data.decimal_place).toBe(3);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail first (if resolver hasn't been wired)**

```bash
cd apps/micro-business
bun run test -- units.service
```

Expected: any pre-existing test structure still passes, but if the Zod response schema hasn't been updated (Task 5) the `findOne` test fails with parse error.

- [ ] **Step 3: Run tests to verify they pass with prior tasks in place**

```bash
bun run test -- units.service
```

Expected: all 5 new assertions PASS (Task 5 already added `decimal_place` to the schema).

- [ ] **Step 4: Commit**

```bash
cd ../..
git add apps/micro-business/src/master/units/units.service.spec.ts
git commit -m "$(cat <<'EOF'
test(units): cover decimal_place default, explicit, zero, update, and response paths

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Unit-Conversion Read Serializer and Service (micro-business)

**Files:**
- Modify: `apps/micro-business/src/master/unit-conversion/dto/unit-conversion.serializer.ts`
- Modify: `apps/micro-business/src/master/unit-conversion/unit-conversion.service.ts`

The read endpoints currently reduce conversion rows to `{ id, name, conversion }`. The spec requires `decimal_place` in responses — add it to both the item-level schema and the full detail schema, and extend the service projection to include it.

- [ ] **Step 1: Add `decimal_place` to item + detail response schemas**

Edit `apps/micro-business/src/master/unit-conversion/dto/unit-conversion.serializer.ts`:

```ts
import { z } from 'zod';

export const UnitConversionItemResponseSchema = z.object({
  id: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  conversion: z.number(),
  decimal_place: z.number().int().nonnegative(),
});

export type UnitConversionItemResponse = z.infer<typeof UnitConversionItemResponseSchema>;

export const UnitConversionListResponseSchema = z.array(UnitConversionItemResponseSchema);
export type UnitConversionListResponse = z.infer<typeof UnitConversionListResponseSchema>;

export const UnitConversionDetailResponseSchema = z.object({
  id: z.string(),
  product_id: z.string(),
  from_unit_id: z.string(),
  from_unit_name: z.string().nullable().optional(),
  from_unit_qty: z.number(),
  to_unit_id: z.string(),
  to_unit_name: z.string().nullable().optional(),
  to_unit_qty: z.number(),
  unit_type: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
  is_default: z.boolean().optional(),
  decimal_place: z.number().int().nonnegative(),
  info: z.any().nullable().optional(),
  dimension: z.any().nullable().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export type UnitConversionDetailResponse = z.infer<typeof UnitConversionDetailResponseSchema>;

export const UnitConversionMutationResponseSchema = z.object({
  id: z.string(),
});

export type UnitConversionMutationResponse = z.infer<typeof UnitConversionMutationResponseSchema>;
```

- [ ] **Step 2: Include `decimal_place` in service projections**

Edit `apps/micro-business/src/master/unit-conversion/unit-conversion.service.ts` — three places use `newData.push({ id, name, conversion })`. Update each to include `decimal_place`, using the conversion row's value first and the relevant side's unit value as fallback (via `resolveConversionDecimalPlace` from Task 1 for the conversion rows, and `resolveUnitDecimalPlace` for the product's base unit).

**2a.** At the top of the file add:

```ts
import {
  resolveConversionDecimalPlace,
  resolveUnitDecimalPlace,
} from './utils/decimal-place.util';
```

**2b.** In `getOrderUnitByProductId` (around line 106-142), update the product-only fallback and the conversion loop:

Replace:
```ts
        return [
          {
            id: product.inventory_unit_id,
            name: product.tb_unit?.name ?? product.inventory_unit_name,
            conversion: 1
          }
        ]
      }
      const newData = []

      newData.push({
        id: res[0].tb_product.inventory_unit_id,
        name: res[0].tb_product.tb_unit?.name ?? res[0].tb_product.inventory_unit_name,
        conversion: 1
      })

      res.forEach((item) => {
        newData.push({
          id: item.from_unit_id,
          name: item.tb_unit_tb_unit_conversion_from_unit_idTotb_unit?.name ?? item.from_unit_name,
          conversion: Number(item.to_unit_qty)
        });
      });
```

With:
```ts
        return [
          {
            id: product.inventory_unit_id,
            name: product.tb_unit?.name ?? product.inventory_unit_name,
            conversion: 1,
            decimal_place: resolveUnitDecimalPlace({ unit: product.tb_unit }),
          }
        ]
      }
      const newData = []

      newData.push({
        id: res[0].tb_product.inventory_unit_id,
        name: res[0].tb_product.tb_unit?.name ?? res[0].tb_product.inventory_unit_name,
        conversion: 1,
        decimal_place: resolveUnitDecimalPlace({ unit: res[0].tb_product.tb_unit }),
      })

      res.forEach((item) => {
        newData.push({
          id: item.from_unit_id,
          name: item.tb_unit_tb_unit_conversion_from_unit_idTotb_unit?.name ?? item.from_unit_name,
          conversion: Number(item.to_unit_qty),
          decimal_place: resolveConversionDecimalPlace({
            conversion: item,
            fallbackUnit: item.tb_unit_tb_unit_conversion_from_unit_idTotb_unit,
          }),
        });
      });
```

**2c.** Apply the same shape to `getIngredientUnitByProductId` (around lines 177-212): use the `to_unit` side for the fallback unit on the conversion items, since this function pushes `item.to_unit_id` as the id.

Replace the analogous block in `getIngredientUnitByProductId`:
```ts
      res.forEach((item) => {
        newData.push({
          id: item.to_unit_id,
          name: item.tb_unit_tb_unit_conversion_to_unit_idTotb_unit?.name ?? item.to_unit_name,
          conversion: Number(item.to_unit_qty)
        });
      });
```

With:
```ts
      res.forEach((item) => {
        newData.push({
          id: item.to_unit_id,
          name: item.tb_unit_tb_unit_conversion_to_unit_idTotb_unit?.name ?? item.to_unit_name,
          conversion: Number(item.to_unit_qty),
          decimal_place: resolveConversionDecimalPlace({
            conversion: item,
            fallbackUnit: item.tb_unit_tb_unit_conversion_to_unit_idTotb_unit,
          }),
        });
      });
```

And the product-only fallback block in the same function:
```ts
        return [
          {
            id: product.inventory_unit_id,
            name: product.tb_unit?.name ?? product.inventory_unit_name,
            conversion: 1
          }
        ]
```

Becomes:
```ts
        return [
          {
            id: product.inventory_unit_id,
            name: product.tb_unit?.name ?? product.inventory_unit_name,
            conversion: 1,
            decimal_place: resolveUnitDecimalPlace({ unit: product.tb_unit }),
          }
        ]
```

And the first push (base unit):
```ts
      newData.push({
        id: res[0].tb_product.inventory_unit_id,
        name: res[0].tb_product.tb_unit?.name ?? res[0].tb_product.inventory_unit_name,
        conversion: 1
      })
```

Becomes:
```ts
      newData.push({
        id: res[0].tb_product.inventory_unit_id,
        name: res[0].tb_product.tb_unit?.name ?? res[0].tb_product.inventory_unit_name,
        conversion: 1,
        decimal_place: resolveUnitDecimalPlace({ unit: res[0].tb_product.tb_unit }),
      })
```

**2d.** Do the same for `getAvailableUnitByProductId` (around lines 259-290). It has two push branches inside the `res.forEach` (`ingredient_unit` uses `item.to_unit`, `order_unit` uses `item.to_unit` as well — verify when editing). Mirror the pattern: pass the conversion row plus the `to_unit` relation as the fallback unit.

Replace:
```ts
        return [
          {
            id: product?.inventory_unit_id,
            name: product?.tb_unit?.name ?? product?.inventory_unit_name,
            conversion: 1
          }
        ]
      }
      const newData = []

      newData.push({
        id: res[0].tb_product.inventory_unit_id,
        name: res[0].tb_product.tb_unit?.name ?? res[0].tb_product.inventory_unit_name,
        conversion: 1
      })

      res.forEach((item) => {
        if (item.unit_type === 'ingredient_unit') {
          newData.push({
            id: item.to_unit_id,
            name: item.tb_unit_tb_unit_conversion_to_unit_idTotb_unit?.name ?? item.to_unit_name,
            conversion: 1 / Number(item.to_unit_qty)
          });
        } else if (item.unit_type === 'order_unit') {
          newData.push({
            id: item.to_unit_id,
            name: item.tb_unit_tb_unit_conversion_to_unit_idTotb_unit?.name ?? item.to_unit_name,
            conversion: Number(item.from_unit_qty)
          });
        }
      })
```

With:
```ts
        return [
          {
            id: product?.inventory_unit_id,
            name: product?.tb_unit?.name ?? product?.inventory_unit_name,
            conversion: 1,
            decimal_place: resolveUnitDecimalPlace({ unit: product?.tb_unit }),
          }
        ]
      }
      const newData = []

      newData.push({
        id: res[0].tb_product.inventory_unit_id,
        name: res[0].tb_product.tb_unit?.name ?? res[0].tb_product.inventory_unit_name,
        conversion: 1,
        decimal_place: resolveUnitDecimalPlace({ unit: res[0].tb_product.tb_unit }),
      })

      res.forEach((item) => {
        if (item.unit_type === 'ingredient_unit') {
          newData.push({
            id: item.to_unit_id,
            name: item.tb_unit_tb_unit_conversion_to_unit_idTotb_unit?.name ?? item.to_unit_name,
            conversion: 1 / Number(item.to_unit_qty),
            decimal_place: resolveConversionDecimalPlace({
              conversion: item,
              fallbackUnit: item.tb_unit_tb_unit_conversion_to_unit_idTotb_unit,
            }),
          });
        } else if (item.unit_type === 'order_unit') {
          newData.push({
            id: item.to_unit_id,
            name: item.tb_unit_tb_unit_conversion_to_unit_idTotb_unit?.name ?? item.to_unit_name,
            conversion: Number(item.from_unit_qty),
            decimal_place: resolveConversionDecimalPlace({
              conversion: item,
              fallbackUnit: item.tb_unit_tb_unit_conversion_to_unit_idTotb_unit,
            }),
          });
        }
      })
```

- [ ] **Step 3: Type-check**

```bash
cd apps/micro-business
bun run check-types
```

Expected: PASS.

- [ ] **Step 4: Run unit tests**

```bash
bun run test -- unit-conversion
```

Expected: PASS. Resolver util tests continue to pass; no existing test asserts on the old response shape (the service wasn't previously tested at integration level).

- [ ] **Step 5: Commit**

```bash
cd ../..
git add apps/micro-business/src/master/unit-conversion/
git commit -m "$(cat <<'EOF'
feat(unit-conversion): expose decimal_place on read responses

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Products — DTO and Service Pass-Through

**Files:**
- Modify: `apps/micro-business/src/master/products/dto/product.dto.ts:97-131` (ProductCreate.order_units + ingredient_units)
- Modify: `apps/micro-business/src/master/products/dto/product.dto.ts:191-260` (ProductUpdate.order_units + ingredient_units)
- Modify: `apps/micro-business/src/master/products/products.service.ts` — four `tb_unit_conversion.createMany` data objects plus two `updateMany` payloads

- [ ] **Step 1: Extend `ProductCreate` sub-schemas**

In `apps/micro-business/src/master/products/dto/product.dto.ts`, locate lines 97-131 and add `decimal_place` to the inner `z.object({...})` used inside both `order_units.add` and `ingredient_units.add`. Result:

```ts
  order_units: z
    .object({
      add: z
        .array(
          z.object({
            from_unit_id: z.string(),
            from_unit_qty: z.number(),
            to_unit_id: z.string(),
            to_unit_qty: z.number(),
            description: z.string().optional(),
            is_default: z.boolean().default(false).optional(),
            is_active: z.boolean().default(true).optional(),
            decimal_place: z.number().int().nonnegative().optional(),
          }),
        )
        .optional(),
    })
    .optional(),
  ingredient_units: z
    .object({
      add: z
        .array(
          z.object({
            from_unit_id: z.string(),
            from_unit_qty: z.number(),
            to_unit_id: z.string(),
            to_unit_qty: z.number(),
            description: z.string().optional(),
            is_default: z.boolean().default(false).optional(),
            is_active: z.boolean().default(true).optional(),
            decimal_place: z.number().int().nonnegative().optional(),
          }),
        )
        .optional(),
    })
    .optional(),
});
```

- [ ] **Step 2: Extend `ProductUpdate` sub-schemas**

In the same file, locate lines 191-260. Add `decimal_place: z.number().int().nonnegative().optional()` to **each** of the four inner schemas:

1. `order_units.add` array inner schema
2. `order_units.update` array inner schema (the one with `product_order_unit_id`)
3. `ingredient_units.add` array inner schema
4. `ingredient_units.update` array inner schema (the one with `product_ingredient_unit_id`)

For each of those four inner `z.object({...})` blocks, add `decimal_place: z.number().int().nonnegative().optional(),` as the last key before the closing brace.

- [ ] **Step 3: Pass `decimal_place` through in `products.service.ts` create flows**

In `apps/micro-business/src/master/products/products.service.ts` lines ~1135-1148 (order_units create), the returned shape becomes:

```ts
            return {
              product_id: createProduct.id,
              from_unit_id: orderUnit.from_unit_id,
              from_unit_name: fromUnit.name,
              from_unit_qty: orderUnit.from_unit_qty,
              to_unit_id: orderUnit.to_unit_id,
              to_unit_name: toUnit.name,
              to_unit_qty: orderUnit.to_unit_qty,
              unit_type: enum_unit_type.order_unit,
              description: orderUnit.description ?? null,
              is_active: true,
              is_default: orderUnit.is_default ?? false,
              decimal_place: orderUnit.decimal_place,
              created_by_id: this.userId
            };
```

Apply the same transform to the ingredient_units object-builder (around lines 1172-1186): add `decimal_place: ingredientUnit.decimal_place,` before `created_by_id`.

`undefined` is allowed and causes Prisma to omit the field so the DB default (2) applies.

- [ ] **Step 4: Pass `decimal_place` through in `products.service.ts` update flows**

Four sites need the pass-through. All four are inside the `update` method.

**4a.** `order_units.add` inside update (around line 1473-1490). This block mirrors the create path — the returned literal is the same shape. Add `decimal_place: orderUnit.decimal_place,` right before `created_by_id: this.userId`.

**4b.** `ingredient_units.add` inside update (around line 1547-1561). Same as 4a — add `decimal_place: ingredientUnit.decimal_place,` right before `created_by_id: this.userId`.

**4c.** `order_units.update` (around line 1494-1514) — the code builds an explicit `data = { ... }` object and passes it to `updateMany`. Add a `decimal_place` line following the same coalesce pattern the neighbouring fields use. Insert before `updated_by_id: this.userId`:

```ts
                decimal_place:
                  orderUnit.decimal_place ?? productOrderUnit.decimal_place,
```

The final object shape at that site becomes:

```ts
              const data = {
                id: productOrderUnit.id,
                from_unit_id: fromUnit.id ?? productOrderUnit.from_unit_id,
                from_unit_name:
                  fromUnit.name ?? productOrderUnit.from_unit_name,
                from_unit_qty:
                  orderUnit.from_unit_qty ?? productOrderUnit.from_unit_qty,
                to_unit_id: toUnit.id ?? productOrderUnit.to_unit_id,
                to_unit_name: toUnit.name ?? productOrderUnit.to_unit_name,
                to_unit_qty:
                  orderUnit.to_unit_qty ?? productOrderUnit.to_unit_qty,
                description:
                  orderUnit.description ?? productOrderUnit.description,
                is_default: orderUnit.is_default ?? productOrderUnit.is_default,
                is_active: orderUnit.is_active ?? productOrderUnit.is_active,
                decimal_place:
                  orderUnit.decimal_place ?? productOrderUnit.decimal_place,
                updated_by_id: this.userId,
              };
```

**4d.** `ingredient_units.update` (around line 1586-1607) — symmetric to 4c. Add before `updated_by_id: this.userId`:

```ts
                decimal_place:
                  ingredientUnit.decimal_place ??
                  productIngredientUnit.decimal_place,
```

Both updateMany sites pass `data: { ...data }` so no change to the `updateMany` call itself is required once the built `data` object includes `decimal_place`.

- [ ] **Step 5: Type-check**

```bash
cd apps/micro-business
bun run check-types
```

Expected: PASS. Note: `orderUnit.decimal_place` is `number | undefined` per the new Zod type, and Prisma's generated create input type on `tb_unit_conversion` treats undefined as "skip", so no cast is needed.

- [ ] **Step 6: Run tests**

```bash
bun run test -- products
```

Expected: PASS. Existing product tests don't reference `decimal_place`, and the additive optional field doesn't break any mock payloads.

- [ ] **Step 7: Commit**

```bash
cd ../..
git add apps/micro-business/src/master/products/
git commit -m "$(cat <<'EOF'
feat(products): accept optional decimal_place for order_units and ingredient_units

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Backend Gateway — Unit DTO and Serializer (Zod)

**Files:**
- Modify: `apps/backend-gateway/src/common/dto/unit/unit.dto.ts`
- Modify: `apps/backend-gateway/src/common/dto/unit/unit.serializer.ts`
- Modify: `apps/backend-gateway/src/config/config_units/dto/units.dto.ts`

- [ ] **Step 1: Add `decimal_place` to the Zod create / update DTOs**

Make the three DTO files match `apps/micro-business/src/master/units/dto/unit.dto.ts` verbatim for the `decimal_place` field. Final shape of each file's create / update schemas:

```ts
export const UnitsCreate = z.object({
  name: z.string(),
  description: z.string().optional(),
  is_active: z.boolean().default(true).nullable().optional(),
  decimal_place: z.number().int().nonnegative().optional(),
});

export const UnitsUpdate = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
  decimal_place: z.number().int().nonnegative().optional(),
});
```

Apply to both `apps/backend-gateway/src/common/dto/unit/unit.dto.ts` and `apps/backend-gateway/src/config/config_units/dto/units.dto.ts` (they currently share the same shape).

- [ ] **Step 2: Add `decimal_place` to the Zod response schema**

In `apps/backend-gateway/src/common/dto/unit/unit.serializer.ts`, match `apps/micro-business/src/master/units/dto/unit.serializer.ts`:

```ts
export const UnitResponseSchema = z.object({
  id: z.string(),
  code: z.string().nullable().optional(),
  name: z.string(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
  decimal_place: z.number().int().nonnegative(),
  info: z.any().nullable().optional(),
  dimension: z.any().nullable().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});
```

- [ ] **Step 3: Type-check gateway**

```bash
cd apps/backend-gateway
bun run check-types
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
cd ../..
git add apps/backend-gateway/src/common/dto/unit/ apps/backend-gateway/src/config/config_units/dto/
git commit -m "$(cat <<'EOF'
feat(gateway): mirror decimal_place into unit Zod DTO and serializer

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: Backend Gateway — Unit Swagger DTOs

**Files:**
- Modify: `apps/backend-gateway/src/config/config_units/swagger/request.ts`
- Modify: `apps/backend-gateway/src/config/config_units/swagger/response.ts`

- [ ] **Step 1: Add `@ApiPropertyOptional` for `decimal_place` on both request DTOs**

In `apps/backend-gateway/src/config/config_units/swagger/request.ts`, add a property to both `UnitCreateRequestDto` and `UnitUpdateRequestDto`, right after `is_active`:

```ts
  @ApiPropertyOptional({
    description:
      'Number of decimal places for display and rounding. Defaults to 2 if omitted.',
    example: 2,
    minimum: 0,
  })
  decimal_place?: number;
```

Final shape of `UnitCreateRequestDto`:

```ts
export class UnitCreateRequestDto {
  @ApiProperty({ description: 'Unit name', example: 'Kilogram' })
  name: string;

  @ApiPropertyOptional({ description: 'Unit description', example: 'Standard metric unit of mass' })
  description?: string;

  @ApiPropertyOptional({ description: 'Whether the unit is active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({
    description:
      'Number of decimal places for display and rounding. Defaults to 2 if omitted.',
    example: 2,
    minimum: 0,
  })
  decimal_place?: number;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Used for dry goods' })
  note?: string;
}
```

Do the same for `UnitUpdateRequestDto`.

- [ ] **Step 2: Add `decimal_place` to the response DTO**

In `apps/backend-gateway/src/config/config_units/swagger/response.ts`, add to `UnitResponseDto` — after `is_active`:

```ts
  @ApiProperty({
    description: 'Number of decimal places for display and rounding',
    example: 2,
    minimum: 0,
  })
  decimal_place: number;
```

(Non-optional — the column is `NOT NULL` post-migration.)

- [ ] **Step 3: Type-check**

```bash
cd apps/backend-gateway
bun run check-types
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
cd ../..
git add apps/backend-gateway/src/config/config_units/swagger/
git commit -m "$(cat <<'EOF'
docs(gateway): document decimal_place in unit Swagger DTOs

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: Backend Gateway — Unit-Conversion Serializer and Swagger

**Files:**
- Modify: `apps/backend-gateway/src/common/dto/unit-conversion/unit-conversion.serializer.ts`
- Modify: `apps/backend-gateway/src/application/unit-conversion/swagger/response.ts`

- [ ] **Step 1: Mirror the Zod serializer change on the gateway**

In `apps/backend-gateway/src/common/dto/unit-conversion/unit-conversion.serializer.ts`, apply the same diff as Task 7 Step 1 — add `decimal_place: z.number().int().nonnegative()` to `UnitConversionItemResponseSchema` and `UnitConversionDetailResponseSchema`. Keep the rest of the file untouched.

- [ ] **Step 2: Add `decimal_place` to `UnitConversionResponseDto`**

In `apps/backend-gateway/src/application/unit-conversion/swagger/response.ts`, after the `is_active` property on `UnitConversionResponseDto`, insert:

```ts
  @ApiProperty({
    description: 'Number of decimal places for display and rounding',
    example: 2,
    minimum: 0,
  })
  decimal_place: number;
```

- [ ] **Step 3: Type-check**

```bash
cd apps/backend-gateway
bun run check-types
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
cd ../..
git add apps/backend-gateway/src/common/dto/unit-conversion/ apps/backend-gateway/src/application/unit-conversion/swagger/
git commit -m "$(cat <<'EOF'
feat(gateway): expose decimal_place in unit-conversion serializer and Swagger

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 12: Bruno Collection Updates

**Files:**
- Modify: `apps/bruno/carmen-inventory/config/units/03 - Create Unit.bru`
- Modify: `apps/bruno/carmen-inventory/config/units/04 - Update Unit.bru`

- [ ] **Step 1: Update the Create Unit sample body**

Edit `apps/bruno/carmen-inventory/config/units/03 - Create Unit.bru`. Replace both the docs-block sample JSON and the `body:json` block with:

```json
{
  "name": "",
  "code": "",
  "is_active": true,
  "decimal_place": 2
}
```

(Two occurrences — one inside the `docs { ... }` markdown, one inside `body:json { ... }`.)

- [ ] **Step 2: Update the Update Unit sample body**

Edit `apps/bruno/carmen-inventory/config/units/04 - Update Unit.bru` similarly, adding `"decimal_place": 2` to the sample body and any docs-block example.

- [ ] **Step 3: Sanity-check**

```bash
grep -n 'decimal_place' apps/bruno/carmen-inventory/config/units/
```

Expected: hits in both the Create Unit and Update Unit .bru files.

- [ ] **Step 4: Commit**

```bash
git add "apps/bruno/carmen-inventory/config/units/"
git commit -m "$(cat <<'EOF'
docs(bruno): include decimal_place example in unit create/update requests

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 13: Final Verification

- [ ] **Step 1: Whole-repo type-check**

```bash
bun run check-types
```

Expected: PASS across the turbo graph.

- [ ] **Step 2: Lint**

```bash
bun run lint
```

Expected: no new violations.

- [ ] **Step 3: Run every affected test file**

```bash
cd apps/micro-business
bun run test -- decimal-place.util
bun run test -- units.service
bun run test -- unit-conversion
bun run test -- products
```

Expected: all green.

- [ ] **Step 4: Start the dev stack and smoke-test through the gateway**

```bash
cd ../..
bun run dev
```

In a second shell (or via Bruno), hit:

1. `GET /api/config/{{bu_code}}/units` — each unit object contains `decimal_place`.
2. `POST /api/config/{{bu_code}}/units` with `{"name": "TEST", "decimal_place": 3}` — response echoes the new id; subsequent GET returns `decimal_place: 3`.
3. `POST /api/config/{{bu_code}}/units` with `{"name": "TEST2"}` (no `decimal_place`) — subsequent GET returns `decimal_place: 2` (DB default).
4. `GET /api/application/{{bu_code}}/unit-conversion/order-unit/{product_id}` — items include `decimal_place`.
5. `GET /swagger` — `decimal_place` appears on the Unit and UnitConversion schema definitions.

Stop the dev stack afterwards.

- [ ] **Step 5: Verify git log is clean and tasks are commited**

```bash
git log --oneline -15
```

Expected: 12 commits from this plan, all with `Co-Authored-By: Claude Opus 4.7 (1M context)`.

- [ ] **Step 6: (Optional) Open PR**

If the user asks for a PR, use the existing `gh pr create` pattern from the repo's conventions, citing this plan and the spec.

---

## Dependencies Between Tasks

- Task 2 (schema + migration) blocks Task 5-11 (anything that depends on the generated Prisma client).
- Task 1 (resolver util) blocks Task 7 (unit-conversion service uses it).
- Task 5 (Zod serializer) blocks Task 6 (tests rely on the updated schema).
- Task 8 (Products DTO) is independent of Tasks 9-11 but must happen before any E2E smoke.
- Task 13 verifies everything end-to-end.

## Out-of-Scope Reminders (do not expand this plan)

- Rounding at calculation time (Phase 2).
- E2E tests through the gateway (Bruno covers it).
- Per-side `from_decimal_place` / `to_decimal_place` (Approach 2 — rejected for Phase 1).
