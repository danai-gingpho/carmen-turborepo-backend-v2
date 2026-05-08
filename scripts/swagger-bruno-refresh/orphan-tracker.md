# Orphan Bruno Endpoints

Endpoints discovered in `apps/bruno/carmen-inventory/` whose gateway controller no longer exists.
Resolved at the end of the run via `bun run bruno:sync`.

## List

No orphans found in the R-W chunk (recipe-equipment through workflows). All Bruno endpoints
map to active gateway controllers.

### Notes

- `config/unit-comment/` Bruno files map to the **application** controller
  (`api/:bu_code/unit-comment/:unit_id`) NOT the config controller
  (`api/config/:bu_code/unit-comment`). This is by design — the config controller
  manages predefined comment templates while the application controller handles
  per-unit comments with S3 attachments.
- `recipe-equipment-category/` uses flat file names (e.g. `GET-list.bru`) instead of
  numbered names — created by `bun run bruno:sync` auto-discovery.
- `sql_query/` uses flat file names aligned with the SQL query routes.

### Task 5 — documents-and-reports (2026-04-29)

No orphans found. All 29 `.bru` files in `documents-and-reports/` map to active gateway controllers:
- `activity-log/` → `apps/backend-gateway/src/application/activity-log/activity-log.controller.ts` (`api/:bu_code/activity-log`)
- `documents/` → `apps/backend-gateway/src/application/document-management/document-management.controller.ts` (`api/:bu_code/documents`)
- `report/` → `apps/backend-gateway/src/application/report/report.controller.ts` (`api/:bu_code/report`)

Permission keys for all three modules are **not found in the BU-level seed** (`permission-role-map.json`). Each `.bru` docs block carries `> Permission key not found in seed; review needed.`

### Task 6a — inventory (A-N) (2026-04-29)

No orphans found. All `.bru` files in the inventory chunk A-N map to active gateway controllers.

Modules processed:
- `inventory-adjustment/` → `inventory-adjustment.controller.ts` (`api/:bu_code/inventory-adjustment`) — permission key not in seed
- `inventory-transaction/` → `inventory-transaction.controller.ts` (`api/:bu_code/inventory-transaction`) — permission key not in seed; `POST-backfill-zero-cost-layers.bru` is `@ApiExcludeEndpoint(true)` dev-only
- `physical-count/` → `physical-count.controller.ts` (`api/:bu_code/physical-count`) — `physical_count:{view,create,update,delete}`
- `physical-count-comment/` → `physical-count-comment.controller.ts` — `physical_count:{view,update}`
- `physical-count-detail-comment/` → `physical-count-detail-comment.controller.ts` — `physical_count:{view,update}`
- `physical-count-period/` → `physical-count-period.controller.ts` — `physical_count:{view,create,update,delete}`
- `physical-count-period-comment/` → `physical-count-period-comment.controller.ts` — `physical_count:{view,update}`
- `spot-check/` → `spot-check.controller.ts` (`api/:bu_code/spot-check`) — `spot_check:{view,create,update,delete}`
- `spot-check-comment/` → `spot-check-comment.controller.ts` — `spot_check:{view,update}`
- `spot-check-detail-comment/` → `spot-check-detail-comment.controller.ts` — `spot_check:{view,update}`

Notes:
- `inventory-adjustment` and `inventory-transaction` resource keys are absent from `permission-role-map.json`. Marked with `> Permission key not found in seed; review needed.`
- `GET /api/spot-check/pending` and `GET /api/physical-count/pending` have no `bu_code` path param — cross-tenant endpoints.
- `GET-get-products-by-location-id.bru` under `spot-check/` maps to `api/:bu_code/locations/:location_id/products` in the spot-check controller.

### Task 6b — inventory (O-Z) (2026-04-29)

No orphans found. All `.bru` files in the inventory chunk O-Z map to active gateway controllers.

