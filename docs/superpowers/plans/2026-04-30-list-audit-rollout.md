# List Audit Enrichment — Rollout Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply `@EnrichAuditUsers()` to every list (`@Get()`) handler in `apps/backend-gateway` whose corresponding `findById` is already enriched (≈54 controllers across config + application + platform), update each list response Zod schema/Swagger DTO/Bruno sample to use the new `audit` shape, and ship a one-time **breaking** redesign of the shared audit shape from `{ created_at, created_by, ... }` to `{ created, updated, deleted }.{ at, id, name }` with null-pair omit rule.

**Architecture:** Sprint 0 rewrites `mutateToAuditShape()` and the shared `AuditSchema` / `AuditDto`, refreshes all 54 already-shipped findById Bruno/Swagger samples to the new shape, and then incrementally rolls out `@EnrichAuditUsers()` to list endpoints in 10 batches across 3 phases. Each batch is one commit. No new components — reuses existing `EnrichmentService`, `UserNameResolverService`, `UserNameCacheService`, `EnrichAuditUsersContextInterceptor`, `BaseHttpController.respond()`, and the `micro-cluster` `user.resolveByIds` TCP handler.

**Tech Stack:** NestJS 11, TypeScript, Zod (`nestjs-zod`), Bruno.

**Spec:** `docs/superpowers/specs/2026-04-30-list-audit-user-enrichment-design.md`
**Findbyid rollout (already shipped):** `docs/superpowers/plans/2026-04-30-findbyid-audit-rollout.md`

---

## Status before starting

Already shipped (do **not** re-implement):

- `apps/backend-gateway/src/common/decorators/enrich-audit-users.decorator.ts`
- `apps/backend-gateway/src/common/context/enrich-audit-users.context.ts`
- `apps/backend-gateway/src/common/interceptors/enrich-audit-users-context.interceptor.ts`
- `apps/backend-gateway/src/common/enrichment/{audit-shape,user-name-cache.service,user-name-resolver.service,enrichment.service,enrichment.module}.ts`
- `apps/backend-gateway/src/common/dto/audit/audit.dto.ts` (`AuditSchema`, `AuditDto`, `AuditUserDto`) — **redesigned in Sprint 0**
- `apps/backend-gateway/src/common/http/base-http-controller.ts` (async `respond()` + static locator)
- `apps/backend-gateway/src/app.module.ts` (registers global interceptor + locator init)
- `apps/micro-cluster/src/cluster/user/{user.service.ts,user.controller.ts,format-user-name.ts}` (TCP `{ cmd: 'user.resolveByIds', service: 'user' }`)
- 54 findById endpoints already enriched with current (old-shape) `audit`. **Sprint 0 reformats their response shape.**

Per user preference, this plan **does not write automated tests**. Each batch ends with `bun run check-types` from the gateway and one git commit.

---

## File structure

### Files redesigned in Sprint 0 (single commit)

| File | Responsibility |
|---|---|
| `apps/backend-gateway/src/common/dto/audit/audit.dto.ts` | New `AuditSchema` (`{ created?, updated?, deleted? }`) + `AuditDto` / `AuditEntryDto`. Removes `AuditUserSchema` / `AuditUserDto` exports. |
| `apps/backend-gateway/src/common/enrichment/audit-shape.ts` | Rewritten `mutateToAuditShape()` producing the new nested shape with null-pair omit rule. |
| 54 × `apps/bruno/carmen-inventory/**/02 - Get *.bru` | findById Bruno docs samples updated to new shape. |
| Multiple swagger response example DTOs / inline `@ApiResponse` examples for findById endpoints | Updated to new shape. |

### Files modified per controller in Phases A–C

| File | Responsibility |
|---|---|
| `apps/backend-gateway/src/<domain>/<x>/<x>.controller.ts` | Add `@EnrichAuditUsers()` decorator on the `@Get()` list handler. |
| `apps/backend-gateway/src/common/dto/<x>/<x>.serializer.ts` | Update `<X>ListItemResponseSchema` — remove raw audit fields, add `audit: AuditSchema.optional()`. |
| `apps/backend-gateway/src/<domain>/<x>/swagger/response.ts` (when present) | Update list response DTO + example. |
| `apps/micro-business/src/<domain>/<x>/<x>.service.ts` | Verify (and if needed extend) Prisma `findMany` `select` to include all 6 audit columns. |
| `apps/bruno/carmen-inventory/<bruno-folder>/01 - Get All <Entity>.bru` | Refresh `docs:` sample response with new shape. |

---

## Canonical change pattern (apply to every controller in Phases A–C)

