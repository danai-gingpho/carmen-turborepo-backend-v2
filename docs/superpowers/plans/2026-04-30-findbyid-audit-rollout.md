# FindById Audit Enrichment — Rollout Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply `@EnrichAuditUsers()` to every remaining `findById` (`@Get(':id')`) handler in `apps/backend-gateway` (config + application + platform), update each response Zod schema to use `audit: AuditSchema.optional()`, and refresh the corresponding Bruno docs sample response.

**Architecture:** Sprint 1 already shipped the infrastructure (decorator, ALS interceptor, `EnrichmentService`, `UserNameResolverService`, `UserNameCacheService`, `BaseHttpController.respond()` integration, `micro-cluster` `user.resolveByIds` TCP handler, shared `AuditSchema` + `AuditDto`/`AuditUserDto`). Pilot endpoint `config_departments.findOne` is live. This plan only rolls out the decorator + per-entity DTO/Bruno changes to the remaining 52 controllers.

**Tech Stack:** NestJS 11, TypeScript, Zod (`nestjs-zod`), Bruno.

**Spec:** `docs/superpowers/specs/2026-04-28-findbyid-audit-user-enrichment-design.md`
**Sprint 1 plan (already executed):** `docs/superpowers/plans/2026-04-28-findbyid-audit-user-enrichment.md`

---

## Status before starting

Already shipped (do **not** re-implement):

- `apps/backend-gateway/src/common/decorators/enrich-audit-users.decorator.ts`
- `apps/backend-gateway/src/common/context/enrich-audit-users.context.ts`
- `apps/backend-gateway/src/common/interceptors/enrich-audit-users-context.interceptor.ts`
- `apps/backend-gateway/src/common/enrichment/{audit-shape,user-name-cache.service,user-name-resolver.service,enrichment.service,enrichment.module}.ts`
- `apps/backend-gateway/src/common/dto/audit/audit.dto.ts` (`AuditSchema`, `AuditDto`, `AuditUserDto`)
- `apps/backend-gateway/src/common/http/base-http-controller.ts` (async `respond()` + static locator)
- `apps/backend-gateway/src/app.module.ts` (registers `EnrichmentModule`, global `EnrichAuditUsersContextInterceptor`, sets `BaseHttpController.enrichmentService` in `onApplicationBootstrap`)
- `apps/micro-cluster/src/cluster/user/{user.service.ts,user.controller.ts,format-user-name.ts}` (TCP `{ cmd: 'user.resolveByIds', service: 'user' }`)
- Pilot: `config_departments.findOne` + `DepartmentDetailResponseSchema` + Bruno `config/departments/02 - Get Department.bru`

Per user preference, this plan **does not write automated tests**. Each batch ends with a `bun run check-types` smoke check from the gateway and one git commit.

---

## Canonical change pattern (apply to every controller in Phases A–C)

For one controller `<X>` whose findById uses Zod schema `<X>DetailResponseSchema`:

### 1. Controller — add the decorator

**File:** `apps/backend-gateway/src/<domain>/<x>/<x>.controller.ts`

In the `@/common` import group, add `EnrichAuditUsers`. On the `@Get(':id')` handler, add `@EnrichAuditUsers()` directly above `@HttpCode(...)` (placement: right after the `@Serialize(...)` line, so the decorator stack reads `Get → UseGuards(AppIdGuard) → Serialize → EnrichAuditUsers → HttpCode → ApiVersionMinRequest → ApiOperation`).

```ts
// before
@Get(':id')
@UseGuards(new AppIdGuard('<x>.findOne'))
@Serialize(<X>DetailResponseSchema)
@HttpCode(HttpStatus.OK)

// after
@Get(':id')
@UseGuards(new AppIdGuard('<x>.findOne'))
@Serialize(<X>DetailResponseSchema)
@EnrichAuditUsers()
@HttpCode(HttpStatus.OK)
```

If `EnrichAuditUsers` is not yet exported from `@/common`, also extend the import block in `@/common/index.ts` — but it already is (re-exported via `decorators`).

### 2. Serializer — swap timestamp/by_id fields for `audit`

**File:** `apps/backend-gateway/src/common/dto/<x>/<x>.serializer.ts`

Two scenarios:

