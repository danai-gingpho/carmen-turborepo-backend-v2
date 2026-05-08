# Inventory API

> Base URL: `https://{host}:{port}/api/:bu_code`

## Table of Contents

- [Stock In](#stock-in)
- [Stock Out](#stock-out)
- [Transfer](#transfer)
- [Inventory Adjustment](#inventory-adjustment)
- [Physical Count](#physical-count)
- [Physical Count Period](#physical-count-period)
- [Spot Check](#spot-check)
- [Stock In Details (Standalone)](#stock-in-details-standalone)
- [Stock Out Details (Standalone)](#stock-out-details-standalone)
- [Transfer Details (Standalone)](#transfer-details-standalone)
- [Inventory Transaction (Test)](#inventory-transaction-test)

## Overview

Inventory endpoints manage stock movements: receiving (stock-in), issuing (stock-out), transfers between locations, adjustments, physical counts, and spot checks. Stock-in, stock-out, and transfer documents support line-item detail sub-resources.

**Authentication:** All endpoints require `KeycloakGuard` + `AppIdGuard` + `x-app-id` header.

---

## Stock In

**Base Path:** `/api/:bu_code/stock-in`

Record goods received into inventory (outside of GRN flow).

### Header Endpoints

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/` | `stockIn.findAll` | 200 | List stock-in documents |
| GET | `/:id` | `stockIn.findOne` | 200 | Get stock-in by ID |
| POST | `/` | `stockIn.create` | 201 | Create stock-in document |
| PATCH | `/:id` | `stockIn.update` | 200 | Update stock-in document |
| DELETE | `/:id` | `stockIn.delete` | 200 | Delete stock-in document |

### Detail (Line Item) Endpoints

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/:id/details` | `stockIn.findOne` | 200 | List all line items |
| GET | `/:id/details/:detail_id` | `stockIn.findOne` | 200 | Get line item by ID |
| POST | `/:id/details` | `stockIn.update` | 201 | Add line item |
| PUT | `/:id/details/:detail_id` | `stockIn.update` | 200 | Update line item |
| DELETE | `/:id/details/:detail_id` | `stockIn.update` | 200 | Delete line item |

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bu_code` | string | Yes | Business unit code |
| `id` | UUID | Yes | Stock-in document ID |
| `detail_id` | UUID | Yes | Line item ID (detail endpoints only) |

---

## Stock Out

**Base Path:** `/api/:bu_code/stock-out`

Record goods issued from inventory.

### Header Endpoints

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/` | `stockOut.findAll` | 200 | List stock-out documents |
| GET | `/:id` | `stockOut.findOne` | 200 | Get stock-out by ID |
| POST | `/` | `stockOut.create` | 201 | Create stock-out document |
| PATCH | `/:id` | `stockOut.update` | 200 | Update stock-out document |
| DELETE | `/:id` | `stockOut.delete` | 200 | Delete stock-out document |

### Detail (Line Item) Endpoints

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/:id/details` | `stockOut.findOne` | 200 | List all line items |
| GET | `/:id/details/:detail_id` | `stockOut.findOne` | 200 | Get line item by ID |
| POST | `/:id/details` | `stockOut.update` | 201 | Add line item |
| PUT | `/:id/details/:detail_id` | `stockOut.update` | 200 | Update line item |
| DELETE | `/:id/details/:detail_id` | `stockOut.update` | 200 | Delete line item |

---

## Transfer

**Base Path:** `/api/:bu_code/transfer`

Transfer stock between locations within the same business unit.

### Header Endpoints

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/` | `transfer.findAll` | 200 | List transfer documents |
| GET | `/:id` | `transfer.findOne` | 200 | Get transfer by ID |
| POST | `/` | `transfer.create` | 201 | Create transfer document |
| PATCH | `/:id` | `transfer.update` | 200 | Update transfer document |
| DELETE | `/:id` | `transfer.delete` | 200 | Delete transfer document |

### Detail (Line Item) Endpoints

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/:id/details` | `transfer.findOne` | 200 | List all line items |
| GET | `/:id/details/:detail_id` | `transfer.findOne` | 200 | Get line item by ID |
| POST | `/:id/details` | `transfer.update` | 201 | Add line item |
| PUT | `/:id/details/:detail_id` | `transfer.update` | 200 | Update line item |
| DELETE | `/:id/details/:detail_id` | `transfer.update` | 200 | Delete line item |

---

## Inventory Adjustment

**Base Path:** `/api/:bu_code/inventory-adjustment`

View inventory adjustments (created by stock-in/stock-out operations).

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/` | `inventoryAdjustment.findAll` | 200 | List adjustments |
| GET | `/:id` | `inventoryAdjustment.findOne` | 200 | Get adjustment by ID |

**Additional Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | No | Filter by type: `stock-in` or `stock-out` |

---

## Physical Count

**Base Path:** `/api/:bu_code/physical-count`

Full physical inventory count process with review and approval workflow.

### Pending Count (Cross-Tenant)

**`GET /api/physical-count/pending`**

> Note: No `:bu_code` prefix — returns cross-tenant pending count.

**AppIdGuard:** `physicalCount.findAllPending.count`

**Response:** `200 OK`

```json
{
  "data": { "count": 3 }
}
```

### CRUD Endpoints

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/` | `physicalCount.findAll` | 200 | List physical counts |
| GET | `/:id` | `physicalCount.findOne` | 200 | Get physical count by ID |
| POST | `/` | `physicalCount.create` | 201 | Create physical count |
| PATCH | `/:id` | `physicalCount.update` | 200 | Update physical count |
| DELETE | `/:id` | `physicalCount.delete` | 200 | Delete physical count |

### Detail Endpoints

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/:id/details` | `physicalCount.findOne` | 200 | List counted items |
| GET | `/:id/details/:detail_id` | `physicalCount.findOne` | 200 | Get counted item by ID |
| DELETE | `/:id/details/:detail_id` | `physicalCount.update` | 200 | Delete counted item |

### Workflow Endpoints

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| PATCH | `/:id/save` | `physicalCount.save` | 200 | Save count items |
| PATCH | `/:id/review` | `physicalCount.review` | 200 | Submit review with variance notes |
| GET | `/:id/review` | `physicalCount.getReview` | 200 | Get review status |
| PATCH | `/:id/submit` | `physicalCount.submit` | 200 | Submit physical count for approval |

### Comment Endpoints

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| POST | `/:id/details/:detail_id/comments` | `physicalCount.createComment` | 201 | Add comment to a counted item |

---

## Physical Count Period

**Base Path:** `/api/:bu_code/physical-count-period`

Manage periods during which physical counts can be conducted.

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/current` | `physicalCountPeriod.current` | 200 | Get current active period |
| GET | `/` | `physicalCountPeriod.findAll` | 200 | List all periods |
| GET | `/:id` | `physicalCountPeriod.findOne` | 200 | Get period by ID |
| POST | `/` | `physicalCountPeriod.create` | 201 | Create period |
| PATCH | `/:id` | `physicalCountPeriod.update` | 200 | Update period |
| DELETE | `/:id` | `physicalCountPeriod.delete` | 200 | Delete period |

---

## Spot Check

**Base Path:** `/api/:bu_code/spot-check`

Random/targeted inventory verification with review workflow.

### Pending Count (Cross-Tenant)

**`GET /api/spot-check/pending`**

> Note: No `:bu_code` prefix.

**AppIdGuard:** `spotCheck.findAllPending.count`

**Response:** `200 OK`

### CRUD Endpoints

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/` | `spotCheck.findAll` | 200 | List spot checks |
| GET | `/:id` | `spotCheck.findOne` | 200 | Get spot check by ID |
| POST | `/` | `spotCheck.create` | 201 | Create spot check |
| PATCH | `/:id` | `spotCheck.update` | 200 | Update spot check |
| DELETE | `/:id` | `spotCheck.delete` | 200 | Delete spot check |

### Detail Endpoints

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/:id/details` | `spotCheck.findOne` | 200 | List checked items |
| GET | `/:id/details/:detail_id` | `spotCheck.findOne` | 200 | Get checked item by ID |
| DELETE | `/:id/details/:detail_id` | `spotCheck.update` | 200 | Delete checked item |

### Workflow Endpoints

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| PATCH | `/:id/save` | `spotCheck.save` | 200 | Save check items |
| PATCH | `/:id/review` | `spotCheck.review` | 200 | Submit review |
| GET | `/:id/review` | `spotCheck.getReview` | 200 | Get review status |
| PATCH | `/:id/submit` | `spotCheck.submit` | 200 | Submit for approval |
| POST | `/:id/reset` | `spotCheck.reset` | 200 | Reset spot check |

### Product Lookup

**`GET /api/:bu_code/locations/:location_id/products`**

**AppIdGuard:** `spotCheck.getProductsByLocation`

Get available products at a location for spot checking.

**Response:** `200 OK`

---

## Stock In Details (Standalone)

**Base Path:** `/api/:bu_code/stock-in-detail`

Standalone CRUD for stock-in line items, separate from the nested `/stock-in/:id/details` endpoints.

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/` | `stockInDetail.findAll` | 200 | List stock-in details |
| GET | `/:id` | `stockInDetail.findOne` | 200 | Get detail by ID |
| POST | `/` | `stockInDetail.create` | 201 | Create stock-in detail |
| PATCH | `/:id` | `stockInDetail.update` | 200 | Update stock-in detail |
| DELETE | `/:id` | `stockInDetail.delete` | 200 | Delete stock-in detail |

---

## Stock Out Details (Standalone)

**Base Path:** `/api/:bu_code/stock-out-detail`

Standalone CRUD for stock-out line items, separate from the nested `/stock-out/:id/details` endpoints.

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/` | `stockOutDetail.findAll` | 200 | List stock-out details |
| GET | `/:id` | `stockOutDetail.findOne` | 200 | Get detail by ID |
| POST | `/` | `stockOutDetail.create` | 201 | Create stock-out detail |
| PATCH | `/:id` | `stockOutDetail.update` | 200 | Update stock-out detail |
| DELETE | `/:id` | `stockOutDetail.delete` | 200 | Delete stock-out detail |

---

## Transfer Details (Standalone)

**Base Path:** `/api/:bu_code/transfer-detail`

Standalone CRUD for transfer line items, separate from the nested `/transfer/:id/details` endpoints.

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/` | `transferDetail.findAll` | 200 | List transfer details |
| GET | `/:id` | `transferDetail.findOne` | 200 | Get detail by ID |
| POST | `/` | `transferDetail.create` | 201 | Create transfer detail |
| PATCH | `/:id` | `transferDetail.update` | 200 | Update transfer detail |
| DELETE | `/:id` | `transferDetail.delete` | 200 | Delete transfer detail |

---

## Inventory Transaction (Test)

**Base Path:** `/api/:bu_code/inventory-transaction`

> **Deprecated:** Test endpoint — will be removed when GRN integration is verified.

### Test Create from GRN

**`POST /api/:bu_code/inventory-transaction/test-create-from-grn`**

Test endpoint for creating inventory transactions from a Good Received Note.

**Response:** `201 Created`
