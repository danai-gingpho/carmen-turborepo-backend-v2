# List Audit User Enrichment

**Status:** Approved (design)
**Date:** 2026-04-30
**Owner:** Carmen Backend
**Scope:** `apps/backend-gateway` (config, application, platform) **list** endpoints, plus a one-time redesign of the shared `audit` shape used by both list and `findById` endpoints.

## Goal

Apply `@EnrichAuditUsers()` to every `findAll` / list endpoint that has a corresponding `findById` already enriched (≈54 controllers across `config`, `application`, `platform`), so that list responses return a unified `audit` object resolving the `created / updated / deleted` user IDs into `{ id, name }` from the platform `tb_user` table.

This rollout also redesigns the existing `audit` shape (introduced for `findById` in `2026-04-28-findbyid-audit-user-enrichment-design.md`) into a more compact, kind-grouped structure that drops null pairs.

## Non-goals

- Tenant-schema endpoints under `apps/micro-business/src/tenant/*`
- Persistent caching (Redis) — in-memory cache only
- Wildcard path syntax (`items.*.children`) — not used in list rollout
- Nested `paths` (e.g., `paths: ['', 'items']`) for list — root only
- create / update / delete endpoint enrichment
- Automated unit/e2e tests for this rollout (per project preference; smoke checks only)

## Decisions (from brainstorming)

| Question | Decision |
|---|---|
| Scope | All ≈54 list endpoints that mirror enriched `findById` controllers (config + application + platform) |
| Audit shape | Redesigned: `audit: { created?, updated?, deleted? }`, each entry `{ at?, id?, name? }` |
| Null handling | If both `*_at` and `*_by_id` are null → omit `audit.<kind>`. If all 3 kinds omitted → omit `audit`. |
| System action (`*_at` set + `*_by_id` null) | `{ at }` (omit `id` + `name`) |
| Rare inverse (`*_at` null + `*_by_id` set) | `{ id, name }` (omit `at`) |
| Unknown user (id present, not in tb_user) | `{ at, id, name: "Unknown" }` |
| Pagination | Send all unique IDs in one TCP call; rely on existing LRU+TTL cache |
| Decorator paths | Default `paths: ['']`; nested embedded objects (e.g. `tb_vendor`) NOT enriched |
| Bruno + Swagger | Updated per controller in each batch |
| Rollout | Mirror findById phasing: Phase A (config), B (application), C (platform); 5-7 controllers/batch |
| micro-business | Each list service must include all 6 audit fields in Prisma `select` (or use no `select`) |
| Consistency | Behavior change is unified — both new list endpoints AND existing findById endpoints adopt the new shape (Sprint 0 = breaking change to findById response shape). |

## Architecture

Reuses the existing infrastructure shipped with the findById rollout. No new components.

```
Client → backend-gateway → micro-cluster → Platform DB (tb_user)
              ↑
              ├── EnrichAuditUsersContextInterceptor (existing global)
              └── BaseHttpController.respond(stdResponse)
                    └── EnrichmentService.enrichIfRequested(stdResponse.data)
                          ├── collectTargetsByPaths(payload, [''])    // root array → iterate each item
                          ├── UserNameCacheService (existing LRU+TTL)
                          ├── UserNameResolverService (existing TCP)
                          └── mutateToAuditShape(target, nameMap)     // ← BEHAVIOR CHANGE in Sprint 0
```

**Why no new component is needed**
- `collectTargetsByPaths(payload, [''])` already iterates each element when the root payload is an array (`apps/backend-gateway/src/common/enrichment/audit-shape.ts:36-44`).
- `BaseHttpController.respond()` already passes `stdResponse.data` to `enrichIfRequested()`. For paginated responses produced by `StdResponse.successPaginated(...)`, `data` IS the array of items (`apps/backend-gateway/src/common/std-response/std-response.ts:42-54`).
- `UserNameCacheService` (LRU 10,000 entries, TTL 60s) absorbs list workload well: list items typically share a small set of `created_by` values (e.g. batch imports), so dedup + cache yield a high hit rate.

