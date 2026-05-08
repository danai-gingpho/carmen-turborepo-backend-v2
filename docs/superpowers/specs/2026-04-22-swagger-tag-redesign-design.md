# Swagger Tag Taxonomy Redesign — Design

**Status:** Proposed · **Date:** 2026-04-22 · **Scope:** `apps/backend-gateway`

## 1. Goal

Redesign the OpenAPI tag taxonomy exposed by `backend-gateway` so an external
integrator who does not know the Carmen domain can navigate 144 controllers
without guesswork. Today the taxonomy mixes duplicate tags, undeclared tags,
inconsistent placement of `*-comment` controllers, and a single flat list that
forces readers to scroll through 30+ endpoints under one heading.

**Audience priority:** external integrators/partners building full-ERP
integrations (POS, accounting, HR). They need comprehensive coverage plus a
journey that reads top-to-bottom like a tutorial.

## 2. Current State

- 144 controllers across `app`, `auth`, `notification`, `platform/`,
  `config/`, and `application/`.
- 13 distinct `@ApiTags(...)` values. `Master` (22) and `Master Data` (8) are
  duplicates — only `Master Data` is declared in `main.ts`.
- Tags `SQL Query`, `Report`, `Dashboard` are used by controllers but never
  declared in `main.ts` (render without description).
- `config_recipe-equipment-category` uses
  `@ApiTags('Configuration', 'Recipe Equipment Category')` — no other
  controller uses multi-arg form.
- `*-comment` controllers are placed inconsistently: some follow parent
  domain (stock-in-comment → Inventory), some drift to `Master`
  (period-comment → Master while period → Inventory), one crosses domains
  (store-requisition-comment → Inventory while store-requisition → Procurement).
- Swagger is served through `@scalar/nestjs-api-reference` at `/swagger`
  (both HTTP and HTTPS), which natively renders the `x-tagGroups` OpenAPI
  extension.

## 3. Design Decisions (approved)

1. **Audience:** external integrators (priority) → tag names must be
   self-explanatory; ordering should follow integrator journey.
2. **Use case:** full ERP integration → comprehensive coverage across master
   data, operations, workflow, and admin.
3. **Structure:** 2-level via `x-tagGroups` (renders in Scalar; ignored
   gracefully by plain Swagger UI).
4. **Comment controllers:** merge into the same tag as the parent entity
   (e.g. `credit-note-comment` → `Procurement: Credit Notes`, alongside
   `credit-note`).
5. **Approach:** Journey-first — 9 groups in the order Getting Started →
   Platform Admin → BU Config → Procurement → Inventory → Workflow →
   Reporting → Notifications → User Profile.

## 4. Proposed Taxonomy (9 groups, 52 tags)

> Count breakdown: 2 + 9 + 12 + 9 + 8 + 3 + 5 + 1 + 3 = 52.

Tag naming pattern: `Group: Subject` (so plain Swagger UI also sorts them
in the correct group order, since Scalar uses `x-tagGroups` but older UIs do
not). `Authentication`, `App Info`, and `Notifications` stay ungrouped in
their tag name since each group contains only one tag.

### 4.1 Group — Getting Started
| Tag | Description |
|---|---|
| `Authentication` | Login, logout, password change, token refresh via Keycloak |
| `App Info` | App-level metadata, version, health |

### 4.2 Group — Platform Administration
System-wide operations. Require platform-admin privileges. Not tenant-scoped.

| Tag | Description |
|---|---|
| `Platform: Clusters` | Tenant clusters (hotel chains / franchise groups) |
| `Platform: Business Units` | BU registration, activation, subscriptions |
| `Platform: Users` | Platform-level users (cross-BU) |
| `Platform: User ↔ Cluster` | Assign users to clusters |
| `Platform: User ↔ Business Unit` | Assign users to business units |
| `Platform: Application Roles` | Define application-level roles |
| `Platform: Application Permissions` | Define application-level permissions |
| `Platform: Role ↔ Permission` | Bind permissions to roles |
| `Platform: Report Templates` | Platform-wide report template catalog |