Modules processed:
- `stock-in/` → `stock-in.controller.ts` (`api/:bu_code/stock-in`) — `inventory_management.stock_in:{view,create,update,delete}`
- `stock-in-comment/` → `stock-in-comment.controller.ts` — `inventory_management.stock_in:{view,update}`
- `stock-in-detail-comment/` — comment files → `stock-in-detail-comment.controller.ts`; flat-name files (GET-list, GET-by-id, POST-create, PATCH-update, DELETE-remove) → `stock-in-detail.controller.ts` (`api/:bu_code/stock-in-detail`) — misplaced in folder but gateway routes are active
- `stock-out/` → `stock-out.controller.ts` (`api/:bu_code/stock-out`) — `inventory_management.stock_out:{view,create,update,delete}`
- `stock-out-comment/` → `stock-out-comment.controller.ts` — `inventory_management.stock_out:{view,update}`
- `stock-out-detail-comment/` — comment files → `stock-out-detail-comment.controller.ts`; flat-name files → `stock-out-detail.controller.ts` (`api/:bu_code/stock-out-detail`) — same misplacement pattern as stock-in-detail-comment
- `store-requisition/` → `store-requisition.controller.ts` — `inventory_management.store_requisition:{view,view_all,view_department}`; create/update/delete keys not in seed (marked for review)
- `store-requisition-comment/` → `store-requisition-comment.controller.ts` — `inventory_management.store_requisition:{view}` (with write access for mutations)
- `store-requisition-detail-comment/` → `store-requisition-detail-comment.controller.ts` — same as store-requisition-comment
- `unit-conversion/` → `unit-conversion.controller.ts` (`api/:bu_code/unit`) — permission key not in seed

Notes:
- `store-requisition` create/update/delete permission keys are absent from `permission-role-map.json`. Marked with `> Permission key not found in seed; review needed.`
- `unit-conversion` permission keys are absent from `permission-role-map.json`. Marked with `> Permission key not found in seed; review needed.`
- `GET /api/store-requisition` (01-List) has no `bu_code` path param — cross-tenant endpoint; `bu_code` is a query param filter only.
- Flat-name `.bru` files in `stock-in-detail-comment/` and `stock-out-detail-comment/` folders are misplaced organizationally but map to valid standalone `stock-in-detail` and `stock-out-detail` controllers respectively.

### Task 7b — master-data (O-Z) (2026-04-30)

No orphans found. All `.bru` files in the master-data chunk O-Z map to active gateway controllers.

Modules processed (15):
- `pricelist-template-comment/` → `pricelist-template-comment.controller.ts` (`api/:bu_code/pricelist-template-comment`) — permission key not in seed
- `pricelist-template-detail-comment/` → `pricelist-template-detail-comment.controller.ts` (`api/:bu_code/pricelist-template-detail-comment`) — permission key not in seed
- `product-category-comment/` → `product-category-comment.controller.ts` (`api/:bu_code/product-category-comment`) — permission key not in seed
- `product-comment/` → `product-comment.controller.ts` (`api/:bu_code/product-comment`) — permission key not in seed
- `product-item-group-comment/` → `product-item-group-comment.controller.ts` (`api/:bu_code/product-item-group-comment`) — permission key not in seed
- `product-sub-category-comment/` → `product-sub-category-comment.controller.ts` (`api/:bu_code/product-sub-category-comment`) — permission key not in seed
- `products/` → `products.controller.ts` (`api/:bu_code/products`) — `product_management.product:view`; GET endpoints for on-hand, on-order, last-purchase, inventory-movement; POST for cost calculation
- `tax-profile/` → `tax-profile.controller.ts` (`api/:bu_code/tax-profile`) — `configuration.tax_profile:view`
- `tax-profile-comment/` → `tax-profile-comment.controller.ts` (`api/:bu_code/tax-profile-comment`) — permission key not in seed
- `unit-comment/` → `unit-comment.controller.ts` (`api/:bu_code/unit-comment`) — permission key not in seed
- `vendor-business-type-comment/` → `vendor-business-type-comment.controller.ts` (`api/:bu_code/vendor-business-type-comment`) — permission key not in seed
- `vendor-comment/` → `vendor-comment.controller.ts` (`api/:bu_code/vendor-comment`) — permission key not in seed
- `vendor-product/` → `vendor-product.controller.ts` (`api/:bu_code/vendor-product`) — `vendor_management.vendor:{view,create,update,delete}`
- `workflow/` → `workflow.controller.ts` (`api/:bu_code/workflow`) — permission key not in seed; `patch-user-action` is an admin-override endpoint
- `workflow-comment/` → `workflow-comment.controller.ts` (`api/:bu_code/workflow-comment`) — permission key not in seed