For one controller `<X>` whose list endpoint uses Zod schema `<X>ListItemResponseSchema`:

### 1. Controller — add the decorator

**File:** `apps/backend-gateway/src/<domain>/<x>/<x>.controller.ts`

In the `@/common` import group, add `EnrichAuditUsers`. On the `@Get()` list handler, insert `@EnrichAuditUsers()` directly after `@Serialize(...)` and before `@HttpCode(...)`. Decorator stack should read: `Get → UseGuards(AppIdGuard) → Serialize → EnrichAuditUsers → HttpCode → ApiVersionMinRequest → ApiUserFilterQueries → ApiOperation`.

```ts
// before
@Get()
@UseGuards(new AppIdGuard('<x>.findAll'))
@Serialize(<X>ListItemResponseSchema)
@HttpCode(HttpStatus.OK)

// after
@Get()
@UseGuards(new AppIdGuard('<x>.findAll'))
@Serialize(<X>ListItemResponseSchema)
@EnrichAuditUsers()
@HttpCode(HttpStatus.OK)
```

`EnrichAuditUsers` is already re-exported from `@/common`.

### 2. Serializer — swap raw audit fields for `audit`

**File:** `apps/backend-gateway/src/common/dto/<x>/<x>.serializer.ts`

Two scenarios:

**(a) `<X>ListItemResponseSchema` is its own `z.object({...})`** — remove these six fields if present, then add `audit: AuditSchema.optional()`:

```
created_at, created_by_id, updated_at, updated_by_id, deleted_at, deleted_by_id
```

```ts
import { AuditSchema } from '../audit/audit.dto';

export const <X>ListItemResponseSchema = z.object({
  id: z.string(),
  // ... entity-specific fields, unchanged
  audit: AuditSchema.optional(),
});
```

**(b) `<X>ListItemResponseSchema = <X>ResponseSchema` (alias)** — split it. Keep base `<X>ResponseSchema` clean, make list its own object with audit:

```ts
// before
export const <X>ListItemResponseSchema = <X>ResponseSchema;

// after
export const <X>ListItemResponseSchema = <X>ResponseSchema
  .omit({ created_at: true, updated_at: true })
  .extend({ audit: AuditSchema.optional() });
```

Use `.omit({...})` with whichever of the six fields are actually defined on the base schema.

### 3. micro-business — verify list service `select`

**File:** `apps/micro-business/src/<domain>/<x>/<x>.service.ts`

Find the `findAll` method (or equivalent list handler). One of three cases:

- **No `select`** (uses default `prisma.<x>.findMany({ where, orderBy, ...paginate })`) — no change. All columns are returned by default, including the 6 audit columns.
- **Has `select: {...}`** that constrains columns — extend it to include all 6 audit fields:
  ```ts
  select: {
    id: true,
    // ... existing fields
    created_at: true,
    created_by_id: true,
    updated_at: true,
    updated_by_id: true,
    deleted_at: true,
    deleted_by_id: true,
  }
  ```
- **Uses a mapper helper** (e.g., `.map(toListItem)`) that picks fields — extend the mapper to forward the 6 audit fields.

### 4. Bruno — refresh sample response

**File:** `apps/bruno/carmen-inventory/<bruno-folder>/01 - Get All <Entity>.bru` (file naming varies — search by `Get All`, `findAll`, or domain folder)

Inside the `docs { ... ### Sample Response ... }` block, replace the inline JSON sample so the `data` array items use the new `audit` shape:

```json
{
  "data": [
    {
      "id": "11111111-1111-1111-1111-111111111111",
      // ... entity fields ...
      "audit": {
        "created": {
          "at": "2026-04-29T08:30:00.000Z",
          "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
          "name": "John Doe"
        },
        "updated": {
          "at": "2026-04-29T09:15:00.000Z",
          "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567891",
          "name": "Jane Smith"
        }
      }
    }
  ],
  "paginate": { "total": 1, "page": 1, "perpage": 10, "pages": 1 },
  "status": 200,
  "success": true,
  "message": "Success",
  "timestamp": "2026-04-29T09:15:00.000Z"
}
```

Remove any `created_at`, `updated_at`, `deleted_at`, `created_by_id`, `updated_by_id`, `deleted_by_id` keys from each item. Leave the rest of the file (meta, get, headers, auth, query, params, error tables) untouched. Show at least one item without `deleted` (omitted because both null) to demonstrate the rule.

If the controller has a corresponding Swagger response example file (`apps/backend-gateway/src/<domain>/<x>/swagger/response*.ts`), update its inline example object the same way.