### 4.3 Group — Business Unit Configuration
Per-BU master/reference data consumed by operations. Covers both the admin
CRUD at `/api/config/:bu_code/*` and the runtime read/comment endpoints at
`/api/:bu_code/<entity>` and `/api/:bu_code/<entity>-comment`.

| Tag | Description |
|---|---|
| `Config: Currencies & FX` | Currencies, exchange rates |
| `Config: Locations` | Locations, location-user, product-location, delivery points |
| `Config: Departments` | Departments, department-user assignments |
| `Config: Products` | Products, categories, sub-categories, item groups |
| `Config: Units` | Units of measure, unit conversions |
| `Config: Vendors` | Vendors, vendor business types, credit terms, credit-note reasons |
| `Config: Tax & Cost Types` | Tax profiles, adjustment types, extra-cost types |
| `Config: Recipes` | Recipe, category, cuisine, equipment, equipment-category |
| `Config: Price Lists` | Price list master data |
| `Config: Workflows` | Workflow definitions |
| `Config: Roles & Permissions` | BU-level role/permission binding |
| `Config: System` | App-config, running codes, SQL query runner, dimensions |

### 4.4 Group — Procurement
Day-to-day procurement transactions (`/api/:bu_code/*`). Each document tag
includes its header, details, templates (where applicable), and all
associated `*-comment` / `*-detail-comment` controllers.

| Tag | Description |
|---|---|
| `Procurement: Purchase Requests` | PR header, details, templates, comments |
| `Procurement: Purchase Orders` | PO header, details, comments |
| `Procurement: Good Received Notes` | GRN header, details, comments |
| `Procurement: Credit Notes` | Credit notes, reasons, details, comments |
| `Procurement: Request for Pricing` | RFP header, details, comments |
| `Procurement: Store Requisitions` | SR header, details, comments |
| `Procurement: Extra Costs` | Extra-cost document comments |
| `Procurement: Vendor Products` | Vendor-specific product catalog |
| `Procurement: Price Lists` | Active price lists, templates, price check |

### 4.5 Group — Inventory
Stock movements and counting (`/api/:bu_code/*`).

| Tag | Description |
|---|---|
| `Inventory: Stock In` | Stock-in header, details, comments |
| `Inventory: Stock Out` | Stock-out header, details, comments |
| `Inventory: Transfers` | Transfer header, details, comments |
| `Inventory: Physical Count` | Physical count, periods, details, comments |
| `Inventory: Spot Check` | Spot check header, details, comments |
| `Inventory: Adjustments` | Inventory adjustments |
| `Inventory: Transactions` | Read-only ledger of all stock movements |
| `Inventory: Periods` | Inventory period open/close |

### 4.6 Group — Workflow & Approval
| Tag | Description |
|---|---|
| `Workflow: Operations` | Runtime workflow state transitions and comments |
| `Workflow: My Pending` | Documents awaiting current user's action |
| `Workflow: My Approvals` | Documents the current user has acted on |

### 4.7 Group — Reporting & Insights
| Tag | Description |
|---|---|
| `Reports: Dashboard` | Aggregated KPI endpoints for dashboards |
| `Reports: Reports` | Formal report generation |
| `Reports: Activity Log` | Audit trail / activity feed |
| `Reports: News` | Announcements / news feed |
| `Documents: File Management` | Attachment upload/download, document metadata |

### 4.8 Group — Notifications
| Tag | Description |
|---|---|
| `Notifications` | REST endpoints for notifications. WebSocket server at `/ws` documented here. |

### 4.9 Group — User Profile & Access
User-context endpoints (not platform admin).

| Tag | Description |
|---|---|
| `User: Profile` | Current user profile |
| `User: Business Units` | User's BU assignments and BU directory |
| `User: Locations` | User's location assignments |

## 5. Controller-to-Tag Mapping

Source of truth: `scripts/swagger-tag-mapping.json` (added by the implementation).
The table below is the authoritative mapping; the JSON is generated from it.

### 5.1 Getting Started
| Controller | Tag |
|---|---|
| `app.controller.ts` | `App Info` |
| `auth/auth.controller.ts` | `Authentication` |

