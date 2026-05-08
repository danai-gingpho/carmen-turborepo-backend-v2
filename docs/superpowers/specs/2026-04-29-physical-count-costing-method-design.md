# Physical Count Submit — Configurable Costing Method (Design)

**Date:** 2026-04-29
**Status:** Approved (pending implementation plan)
**Scope:** `apps/micro-business/src/inventory/physical-count`, `packages/prisma-shared-schema-tenant`

## Problem

Endpoint `PATCH {{host}}/api/{{bu_code}}/physical-count/:id/submit` ปัจจุบัน (`physical-count.service.ts:790-949`) สร้าง `tb_stock_in` (สำหรับ positive variance) และ `tb_stock_out` (สำหรับ negative variance) ตาม `diff_qty` แต่ hardcode `cost_per_unit = 0` และ `total_cost = 0` — ทำให้รายการปรับปรุง stock จาก physical count ไม่สะท้อนมูลค่าทางการเงินที่ถูกต้อง

## Goal

ทำให้ราคาที่ใช้ตอนสร้าง stock_in/stock_out จาก physical count submit สามารถ **config ได้ระดับ Business Unit (BU)** เลือกจาก 4 method:

- `standard` — ราคามาตรฐานที่ตั้งไว้ใน product master
- `last` — ราคา cost ของรายการรับเข้าล่าสุด (ระหว่าง GRN กับ stock_in รวมกัน)
- `average` — average cost ล่าสุดจาก inventory cost layer
- `last_receiving` — ราคา cost ของ GRN ล่าสุด (รับสินค้าจาก vendor เท่านั้น)

## Non-Goals

- ไม่เปลี่ยน HTTP contract ของ submit endpoint (ยังเป็น `PATCH /:id/submit` no body)
- ไม่เปลี่ยน flow / status / validation อื่นๆ ของ physical count
- ไม่ implement standard cost ระดับ location (เก็บที่ระดับ product เท่านั้น)
- ไม่ implement effective-dated standard cost history
- ไม่แตะ spot-check / count-stock (แม้ว่า `CostingService` จะ reuse ได้ในอนาคต)

## Decisions

| # | Decision | Why |
|---|---|---|
| 1 | สร้าง enum value ใหม่ `physical_count_costing_method` ใน `enum_business_unit_config_key` | Scope ต่างจาก `calculation_method` (FIFO/AVG ของ stock issue) |
| 2 | เพิ่ม `standard_cost` ใน `tb_product` (ระดับ product) | เริ่มง่ายสุด ขยายเป็นต่อ-location ได้ทีหลังถ้าจำเป็น |
| 3 | Default = `last_receiving` | ราคาจริงล่าสุดจาก vendor เป็นค่าที่สมเหตุสมผลที่สุดสำหรับธุรกิจ hotel/procurement |
| 4 | Fallback ถ้าหา cost ไม่เจอ = `0` | Submit ผ่านได้เสมอ ไม่ block business operation; รายการ adjustment จะมี cost = 0 ให้ user แก้ไขทีหลังถ้าต้องการ |
| 5 | Lookup filter = `product_id` + `location_id` | ราคาที่ track ในระบบเป็นต่อ location จริง (ยกเว้น standard) |
| 6 | `last` = ใหม่กว่าระหว่าง GRN + stock_in (ทุก type) | ครอบคลุม manual stock-in / transfer-in / adjust-in |
| 7 | `last_receiving` = GRN เท่านั้น (`tb_good_received_note_detail`) | เจาะจง "การรับสินค้าจาก vendor" ไม่นับการปรับสต๊อกภายใน |
| 8 | สถาปัตยกรรม = แยก `CostingService` (Approach 2) | สมดุล separation of concerns กับความซับซ้อน, reuse ได้ใน spot-check / count-stock |

## Architecture

### Components