### 5. Per-batch verification

```bash
cd apps/backend-gateway
bun run check-types
```

Expected: exits 0.

### 6. Commit

One commit per batch:

```bash
git add apps/backend-gateway/src apps/micro-business/src apps/bruno/carmen-inventory
git commit -m "feat(audit): enrich list for <phase> batch <N> (<short-list>)"
```

---

## Sprint 0 — Infra redesign + findById refresh (single commit)

### Task S0: Audit shape redesign

**Files:**
- Modify: `apps/backend-gateway/src/common/dto/audit/audit.dto.ts`
- Modify: `apps/backend-gateway/src/common/enrichment/audit-shape.ts`
- Refresh: 54 × `apps/bruno/carmen-inventory/**/02 - Get *.bru` findById samples
- Refresh: any inline Swagger response examples for findById endpoints (if they hard-code the audit shape)

- [ ] **Step 1 — Rewrite `audit.dto.ts`**

Replace the **entire** contents of `apps/backend-gateway/src/common/dto/audit/audit.dto.ts` with:

```ts
import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export class AuditEntryDto {
  @ApiProperty({ type: String, format: 'date-time', required: false, example: '2026-04-29T08:30:00.000Z' })
  at?: string;
  @ApiProperty({ required: false, example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id?: string;
  @ApiProperty({ required: false, example: 'John Doe' })
  name?: string;
}

export class AuditDto {
  @ApiProperty({ type: AuditEntryDto, required: false })
  created?: AuditEntryDto;
  @ApiProperty({ type: AuditEntryDto, required: false })
  updated?: AuditEntryDto;
  @ApiProperty({ type: AuditEntryDto, required: false })
  deleted?: AuditEntryDto;
}

export const AuditEntrySchema = z.object({
  at: z.string().optional(),
  id: z.string().optional(),
  name: z.string().optional(),
});

export const AuditSchema = z.object({
  created: AuditEntrySchema.optional(),
  updated: AuditEntrySchema.optional(),
  deleted: AuditEntrySchema.optional(),
});

export type Audit = z.infer<typeof AuditSchema>;
export type AuditEntry = z.infer<typeof AuditEntrySchema>;
```

Note: `at` uses `z.string().optional()` (not `.datetime()`) because Prisma can return `Date` objects that we already `.toISOString()` in `mutateToAuditShape`, but the schema must accept the serialized string regardless of formatting strictness.

- [ ] **Step 2 — Rewrite `mutateToAuditShape` in `audit-shape.ts`**

In `apps/backend-gateway/src/common/enrichment/audit-shape.ts`, replace the `KIND_MAP` constant and the `mutateToAuditShape` function. Leave `AUDIT_AT_FIELDS`, `AUDIT_BY_ID_FIELDS`, `EnrichmentTarget`, `isPlainObject`, `collectTargetsByPaths`, `collectAt`, and `uniqueAuditUserIds` unchanged.

```ts
const KIND_MAP = [
  { key: 'created', at: 'created_at', byId: 'created_by_id' },
  { key: 'updated', at: 'updated_at', byId: 'updated_by_id' },
  { key: 'deleted', at: 'deleted_at', byId: 'deleted_by_id' },
] as const;

/**
 * Mutate `target` in place: collapse `created_at + created_by_id` (and the
 * updated/deleted equivalents) into a single nested `audit` object of shape
 * `{ created?, updated?, deleted? }` where each entry is `{ at?, id?, name? }`.
 * Drops the raw fields. Omits a kind entirely when both its `*_at` and
 * `*_by_id` are null. If all three kinds are omitted, no `audit` key is added.
 * If the target has none of the six raw fields, no `audit` key is added.
 */
export function mutateToAuditShape(
  target: EnrichmentTarget,
  nameMap: Map<string, string | null>,
): void {
  if (!isPlainObject(target)) return;

  const hasAnyRaw = KIND_MAP.some(({ at, byId }) => at in target || byId in target);
  if (!hasAnyRaw) return;

  const audit: Record<string, { at?: string; id?: string; name?: string }> = {};
  let hasAnyKind = false;

  for (const { key, at, byId } of KIND_MAP) {
    const atVal = at in target ? (target[at] as Date | string | null | undefined) : undefined;
    const byIdVal = byId in target ? (target[byId] as string | null | undefined) : undefined;

    delete target[at];
    delete target[byId];

    const atIsNull = atVal == null;
    const byIdIsNull = byIdVal == null || byIdVal === '';
    if (atIsNull && byIdIsNull) continue;

    const entry: { at?: string; id?: string; name?: string } = {};
    if (!atIsNull) {
      entry.at = atVal instanceof Date ? atVal.toISOString() : (atVal as string);
    }
    if (!byIdIsNull) {
      const id = byIdVal as string;
      entry.id = id;
      const name = nameMap.get(id);
      entry.name = name == null ? 'Unknown' : name;
    }

    audit[key] = entry;
    hasAnyKind = true;
  }

  if (hasAnyKind) target.audit = audit;
}
```