**Single behavior change** (Sprint 0): `mutateToAuditShape()` is rewritten to produce the redesigned `{ created, updated, deleted }` shape and to omit pairs whose `*_at` and `*_by_id` are both null.

## Output shape

### Input from `micro-business` (paginated list response)

```json
{
  "data": [
    {
      "id": "ct-1",
      "name": "Net 30",
      "value": 30,
      "is_active": true,
      "created_at": "2026-04-01T10:00:00Z",
      "created_by_id": "u1",
      "updated_at": "2026-04-15T08:30:00Z",
      "updated_by_id": "u2",
      "deleted_at": null,
      "deleted_by_id": null
    },
    {
      "id": "ct-2",
      "name": "COD",
      "value": 0,
      "is_active": true,
      "created_at": "2026-04-02T09:00:00Z",
      "created_by_id": null,
      "updated_at": null,
      "updated_by_id": null,
      "deleted_at": null,
      "deleted_by_id": null
    }
  ],
  "paginate": { "total": 2, "page": 1, "perpage": 100, "pages": 1 },
  "status": 200,
  "success": true,
  "message": "Success",
  "timestamp": "..."
}
```

### Output after enrichment

```json
{
  "data": [
    {
      "id": "ct-1",
      "name": "Net 30",
      "value": 30,
      "is_active": true,
      "audit": {
        "created": {
          "at": "2026-04-01T10:00:00Z",
          "id": "u1",
          "name": "John Doe"
        },
        "updated": {
          "at": "2026-04-15T08:30:00Z",
          "id": "u2",
          "name": "Jane Smith"
        }
      }
    },
    {
      "id": "ct-2",
      "name": "COD",
      "value": 0,
      "is_active": true,
      "audit": {
        "created": {
          "at": "2026-04-02T09:00:00Z"
        }
      }
    }
  ],
  "paginate": { "total": 2, "page": 1, "perpage": 100, "pages": 1 },
  "status": 200,
  "success": true,
  "message": "Success",
  "timestamp": "..."
}
```

### Transformation rules (apply to BOTH list and findById)

| Source | `audit.<kind>` |
|---|---|
| `*_at` set, `*_by_id` set, resolved | `{ at, id, name }` |
| `*_at` set, `*_by_id` set, id not in `tb_user` | `{ at, id, name: "Unknown" }` |
| `*_at` set, `*_by_id` null (system action) | `{ at }` |
| `*_at` null, `*_by_id` set (rare/data-quality) | `{ id, name }` |
| `*_at` null, `*_by_id` null | **omit `audit.<kind>` key** |

Object-level rules:
- Original raw fields (`created_at`, `created_by_id`, `updated_at`, `updated_by_id`, `deleted_at`, `deleted_by_id`) are **always** removed from output.
- If the object has none of those 6 raw fields → no `audit` key is added (do not pollute).
- If all 3 kinds (`created`, `updated`, `deleted`) are omitted by the null-pair rule → no `audit` key is added.

## Schema (Zod) and Swagger DTO

### Shared `AuditSchema`

**File:** `apps/backend-gateway/src/common/dto/audit/audit.dto.ts`

```ts
import { z } from 'zod';

export const AuditEntrySchema = z.object({
  at: z.string().datetime().optional(),
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

The previously exported `AuditUserSchema` / `AuditUserDto` are removed (subsumed by `AuditEntrySchema`/`AuditEntryDto`).

### Shared `AuditDto` (Swagger)

```ts
import { ApiProperty } from '@nestjs/swagger';

export class AuditEntryDto {
  @ApiProperty({ type: String, format: 'date-time', required: false })
  at?: string;

  @ApiProperty({ required: false })
  id?: string;