```
┌─────────────────────────────────────┐
│ PhysicalCountService.submit()        │
│  ─ validate                          │
│  ─ load BU config (TenantService)    │ ──► tb_business_unit.config (platform)
│  ─ batch fetch costs (CostingSvc)    │ ──► tenant DB (read)
│  ─ tx: stock_in/out + status update  │ ──► tenant DB (write)
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ CostingService                       │
│  ─ getCostsPerUnit(method, items)    │
│  ─ getCostPerUnit(method, item)      │
└─────────────────────────────────────┘
```

### Module wiring

- New: `apps/micro-business/src/inventory/costing/{costing.module.ts, costing.service.ts, costing.service.spec.ts}`
- `physical-count.module.ts` imports `CostingModule`, injects `CostingService`

## Schema Changes

**File:** `packages/prisma-shared-schema-tenant/prisma/schema.prisma`

```prisma
enum enum_business_unit_config_key {
  hotel
  company
  tax_id
  branch_no
  calculation_method
  currency_base
  date_format
  long_time_format
  short_time_format
  timezone
  perpage
  amount
  quantity
  recipe
  physical_count_costing_method   // NEW
}

enum enum_physical_count_costing_method {
  standard
  last
  average
  last_receiving
}

model tb_product {
  // ...existing fields...
  standard_cost Decimal? @default(0) @db.Decimal(20, 5)   // NEW
  // ...existing relations...
}

// Pre-existing gap discovered during review — required for the design to work
model tb_stock_out_detail {
  // ...existing fields...
  cost_per_unit Decimal? @default(0) @db.Decimal(20, 5)   // NEW (was missing)
  total_cost    Decimal? @default(0) @db.Decimal(20, 5)   // NEW (was missing)
}
```

**Schema gap note:** ปัจจุบัน `tb_stock_out_detail` ไม่มี `cost_per_unit` / `total_cost` ขณะที่ existing `submit()` code พยายามเขียนค่าเหล่านี้อยู่ (line 925-927 ของ service ปัจจุบัน — น่าจะ runtime error เมื่อ negative variance เกิดขึ้น) Implementation plan ต้อง verify จุดนี้และเพิ่ม column

**Migration:**
```bash
cd packages/prisma-shared-schema-tenant
bun run db:migrate    # generates and applies migration
```

**Seed update:** `packages/prisma-shared-schema-tenant/prisma/seed.ts` — เพิ่ม block สำหรับ default `physical_count_costing_method = 'last_receiving'` ในรูปแบบเดียวกับ `calculation_method` (line ~150-200)

## CostingService API

**File:** `apps/micro-business/src/inventory/costing/costing.service.ts`

```ts
export type CostingMethod = 'standard' | 'last' | 'average' | 'last_receiving';

export interface GetCostInput {
  prisma: PrismaTenantClient;
  product_id: string;
  location_id: string;
  method: CostingMethod;
}

export interface GetCostsBatchInput {
  prisma: PrismaTenantClient;
  items: Array<{ product_id: string; location_id: string }>;
  method: CostingMethod;
}

@Injectable()
export class CostingService {
  // returns Decimal(0) when not found (fallback policy)
  async getCostPerUnit(input: GetCostInput): Promise<Prisma.Decimal>;

  // batch — returns Map keyed by `${product_id}:${location_id}`
  async getCostsPerUnit(input: GetCostsBatchInput): Promise<Map<string, Prisma.Decimal>>;
}
```

### Lookup logic per method

**สำคัญ:** Schema จริงต่าง — cost data ไม่ได้อยู่บน `tb_good_received_note_detail` หรือ `tb_stock_in_detail` ตรงๆ ต้อง derive/JOIN