- [ ] **Step 3 — Verify nothing else imports the removed `AuditUserSchema`**

```bash
grep -rn "AuditUserSchema\|AuditUserDto" apps/backend-gateway/src apps/micro-business/src
```

Expected: only matches inside `audit.dto.ts` (now removed) — none elsewhere. If grep prints any other file, replace those references with `AuditEntrySchema` / `AuditEntryDto` accordingly.

- [ ] **Step 4 — Type check after infra change**

```bash
cd apps/backend-gateway && bun run check-types
```

Expected: exits 0.

- [ ] **Step 5 — Refresh 54 findById Bruno samples**

For each Bruno file enumerated below, edit the `docs:` block's `Sample Response` JSON. Replace the existing audit block:

```json
"audit": {
  "created_at": "...",
  "created_by": { "id": "...", "name": "..." },
  "updated_at": "...",
  "updated_by": { "id": "...", "name": "..." },
  "deleted_at": null,
  "deleted_by": null
}
```

with:

```json
"audit": {
  "created": {
    "at": "2026-04-29T08:30:00.000Z",
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "John Doe"
  },
  "updated": {
    "at": "2026-04-29T09:15:00.000Z",
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567891",
    "name": "Jane Smith"
  }
}
```

(Drop `deleted` because both null — demonstrates the new omit rule. Keep `at` ISO strings; reuse the existing IDs/names if the original sample had them.)

Files to edit (54 total):

```bash
# Phase A (config) — locate by:
grep -rln "@EnrichAuditUsers" apps/backend-gateway/src/config | sed 's|.*/src/||;s|/[^/]*\.controller\.ts||' | sort -u
# Then for each entry, find the corresponding 02 - Get *.bru in apps/bruno/carmen-inventory/config/

# Phase B (application) — same pattern under .../src/application/
# Phase C (platform) — same pattern under .../src/platform/
```

If you prefer a one-shot enumeration, run:

```bash
for f in apps/bruno/carmen-inventory/**/02*Get*.bru; do
  if grep -q '"created_by"' "$f" 2>/dev/null || grep -q '"created_at"' "$f" 2>/dev/null; then
    echo "$f"
  fi
done
```

Each file: same edit pattern. Use the editor's exact-match find/replace per file (the JSON shape is consistent across the 54).

- [ ] **Step 6 — Refresh Swagger inline examples for findById**

Some controllers carry inline `@ApiResponse({ schema: { example: {...} } })` blocks under `apps/backend-gateway/src/{config,application,platform}/*/swagger/` or directly in the controller. Locate any that hard-code the old audit shape:

```bash
grep -rln '"created_by"\|created_by_id' apps/backend-gateway/src/config/*/swagger \
  apps/backend-gateway/src/application/*/swagger \
  apps/backend-gateway/src/platform/*/swagger 2>/dev/null
```

For each file printed, apply the same JSON edit pattern as Step 5. If a file has no audit shape in the example, no change.

- [ ] **Step 7 — Smoke test (manual, requires dev stack)**

Start the gateway + micro-cluster + micro-business (or whichever services the pilot endpoint needs):

```bash
bun run dev
```

In a Bruno tab, run `apps/bruno/carmen-inventory/config/departments/02 - Get Department.bru` against an existing department UUID. Confirm response `data.audit` matches the new shape. If the department has no `deleted_at`, `audit.deleted` must be **absent**.

If the smoke test fails, inspect server logs for `EnrichmentService` warnings; do not commit Sprint 0 until shape matches.

- [ ] **Step 8 — Commit Sprint 0**

```bash
git add apps/backend-gateway/src apps/bruno/carmen-inventory
git commit -m "refactor(audit): redesign audit shape to {created,updated,deleted}.{at,id,name}"
```

---

## Phase A — Config rollout (≈25 list endpoints, 6 batches)

### Task A1: Config list batch 1 — adjustment-type, application_role, credit-note-reason, credit_term, currencies

**Per controller (apply canonical pattern from "Canonical change pattern" above):**