### 5.2 Platform Administration
| Controller | Tag |
|---|---|
| `platform/platform_cluster/platform_cluster.controller.ts` | `Platform: Clusters` |
| `platform/platform_business-unit/platform_business-unit.controller.ts` | `Platform: Business Units` |
| `platform/platform-user/platform-user.controller.ts` | `Platform: Users` |
| `platform/platform_user-cluster/platform_user-cluster.controller.ts` | `Platform: User ↔ Cluster` |
| `platform/platform_user-business-unit/platform_user-business-unit.controller.ts` | `Platform: User ↔ Business Unit` |
| `platform/application-role/application-role.controller.ts` | `Platform: Application Roles` |
| `platform/application-permission/application-permission.controller.ts` | `Platform: Application Permissions` |
| `platform/application-role-permission/application-role-permission.controller.ts` | `Platform: Role ↔ Permission` |
| `platform/platform_report-template/platform_report-template.controller.ts` | `Platform: Report Templates` |

### 5.3 Business Unit Configuration
| Controller | Tag |
|---|---|
| `config/config_currencies/config_currencies.controller.ts` | `Config: Currencies & FX` |
| `config/config_exchange-rate/config_exchange-rate.controller.ts` | `Config: Currencies & FX` |
| `application/currencies/currencies.controller.ts` | `Config: Currencies & FX` |
| `application/currency-comment/currency-comment.controller.ts` | `Config: Currencies & FX` |
| `application/exchange-rate-comment/exchange-rate-comment.controller.ts` | `Config: Currencies & FX` |
| `config/config_locations/config_locations.controller.ts` | `Config: Locations` |
| `config/config_locations-user/config_locations-user.controller.ts` | `Config: Locations` |
| `config/config_user-location/config_user-location.controller.ts` | `Config: Locations` |
| `config/config_location-product/config_location-product.controller.ts` | `Config: Locations` |
| `config/config_product-location/config_product-location.controller.ts` | `Config: Locations` |
| `config/config_delivery-point/config_delivery-point.controller.ts` | `Config: Locations` |
| `application/locations/locations.controller.ts` | `Config: Locations` |
| `application/location-comment/location-comment.controller.ts` | `Config: Locations` |
| `application/delivery-point-comment/delivery-point-comment.controller.ts` | `Config: Locations` |
| `config/config_departments/config_departments.controller.ts` | `Config: Departments` |
| `config/config_department-user/config_department-user.controller.ts` | `Config: Departments` |
| `application/department/department.controller.ts` | `Config: Departments` |
| `application/department-comment/department-comment.controller.ts` | `Config: Departments` |
| `config/config_products/config_products.controller.ts` | `Config: Products` |
| `config/config_product-category/config_product-category.controller.ts` | `Config: Products` |
| `config/config_product-sub-category/config_product-sub-category.controller.ts` | `Config: Products` |
| `config/config_product-item-group/config_product-item-group.controller.ts` | `Config: Products` |
| `application/products/products.controller.ts` | `Config: Products` |
| `application/product-comment/product-comment.controller.ts` | `Config: Products` |
| `application/product-category-comment/product-category-comment.controller.ts` | `Config: Products` |
| `application/product-sub-category-comment/product-sub-category-comment.controller.ts` | `Config: Products` |
| `application/product-item-group-comment/product-item-group-comment.controller.ts` | `Config: Products` |
| `config/config_units/config_units.controller.ts` | `Config: Units` |
| `config/config_unit_comment/config_unit_comment.controller.ts` | `Config: Units` |
| `application/unit-conversion/unit-conversion.controller.ts` | `Config: Units` |
| `application/unit-comment/unit-comment.controller.ts` | `Config: Units` |
| `config/config_vendors/config_vendors.controller.ts` | `Config: Vendors` |
| `config/config_vendor_business_type/config_vendor_business_type.controller.ts` | `Config: Vendors` |
| `config/config_credit_term/config_credit_term.controller.ts` | `Config: Vendors` |
| `config/config_credit-note-reason/config_credit-note-reason.controller.ts` | `Config: Vendors` |
| `application/credit-term/credit-term.controller.ts` | `Config: Vendors` |
| `application/credit-term-comment/credit-term-comment.controller.ts` | `Config: Vendors` |
| `application/vendor-comment/vendor-comment.controller.ts` | `Config: Vendors` |
| `application/vendor-business-type/vendor-business-type.controller.ts` | `Config: Vendors` |
| `application/vendor-business-type-comment/vendor-business-type-comment.controller.ts` | `Config: Vendors` |
| `config/config_tax_profile/config_tax_profile.controller.ts` | `Config: Tax & Cost Types` |
| `config/config_adjustment-type/config_adjustment-type.controller.ts` | `Config: Tax & Cost Types` |
| `config/config_extra_cost_type/config_extra_cost_type.controller.ts` | `Config: Tax & Cost Types` |
| `application/tax-profile/tax-profile.controller.ts` | `Config: Tax & Cost Types` |
| `application/tax-profile-comment/tax-profile-comment.controller.ts` | `Config: Tax & Cost Types` |
| `config/config_recipe/config_recipe.controller.ts` | `Config: Recipes` |
| `config/config_recipe-category/config_recipe-category.controller.ts` | `Config: Recipes` |
| `config/config_recipe-cuisine/config_recipe-cuisine.controller.ts` | `Config: Recipes` |
| `config/config_recipe-equipment/config_recipe-equipment.controller.ts` | `Config: Recipes` |
| `config/config_recipe-equipment-category/config_recipe-equipment-category.controller.ts` | `Config: Recipes` |
| `config/config_price-list/config_price-list.controller.ts` | `Config: Price Lists` |
| `config/config_workflows/config_workflows.controller.ts` | `Config: Workflows` |
| `config/config_application_role/config_application_role.controller.ts` | `Config: Roles & Permissions` |
| `config/config_permission/config_permission.controller.ts` | `Config: Roles & Permissions` |
| `config/config_user_application_role/config_user_application_role.controller.ts` | `Config: Roles & Permissions` |
| `config/config_app_config/config_app_config.controller.ts` | `Config: System` |
| `config/config_running-code/config_running-code.controller.ts` | `Config: System` |
| `config/config_sql_query/config_sql_query.controller.ts` | `Config: System` |
| `application/config-running-code-comment/config-running-code-comment.controller.ts` | `Config: System` |
| `application/dimension-comment/dimension-comment.controller.ts` | `Config: System` |