| Method | Source | Logic |
|---|---|---|
| `standard` | `tb_product` | `WHERE id = product_id` → `standard_cost` (location-agnostic) |
| `last_receiving` | `tb_good_received_note_detail` (location/product) JOIN `tb_good_received_note_detail_item` (cost data) | filter `product_id` + `location_id` + `deleted_at = null` ที่ parent, ORDER BY parent `created_at DESC` LIMIT 1, derive cost = `item.net_amount / item.received_base_qty` |
| `last` | (a) ผลของ `last_receiving` query (with `created_at`)<br>(b) `tb_stock_in_detail` JOIN parent `tb_stock_in` filter `tb_stock_in.location_id` + detail `product_id`, ORDER BY detail `created_at DESC` LIMIT 1, return `tb_stock_in_detail.cost_per_unit` | เปรียบเทียบ `created_at` ของ (a) กับ (b) → ใช้ cost ของอันที่ใหม่กว่า |
| `average` | `tb_inventory_transaction_cost_layer` | `WHERE product_id` + `location_id` + `deleted_at = null` ORDER BY `lot_at_date DESC` LIMIT 1 → `average_cost_per_unit` |

**Cost derivation note (`last_receiving`):** ราคาต่อหน่วยจาก GRN ต้องคำนวณจาก `net_amount / received_base_qty` (ราคาสุทธิหลัง discount หาร qty หน่วย inventory) — implementation plan ต้อง verify ว่า field ที่ถูกต้องคืออะไร อาจเลือก `base_net_amount` ถ้าต้องการเป็นเงิน base currency ของ BU

ทุก method ที่ query ไม่เจอ หรือ derive แล้วได้ `0` / `null` → return `Decimal(0)`

### Batch optimization

`getCostsPerUnit` ทำ deduplication ของ `product_id:location_id` ก่อน query, แล้วใช้ `IN (...)` clause เดียวต่อ method (1-2 query ต่อ batch) เพื่อหลีกเลี่ยง N+1

## BU Config Lookup

**Helper ใหม่ใน `TenantService`** (หรือ utility ใกล้เคียงที่มี platform prisma):

```ts
async getBuConfig<T = unknown>(
  bu_id: string,
  key: enum_business_unit_config_key,
  default_value: T,
): Promise<T>
```

อ่าน `tb_business_unit.config` (JSON array รูป `[{key, value}, ...]`) → return `value` หรือ `default_value`

**Validation:** ใน `submit()` หลัง lookup config — ถ้า value ไม่ตรงกับ `'standard' | 'last' | 'average' | 'last_receiving'` → log warning + ใช้ `'last_receiving'` แทน (ไม่ throw)

**Pre-flight:** เช็คว่า `tenant` object จาก `tenantService.getdb_connection(user_id, tenant_id)` มี `bu_id` หรือเปล่า — ถ้าไม่มีต้องเพิ่ม

## `submit()` Refactor

**File:** `apps/micro-business/src/inventory/physical-count/physical-count.service.ts`

ส่วนที่เปลี่ยน (อ้างอิงโครงสร้างปัจจุบัน line 790-949):