- [ ] **Step 1** — `apps/backend-gateway/src/config/config_adjustment-type/config_adjustment-type.controller.ts` + `apps/backend-gateway/src/common/dto/adjustment-type/adjustment-type.serializer.ts` (or co-located response file) + `apps/micro-business/src/config/adjustment-type/adjustment-type.service.ts` + `apps/bruno/carmen-inventory/config/adjustment-type/01 - Get All Adjustment Type.bru`.
- [ ] **Step 2** — `apps/backend-gateway/src/config/config_application_role/config_application_role.controller.ts` + serializer + matching service + Bruno.
- [ ] **Step 3** — `apps/backend-gateway/src/config/config_credit-note-reason/config_credit-note-reason.controller.ts` + `apps/backend-gateway/src/common/dto/credit-note-reason/credit-note-reason.serializer.ts` + service + Bruno.
- [ ] **Step 4** — `apps/backend-gateway/src/config/config_credit_term/config_credit_term.controller.ts` + `apps/backend-gateway/src/common/dto/credit-term/credit-term.serializer.ts` (alias case — split list shape from base if not yet split: keep `<X>ResponseSchema` clean, define `<X>ListItemResponseSchema = <X>ResponseSchema.omit({...}).extend({ audit: AuditSchema.optional() })`) + service + Bruno.
- [ ] **Step 5** — `apps/backend-gateway/src/config/config_currencies/config_currencies.controller.ts` + `apps/backend-gateway/src/common/dto/currency/currency.serializer.ts` + service + Bruno.
- [ ] **Step 6** — `cd apps/backend-gateway && bun run check-types` → exits 0.
- [ ] **Step 7** — Commit:

```bash
git add apps/backend-gateway/src apps/micro-business/src apps/bruno/carmen-inventory
git commit -m "feat(audit): enrich list for config batch 1 (adjustment-type, application_role, credit-note-reason, credit_term, currencies)"
```

---

### Task A2: Config list batch 2 — delivery-point, department-user, exchange-rate, extra_cost_type, locations

- [ ] **Step 1** — `config_delivery-point.controller.ts` + `common/dto/delivery-point/delivery-point.serializer.ts` + service + Bruno.
- [ ] **Step 2** — `config_department-user.controller.ts` + serializer + service + Bruno. The list shape pivots around department-user wrappers; apply enrichment to the wrapper objects only (default root-only paths).
- [ ] **Step 3** — `config_exchange-rate.controller.ts` + `common/dto/exchange-rate/exchange-rate.serializer.ts` + service + Bruno.
- [ ] **Step 4** — `config_extra_cost_type.controller.ts` + `common/dto/extra-cost-type/extra-cost-type.serializer.ts` (passthrough case — `omit({...}).extend({ audit: AuditSchema.optional() })` then re-wrap with `.passthrough()`) + service + Bruno.
- [ ] **Step 5** — `config_locations.controller.ts` + `common/dto/location/location.serializer.ts` (`<X>ListItemResponseSchema`) + service + Bruno.
- [ ] **Step 6** — `cd apps/backend-gateway && bun run check-types` → exits 0.
- [ ] **Step 7** — Commit:

```bash
git commit -m "feat(audit): enrich list for config batch 2 (delivery-point, department-user, exchange-rate, extra_cost_type, locations)"
```

---

### Task A3: Config list batch 3 — price-list, product-category, product-item-group, product-sub-category, products

- [ ] **Step 1** — `config_price-list.controller.ts` + `common/dto/pricelist/pricelist.serializer.ts` + service + Bruno.
- [ ] **Step 2** — `config_product-category.controller.ts` + `common/dto/product-category/product-category.serializer.ts` + service + Bruno.
- [ ] **Step 3** — `config_product-item-group.controller.ts` + `common/dto/product-item-group/product-item-group.serializer.ts` + service + Bruno.
- [ ] **Step 4** — `config_product-sub-category.controller.ts` + `common/dto/product-sub-category/product-sub-category.serializer.ts` + service + Bruno.
- [ ] **Step 5** — `config_products.controller.ts` + `common/dto/product/product.serializer.ts` + service + Bruno.
- [ ] **Step 6** — `cd apps/backend-gateway && bun run check-types` → exits 0.
- [ ] **Step 7** — Commit:

```bash
git commit -m "feat(audit): enrich list for config batch 3 (price-list, product-category/item-group/sub-category, products)"
```

---

### Task A4: Config list batch 4 — recipe-category, recipe-cuisine, recipe-equipment-category, recipe-equipment, recipe

Recipe list serializers may live in `apps/backend-gateway/src/config/config_recipe*/swagger/response.ts` rather than under `common/dto/`. Locate via `grep -rn "<X>ListItemResponseSchema" apps/backend-gateway/src/`.