**(a) `<X>DetailResponseSchema` is its own `z.object({...})`** — remove these six fields if present, then add `audit: AuditSchema.optional()`:

```
created_at, created_by_id, updated_at, updated_by_id, deleted_at, deleted_by_id
```

```ts
import { AuditSchema } from '../audit/audit.dto';

export const <X>DetailResponseSchema = z.object({
  id: z.string(),
  // ... entity-specific fields, unchanged
  audit: AuditSchema.optional(),
});
```

**(b) `<X>DetailResponseSchema = <X>ResponseSchema` (alias)** — split it. Keep `ListItemResponseSchema = <X>ResponseSchema` (list endpoints are out of scope for enrichment). Make `DetailResponseSchema` its own object:

```ts
// before
export const <X>DetailResponseSchema = <X>ResponseSchema;

// after
export const <X>DetailResponseSchema = <X>ResponseSchema
  .omit({ created_at: true, updated_at: true })
  .extend({ audit: AuditSchema.optional() });
```

Use `.omit({...})` with whichever of the six fields are actually defined on the base schema. List/mutation schemas are untouched.

Some entities have a `<X>BaseSchema.passthrough()` (e.g., `extra-cost-type`). For passthrough, do the same: `.omit({...}).extend({ audit: AuditSchema.optional() })`.

### 3. Bruno — refresh sample response