  @ApiProperty({ required: false })
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
```

### Per-entity list serializer

Pattern (apply to every `<X>ListItemResponseSchema`):

**Before:**
```ts
export const CreditTermListItemResponseSchema = CreditTermResponseSchema;
// or:
export const CreditTermListItemResponseSchema = z.object({
  id: z.string(),
  // ... entity fields
  created_at: z.coerce.date().optional(),
});
```

**After:**
```ts
export const CreditTermListItemResponseSchema = CreditTermResponseSchema
  .omit({ created_at: true, updated_at: true })
  .extend({ audit: AuditSchema.optional() });
// or, if standalone:
export const CreditTermListItemResponseSchema = z.object({
  id: z.string(),
  // ... entity fields (no raw audit fields)
  audit: AuditSchema.optional(),
});
```

Fields to remove from list item shape (if currently present):
```
created_at, created_by_id, updated_at, updated_by_id, deleted_at, deleted_by_id
```

Replace with:
```
audit: AuditSchema.optional()
```

`<X>DetailResponseSchema` for `findById` already extends with `audit: AuditSchema.optional()` — no per-controller serializer change needed for findById; only the underlying `AuditSchema` definition changes (Sprint 0).

## Implementation

### 1) `mutateToAuditShape` rewrite

**File:** `apps/backend-gateway/src/common/enrichment/audit-shape.ts`

```ts
const KIND_MAP = [
  { key: 'created', at: 'created_at', byId: 'created_by_id' },
  { key: 'updated', at: 'updated_at', byId: 'updated_by_id' },
  { key: 'deleted', at: 'deleted_at', byId: 'deleted_by_id' },
] as const;

export function mutateToAuditShape(
  target: EnrichmentTarget,
  nameMap: Map<string, string | null>,
): void {
  const hasAnyAuditField =
    AUDIT_AT_FIELDS.some(f => f in target) ||
    AUDIT_BY_ID_FIELDS.some(f => f in target);
  if (!hasAnyAuditField) return;

  const audit: Record<string, { at?: string; id?: string; name?: string }> = {};
  let hasAnyKind = false;

  for (const { key, at, byId } of KIND_MAP) {
    const atVal = target[at] as Date | string | null | undefined;
    const byIdVal = target[byId] as string | null | undefined;

    // Always strip raw fields
    delete target[at];
    delete target[byId];

    const atIsNull = atVal == null;
    const byIdIsNull = byIdVal == null;
    if (atIsNull && byIdIsNull) continue;

    const entry: { at?: string; id?: string; name?: string } = {};
    if (!atIsNull) {
      entry.at = atVal instanceof Date ? atVal.toISOString() : (atVal as string);
    }
    if (!byIdIsNull) {
      entry.id = byIdVal as string;
      const name = nameMap.get(byIdVal as string);
      entry.name = name == null ? 'Unknown' : name;
    }

    audit[key] = entry;
    hasAnyKind = true;
  }

  if (hasAnyKind) target.audit = audit;
}
```

### 2) Controller — add decorator to list handler

Pattern (apply to every `@Get()` list handler in scope):

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
@EnrichAuditUsers()                        // ← new line
@HttpCode(HttpStatus.OK)
```

Decorator placement: after `@Serialize(...)`, before `@HttpCode(...)` — same convention as findById rollout. Add `EnrichAuditUsers` to the existing `@/common` import group (it is already re-exported there).

### 3) Per-entity serializer change

Apply the pattern in "Per-entity list serializer" above.

### 4) micro-business list service

Verify `apps/micro-business/src/<domain>/<x>/<x>.service.ts`:
- If `findAll` uses `prisma.<x>.findMany({ where, orderBy, ...paginate })` without `select` → no change.
- If it uses `select: {...}` that constrains the columns → ensure all 6 audit columns are included:
  ```
  created_at, created_by_id, updated_at, updated_by_id, deleted_at, deleted_by_id
  ```
- If it pipes through a mapper helper (e.g. `mapToListItem`) that picks fields → include the 6 audit fields in the mapper.

### 5) Swagger response example + Bruno docs sample

For each list controller in scope:
- Update the `@ApiResponse` example (or response DTO) to use the new nested shape (`audit: { created: {...}, updated?: {...}, deleted?: {...} }`).
- Update the corresponding `apps/bruno/carmen-inventory/<domain>/<x>/01 - Get All <X>.bru` `docs:` section sample response. The `bun run bruno:sync` tool only syncs endpoint structure; the docs sample must be edited manually.

## Sprint 0 — Infra change + findById refresh

Sprint 0 ships the `mutateToAuditShape` rewrite plus a **breaking refresh** of the 54 already-shipped findById endpoints to the new shape.

Tasks (single commit):
1. Rewrite `mutateToAuditShape` (above).
2. Replace `AuditSchema` + `AuditDto` (above); remove `AuditUserSchema` / `AuditUserDto` exports.
3. Refresh all 54 findById Bruno docs samples — convert old
   `{ created_at, created_by, updated_at, updated_by, deleted_at, deleted_by }`
   to new `{ created, updated, deleted }` nested shape, and apply the null-pair omit rule.
4. Refresh all 54 findById Swagger response examples in the same way.
5. Smoke check: `bun run check-types` from gateway, then exercise the pilot
   endpoint (`GET /api/config/<bu>/department/:id`) in Bruno and confirm new
   shape.

Commit message: `refactor(audit): redesign audit shape to {created,updated,deleted}.{at,id,name}`.

This is a **breaking change** to the response shape of 54 already-shipped endpoints. Frontend code that reads `audit.created_by.name` must migrate to `audit.created.name` (and equivalently for `updated` / `deleted`). Frontend coordination must happen alongside this commit.

## Rollout phases

Mirrors the findById rollout structure (`docs/superpowers/plans/2026-04-30-findbyid-audit-rollout.md`).

### Phase A — config domain (≈25 list endpoints, 4 batches)

Mirror existing findById config batches. Sample grouping (final composition adjusts to actual controller list at execution time):

- **Batch A1** (~6 controllers): `adjustment-type`, `application_role`, `credit-note-reason`, `credit_term`, `currencies`, `delivery-point`
- **Batch A2** (~6 controllers): `department-user`, `exchange-rate`, `extra_cost_type`, `locations`, `price-list`, `product-category`
- **Batch A3** (~6 controllers): `product-item-group`, `product-sub-category`, `products`, `recipe-category`, `recipe-cuisine`, `recipe-equipment-category`
- **Batch A4** (~6-7 controllers): `recipe-equipment`, `recipe`, `running-code`, `tax_profile`, `unit_comment`, `units`, `vendor_business_type`, `vendors`, `workflows`

Commit per batch: `feat(audit): enrich list for config batch <N> (<short-list>)`.

### Phase B — application domain (≈19 list endpoints, ~4 batches)

Mirror findById application batches. Includes (non-exhaustive): `activity-log`, `credit-note`, `dashboard`, `department`, `inventory-adjustment`, `news`, `price-list-template`, `purchase-order`, `purchase-request-template`, `request-for-pricing`, `stock-in/-detail`, `stock-out/-detail`, `tax-profile`, `vendor-product`.

### Phase C — platform domain (≈7 list endpoints, ~2 batches)

- **Batch C1**: `application-permission`, `application-role`, `platform_business-unit`, `platform_cluster`
- **Batch C2**: `report-template`, `user-business-unit`, `user-cluster`

### Per-batch checklist (canonical)

For each controller `<X>` in a batch:

- [ ] Add `EnrichAuditUsers` import in controller (already re-exported from `@/common`).
- [ ] Add `@EnrichAuditUsers()` on the `@Get()` list handler.
- [ ] Update `<X>ListItemResponseSchema` — swap raw audit fields for `audit: AuditSchema.optional()`.
- [ ] Update Swagger response DTO + example for the list endpoint.
- [ ] Verify (and adjust if needed) the matching `micro-business` list service so that `select` includes all 6 audit columns.
- [ ] Update Bruno `01 - Get All <X>.bru` `docs:` sample.
- [ ] `bun run check-types` from gateway.
- [ ] Single commit: `feat(audit): enrich list for <phase> batch <N> (<short-list>)`.

## Edge cases

| Case | Behavior |
|---|---|
| Empty list (`data: []`) | no targets collected; pass-through |
| List item has no audit fields at all | object passes through unchanged |
| List item has all 6 audit fields = null | no `audit` key added |
| Mixed nulls (e.g., only `created_*` set) | `audit` has only `created`; other kinds omitted |
| Same `*_by_id` repeated across many items | dedup before TCP (existing `uniqueAuditUserIds`); cache hits on repeats |
| User soft-deleted in `tb_user` | resolver returns the formatted name (existing behavior) |
| Unknown user id | `audit.<kind>.name = "Unknown"` |
| TCP timeout / connection error to `CLUSTER_SERVICE` | log warn; unresolved IDs become `name: "Unknown"`; request still succeeds |
| Resolver throws | catch in `EnrichmentService.enrichIfRequested`; return original payload |
| Pagination wrapper with `data: null` (error path) | `enrichIfRequested` returns input unchanged |
| Root is array (paginated) | `collectTargetsByPaths` iterates each element |
| List response not paginated (raw array) | same: iterates root array |

**Principle:** enrichment must never fail the request — degrade gracefully.

## Cache behavior under list load

Reuse existing `UserNameCacheService` (LRU 10,000 entries, TTL 60s).

- Typical list (100 items × 3 by_id fields = 300 lookups) → after dedup, often only ~5-20 unique IDs (a few users typically own most records in a batch).
- Cache hit rate is *higher* on list workloads than on findById — same creator across items.
- Worst case (perpage=500, all unique IDs): 1500 unique lookups in one TCP call. Postgres `WHERE id IN (...)` handles this comfortably; NestJS TCP message size default is 100 MB.
- TTL 60s: a freshly-renamed user appears in list responses within 60 seconds — acceptable.
- No cache size or TTL change required.

## Migration / rollout principle

- Each batch is an opt-in change (decorator on a single handler) and is independently reversible by removing the decorator.
- Sprint 0 is **not** opt-in — it changes the shape produced for any caller of `mutateToAuditShape`, which means all 54 findById endpoints adopt the new shape simultaneously. Coordinate frontend rollout against this commit.

## Testing

Per project preference (see memory `feedback_skip_tests.md`), this rollout does not add automated unit/e2e tests. Verification is by smoke check after each batch.

**Per batch:** `bun run check-types` from `apps/backend-gateway`.

**Manual QA after each phase:**
- Phase A: open one list endpoint per major sub-domain (e.g. `/api/config/<bu>/credit-term`, `/api/config/<bu>/locations`) in Bruno; verify `audit.created.name` resolves and the null-pair omit rule holds.
- Phase B: one list per major application sub-domain (procurement, stock, recipe-mutation pipeline).
- Phase C: one list per platform area.

**Sprint 0 specific:** before merging, run the existing findById pilot (`GET /api/config/<bu>/department/:id`) and confirm new shape end-to-end.

## Out of scope (YAGNI)

- Persistent cache (Redis)
- Tenant-schema endpoints
- Wildcard path syntax
- Nested `paths` for list (root only)
- create / update / delete enrichment
- Automated test additions

## References

- Spec: `docs/superpowers/specs/2026-04-28-findbyid-audit-user-enrichment-design.md` (Sprint 1 infrastructure)
- Plan: `docs/superpowers/plans/2026-04-30-findbyid-audit-rollout.md` (findById rollout pattern, batches)
- Code: `apps/backend-gateway/src/common/enrichment/audit-shape.ts` (function under change)
- Code: `apps/backend-gateway/src/common/dto/audit/audit.dto.ts` (schema + DTO under redesign)