Notes:
- All 10 `*-comment` modules have no permission key in the BU-level seed. Marked with `> Permission key not found in seed; review needed.`
- `workflow.patch-user-action` endpoint is an admin tool to fix broken workflow assignments; no permission key in seed.
- `products/` Bruno folder contains product analytics endpoints (on-hand, on-order, last-purchase, inventory-movement, cost) — NOT the CRUD product master. These are read-only (GET) except POST-get-product-cost which is a query endpoint.
- `vendor-product` controller uses `KeycloakGuard` only (no `PermissionGuard`), but the resource logically maps to `vendor_management.vendor:*`.
- `tax-profile` in master-data uses the same controller as in config context but different path/controller file — `apps/backend-gateway/src/application/tax-profile/`.

### Task 8 — my-pending (2026-04-29)

No orphans found. All 33 `.bru` files in `my-pending/` map to active gateway controllers.

Modules processed (4):
- `my-approve/` → `my-approve.controller.ts` (`api/my-approve`) — permission key not in seed; `@ApiTags('Workflow: My Approvals')`
- `purchase-order/` → `my-pending.purchase-order.controller.ts` (`api/my-pending/purchase-order`) — `procurement.purchase_order:view` (all 4 roles)
- `purchase-request/` → `my-pending.purchase-request.controller.ts` (`api/my-pending/purchase-request`) — `procurement.purchase_request:view` (all 4 roles); create/update/delete not in seed
- `store-requisition/` → `my-pending.store-requisition.controller.ts` (`api/my-pending/store-requisition`) — `inventory_management.store_requisition:view` (all 4 roles); create/update/delete not in seed

Notes:
- `my-approve` endpoints are not in the BU-level seed. Marked with `> Permission key not found in seed; review needed.`
- `purchase-order` module has only 3 files (list, count, workflow-stages) — no find-by-id in the folder. `GET-find-by-id.bru` is misplaced inside `store-requisition/` folder but hits `api/my-pending/purchase-order/:bu_code/:id`.
- `purchase-request` create/update/delete permission keys are absent from `permission-role-map.json`. Marked with `> Permission key not found in seed; review needed.` for those specific actions.
- `store-requisition` create/update/delete permission keys are absent from `permission-role-map.json`. Marked with `> Permission key not found in seed; review needed.` for those specific actions.
- All endpoints use `KeycloakGuard` + `ApiBearerAuth` — no public endpoints in this folder.
- `GET-find-by-id.bru` (seq: 13) in `store-requisition/` is organizationally misplaced — it calls `api/my-pending/purchase-order/{{bu_code}}/:id`. The file belongs to the purchase-order module but was auto-generated into the wrong folder. Gateway controller is active; not an orphan.

### Task 9 — platform (2026-04-29)

No orphans found. All 49 `.bru` files across 10 modules in `platform/` map to active gateway controllers.

Modules processed (10):
- `business-unit/` → `platform_business-unit.controller.ts` (`api-system/business-unit`) — platform admin only; no BU-level permission key
- `cluster/` → `platform_cluster.controller.ts` (`api-system/cluster`) — platform admin only; no BU-level permission key
- `permission/` → `application-permission.controller.ts` (`api-system/permission`) — platform admin only; no BU-level permission key
- `platform-user/` → `platform-user.controller.ts` (`api-system`) — special endpoints: `POST fetch-user`, `PUT user/:id/reset-password`, `DELETE user/:id/hard`; platform admin only
- `report-template/` → `platform_report-template.controller.ts` (`api-system/report-template`) — platform admin only; no BU-level permission key
- `role/` → `application-role.controller.ts` (`api-system/role`) — platform admin only; no BU-level permission key
- `role-permission/` → `application-role-permission.controller.ts` (`api-system/role-permission`) — 6 files covering assign/remove bulk+single, list by role/permission; platform admin only
- `user/` → `platform-user.controller.ts` (`api-system`) — standard CRUD: `GET /api-system/user`, `GET /api-system/user/:id`, `POST /api-system/user`, `PUT /api-system/user/:id`, `DELETE /api-system/user/:id`; platform admin only
- `user-business-unit/` → `platform_user-business-unit.controller.ts` (`api-system/user/business-unit`) — uses PATCH (not PUT) for update; platform admin only
- `user-cluster/` → `platform_user-cluster.controller.ts` (`api-system/user/cluster`) — uses PUT for update; platform admin only