```ts
async submit(data, user_id, tenant_id) {
  // ── unchanged: tenant resolve, prisma init, physicalCount lookup,
  //               status check, period lookup, details fetch,
  //               uncounted validation
  // ────────────────────────────────────────────────────────────────

  const detailsWithVariance = details.filter(
    (d) => d.diff_qty && !d.diff_qty.equals(0),
  );

  // NEW: BU config lookup
  const rawMethod = await this.tenantService.getBuConfig(
    tenant.bu_id,
    enum_business_unit_config_key.physical_count_costing_method,
    'last_receiving',
  );
  const method: CostingMethod = isValidMethod(rawMethod)
    ? rawMethod
    : (this.logger.warn({...}), 'last_receiving');

  // NEW: batch cost lookup before transaction
  const costMap = await this.costingService.getCostsPerUnit({
    prisma,
    method,
    items: detailsWithVariance.map((d) => ({
      product_id: d.product_id,
      location_id: physicalCount.location_id,
    })),
  });

  await prisma.$transaction(async (tx) => {
    const positiveVariance = detailsWithVariance.filter((d) => d.diff_qty.greaterThan(0));
    const negativeVariance = detailsWithVariance.filter((d) => d.diff_qty.lessThan(0));

    if (positiveVariance.length > 0) {
      // ── unchanged: generate siNo, create tb_stock_in header ──
      const stockInDetails = positiveVariance.map((d) => {
        const cost = costMap.get(`${d.product_id}:${physicalCount.location_id}`)
          ?? new Prisma.Decimal(0);
        const qty = d.diff_qty;
        return {
          // ── unchanged: stock_in_id, sequence_no, product/location fields ──
          qty,
          cost_per_unit: cost,                         // CHANGED (was Decimal(0))
          total_cost: cost.mul(qty),                   // CHANGED (was Decimal(0))
          note: `Physical Count Adjustment - Variance: +${d.diff_qty} @ ${cost} (${method})`,
          created_by_id: user_id,
        };
      });
      await tx.tb_stock_in_detail.createMany({ data: stockInDetails });
    }

    if (negativeVariance.length > 0) {
      // ── unchanged: generate soNo, create tb_stock_out header ──
      const stockOutDetails = negativeVariance.map((d) => {
        const cost = costMap.get(`${d.product_id}:${physicalCount.location_id}`)
          ?? new Prisma.Decimal(0);
        const qty = d.diff_qty.abs();
        return {
          // ── unchanged: stock_out_id, sequence_no, product/location fields ──
          qty,
          cost_per_unit: cost,                         // CHANGED
          total_cost: cost.mul(qty),                   // CHANGED
          note: `Physical Count Adjustment - Variance: ${d.diff_qty} @ ${cost} (${method})`,
          created_by_id: user_id,
        };
      });
      await tx.tb_stock_out_detail.createMany({ data: stockOutDetails });
    }

    // ── unchanged: tb_physical_count.update — status=completed, completed_at, completed_by_id ──
  });

  return this.findOne(data.id, user_id, tenant_id);
}
```

**Key points:**
- BU config lookup อยู่นอก `$transaction` (platform DB คนละ connection)
- Batch cost fetch อยู่นอก `$transaction` (read-only, ไม่ต้อง atomic กับ writes)
- `cost_per_unit` และ `total_cost` คำนวณจาก `cost * qty` (Decimal arithmetic)
- Note ใส่ method ที่ใช้เพื่อ audit trail
- ไม่เปลี่ยน validation, status flow, หรือ stamping logic

## Gateway / Bruno Sync

### Submit endpoint
- **ไม่เปลี่ยน contract** — ยังเป็น `PATCH /:id/submit` no body
- Response shape เดิม
- ไม่ต้องแก้ Swagger DTO

### Product master
- เพิ่ม `standard_cost: number` ใน:
  - Zod input DTO + output type ใน `apps/backend-gateway/src/config/product/`
  - Swagger request/response examples
  - Service mapper (create/update/findOne)
- Bruno: `bun run bruno:sync:payloads` ให้ payload ตัวอย่างใน `.bru` files มี field ใหม่

### BU config update endpoint
- ถ้ามี endpoint update BU config อยู่แล้ว — เช็คว่า DTO/Zod validation ของ key (enum) อนุญาต `physical_count_costing_method`
- ถ้ามี enum guard ต้องเพิ่ม value ใหม่

## Testing

### Unit — `costing.service.spec.ts` (ใหม่)

```
describe('CostingService.getCostsPerUnit')
  ✓ standard: returns tb_product.standard_cost (location-agnostic)
  ✓ standard: returns 0 when standard_cost is null/0
  ✓ last_receiving: returns latest GRN cost for product+location
  ✓ last_receiving: returns 0 when no GRN exists for the pair
  ✓ last: returns latest between GRN and stock_in (GRN newer case)
  ✓ last: returns latest between GRN and stock_in (stock_in newer case)
  ✓ last: returns 0 when neither table has matching record
  ✓ average: returns average_cost_per_unit from latest cost layer
  ✓ average: returns 0 when no cost layer exists
  ✓ batch: deduplicates queries when items share product+location
  ✓ batch: each item resolves independently (different products)
```

