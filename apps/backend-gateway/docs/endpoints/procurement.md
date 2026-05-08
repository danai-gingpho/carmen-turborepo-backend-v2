# Procurement API

> Base URL: `https://{host}:{port}/api/:bu_code`

## Table of Contents

- [Purchase Request (PR)](#purchase-request-pr)
- [Purchase Order (PO)](#purchase-order-po)
- [Good Received Note (GRN)](#good-received-note-grn)
- [Store Requisition (SR)](#store-requisition-sr)
- [Credit Note](#credit-note)
- [Request for Pricing (RFP)](#request-for-pricing-rfp)
- [Purchase Request Comments](#purchase-request-comments)
- [Purchase Request Templates](#purchase-request-templates)
- [Credit Note Reasons](#credit-note-reasons)

## Overview

Procurement endpoints handle the full procurement cycle: purchase requests, purchase orders, goods receiving, store requisitions, credit notes, and pricing requests. Most documents support workflow actions (submit, approve, reject, review).

**Authentication:** All endpoints require `KeycloakGuard` + `AppIdGuard` + `x-app-id` header. PR and PO endpoints additionally use `PermissionGuard`.

---

## Purchase Request (PR)

**Base Path:** `/api/:bu_code/purchase-request`

### List Purchase Requests

**`GET /api/purchase-request`**

> Note: List endpoint does NOT include `:bu_code` prefix.

**AppIdGuard:** `purchaseRequest.findAll`
**Permission:** `procurement.purchase_request: ['view']`

**Query Parameters:** Standard pagination + `search`, `page`, `perPage`, `orderBy`

**Response:** `200 OK` — Serialized with `PurchaseRequestListItemResponseSchema`

---

### Get Workflow Stages

**`GET /api/:bu_code/purchase-request/workflow-stages`**

**AppIdGuard:** `purchaseRequest.findAll`

Returns workflow stage definitions for purchase requests.

**Response:** `200 OK`

---

### Get Purchase Request by ID

**`GET /api/:bu_code/purchase-request/:id`**

**AppIdGuard:** `purchaseRequest.findOne`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bu_code` | string | Yes | Business unit code |
| `id` | UUID | Yes | Purchase request ID |

**Response:** `200 OK` — Serialized with `PurchaseRequestDetailResponseSchema`

---

### Get Purchase Request by Status

**`GET /api/:bu_code/purchase-request/:id/status/:status`**

**AppIdGuard:** `purchaseRequest.approval`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Purchase request ID |
| `status` | string | Yes | Status filter |

**Response:** `200 OK`

---

### Create Purchase Request

**`POST /api/:bu_code/purchase-request`**

**AppIdGuard:** `purchaseRequest.create`

**Request Body:**

```json
{
  "description": "string — optional, PR description",
  "location_id": "uuid — required, requesting location",
  "department_id": "uuid — optional",
  "delivery_date": "string — ISO date",
  "delivery_point_id": "uuid — optional",
  "remark": "string — optional",
  "details": [
    {
      "product_id": "uuid — required",
      "quantity": "number — required",
      "unit_id": "uuid — required",
      "price": "number — optional, estimated price",
      "remark": "string — optional"
    }
  ]
}
```

**Response:** `201 Created`

---

### Duplicate Purchase Requests

**`POST /api/:bu_code/purchase-request/duplicate-pr`**

**AppIdGuard:** `purchaseRequest.duplicatePr`

**Request Body:**

```json
{
  "ids": ["uuid — array of PR IDs to duplicate"]
}
```

**Response:** `201 Created`

---

### Split Purchase Request

**`POST /api/:bu_code/purchase-request/:id/split`**

**AppIdGuard:** `purchaseRequest.split`

Split selected line items into a new purchase request.

**Request Body:**

```json
{
  "detail_ids": ["uuid — array of detail IDs to split off"]
}
```

**Response:** `200 OK`

---

### Submit Purchase Request

**`PATCH /api/:bu_code/purchase-request/:id/submit`**

**AppIdGuard:** `purchaseRequest.submit`

Submit PR to approval workflow.

**Response:** `200 OK`

---

### Approve Purchase Request

**`PATCH /api/:bu_code/purchase-request/:id/approve`**

**AppIdGuard:** `purchaseRequest.approve`

**Response:** `200 OK`

---

### Reject Purchase Request

**`PATCH /api/:bu_code/purchase-request/:id/reject`**

**AppIdGuard:** `purchaseRequest.reject`

**Request Body:**

```json
{
  "reason": "string — rejection reason"
}
```

**Response:** `200 OK`

---

### Review Purchase Request

**`PATCH /api/:bu_code/purchase-request/:id/review`**

**AppIdGuard:** `purchaseRequest.review`

Send PR back for review (to a previous stage).

**Response:** `200 OK`

---

### Save Purchase Request Changes

**`PATCH /api/:bu_code/purchase-request/:id/save`**

**AppIdGuard:** `purchaseRequest.update`

Save incremental changes to PR without submitting.

**Response:** `200 OK`

---

### Export Purchase Request to Excel

**`GET /api/:bu_code/purchase-request/:id/export`**

**AppIdGuard:** `purchaseRequest.export`

**Response:** `200 OK` — Excel file download

---

### Print Purchase Request to PDF

**`GET /api/:bu_code/purchase-request/:id/print`**

**AppIdGuard:** `purchaseRequest.print`

**Response:** `200 OK` — PDF file download

---

### Delete Purchase Request

**`DELETE /api/:bu_code/purchase-request/:id`**

**AppIdGuard:** `purchaseRequest.delete`

**Response:** `200 OK`

---

### Get PR Detail Dimensions

**`GET /api/:bu_code/purchase-request/detail/:detail_id/dimension`**

**AppIdGuard:** `purchaseRequest.detail.findDimensions`

Get cost dimensions for a specific PR line item.

**Response:** `200 OK`

---

### Get PR Detail History

**`GET /api/:bu_code/purchase-request/detail/:detail_id/history`**

**AppIdGuard:** `purchaseRequest.detail.findhistory`

Get change history for a specific PR line item.

**Response:** `200 OK`

---

### Calculate PR Detail Price

**`GET /api/:bu_code/purchase-request/detail/:detail_id/calculate`**

**AppIdGuard:** `purchaseRequest.detail.findhistory`

Calculate price breakdown for a specific PR line item.

**Response:** `200 OK`

---

## Purchase Order (PO)

**Base Path:** `/api/:bu_code/purchase-order`

### Get Purchase Order by ID

**`GET /api/:bu_code/purchase-order/:id`**

**AppIdGuard:** `purchaseOrder.findOne`

**Response:** `200 OK` — Serialized with `PurchaseOrderDetailResponseSchema`

---

### List Purchase Orders

**`GET /api/:bu_code/purchase-order`**

**AppIdGuard:** `purchaseOrder.findAll`

**Query Parameters:** Standard pagination

**Response:** `200 OK`

---

### Create Purchase Order

**`POST /api/:bu_code/purchase-order`**

**AppIdGuard:** `purchaseOrder.create`

**Request Body:**

```json
{
  "vendor_id": "uuid — required",
  "location_id": "uuid — required",
  "delivery_date": "string — ISO date",
  "delivery_point_id": "uuid — optional",
  "credit_term_id": "uuid — optional",
  "currency_id": "uuid — optional",
  "remark": "string — optional",
  "details": [
    {
      "product_id": "uuid — required",
      "quantity": "number — required",
      "unit_id": "uuid — required",
      "price": "number — required",
      "tax_profile_id": "uuid — optional"
    }
  ]
}
```

**Response:** `201 Created`

---

### Full Update Purchase Order

**`PUT /api/:bu_code/purchase-order/:id`**

**AppIdGuard:** `purchaseOrder.update`

**Response:** `200 OK`

---

### Save Purchase Order Changes

**`PATCH /api/:bu_code/purchase-order/:id/save`**

**AppIdGuard:** `purchaseOrder.save`

Incremental update with add/update/remove detail operations.

**Request Body:** `SavePurchaseOrderDto`

```json
{
  "add": [{ "product_id": "uuid", "quantity": 10, "unit_id": "uuid", "price": 100 }],
  "update": [{ "id": "uuid", "quantity": 20 }],
  "remove": ["uuid — detail IDs to remove"]
}
```

**Response:** `200 OK`

---

### Approve Purchase Order

**`PATCH /api/:bu_code/purchase-order/:id/approve`**

**AppIdGuard:** `purchaseOrder.approve`

**Response:** `200 OK`

---

### Reject Purchase Order

**`PATCH /api/:bu_code/purchase-order/:id/reject`**

**AppIdGuard:** `purchaseOrder.reject`

**Response:** `200 OK`

---

### Review Purchase Order

**`PATCH /api/:bu_code/purchase-order/:id/review`**

**AppIdGuard:** `purchaseOrder.review`

**Response:** `200 OK`

---

### Cancel Purchase Order

**`POST /api/:bu_code/purchase-order/:id/cancel`**

**AppIdGuard:** `purchaseOrder.cancel`

**Response:** `200 OK`

---

### Close Purchase Order

**`POST /api/:bu_code/purchase-order/:id/close`**

**AppIdGuard:** `purchaseOrder.close`

Close PO after all goods have been received.

**Response:** `200 OK`

---

### Group PRs for PO Creation (Preview)

**`POST /api/:bu_code/purchase-order/group-pr`**

**AppIdGuard:** `purchaseOrder.groupPr`

Preview how approved PRs would be grouped into POs (by vendor).

**Request Body:**

```json
{
  "pr_ids": ["uuid — array of approved PR IDs"]
}
```

**Response:** `200 OK`

---

### Confirm PRs to Create POs

**`POST /api/:bu_code/purchase-order/confirm-pr`**

**AppIdGuard:** `purchaseOrder.confirmPr`

Convert approved PRs into purchase orders.

**Request Body:**

```json
{
  "pr_ids": ["uuid — array of approved PR IDs"]
}
```

**Response:** `201 Created`

---

### Export Purchase Order to Excel

**`GET /api/:bu_code/purchase-order/:id/export`**

**AppIdGuard:** `purchaseOrder.export`

**Response:** `200 OK` — Excel file download

---

### Print Purchase Order to PDF

**`GET /api/:bu_code/purchase-order/:id/print`**

**AppIdGuard:** `purchaseOrder.print`

**Response:** `200 OK` — PDF file download

---

### List PO Line Items

**`GET /api/:bu_code/purchase-order/:id/details`**

**AppIdGuard:** `purchaseOrder.findOne`

**Response:** `200 OK`

---

### Get PO Line Item by ID

**`GET /api/:bu_code/purchase-order/:id/details/:detail_id`**

**AppIdGuard:** `purchaseOrder.findOne`

**Response:** `200 OK`

---

### Delete PO Line Item

**`DELETE /api/:bu_code/purchase-order/:id/details/:detail_id`**

**AppIdGuard:** `purchaseOrder.update`

**Response:** `200 OK`

---

### Delete Purchase Order

**`DELETE /api/:bu_code/purchase-order/:id`**

**AppIdGuard:** `purchaseOrder.delete`

**Response:** `200 OK`

---

## Good Received Note (GRN)

**Base Path:** `/api/:bu_code/good-received-note`

### Get Pending GRN Count

**`GET /api/good-received-note/pending`**

> Note: No `:bu_code` prefix — returns cross-tenant pending count.

**AppIdGuard:** `goodReceivedNote.findAllPending.count`

**Response:** `200 OK`

```json
{
  "data": { "count": 5 }
}
```

---

### List Good Received Notes

**`GET /api/:bu_code/good-received-note`**

**AppIdGuard:** `goodReceivedNote.findAll`

**Query Parameters:** Standard pagination

**Response:** `200 OK`

---

### Get GRN by ID

**`GET /api/:bu_code/good-received-note/:id`**

**AppIdGuard:** `goodReceivedNote.findOne`

**Response:** `200 OK` — Serialized with `GoodReceivedNoteDetailResponseSchema`

---

### Scan PO QR Code

**`GET /api/:bu_code/good-received-note/scan-po/:qr_code`**

Look up a purchase order by QR code for GRN creation.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `qr_code` | string | Yes | PO QR code |

**Response:** `200 OK`

---

### Manual PO Lookup

**`GET /api/:bu_code/good-received-note/manual-po/:po_no`**

Look up a purchase order by PO number.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `po_no` | string | Yes | PO number |

**Response:** `200 OK`

---

### Create Good Received Note

**`POST /api/:bu_code/good-received-note`**

**AppIdGuard:** `goodReceivedNote.create`

**Response:** `201 Created`

---

### Update Good Received Note

**`PATCH /api/:bu_code/good-received-note/:id`**

**AppIdGuard:** `goodReceivedNote.update`

**Response:** `200 OK`

---

### Approve GRN

**`POST /api/:bu_code/good-received-note/:id/approve`**

**AppIdGuard:** `goodReceivedNote.approve`

Approve and commit received goods to inventory.

**Response:** `200 OK`

---

### Reject GRN

**`POST /api/:bu_code/good-received-note/:id/reject`**

**AppIdGuard:** `goodReceivedNote.reject`

**Response:** `200 OK`

---

### Commit GRN (Mobile)

**`PATCH /api/:bu_code/good-received-note/:id/commit`**

**AppIdGuard:** `goodReceivedNote.commit`

Mobile commit of goods receipt.

**Response:** `200 OK`

---

### Export GRN to Excel

**`GET /api/:bu_code/good-received-note/:id/export`**

**AppIdGuard:** `goodReceivedNote.export`

**Response:** `200 OK` — Excel file download

---

### List GRN Details

**`GET /api/:bu_code/good-received-note/:id/details`**

**AppIdGuard:** `goodReceivedNote.findOne`

**Response:** `200 OK`

---

### Get GRN Detail by ID

**`GET /api/:bu_code/good-received-note/:id/details/:detail_id`**

**AppIdGuard:** `goodReceivedNote.findOne`

**Response:** `200 OK`

---

### Delete GRN Detail

**`DELETE /api/:bu_code/good-received-note/:id/details/:detail_id`**

**AppIdGuard:** `goodReceivedNote.update`

**Response:** `200 OK`

---

### Delete Good Received Note

**`DELETE /api/:bu_code/good-received-note/:id`**

**AppIdGuard:** `goodReceivedNote.delete`

**Response:** `200 OK`

---

## Store Requisition (SR)

**Base Path:** `/api/:bu_code/store-requisition`

### List Store Requisitions

**`GET /api/store-requisition`**

> Note: List endpoint does NOT include `:bu_code` prefix.

**AppIdGuard:** `storeRequisition.findAll`

**Query Parameters:** Standard pagination

**Response:** `200 OK`

---

### Get Store Requisition by ID

**`GET /api/:bu_code/store-requisition/:id`**

**AppIdGuard:** `storeRequisition.findOne`

**Response:** `200 OK` — Serialized with `StoreRequisitionDetailResponseSchema`

---

### Create Store Requisition

**`POST /api/:bu_code/store-requisition`**

**AppIdGuard:** `storeRequisition.create`

**Response:** `201 Created`

---

### Update Store Requisition

**`PUT /api/:bu_code/store-requisition/:id`**

**AppIdGuard:** `storeRequisition.update`

**Response:** `200 OK`

---

### Submit Store Requisition

**`PATCH /api/:bu_code/store-requisition/:id/submit`**

**AppIdGuard:** `storeRequisition.submit`

**Response:** `200 OK`

---

### Approve Store Requisition

**`PATCH /api/:bu_code/store-requisition/:id/approve`**

**AppIdGuard:** `storeRequisition.approve`

**Response:** `200 OK`

---

### Reject Store Requisition

**`PATCH /api/:bu_code/store-requisition/:id/reject`**

**AppIdGuard:** `storeRequisition.reject`

**Response:** `200 OK`

---

### Review Store Requisition

**`PATCH /api/:bu_code/store-requisition/:id/review`**

**AppIdGuard:** `storeRequisition.review`

**Response:** `200 OK`

---

### Get SR Workflow Permission

**`GET /api/:bu_code/store-requisition/:id/workflow-permission`**

**AppIdGuard:** `storeRequisition.getWorkflowPermission`

Check current user's workflow permissions for this SR.

**Response:** `200 OK`

---

### Get SR Workflow Previous Step List

**`GET /api/:bu_code/store-requisition/:id/workflow-previous-step-list`**

**AppIdGuard:** `storeRequisition.getWorkflowPreviousStepList`

Get available targets for "send back for review".

**Response:** `200 OK`

---

### Delete Store Requisition

**`DELETE /api/:bu_code/store-requisition/:id`**

**AppIdGuard:** `storeRequisition.delete`

**Response:** `200 OK`

---

## Credit Note

**Base Path:** `/api/:bu_code/credit-note`

### Get Credit Note by ID

**`GET /api/:bu_code/credit-note/:id`**

**AppIdGuard:** `creditNote.findOne`

**Response:** `200 OK` — Serialized with `CreditNoteDetailResponseSchema`

---

### List Credit Notes

**`GET /api/:bu_code/credit-note`**

**AppIdGuard:** `creditNote.findAll`

**Query Parameters:** Standard pagination

**Response:** `200 OK`

---

### Create Credit Note

**`POST /api/:bu_code/credit-note`**

**AppIdGuard:** `creditNote.create`

**Response:** `201 Created`

---

### Update Credit Note

**`PATCH /api/:bu_code/credit-note/:id`**

**AppIdGuard:** `creditNote.update`

**Response:** `200 OK`

---

### Delete Credit Note

**`DELETE /api/:bu_code/credit-note/:id`**

**AppIdGuard:** `creditNote.delete`

**Response:** `200 OK`

---

## Request for Pricing (RFP)

**Base Path:** `/api/:bu_code/request-for-pricing`

### Get RFP by ID

**`GET /api/:bu_code/request-for-pricing/:id`**

**AppIdGuard:** `requestForPricing.findOne`

**Response:** `200 OK`

---

### List RFPs

**`GET /api/:bu_code/request-for-pricing`**

**AppIdGuard:** `requestForPricing.findAll`

**Query Parameters:** Standard pagination

**Response:** `200 OK`

---

### Create RFP

**`POST /api/:bu_code/request-for-pricing`**

**AppIdGuard:** `requestForPricing.create`

**Response:** `201 Created`

---

### Update RFP

**`PATCH /api/:bu_code/request-for-pricing/:id`**

**AppIdGuard:** `requestForPricing.update`

**Response:** `200 OK`

---

### Delete RFP

**`DELETE /api/:bu_code/request-for-pricing/:id`**

**AppIdGuard:** `requestForPricing.delete`

**Response:** `200 OK`

---

## Purchase Request Comments

**Base Path:** `/api/:bu_code/purchase-request-comment`

Comments and attachments on purchase requests. Uses `KeycloakGuard` + `PermissionGuard`.

### List Comments for Purchase Request

**`GET /api/:bu_code/purchase-request/:purchase_request_id/comments`**

**AppIdGuard:** `purchaseRequestComment.findAll`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bu_code` | string | Yes | Business unit code |
| `purchase_request_id` | UUID | Yes | Purchase request ID |

**Query Parameters:** Standard pagination

**Response:** `200 OK`

---

### Get Comment by ID

**`GET /api/:bu_code/purchase-request-comment/:id`**

**AppIdGuard:** `purchaseRequestComment.findOne`

**Response:** `200 OK`

---

### Create Comment

**`POST /api/:bu_code/purchase-request-comment`**

**AppIdGuard:** `purchaseRequestComment.create`

**Response:** `201 Created`

---

### Update Comment

**`PATCH /api/:bu_code/purchase-request-comment/:id`**

**AppIdGuard:** `purchaseRequestComment.update`

**Response:** `200 OK`

---

### Delete Comment

**`DELETE /api/:bu_code/purchase-request-comment/:id`**

**AppIdGuard:** `purchaseRequestComment.delete`

**Response:** `200 OK`

---

### Add Attachment to Comment

**`POST /api/:bu_code/purchase-request-comment/:id/attachment`**

**AppIdGuard:** `purchaseRequestComment.addAttachment`

**Response:** `201 Created`

---

### Remove Attachment from Comment

**`DELETE /api/:bu_code/purchase-request-comment/:id/attachment/:fileToken`**

**AppIdGuard:** `purchaseRequestComment.removeAttachment`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Comment ID |
| `fileToken` | string | Yes | File token of the attachment |

**Response:** `200 OK`

---

## Purchase Request Templates

**Base Path:** `/api/:bu_code/purchase-request-template`

Manage reusable templates for purchase requests.

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/` | `purchaseRequestTemplate.findAll` | 200 | List templates |
| GET | `/:id` | `purchaseRequestTemplate.findOne` | 200 | Get template by ID |
| POST | `/` | `purchaseRequestTemplate.create` | 201 | Create template |
| PUT | `/:id` | `purchaseRequestTemplate.update` | 200 | Update template |
| DELETE | `/:id` | `purchaseRequestTemplate.delete` | 200 | Delete template |

---

## Credit Note Reasons

**Base Path:** `/api/:bu_code/credit-note-reason`

### List Credit Note Reasons

**`GET /api/:bu_code/credit-note-reason`**

**AppIdGuard:** `creditNoteReason.findAll`

**Query Parameters:** Standard pagination

**Response:** `200 OK`