### 5.4 Procurement
| Controller | Tag |
|---|---|
| `application/purchase-request/purchase-request.controller.ts` | `Procurement: Purchase Requests` |
| `application/purchase-request-comment/purchase-request-comment.controller.ts` | `Procurement: Purchase Requests` |
| `application/purchase-request-detail-comment/purchase-request-detail-comment.controller.ts` | `Procurement: Purchase Requests` |
| `application/purchase-request-template/purchase-request-template.controller.ts` | `Procurement: Purchase Requests` |
| `application/purchase-request-template-comment/purchase-request-template-comment.controller.ts` | `Procurement: Purchase Requests` |
| `application/purchase-order/purchase-order.controller.ts` | `Procurement: Purchase Orders` |
| `application/purchase-order-comment/purchase-order-comment.controller.ts` | `Procurement: Purchase Orders` |
| `application/purchase-order-detail-comment/purchase-order-detail-comment.controller.ts` | `Procurement: Purchase Orders` |
| `application/good-received-note/good-received-note.controller.ts` | `Procurement: Good Received Notes` |
| `application/good-received-note-comment/good-received-note-comment.controller.ts` | `Procurement: Good Received Notes` |
| `application/good-received-note-detail-comment/good-received-note-detail-comment.controller.ts` | `Procurement: Good Received Notes` |
| `application/credit-note/credit-note.controller.ts` | `Procurement: Credit Notes` |
| `application/credit-note-comment/credit-note-comment.controller.ts` | `Procurement: Credit Notes` |
| `application/credit-note-detail-comment/credit-note-detail-comment.controller.ts` | `Procurement: Credit Notes` |
| `application/credit-note-reason/credit-note-reason.controller.ts` | `Procurement: Credit Notes` |
| `application/request-for-pricing/request-for-pricing.controller.ts` | `Procurement: Request for Pricing` |
| `application/request-for-pricing-comment/request-for-pricing-comment.controller.ts` | `Procurement: Request for Pricing` |
| `application/request-for-pricing-detail-comment/request-for-pricing-detail-comment.controller.ts` | `Procurement: Request for Pricing` |
| `application/store-requisition/store-requisition.controller.ts` | `Procurement: Store Requisitions` |
| `application/store-requisition-comment/store-requisition-comment.controller.ts` | `Procurement: Store Requisitions` |
| `application/store-requisition-detail-comment/store-requisition-detail-comment.controller.ts` | `Procurement: Store Requisitions` |
| `application/extra-cost-comment/extra-cost-comment.controller.ts` | `Procurement: Extra Costs` |
| `application/extra-cost-detail-comment/extra-cost-detail-comment.controller.ts` | `Procurement: Extra Costs` |
| `application/vendor-product/vendor-product.controller.ts` | `Procurement: Vendor Products` |
| `application/price-list/price-list.controller.ts` | `Procurement: Price Lists` |
| `application/price-list/check-price-list.controller.ts` | `Procurement: Price Lists` |
| `application/price-list-template/price-list-template.controller.ts` | `Procurement: Price Lists` |
| `application/pricelist-comment/pricelist-comment.controller.ts` | `Procurement: Price Lists` |
| `application/pricelist-detail-comment/pricelist-detail-comment.controller.ts` | `Procurement: Price Lists` |
| `application/pricelist-template-comment/pricelist-template-comment.controller.ts` | `Procurement: Price Lists` |
| `application/pricelist-template-detail-comment/pricelist-template-detail-comment.controller.ts` | `Procurement: Price Lists` |