### Unit — `physical-count.service.spec.ts` (เพิ่ม)

```
describe('PhysicalCountService.submit (with costing)')
  ✓ uses BU config method when set (CostingService called with correct method)
  ✓ falls back to 'last_receiving' when BU config missing
  ✓ falls back to 'last_receiving' when BU config has invalid value (with warning log)
  ✓ stock_in.cost_per_unit = lookup result for positive variance
  ✓ stock_out.cost_per_unit = lookup result for negative variance
  ✓ stock_in.total_cost = qty * cost
  ✓ stock_out.total_cost = abs(qty) * cost
  ✓ uses cost = 0 when CostingService returns 0 (still completes successfully)
  ✓ does not create stock_in when no positive variance
  ✓ does not create stock_out when no negative variance
  ✓ existing validations still pass (uncounted details, already-completed)
```

### E2E — เพิ่ม 1 case (ถ้ามี existing e2e file)

Seed BU config + product `standard_cost = 100` → run physical count → submit → assert `tb_stock_in_detail.cost_per_unit = 100` (เลือก method = `standard` เพื่อ deterministic)

### Manual smoke test (Bruno)

1. Update `tb_business_unit.config` ให้มี `physical_count_costing_method = 'standard'`
2. Update product มี `standard_cost = 100`
3. รัน physical count flow → submit
4. เช็ค response ของ `findOne` ว่า variance รายการนั้น `cost_per_unit = 100` ถูกต้อง

## Risks & Open Questions

- **R1:** `tenant.bu_id` ต้องมีจาก `tenantService.getdb_connection()` — ถ้าไม่มีต้องเพิ่ม path ส่ง bu_id หรือ resolve จาก request context (กระทบ multiple call sites)
- **R2:** Migration เพิ่ม column 3 จุด (`tb_product.standard_cost`, `tb_stock_out_detail.cost_per_unit`, `tb_stock_out_detail.total_cost`) + enum value ใหม่ ต้อง run ทุก tenant DB — ใช้ `db:migrate` per-tenant flow ที่มีอยู่
- **R3:** Performance — `last` method ทำ 2 query (GRN + stock_in) แล้ว compare ใน application layer; batch query ลด N+1 แต่ต้อง verify ด้วย explain ใน production-like data; ถ้าช้าจริง อาจใช้ `tb_inventory_transaction_cost_layer` เป็น single source แทน
- **R4:** Existing physical counts ที่ submit ไปแล้ว (cost = 0) จะยังเป็น 0 — ไม่ migrate retro-active
- **R5 (pre-existing bug):** Existing `submit()` code (line 887-889, 922-924) เขียน `location_id` / `location_code` / `location_name` ลง `tb_stock_in_detail` และ `tb_stock_out_detail` ที่ schema ไม่มี field นี้ — น่าจะ Prisma runtime error เมื่อ branch นั้นทำงาน Implementation plan ต้องตัดสินว่า: (a) ลบบรรทัดเหล่านี้ทิ้ง (location อยู่ที่ parent stock_in/out อยู่แล้วผ่าน `physicalCount.location_id`), หรือ (b) เพิ่ม `location_id` ลง schema ของ detail tables
- **R6:** Cost derivation จาก GRN — `net_amount / received_base_qty` อาจ divide by zero ถ้า `received_base_qty = 0` (FOC items?) → fallback เป็น 0 ตาม policy

## Out of Scope (Future)

- Per-location standard cost (`tb_product_location.standard_cost`)
- Standard cost effective-dating / history
- Reuse `CostingService` ใน spot-check, count-stock submit flows
- Cost variance reporting dashboard