Notes:
- All 10 modules are platform-level (cross-tenant) endpoints under `api-system/` prefix. None appear in `permission-role-map.json` (BU-level seed). All docs blocks carry "Platform admin only — managed at Keycloak realm role level".
- `platform-user/` and `user/` both map to the same `PlatformUserController` but cover different endpoint subsets — special ops vs. standard CRUD.
- `user-business-unit` Update endpoint uses PATCH verb; title set to "Patch User Business Unit" per convention.
- `role-permission/` GET endpoints (`01`, `02`) have no body; bulk assign/remove bodies use `permission_ids[]` array; single assign/remove use single `permission_id`.
- `report-template` body:json includes XML strings in `dialog` and `content` fields — stored as text in DB.

### Task 10a — procurement (credit-term, extra-cost-comment, extra-cost-detail-comment, good-received-note) (2026-04-29)

No true orphans found (no Bruno files whose gateway controller no longer exists).

Two URL-mismatched files found in `good-received-note/`:
- `09 - List GRN Comments.bru` — uses legacy URL `GET /api/:bu_code/good-received-note/:good_received_note_id/comments`. The active controller is `GET /api/:bu_code/good-received-note-comment/:good_received_note_id`. Controller exists but URL path doesn't match the file. Docs block updated with prominent `> Note` explaining the mismatch and pointing to the correct URL. File retained (not archived).
- `14 - Create GRN Comment.bru` — uses legacy pattern `POST /api/:bu_code/good-received-note-comment` with JSON body `{ good_received_note_id }`. The active controller is `POST /api/:bu_code/good-received-note-comment/:good_received_note_id` (multipart form). Docs block updated with prominent `> Note` marking as legacy. File retained (not archived).

Modules processed (4):
- `credit-term/` (2 files) → `credit-term.controller.ts` (`api/:bu_code/credit-term`) — `KeycloakGuard` only (no `PermissionGuard`); permission key not in seed for either action
- `extra-cost-comment/` (6 files) → `extra-cost-comment.controller.ts` (`api/:bu_code/extra-cost-comment`) — permission key not in seed; full unified comment pattern (list, create multipart, update multipart, delete, add attachment, remove attachment)
- `extra-cost-detail-comment/` (6 files) → `extra-cost-detail-comment.controller.ts` (`api/:bu_code/extra-cost-detail-comment`) — permission key not in seed; same unified comment pattern
- `good-received-note/` (27 files) → `good-received-note.controller.ts` (`api/:bu_code/good-received-note`) — `procurement.goods_received_note:{view,create,update,delete,commit}` fully in seed

Notes:
- `credit-term`, `extra-cost-comment`, `extra-cost-detail-comment` permission keys are absent from `permission-role-map.json`. All docs blocks carry `> Permission key not found in seed; review needed.`
- `good-received-note` has the full permission key set in seed: `view → [HOD, Purchase, Approval]`; `create/update/delete/commit → [Purchase]`.
- `GET /api/good-received-note/pending` (03 - Get Pending GRN) has no `bu_code` — cross-tenant endpoint.
- Sub-resource endpoints (22–25: products, locations by GRN) use `grn_id` path param instead of `id`.
- Regenerate-totals endpoints (26, 27) are admin/repair tools with no specific permission key beyond `goods_received_note:update`.

### Task 10a final — procurement (good-received-note-comment, good-received-note-detail-comment, price-list, price-list-template) (2026-04-29)

No orphans found. All `.bru` files in these 4 modules map to active gateway controllers.