### 5.5 Inventory
| Controller | Tag |
|---|---|
| `application/stock-in/stock-in.controller.ts` | `Inventory: Stock In` |
| `application/stock-in-detail/stock-in-detail.controller.ts` | `Inventory: Stock In` |
| `application/stock-in-comment/stock-in-comment.controller.ts` | `Inventory: Stock In` |
| `application/stock-in-detail-comment/stock-in-detail-comment.controller.ts` | `Inventory: Stock In` |
| `application/stock-out/stock-out.controller.ts` | `Inventory: Stock Out` |
| `application/stock-out-detail/stock-out-detail.controller.ts` | `Inventory: Stock Out` |
| `application/stock-out-comment/stock-out-comment.controller.ts` | `Inventory: Stock Out` |
| `application/stock-out-detail-comment/stock-out-detail-comment.controller.ts` | `Inventory: Stock Out` |
| `application/transfer/transfer.controller.ts` | `Inventory: Transfers` |
| `application/transfer-detail/transfer-detail.controller.ts` | `Inventory: Transfers` |
| `application/transfer-comment/transfer-comment.controller.ts` | `Inventory: Transfers` |
| `application/transfer-detail-comment/transfer-detail-comment.controller.ts` | `Inventory: Transfers` |
| `application/physical-count/physical-count.controller.ts` | `Inventory: Physical Count` |
| `application/physical-count-comment/physical-count-comment.controller.ts` | `Inventory: Physical Count` |
| `application/physical-count-detail-comment/physical-count-detail-comment.controller.ts` | `Inventory: Physical Count` |
| `application/physical-count-period/physical-count-period.controller.ts` | `Inventory: Physical Count` |
| `application/physical-count-period-comment/physical-count-period-comment.controller.ts` | `Inventory: Physical Count` |
| `application/count-stock-comment/count-stock-comment.controller.ts` | `Inventory: Physical Count` |
| `application/count-stock-detail-comment/count-stock-detail-comment.controller.ts` | `Inventory: Physical Count` |
| `application/spot-check/spot-check.controller.ts` | `Inventory: Spot Check` |
| `application/spot-check-comment/spot-check-comment.controller.ts` | `Inventory: Spot Check` |
| `application/spot-check-detail-comment/spot-check-detail-comment.controller.ts` | `Inventory: Spot Check` |
| `application/inventory-adjustment/inventory-adjustment.controller.ts` | `Inventory: Adjustments` |
| `application/inventory-transaction/inventory-transaction.controller.ts` | `Inventory: Transactions` |
| `application/period/period.controller.ts` | `Inventory: Periods` |
| `application/period-comment/period-comment.controller.ts` | `Inventory: Periods` |