- [ ] **Step 1** — `config_recipe-category.controller.ts` + list serializer + service (`apps/micro-business/src/recipe/recipe-category/...`) + Bruno.
- [ ] **Step 2** — `config_recipe-cuisine.controller.ts` + list serializer + service + Bruno.
- [ ] **Step 3** — `config_recipe-equipment-category.controller.ts` + list serializer + service + Bruno.
- [ ] **Step 4** — `config_recipe-equipment.controller.ts` + list serializer + service + Bruno.
- [ ] **Step 5** — `config_recipe.controller.ts` + list serializer + service + Bruno. Recipe list items are flat header rows (no nested children in list shape). Default root-only paths.
- [ ] **Step 6** — `cd apps/backend-gateway && bun run check-types` → exits 0.
- [ ] **Step 7** — Commit:

```bash
git commit -m "feat(audit): enrich list for config batch 4 (recipe family)"
```

---

### Task A5: Config list batch 5 — running-code, tax_profile, unit_comment, units

- [ ] **Step 1** — `config_running-code.controller.ts` + list serializer + service + Bruno.
- [ ] **Step 2** — `config_tax_profile.controller.ts` + `common/dto/tax-profile/tax-profile.serializer.ts` + service + Bruno.
- [ ] **Step 3** — `config_unit_comment.controller.ts` + `common/dto/unit-comment/unit-comment.serializer.ts` + service + Bruno. Comment entities have only `created_at` / `created_by_id` — `mutateToAuditShape` will produce `audit: { created: {...} }` only. Bruno sample should reflect that.
- [ ] **Step 4** — `config_units.controller.ts` + `common/dto/unit/unit.serializer.ts` + service + Bruno.
- [ ] **Step 5** — `cd apps/backend-gateway && bun run check-types` → exits 0.
- [ ] **Step 6** — Commit:

```bash
git commit -m "feat(audit): enrich list for config batch 5 (running-code, tax_profile, unit_comment, units)"
```

---

### Task A6: Config list batch 6 — vendor_business_type, vendors, workflows

- [ ] **Step 1** — `config_vendor_business_type.controller.ts` + `common/dto/vendor-business-type/vendor-business-type.serializer.ts` + service + Bruno.
- [ ] **Step 2** — `config_vendors.controller.ts` + `common/dto/vendor/vendor.serializer.ts` + service + Bruno.
- [ ] **Step 3** — `config_workflows.controller.ts` + `common/dto/workflow/workflow.serializer.ts` + service + Bruno.
- [ ] **Step 4** — `cd apps/backend-gateway && bun run check-types` → exits 0.
- [ ] **Step 5** — Commit:

```bash
git commit -m "feat(audit): enrich list for config batch 6 (vendor_business_type, vendors, workflows)"
```

---

## Phase B — Application rollout (≈18 list endpoints, 4 batches)

### Task B1: Application list batch 1 — activity-log, credit-note, credit-term, dashboard, department

- [ ] **Step 1** — `apps/backend-gateway/src/application/activity-log/activity-log.controller.ts` + list serializer + service + Bruno. Activity-log entries usually have only `created_at` / `created_by_id` (same partial-audit pattern as comments).
- [ ] **Step 2** — `application/credit-note/credit-note.controller.ts` + `common/dto/credit-note/credit-note.serializer.ts` (`CreditNoteListItemResponseSchema`) + service + Bruno. Default root-only paths (list items are header rows; details are not embedded in list response).
- [ ] **Step 3** — `application/credit-term/credit-term.controller.ts` (reuses `common/dto/credit-term/credit-term.serializer.ts` updated in Task A1) + service + Bruno.
- [ ] **Step 4** — `application/dashboard/dashboard.controller.ts`. If the list endpoint returns audited entities (e.g. saved dashboard configs per BU), apply the pattern. If the list returns aggregated metrics with no audit fields, **skip** this controller and note it in the commit.
- [ ] **Step 5** — `application/department/department.controller.ts` (reuses `common/dto/department/department.serializer.ts`) + service + Bruno.
- [ ] **Step 6** — `cd apps/backend-gateway && bun run check-types` → exits 0.
- [ ] **Step 7** — Commit:

```bash
git commit -m "feat(audit): enrich list for application batch 1 (activity-log, credit-note, credit-term, dashboard, department)"
```

---

### Task B2: Application list batch 2 — inventory-adjustment, news, price-list-template, price-list, purchase-order