Modules processed (4):
- `good-received-note-comment/` (6 files) → `good-received-note-comment.controller.ts` (`api/:bu_code/good-received-note-comment`) — permission key `procurement.goods_received_note:{view,update}` (view → HOD, Purchase, Approval; update → Purchase)
- `good-received-note-detail-comment/` (6 files) → `good-received-note-detail-comment.controller.ts` (`api/:bu_code/good-received-note-detail-comment`) — same permission mapping as above
- `price-list/` (7 files including POST-check-price-list) → `price-list.controller.ts` (`api/:bu_code/price-list`) + `check-price-list.controller.ts` (`api/check-price-list`) — `vendor_management.price_list:{view,create,update,delete}`; check-price-list uses `UrlTokenGuard` (no Keycloak auth)
- `price-list-template/` (7 files) → `price-list-template.controller.ts` (`api/:bu_code/price-list-template`) — `vendor_management.price_list:{view,create,update,delete}` (same resource key as price-list)

Notes:
- `good-received-note-comment` and `good-received-note-detail-comment` have no dedicated comment-specific permission keys in the seed. Both modules use the parent resource `procurement.goods_received_note` — `view` for list, `update` for create/update/delete/attachment operations.
- `POST /api/check-price-list/:url_token` uses `UrlTokenGuard` (not `KeycloakGuard`) — `Authorization` header is not required for that endpoint. Docs block marks it as "Public — authenticated via URL token".
- `price-list-template` uses the same `vendor_management.price_list` resource key as `price-list` — no dedicated template key in the seed.
- All 26 `.bru` files refreshed with full R7 docs template (Path Parameters table, Headers table, Permissions bullet, Sample Body/Response, Error Responses table).

### Task 10b — procurement (purchase-order, purchase-order-comment, purchase-order-detail-comment, purchase-request, purchase-request-comment) (2026-04-29)

No orphans found. All `.bru` files in these 5 modules map to active gateway controllers.

Modules processed (5):
- `purchase-order/` (24 files including GET-find-all-for-grn, PATCH-submit) → `purchase-order.controller.ts` (`api/:bu_code/purchase-order`) — `procurement.purchase_order:view` (Requestor, HOD, Purchase, Approval); workflow action permission keys (create/approve/reject/review/cancel/close/save/submit/group/confirm) are absent from seed
- `purchase-order-comment/` (6 files) → `purchase-order-comment.controller.ts` (`api/:bu_code/purchase-order-comment`) — parent resource `procurement.purchase_order:view` (all 4 roles); no dedicated comment permission key in seed
- `purchase-order-detail-comment/` (6 files) → `purchase-order-detail-comment.controller.ts` (`api/:bu_code/purchase-order-detail-comment`) — same permission mapping as purchase-order-comment
- `purchase-request/` (25 files including GET-print-to-report, POST-swipe-approve, POST-swipe-reject) → `purchase-request.controller.ts` (`api/:bu_code/purchase-request`) — `procurement.purchase_request:view` (Requestor, HOD, Purchase, Approval); workflow action permission keys (create/approve/reject/review/submit/save/split/duplicate/swipe) are absent from seed
- `purchase-request-comment/` (6 files) → `purchase-request-comment.controller.ts` (`api/:bu_code/purchase-request-comment`) — parent resource `procurement.purchase_request:view` (all 4 roles); no dedicated comment permission key in seed

Notes:
- `purchase-order` and `purchase-request` only have `view` in `permission-role-map.json`. All workflow action endpoints (approve, reject, review, submit, save, create, cancel, close, group-pr, confirm-pr, duplicate, split, regenerate-totals, swipe-approve, swipe-reject) are marked `> Permission key not found in seed; review needed.`
- `purchase-request:view_all` and `purchase-request:view_department` exist in seed but map to no specific Bruno file; they apply to the list endpoint filtered by scope.
- `GET-print-to-report.bru` and `POST-swipe-approve.bru` / `POST-swipe-reject.bru` had no docs block — added complete docs blocks from scratch.
- Regenerate-totals endpoints (21, 22) are admin/repair tools to fix denormalized `base_net_amount`/`base_total_amount` fields on PR headers.
- `detail_id` path param is used for sub-resource endpoints (dimension, history, calculate) on purchase-request detail lines.
- Comment modules inherit parent permission key (`procurement.purchase_request:view`) — no separate comment permission key exists in seed.
- Sample responses updated to use UUID v7 (`019638a6-2a00-7c4f-8e46-9b7a52c80c4d`) and timestamp `2026-04-29T08:30:00.000Z`. Paginate format updated to 6-field `{ page, perpage, pages, total, prev, next }`.