### 5.6 Workflow & Approval
| Controller | Tag |
|---|---|
| `application/workflow/workflow.controller.ts` | `Workflow: Operations` |
| `application/workflow-comment/workflow-comment.controller.ts` | `Workflow: Operations` |
| `application/my-pending/purchase-request/my-pending.purchase-request.controller.ts` | `Workflow: My Pending` |
| `application/my-pending/purchase-order/my-pending.purchase-order.controller.ts` | `Workflow: My Pending` |
| `application/my-pending/store-requisition/my-pending.store-requisition.controller.ts` | `Workflow: My Pending` |
| `application/my-pending/my-approve/my-approve.controller.ts` | `Workflow: My Approvals` |

### 5.7 Reporting & Insights
| Controller | Tag |
|---|---|
| `application/dashboard/dashboard.controller.ts` | `Reports: Dashboard` |
| `application/report/report.controller.ts` | `Reports: Reports` |
| `application/activity-log/activity-log.controller.ts` | `Reports: Activity Log` |
| `application/news/news.controller.ts` | `Reports: News` |
| `application/document-management/document-management.controller.ts` | `Documents: File Management` |

### 5.8 Notifications
| Controller | Tag |
|---|---|
| `notification/notification.controller.ts` | `Notifications` |

### 5.9 User Profile & Access
| Controller | Tag |
|---|---|
| `application/user/user.controller.ts` | `User: Profile` |
| `application/user-business-unit/user-business-unit.controller.ts` | `User: Business Units` |
| `application/business-unit/business-unit.controller.ts` | `User: Business Units` |
| `application/user-location/user-location.controller.ts` | `User: Locations` |

**Total:** 144 controllers.

### 5.10 Notes on orphan or ambiguous controllers (resolved)

| Controller | URL pattern | Parent in gateway? | Decision |
|---|---|---|---|
| `count-stock-comment`, `count-stock-detail-comment` | `/api/:bu_code/count-stock/:id/comments` | No | `Inventory: Physical Count` (peer concept in inventory counting) |
| `dimension-comment` | `/api/:bu_code/dimension/:id/comments` | No | `Config: System` (GL dimension is a finance config concept) |
| `extra-cost-comment`, `extra-cost-detail-comment` | `/api/:bu_code/extra-cost/...` | No parent, only `config_extra_cost_type` (types) | `Procurement: Extra Costs` |

These controllers remain live (no `@ApiExcludeController`). The verification
script will flag them if the parent endpoint is still absent in a future
review.

## 6. Implementation Strategy

### 6.1 main.ts changes

Extract tag metadata into `apps/backend-gateway/src/swagger/tag-groups.ts`:

```ts
export const SWAGGER_TAGS: Array<{ name: string; description: string }> = [
  { name: 'Authentication', description: '...' },
  // ... 38 entries in group order
];

export const SWAGGER_TAG_GROUPS: Array<{ name: string; tags: string[] }> = [
  { name: 'Getting Started',             tags: ['Authentication', 'App Info'] },
  { name: 'Platform Administration',     tags: [/* 9 */] },
  { name: 'Business Unit Configuration', tags: [/* 12 */] },
  { name: 'Procurement',                 tags: [/* 9 */] },
  { name: 'Inventory',                   tags: [/* 8 */] },
  { name: 'Workflow & Approval',         tags: [/* 3 */] },
  { name: 'Reporting & Insights',        tags: [/* 5 */] },
  { name: 'Notifications',               tags: ['Notifications'] },
  { name: 'User Profile & Access',       tags: [/* 3 */] },
];
```

In `main.ts`:

1. Replace the 12 hardcoded `.addTag(...)` lines with a loop over
   `SWAGGER_TAGS`.
2. After each `SwaggerModule.createDocument(...)`, inject `x-tagGroups`:
   ```ts
   (document_http  as unknown as Record<string, unknown>)['x-tagGroups']
     = SWAGGER_TAG_GROUPS;
   (document_https as unknown as Record<string, unknown>)['x-tagGroups']
     = SWAGGER_TAG_GROUPS;
   ```