- [ ] **Step 1** — `application/inventory-adjustment/inventory-adjustment.controller.ts` + list serializer + service + Bruno. Default root-only paths (list = header rows).
- [ ] **Step 2** — `application/news/news.controller.ts` + list serializer + service + Bruno.
- [ ] **Step 3** — `application/price-list-template/price-list-template.controller.ts` + `common/dto/price-list-template/price-list-template.serializer.ts` + service + Bruno.
- [ ] **Step 4** — `application/price-list/price-list.controller.ts` (reuses `common/dto/pricelist/pricelist.serializer.ts` updated in Task A3) + service + Bruno.
- [ ] **Step 5** — `application/purchase-order/purchase-order.controller.ts` + `common/dto/purchase-order/purchase-order.serializer.ts` (`PurchaseOrderListItemResponseSchema`) + service + Bruno. Default root-only paths.
- [ ] **Step 6** — `cd apps/backend-gateway && bun run check-types` → exits 0.
- [ ] **Step 7** — Commit:

```bash
git commit -m "feat(audit): enrich list for application batch 2 (inventory-adjustment, news, price-list-template, price-list, purchase-order)"
```

---

### Task B3: Application list batch 3 — purchase-request-template, request-for-pricing, stock-in-detail, stock-in

- [ ] **Step 1** — `application/purchase-request-template/purchase-request-template.controller.ts` + `common/dto/purchase-request-template/purchase-request-template.serializer.ts` + service + Bruno.
- [ ] **Step 2** — `application/request-for-pricing/request-for-pricing.controller.ts` + `common/dto/request-for-pricing/request-for-pricing.serializer.ts` + service + Bruno.
- [ ] **Step 3** — `application/stock-in-detail/stock-in-detail.controller.ts` + `common/dto/stock-in/...` (the detail line-item list serializer) + service + Bruno.
- [ ] **Step 4** — `application/stock-in/stock-in.controller.ts` (reuses `common/dto/stock-in/stock-in.serializer.ts`) + service + Bruno.
- [ ] **Step 5** — `cd apps/backend-gateway && bun run check-types` → exits 0.
- [ ] **Step 6** — Commit:

```bash
git commit -m "feat(audit): enrich list for application batch 3 (purchase-request-template, request-for-pricing, stock-in/-detail)"
```

---

### Task B4: Application list batch 4 — stock-out-detail, stock-out, tax-profile, vendor-product

- [ ] **Step 1** — `application/stock-out-detail/stock-out-detail.controller.ts` + list serializer + service + Bruno.
- [ ] **Step 2** — `application/stock-out/stock-out.controller.ts` + `common/dto/stock-out/stock-out.serializer.ts` + service + Bruno.
- [ ] **Step 3** — `application/tax-profile/tax-profile.controller.ts` (reuses `common/dto/tax-profile/tax-profile.serializer.ts`) + service + Bruno.
- [ ] **Step 4** — `application/vendor-product/vendor-product.controller.ts` + list serializer + service + Bruno.
- [ ] **Step 5** — `cd apps/backend-gateway && bun run check-types` → exits 0.
- [ ] **Step 6** — Commit:

```bash
git commit -m "feat(audit): enrich list for application batch 4 (stock-out/-detail, tax-profile, vendor-product)"
```

---

## Phase C — Platform rollout (≈7 list endpoints, 2 batches)

### Task C1: Platform list batch 1 — application-permission, application-role, platform_business-unit, platform_cluster

- [ ] **Step 1** — `platform/application-permission/application-permission.controller.ts` + list serializer + service (`apps/micro-cluster/src/...`) + `apps/bruno/carmen-inventory/platform/application-permission/01 - Get All ...bru`.
- [ ] **Step 2** — `platform/application-role/application-role.controller.ts` + list serializer + service + Bruno.
- [ ] **Step 3** — `platform/platform_business-unit/platform_business-unit.controller.ts` + `common/dto/business-unit/business-unit.serializer.ts` (`<X>ListItemResponseSchema`) + service + Bruno.
- [ ] **Step 4** — `platform/platform_cluster/platform_cluster.controller.ts` + `common/dto/cluster/cluster.serializer.ts` + service + Bruno.
- [ ] **Step 5** — `cd apps/backend-gateway && bun run check-types` → exits 0.
- [ ] **Step 6** — Commit:

```bash
git commit -m "feat(audit): enrich list for platform batch 1 (application-permission, application-role, platform_business-unit, platform_cluster)"
```

---

### Task C2: Platform list batch 2 — platform_report-template, platform_user-business-unit, platform_user-cluster