### Task 11 — user-management (2026-04-29)

No orphans found. All 8 `.bru` files in `user-management/` map to active gateway controllers.

Modules processed (2):
- `user/` (7 files) → multiple controllers in `apps/backend-gateway/src/application/`:
  - `01 - Get Profile.bru` → `user.controller.ts` (`GET /api/user/profile`)
  - `02 - Get Permission.bru` → `user.controller.ts` (`GET /api/user/permission`)
  - `03 - List Users.bru` → `user.controller.ts` (`GET /api/:bu_code/users`)
  - `04 - Update User.bru` → `user.controller.ts` (`PUT /api/user/:user_id`)
  - `05 - Set Default Business Unit.bru` → `user-business-unit.controller.ts` (`POST /api/business-unit/default`)
  - `06 - Get User Locations.bru` → `user-location.controller.ts` (`GET /api/:bu_code/user-location`)
  - `07 - Update Profile.bru` → `user.controller.ts` (`PATCH /api/user/profile`)
- `user-business-unit/` (1 file) → `user-business-unit.controller.ts` (`POST /api/business-unit/default`)

Notes:
- All user-management permission keys are absent from `permission-role-map.json` (BU-level seed). All docs blocks carry `> Permission key not found in seed; review needed.`
- `05 - Set Default Business Unit.bru` (in `user/` folder) and `user-business-unit/01 - Set Default Business Unit.bru` both map to the same `POST /api/business-unit/default` endpoint — intentional duplication for discoverability from different folder contexts.
- `body:json` for both Set Default Business Unit files was fixed: old field `business_unit_id` replaced with the correct `tenant_id` field as defined in `SetDefaultTenantRequestDto`.
- `body:json` for `07 - Update Profile.bru` was filled (was empty `{}`) with realistic profile update fields (`alias_name`, `firstname`, `middlename`, `lastname`, `telephone`).
- `user.controller.ts` is in `src/application/user/` (BU-scoped user management); distinct from `platform/platform-user/` (cross-tenant platform admin) and `platform/user/` (platform CRUD).
- All 8 `.bru` files refreshed with full R7 docs template. Sample responses updated to use UUID v7 and timestamp `2026-04-29T08:30:00.000Z`. Paginate format updated to 6-field `{ page, perpage, pages, total, prev, next }` where applicable.

### Task 7a — master-data (A-N) (2026-04-29)

No orphans found. All `.bru` files in the master-data chunk A-N map to active gateway controllers.

Modules processed (16):
- `config-running-code-comment/` → `config-running-code-comment.controller.ts` (`api/:bu_code/config-running-code-comment`) — permission key not in seed
- `credit-term-comment/` → `credit-term-comment.controller.ts` (`api/:bu_code/credit-term-comment`) — permission key not in seed
- `currencies/` → `currencies.controller.ts` (`api/:bu_code/currencies`) — `configuration.currency:view`; ISO endpoint has no bu_code (`GET /api/iso`)
- `currency-comment/` → `currency-comment.controller.ts` (`api/:bu_code/currency-comment`) — permission key not in seed
- `delivery-point-comment/` → `delivery-point-comment.controller.ts` (`api/:bu_code/delivery-point-comment`) — permission key not in seed
- `department/` → `department.controller.ts` (`api/:bu_code/department`) — `configuration.department:view`
- `department-comment/` → `department-comment.controller.ts` (`api/:bu_code/department-comment`) — permission key not in seed
- `dimension-comment/` → `dimension-comment.controller.ts` (`api/:bu_code/dimension-comment`) — permission key not in seed
- `exchange-rate-comment/` → `exchange-rate-comment.controller.ts` (`api/:bu_code/exchange-rate-comment`) — permission key not in seed
- `location-comment/` → `location-comment.controller.ts` (`api/:bu_code/location-comment`) — permission key not in seed
- `locations/` → `locations.controller.ts` (`api/:bu_code/locations`) — `configuration.location:view`; includes product inventory sub-endpoint
- `news/` → `news.controller.ts` (`/api/news`, no bu_code) — permission key not in seed
- `period/` → `period.controller.ts` (`api/:bu_code/period`) — `inventory_management.period_end:view` (list/get) and `inventory_management.period_end:execute` (create/update/delete/generate)
- `period-comment/` → `period-comment.controller.ts` (`api/:bu_code/period-comment`) — permission key not in seed
- `pricelist-comment/` → `pricelist-comment.controller.ts` (`api/:bu_code/pricelist-comment`) — permission key not in seed
- `pricelist-detail-comment/` → `pricelist-detail-comment.controller.ts` (`api/:bu_code/pricelist-detail-comment`) — permission key not in seed