Scalar renders the 2-level navigation from `x-tagGroups`; plain Swagger UI
silently ignores the extension and falls back to the flat tag list (still
consistent because every tag uses the `Group: Subject` convention).

### 6.2 Controller migration — codemod

Create `scripts/swagger-retag.ts`:

1. Read `scripts/swagger-tag-mapping.json`
   (`{ "<controller-path-relative-to-gateway-src>": "<new tag>" }`).
2. For each controller listed, read the file and apply the regex
   `@ApiTags\(([^)]*)\)` → `@ApiTags('<new tag>')`. Handles both single-arg
   and multi-arg current forms (including
   `@ApiTags('Configuration', 'Recipe Equipment Category')`).
3. Modes:
   - `--dry` (default): print unified diff per file.
   - `--apply`: write changes.
4. After `--apply`, the script prints a summary: files changed, unchanged,
   skipped.
5. Post-apply: run `bun run format && bun run lint && bun run check-types`.

The mapping JSON is retained as the permanent source of truth. Any future
new controller must be added to this file — the verification script (6.3)
fails CI until that happens.

### 6.3 Verification script

Create `scripts/verify-swagger-tags.ts` intended to run against a live
gateway (dev or CI-spun):

1. Fetch the OpenAPI document from the running gateway
   (the gateway already exposes it via Scalar; either read it through
   `apiReference`'s internal spec or call a small helper route that writes
   `document` to JSON on demand).
2. Build the set of tags declared in `SWAGGER_TAGS` (38 entries).
3. For each operation in `paths`:
   - Assert `tags.length >= 1` — no untagged operations.
   - Assert every tag is in the declared set — no typos / orphans.
4. For each tag declared, assert it appears in at least one operation —
   no dead tags.
5. For each tag in every `x-tagGroups[].tags`, assert it exists in the
   declared set — no stale group references.
6. Assert the union of all `x-tagGroups[].tags` equals the declared set —
   no tag outside any group.

Exit code 0 on pass, non-zero on fail with a per-failure line. The script
is added to CI as a step after `build` (needs the gateway spec, not a
running server — it can import the same `tag-groups.ts` and use a headless
`SwaggerModule.createDocument` call to build the document from `AppModule`).

### 6.4 PR strategy

Single PR: one commit for the codemod, verification script, and
`main.ts` / `tag-groups.ts` refactor. Diff is large (~140 files) but
mechanical — reviewers audit `scripts/swagger-tag-mapping.json` against
Section 5 of this spec and spot-check a handful of controllers.

### 6.5 Bruno impact

`apps/bruno/carmen-inventory/` is organized by URL path, not by Swagger
tag, so this redesign does not affect Bruno collections. `bun run
bruno:sync` remains unaffected because that tool reads OpenAPI `operationId`
and `method+path`, not `tags`.

## 7. Rollback

Pure Swagger-metadata change. No runtime behavior, database schema,
deployment topology, or contract change. Rollback is a single
`git revert` of the PR commit. No service restart choreography.

## 8. Out of Scope

- Adding or renaming operations (`operationId`, summaries, request/response
  DTOs, examples).
- Re-organizing file paths or folder structure of controllers.
- Changing the endpoint URL for any route.
- Micro-service boundary changes.
- The `*-comment` controllers that currently have no matching parent in
  the gateway (`count-stock-*`, `dimension-comment`, `extra-cost-*-comment`)
  — they retain their tag per Section 5.10 but whether the parent resource
  should be exposed is a separate question.

## 9. Risks

| Risk | Mitigation |
|---|---|
| Codemod regex misses a controller (e.g., multi-line `@ApiTags`) | Dry-run output is reviewed manually; verification script re-checks post-apply. |
| Plain Swagger UI user sees flat list without grouping | `Group: Subject` naming sorts alphabetically into the intended groups; description still makes each tag self-explanatory. |
| A new controller merged in parallel is missed | Verification script is added to CI and fails on any untagged or undeclared-tag operation. |
| Downstream tooling depends on existing tag names | Confirmed: Bruno sync (reads path/method), Scalar (reads tags/groups dynamically). No other consumer known. |