- [ ] **Step 1** — `platform/platform_report-template/platform_report-template.controller.ts` + list serializer + service + Bruno.
- [ ] **Step 2** — `platform/platform_user-business-unit/platform_user-business-unit.controller.ts` + list serializer + service + Bruno.
- [ ] **Step 3** — `platform/platform_user-cluster/platform_user-cluster.controller.ts` + list serializer + service + Bruno.
- [ ] **Step 4** — `cd apps/backend-gateway && bun run check-types` → exits 0.
- [ ] **Step 5** — Commit:

```bash
git commit -m "feat(audit): enrich list for platform batch 2 (report-template, user-business-unit, user-cluster)"
```

---

## Final verification

### Task FV1: Audit complete coverage + smoke check

- [ ] **Step 1 — Confirm every list handler has `@EnrichAuditUsers`**

```bash
for f in apps/backend-gateway/src/config/*/*.controller.ts \
         apps/backend-gateway/src/application/*/*.controller.ts \
         apps/backend-gateway/src/platform/*/*.controller.ts; do
  if grep -qE "@Get\(\)" "$f" \
     && grep -q "@EnrichAuditUsers\b" "$f" \
     && [ "$(grep -c '@EnrichAuditUsers' "$f")" -lt "$(grep -cE '^\s*@Get\(' "$f")" ]; then
    echo "PARTIAL: $f"
  fi

  if grep -qE "^\s*@Get\(\)\s*$" "$f" && ! grep -q "@EnrichAuditUsers\b" "$f"; then
    echo "MISSING: $f"
  fi
done
```

Expected: prints only files explicitly skipped (e.g., `dashboard.controller.ts` if its list endpoint returns aggregated metrics without audit fields). If anything else prints, go back and apply the canonical pattern to that controller.

- [ ] **Step 2 — Confirm no leaked old-shape audit fields in any list serializer**

```bash
grep -rln "ListItemResponseSchema" apps/backend-gateway/src/common/dto | while read f; do
  if grep -E "created_at\s*:|created_by_id\s*:|updated_at\s*:|updated_by_id\s*:|deleted_at\s*:|deleted_by_id\s*:" "$f" >/dev/null 2>&1; then
    echo "STILL HAS RAW AUDIT FIELDS: $f"
  fi
done
```

Expected: no output. If any file prints, the corresponding `<X>ListItemResponseSchema` still references raw audit fields — go fix it.

- [ ] **Step 3 — Final typecheck across the gateway**

```bash
cd apps/backend-gateway && bun run check-types
```

Expected: exits 0.

- [ ] **Step 4 — Lint (catches unused imports from removed timestamp fields)**

```bash
cd apps/backend-gateway && bun run lint
```

Expected: exits 0 (warnings ok, errors must be zero).

- [ ] **Step 5 — Bruno sync dry-run**

```bash
bun run bruno:sync:dry
```

Expected: no `add`/`archive` for the controllers we touched (we only modified existing endpoint docs; URLs unchanged). Some `update` lines are normal.

- [ ] **Step 6 — Manual smoke (one per phase)**

Start gateway + micro-cluster + micro-business locally:

```bash
bun run dev
```

Run these Bruno requests and verify each response's first `data[]` item contains an `audit` object in the new shape; verify a list with mixed records demonstrates the omit-on-null rule (i.e., some items have only `audit.created`):

  - Phase A: `apps/bruno/carmen-inventory/config/credit-term/01 - Get All Credit Terms.bru`
  - Phase B: `apps/bruno/carmen-inventory/procurement/purchase-order/01 - Get All Purchase Orders.bru`
  - Phase C: `apps/bruno/carmen-inventory/platform/cluster/01 - Get All Clusters.bru`

Acceptance:
- `data[].audit.created.{at,id,name}` present and resolved (or `name: "Unknown"` for missing users)
- `data[].audit.deleted` absent for non-deleted records
- `data[].created_at`, `data[].created_by_id`, etc. **not** present on items
- HTTP status 200 with `paginate` envelope intact

If the manual smoke uncovers a regression, fix in the relevant phase's batch and ship a new commit (do not amend).

- [ ] **Step 7 — No commit needed for verification**

---

## Out of scope (do **not** implement here)

- Tenant-schema endpoints under `apps/micro-business/src/tenant/*`
- Persistent caching (Redis)
- Wildcard path syntax (`items.*.children`)
- Nested `paths` for list endpoints (root only — `paths: ['']`)
- create / update / delete enrichment
- Automated tests (per user preference; manual smoke + typecheck only)
- Updating controllers whose list endpoint does not return audited entities (e.g. dashboard metrics) — skip explicitly and note in batch commit