Notes:
- `news` controller is mounted at `/api/news` with no `bu_code` path segment — cross-tenant endpoint.
- 12 of 16 modules are `*-comment` modules following the unified comment pattern from `docs/design-comment-logic.md`.
- `currencies`, `department`, `locations`, `period` overlap conceptually with `config/` folder modules but use different controller paths (master-data context).
- `dimension-comment`, `exchange-rate-comment`, `credit-term-comment`, `pricelist-comment`, `pricelist-detail-comment` parent entities are defined elsewhere; these are comment-side-only endpoints in master-data.
- All `*-comment` permission keys are absent from `permission-role-map.json`. Marked with `> Permission key not found in seed; review needed.`

### Task 10b second half — procurement (purchase-request-detail-comment, purchase-request-template, purchase-request-template-comment, request-for-pricing, request-for-pricing-comment, request-for-pricing-detail-comment) (2026-04-29)

No orphans found. All `.bru` files in these 6 modules map to active gateway controllers.

Modules processed (6):
- `purchase-request-detail-comment/` (6 files) → `purchase-request-detail-comment.controller.ts` (`api/:bu_code/purchase-request-detail-comment`) — permission key not in seed; full unified comment pattern
- `purchase-request-template/` (5 files) → `purchase-request-template.controller.ts` (`api/:bu_code/purchase-request-template`) — `procurement.purchase_request_template:{view,create,update,delete}`; view → Requestor, HOD, Purchase, Approval; create/update/delete → Purchase only
- `purchase-request-template-comment/` (6 files) → `purchase-request-template-comment.controller.ts` (`api/:bu_code/purchase-request-template-comment`) — permission key not in seed; full unified comment pattern
- `request-for-pricing/` (5 files) → `request-for-pricing.controller.ts` (`api/:bu_code/request-for-pricing`) — permission key not in seed
- `request-for-pricing-comment/` (6 files) → `request-for-pricing-comment.controller.ts` (`api/:bu_code/request-for-pricing-comment`) — permission key not in seed; full unified comment pattern
- `request-for-pricing-detail-comment/` (6 files) → `request-for-pricing-detail-comment.controller.ts` (`api/:bu_code/request-for-pricing-detail-comment`) — permission key not in seed; full unified comment pattern

Notes:
- `purchase-request-template` uses `KeycloakGuard` only (no `PermissionGuard`) in the gateway controller, but the resource `procurement.purchase_request_template` exists in `permission-role-map.json` with role mappings — docs blocks use seed-derived role assignments.
- `request-for-pricing` and all 4 comment modules (`purchase-request-detail-comment`, `purchase-request-template-comment`, `request-for-pricing-comment`, `request-for-pricing-detail-comment`) have no permission keys in the BU-level seed. All docs blocks carry `> Permission key not found in seed; review needed.`
- `purchase-request-template` body uses `purchase_request_template_detail: { add: [...] }` on create and `{ add, update, delete }` on update — same `details.add` pattern documented in `feedback_details_add_pattern.md`.
- `request-for-pricing` body fields: `name`, `pricelist_template_id`, `start_date`, `end_date`, `custom_message`.
- PATCH verb endpoints in comment modules titled "Patch X" per convention.
- All 34 `.bru` files refreshed with full R7 docs template. body:json blocks filled with realistic request bodies where previously empty (`{}`).
- Sample responses updated to use UUID v7 (`019638a6-2a00-7c4f-8e46-9b7a52c80c4d`) and timestamp `2026-04-29T08:30:00.000Z`. Paginate format updated to 6-field `{ page, perpage, pages, total, prev, next }`.