**File:** `apps/bruno/carmen-inventory/<bruno-folder>/02 - Get <Entity>.bru` (file naming varies — search by `get` / `By id` / `Get <Entity>` keywords inside the entity's bruno folder)

Inside the `docs { ... ### Sample Response ... }` block, replace the inline JSON sample so that the `data` object shows the new `audit` shape exactly like the `config/departments/02 - Get Department.bru` reference:

```json
{
  "data": {
    "id": "...",
    // ... entity fields ...
    "audit": {
      "created_at": "2026-04-29T08:30:00.000Z",
      "created_by": { "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890", "name": "John Doe" },
      "updated_at": "2026-04-29T08:30:00.000Z",
      "updated_by": { "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567891", "name": "Jane Smith" },
      "deleted_at": null,
      "deleted_by": null
    }
  },
  "paginate": null,
  "status": 200,
  "success": true,
  "message": "Success",
  "timestamp": "2026-04-29T08:30:00.000Z"
}
```

Remove any `created_at`, `updated_at`, `deleted_at`, `created_by_id`, `updated_by_id`, `deleted_by_id` keys from the `data` object. Leave the rest of the file (meta, get, headers, auth, query, params, error tables) untouched.

If the Bruno file's findById sample does **not** currently include any audit timestamps, add the `audit` block anyway so consumers see what to expect.

### 4. Nested arrays — when to extend `paths`

Default `@EnrichAuditUsers()` is root only. Extend paths only when the service's findOne response **already** embeds child entities that themselves have their own `created_at / created_by_id` etc. and you want those resolved too.

```ts
@EnrichAuditUsers({ paths: ['', 'items'] })          // root + each items[]
@EnrichAuditUsers({ paths: ['', 'items.attachments'] })
```

If unsure, leave it at default (`@EnrichAuditUsers()`); we can extend later. Out of scope: list/findAll, create, update, delete; tenant-schema endpoints in `apps/micro-business`.

### 5. Per-batch verification

At the end of each batch:

```bash
cd apps/backend-gateway
bun run check-types
```

Expected: exits 0 (no TypeScript errors). If a serializer split breaks an unrelated reference, fix before committing.

### 6. Commit

One commit per batch:

```bash
git add apps/backend-gateway/src apps/bruno/carmen-inventory
git commit -m "feat(audit): enrich findById responses for <batch label> (#<N>)"
```

---

## Phase A — Config rollout (27 controllers, 6 batches)

### Task A1: Config batch 1 — adjustment-type, application_role, credit-note-reason, credit_term, currencies

**Files per controller (apply canonical pattern):**

- [ ] **Step 1** — `apps/backend-gateway/src/config/config_adjustment-type/config_adjustment-type.controller.ts` + `apps/backend-gateway/src/common/dto/<adjustment-type-or-equivalent>/*.serializer.ts` + matching Bruno file under `apps/bruno/carmen-inventory/config/`.
- [ ] **Step 2** — `apps/backend-gateway/src/config/config_application_role/config_application_role.controller.ts` + serializer + Bruno.
- [ ] **Step 3** — `apps/backend-gateway/src/config/config_credit-note-reason/config_credit-note-reason.controller.ts` + `apps/backend-gateway/src/common/dto/credit-note-reason/credit-note-reason.serializer.ts` + Bruno.
- [ ] **Step 4** — `apps/backend-gateway/src/config/config_credit_term/config_credit_term.controller.ts` + `apps/backend-gateway/src/common/dto/credit-term/credit-term.serializer.ts` (alias case — split detail) + Bruno.
- [ ] **Step 5** — `apps/backend-gateway/src/config/config_currencies/config_currencies.controller.ts` + `apps/backend-gateway/src/common/dto/currency/currency.serializer.ts` (alias case — split detail; controller currently uses `CurrencyResponseSchema` for findOne, switch to `CurrencyDetailResponseSchema` after split) + Bruno.
- [ ] **Step 6** — `cd apps/backend-gateway && bun run check-types` → exits 0.
- [ ] **Step 7** — Commit:

```bash
git add apps/backend-gateway/src apps/bruno/carmen-inventory
git commit -m "feat(audit): enrich findById for config batch 1 (adjustment-type, application_role, credit-note-reason, credit_term, currencies)"
```

---

### Task A2: Config batch 2 — delivery-point, department-user, exchange-rate, extra_cost_type, locations

- [ ] **Step 1** — `config_delivery-point.controller.ts` + `common/dto/delivery-point/delivery-point.serializer.ts` + Bruno.
- [ ] **Step 2** — `config_department-user.controller.ts` + serializer + Bruno. (Note: department-user findOne returns user-with-department association, may already include user info — add audit on the wrapper object only.)
- [ ] **Step 3** — `config_exchange-rate.controller.ts` + `common/dto/exchange-rate/exchange-rate.serializer.ts` (`.extend()` case) + Bruno.
- [ ] **Step 4** — `config_extra_cost_type.controller.ts` + `common/dto/extra-cost-type/extra-cost-type.serializer.ts` (passthrough case) + Bruno.
- [ ] **Step 5** — `config_locations.controller.ts` + `common/dto/location/location.serializer.ts` (use `LocationDetailResponseSchema`) + Bruno.
- [ ] **Step 6** — `cd apps/backend-gateway && bun run check-types` → exits 0.
- [ ] **Step 7** — Commit:

```bash
git commit -m "feat(audit): enrich findById for config batch 2 (delivery-point, department-user, exchange-rate, extra_cost_type, locations)"
```

---

### Task A3: Config batch 3 — price-list, product-category, product-item-group, product-sub-category, products

- [ ] **Step 1** — `config_price-list.controller.ts` + `common/dto/pricelist/pricelist.serializer.ts` + Bruno.
- [ ] **Step 2** — `config_product-category.controller.ts` + `common/dto/product-category/product-category.serializer.ts` + Bruno.
- [ ] **Step 3** — `config_product-item-group.controller.ts` + `common/dto/product-item-group/product-item-group.serializer.ts` + Bruno.
- [ ] **Step 4** — `config_product-sub-category.controller.ts` + `common/dto/product-sub-category/product-sub-category.serializer.ts` + Bruno.
- [ ] **Step 5** — `config_products.controller.ts` + `common/dto/product/product.serializer.ts` (use the detail schema) + Bruno.
- [ ] **Step 6** — `cd apps/backend-gateway && bun run check-types` → exits 0.
- [ ] **Step 7** — Commit:

```bash
git commit -m "feat(audit): enrich findById for config batch 3 (price-list, product-category/item-group/sub-category, products)"
```

---

### Task A4: Config batch 4 — recipe-category, recipe-cuisine, recipe-equipment-category, recipe-equipment, recipe

Recipe entities live under `apps/micro-business/src/recipe/*` for backend logic; the gateway controllers and serializers live in `backend-gateway/src/config/config_recipe*`. Some recipe serializers may not exist under `common/dto/`; in that case the response schema lives next to the controller (`apps/backend-gateway/src/config/config_recipe*/swagger/response.ts` or similar). Locate it via `grep -rn "<X>DetailResponseSchema" apps/backend-gateway/src/`.

- [ ] **Step 1** — `config_recipe-category.controller.ts` + its detail serializer + Bruno.
- [ ] **Step 2** — `config_recipe-cuisine.controller.ts` + its detail serializer + Bruno.
- [ ] **Step 3** — `config_recipe-equipment-category.controller.ts` + its detail serializer + Bruno.
- [ ] **Step 4** — `config_recipe-equipment.controller.ts` + its detail serializer + Bruno.
- [ ] **Step 5** — `config_recipe.controller.ts` + its detail serializer + Bruno. (Recipes can have nested ingredients/steps; use root-only unless the response visibly includes children with their own audit fields.)
- [ ] **Step 6** — `cd apps/backend-gateway && bun run check-types` → exits 0.
- [ ] **Step 7** — Commit:

```bash
git commit -m "feat(audit): enrich findById for config batch 4 (recipe family)"
```

---

### Task A5: Config batch 5 — running-code, tax_profile, unit_comment, units

- [ ] **Step 1** — `config_running-code.controller.ts` + serializer + Bruno.
- [ ] **Step 2** — `config_tax_profile.controller.ts` + `common/dto/tax-profile/tax-profile.serializer.ts` + Bruno.
- [ ] **Step 3** — `config_unit_comment.controller.ts` + `common/dto/unit-comment/unit-comment.serializer.ts`. **Caveat:** comment entities historically have only `created_at`/`created_by_id` (no update/delete audit). The `mutateToAuditShape` helper handles partial fields — `audit.updated_at` and `audit.deleted_at` end up `null` and `audit.updated_by` / `audit.deleted_by` are `null`. That's fine. Bruno doc should still show the full audit block.
- [ ] **Step 4** — `config_units.controller.ts` + `common/dto/unit/unit.serializer.ts` + Bruno.
- [ ] **Step 5** — `cd apps/backend-gateway && bun run check-types` → exits 0.
- [ ] **Step 6** — Commit:

```bash
git commit -m "feat(audit): enrich findById for config batch 5 (running-code, tax_profile, unit_comment, units)"
```

---

### Task A6: Config batch 6 — vendor_business_type, vendors, workflows

- [ ] **Step 1** — `config_vendor_business_type.controller.ts` + `common/dto/vendor-business-type/vendor-business-type.serializer.ts` + Bruno.
- [ ] **Step 2** — `config_vendors.controller.ts` + `common/dto/vendor/vendor.serializer.ts` + Bruno.
- [ ] **Step 3** — `config_workflows.controller.ts` + `common/dto/workflow/workflow.serializer.ts` + Bruno.
- [ ] **Step 4** — `cd apps/backend-gateway && bun run check-types` → exits 0.
- [ ] **Step 5** — Commit:

```bash
git commit -m "feat(audit): enrich findById for config batch 6 (vendor_business_type, vendors, workflows)"
```

---

## Phase B — Application rollout (18 controllers, 4 batches)

### Task B1: Application batch 1 — activity-log, credit-note, credit-term, dashboard, department

- [ ] **Step 1** — `apps/backend-gateway/src/application/activity-log/activity-log.controller.ts` + serializer + Bruno. (Activity-log entries usually have only `created_at` / `created_by_id` — same partial-audit pattern as comments.)
- [ ] **Step 2** — `application/credit-note/credit-note.controller.ts` + `common/dto/credit-note/credit-note.serializer.ts`. Credit-note findOne returns nested `details[]`; if those details carry their own `created_by_id`/`updated_by_id` you want resolved, use `@EnrichAuditUsers({ paths: ['', 'details'] })` and adjust `CreditNoteDetailResponseSchema.details` items to include `audit: AuditSchema.optional()` and drop their per-row timestamp/by_id fields. Otherwise leave default.
- [ ] **Step 3** — `application/credit-term/credit-term.controller.ts` + reuse `common/dto/credit-term/credit-term.serializer.ts` (already split in Task A1).
- [ ] **Step 4** — `application/dashboard/dashboard.controller.ts`. Dashboard `:id` may not return an audited entity (e.g. dashboard widget); skip the decorator for any handler whose response shape lacks audit fields. If it does (e.g. dashboard config saved per BU), apply pattern.
- [ ] **Step 5** — `application/department/department.controller.ts` + reuse `common/dto/department/department.serializer.ts` (already updated in pilot).
- [ ] **Step 6** — `cd apps/backend-gateway && bun run check-types` → exits 0.
- [ ] **Step 7** — Commit:

```bash
git commit -m "feat(audit): enrich findById for application batch 1 (activity-log, credit-note, credit-term, dashboard, department)"
```

---

### Task B2: Application batch 2 — inventory-adjustment, news, price-list-template, price-list, purchase-order

- [ ] **Step 1** — `application/inventory-adjustment/inventory-adjustment.controller.ts` + serializer + Bruno. Has nested details — consider `paths: ['', 'details']`.
- [ ] **Step 2** — `application/news/news.controller.ts` + `common/dto/notification/notification.serializer.ts` (or its own news serializer if present) + Bruno.
- [ ] **Step 3** — `application/price-list-template/price-list-template.controller.ts` + `common/dto/price-list-template/price-list-template.serializer.ts` + Bruno.
- [ ] **Step 4** — `application/price-list/price-list.controller.ts` + reuse `common/dto/pricelist/pricelist.serializer.ts` (already updated in Task A3).
- [ ] **Step 5** — `application/purchase-order/purchase-order.controller.ts` + `common/dto/purchase-order/purchase-order.serializer.ts`. Purchase order has `details[]`; consider `paths: ['', 'details']`.
- [ ] **Step 6** — `cd apps/backend-gateway && bun run check-types` → exits 0.
- [ ] **Step 7** — Commit:

```bash
git commit -m "feat(audit): enrich findById for application batch 2 (inventory-adjustment, news, price-list-template, price-list, purchase-order)"
```

---

### Task B3: Application batch 3 — purchase-request-template, request-for-pricing, stock-in-detail, stock-in

- [ ] **Step 1** — `application/purchase-request-template/purchase-request-template.controller.ts` + `common/dto/purchase-request-template/purchase-request-template.serializer.ts` + Bruno.
- [ ] **Step 2** — `application/request-for-pricing/request-for-pricing.controller.ts` + `common/dto/request-for-pricing/request-for-pricing.serializer.ts`. Has `vendors[]` and possibly `items[]`; default to root only unless those details carry audit fields.
- [ ] **Step 3** — `application/stock-in-detail/stock-in-detail.controller.ts` + serializer (under `common/dto/stock-in/`) + Bruno. The detail controller returns a single line item; root only.
- [ ] **Step 4** — `application/stock-in/stock-in.controller.ts` + reuse `common/dto/stock-in/stock-in.serializer.ts`. Stock-in header has `details[]` — consider `paths: ['', 'details']`.
- [ ] **Step 5** — `cd apps/backend-gateway && bun run check-types` → exits 0.
- [ ] **Step 6** — Commit:

```bash
git commit -m "feat(audit): enrich findById for application batch 3 (purchase-request-template, request-for-pricing, stock-in/-detail)"
```

---

### Task B4: Application batch 4 — stock-out-detail, stock-out, tax-profile, vendor-product

- [ ] **Step 1** — `application/stock-out-detail/stock-out-detail.controller.ts` + serializer + Bruno.
- [ ] **Step 2** — `application/stock-out/stock-out.controller.ts` + `common/dto/stock-out/stock-out.serializer.ts`. Header with `details[]`.
- [ ] **Step 3** — `application/tax-profile/tax-profile.controller.ts` + reuse `common/dto/tax-profile/tax-profile.serializer.ts` (already updated in Task A5).
- [ ] **Step 4** — `application/vendor-product/vendor-product.controller.ts` + serializer (under `common/dto/vendor/` or its own) + Bruno.
- [ ] **Step 5** — `cd apps/backend-gateway && bun run check-types` → exits 0.
- [ ] **Step 6** — Commit:

```bash
git commit -m "feat(audit): enrich findById for application batch 4 (stock-out/-detail, tax-profile, vendor-product)"
```

---

## Phase C — Platform rollout (7 controllers, 2 batches)

### Task C1: Platform batch 1 — application-permission, application-role, platform_business-unit, platform_cluster

- [ ] **Step 1** — `platform/application-permission/application-permission.controller.ts` + serializer + Bruno (`apps/bruno/carmen-inventory/platform/application-permission/...`).
- [ ] **Step 2** — `platform/application-role/application-role.controller.ts` + serializer + Bruno.
- [ ] **Step 3** — `platform/platform_business-unit/platform_business-unit.controller.ts` + `common/dto/business-unit/business-unit.serializer.ts` (alias case — split detail). Same alias-split pattern as currency/credit-term.
- [ ] **Step 4** — `platform/platform_cluster/platform_cluster.controller.ts` + `common/dto/cluster/cluster.serializer.ts` + Bruno.
- [ ] **Step 5** — `cd apps/backend-gateway && bun run check-types` → exits 0.
- [ ] **Step 6** — Commit:

```bash
git commit -m "feat(audit): enrich findById for platform batch 1 (application-permission, application-role, platform_business-unit, platform_cluster)"
```

---

### Task C2: Platform batch 2 — platform_report-template, platform_user-business-unit, platform_user-cluster

- [ ] **Step 1** — `platform/platform_report-template/platform_report-template.controller.ts` + serializer + Bruno.
- [ ] **Step 2** — `platform/platform_user-business-unit/platform_user-business-unit.controller.ts` + serializer + Bruno.
- [ ] **Step 3** — `platform/platform_user-cluster/platform_user-cluster.controller.ts` + serializer + Bruno.
- [ ] **Step 4** — `cd apps/backend-gateway && bun run check-types` → exits 0.
- [ ] **Step 5** — Commit:

```bash
git commit -m "feat(audit): enrich findById for platform batch 2 (report-template, user-business-unit, user-cluster)"
```

---

## Final verification

### Task FV1: Audit complete coverage + smoke check

- [ ] **Step 1** — Verify every `@Get(':id')` handler in `apps/backend-gateway/src/{config,application,platform}/*/*.controller.ts` has `@EnrichAuditUsers(...)` (excluding handlers whose response is not an audited entity, e.g. dashboard widget reads):

```bash
# Each line should show the @EnrichAuditUsers decorator near a @Get(':id') route
for f in apps/backend-gateway/src/config/*/*.controller.ts \
         apps/backend-gateway/src/application/*/*.controller.ts \
         apps/backend-gateway/src/platform/*/*.controller.ts; do
  if grep -q "@Get(':id')" "$f" && ! grep -q "@EnrichAuditUsers" "$f"; then
    echo "MISSING: $f"
  fi
done
```

Expected: prints only files explicitly skipped (e.g. dashboard widget). If anything else prints, go back and apply the canonical pattern.

- [ ] **Step 2** — Final typecheck across the gateway:

```bash
cd apps/backend-gateway && bun run check-types
```

Expected: exits 0.

- [ ] **Step 3** — Lint (catches unused imports from removed timestamp fields):

```bash
cd apps/backend-gateway && bun run lint
```

Expected: exits 0 (warnings ok, errors must be zero).

- [ ] **Step 4** — Bruno sync dry-run to confirm we haven't broken collection mapping:

```bash
bun run bruno:sync:dry
```

Expected: no `add`/`archive` for the controllers we touched (we only modified existing endpoint docs, didn't rename URLs). Some `update` lines are normal.

- [ ] **Step 5** — Manual smoke (one per phase) — start gateway + micro-cluster + micro-business locally, hit one findById per phase via Bruno:
  - Phase A: `config/currencies/02 - Get Currency.bru`
  - Phase B: `purchase-order/02 - Get Purchase Order.bru`
  - Phase C: `platform/cluster/02 - Get Cluster.bru`

  Each response's `data` must contain an `audit` object with the documented shape. If a `*_by_id` is `null` (system action), the corresponding `audit.*_by` is `null`. If a user is missing in `tb_user`, `audit.*_by.name === "Unknown"`.

- [ ] **Step 6** — No commit needed for verification. If the manual smoke uncovers a regression, fix in the relevant phase's batch and follow up with a fix commit (not amend).

---

## Out of scope (do **not** implement here)

- list / findAll / create / update / delete enrichment
- tenant-schema endpoints under `apps/micro-business/src/tenant/*`
- persistent caching (Redis)
- wildcard path syntax (`items.*.children`)
- automated tests (per user preference; manual smoke + typecheck only)
