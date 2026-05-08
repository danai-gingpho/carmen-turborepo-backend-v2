# Workflow & Approval API

> Base URL: `https://{host}:{port}/api`

## Table of Contents

- [My Approve (Combined)](#my-approve-combined)
- [My Pending — Purchase Requests](#my-pending--purchase-requests)
- [My Pending — Purchase Orders](#my-pending--purchase-orders)
- [My Pending — Store Requisitions](#my-pending--store-requisitions)
- [Workflow Queries](#workflow-queries)

## Overview

Workflow and approval endpoints provide the "My Pending" dashboard functionality, showing documents awaiting the current user's action. Each document type (PR, PO, SR) has its own pending controller with CRUD and workflow actions.

**Authentication:** All endpoints require `KeycloakGuard` + `AppIdGuard` + `x-app-id` header.

---

## My Approve (Combined)

### Get Combined Pending Count

**`GET /api/my-approve/pending`**

**AppIdGuard:** `my-approve.findAllPending.count`

Returns the combined count of all pending approvals across SR, PR, and PO.

**Response:** `200 OK`

```json
{
  "data": {
    "count": 12,
    "sr_count": 3,
    "pr_count": 5,
    "po_count": 4
  }
}
```

---

## My Pending — Purchase Requests

**Base Path:** `/api/my-pending/purchase-request`

### Get Pending PR Count

**`GET /api/my-pending/purchase-request/pending`**

**AppIdGuard:** `my-pending.purchaseRequest.findAllPending.count`

**Response:** `200 OK`

```json
{
  "data": { "count": 5 }
}
```

### List Pending Purchase Requests

**`GET /api/my-pending/purchase-request`**

**AppIdGuard:** `my-pending.purchaseRequest.findAll`

**Response:** `200 OK`

### Get Pending PR Workflow Stages

**`GET /api/my-pending/purchase-request/:bu_code/workflow-stages`**

**AppIdGuard:** `my-pending.purchaseRequest.findAllWorkflowStagesByPr`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bu_code` | string | Yes | Business unit code |

**Response:** `200 OK`

### Get Pending PR by ID

**`GET /api/my-pending/purchase-request/:bu_code/:id`**

**AppIdGuard:** `my-pending.purchaseRequest.findOne`

**Response:** `200 OK`

### Get Pending PRs by Status

**`GET /api/my-pending/purchase-request/:bu_code/status/:status`**

**AppIdGuard:** `my-pending.purchaseRequest.findAllByStatus`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bu_code` | string | Yes | Business unit code |
| `status` | string | Yes | Status filter |

**Response:** `200 OK`

### Create Pending PR

**`POST /api/my-pending/purchase-request/:bu_code`**

**AppIdGuard:** `my-pending.purchaseRequest.create`

**Response:** `201 Created`

### Submit Pending PR

**`PATCH /api/my-pending/purchase-request/:bu_code/:id/submit`**

**AppIdGuard:** `my-pending.purchaseRequest.submit`

**Response:** `200 OK`

### Approve Pending PR

**`PATCH /api/my-pending/purchase-request/:bu_code/:id/approve`**

**AppIdGuard:** `my-pending.purchaseRequest.approve`

**Response:** `200 OK`

### Reject Pending PR

**`PATCH /api/my-pending/purchase-request/:bu_code/:id/reject`**

**AppIdGuard:** `my-pending.purchaseRequest.reject`

**Response:** `200 OK`

### Review Pending PR

**`PATCH /api/my-pending/purchase-request/:bu_code/:id/review`**

**AppIdGuard:** `my-pending.purchaseRequest.review`

Send PR back to a previous workflow stage.

**Response:** `200 OK`

### Save Pending PR

**`PATCH /api/my-pending/purchase-request/:bu_code/:id/save`**

**AppIdGuard:** `my-pending.purchaseRequest.update`

**Response:** `200 OK`

### Delete Pending PR

**`DELETE /api/my-pending/purchase-request/:bu_code/:id`**

**AppIdGuard:** `my-pending.purchaseRequest.delete`

**Response:** `200 OK`

---

## My Pending — Purchase Orders

**Base Path:** `/api/my-pending/purchase-order`

### Get Pending PO Count

**`GET /api/my-pending/purchase-order/pending`**

**AppIdGuard:** `my-pending.purchaseOrder.findAllPending.count`

**Response:** `200 OK`

```json
{
  "data": { "count": 4 }
}
```

### List Pending Purchase Orders

**`GET /api/my-pending/purchase-order`**

**AppIdGuard:** `my-pending.purchaseOrder.findAll`

**Query Parameters:** Standard pagination

**Response:** `200 OK`

### Get Pending PO by ID

**`GET /api/my-pending/purchase-order/:bu_code/:id`**

**AppIdGuard:** `my-pending.purchaseOrder.findOne`

**Response:** `200 OK`

---

## My Pending — Store Requisitions

**Base Path:** `/api/my-pending/store-requisition`

### Get Pending SR Count

**`GET /api/my-pending/store-requisition/pending`**

**AppIdGuard:** `my-pending.storeRequisition.findAllPending.count`

**Response:** `200 OK`

```json
{
  "data": { "count": 3 }
}
```

### List Pending Store Requisitions

**`GET /api/my-pending/store-requisition`**

**AppIdGuard:** `my-pending.storeRequisition.findAll`

**Response:** `200 OK`

### Get Pending SR Workflow Stages

**`GET /api/my-pending/store-requisition/:bu_code/workflow-stages`**

**AppIdGuard:** `my-pending.storeRequisition.findAllWorkflowStagesBySr`

**Response:** `200 OK`

### Get Pending SR by ID

**`GET /api/my-pending/store-requisition/:bu_code/:id`**

**AppIdGuard:** `my-pending.storeRequisition.findOne`

**Response:** `200 OK`

### Get Pending SRs by Status

**`GET /api/my-pending/store-requisition/:bu_code/status/:status`**

**AppIdGuard:** `my-pending.storeRequisition.findAllByStatus`

**Response:** `200 OK`

### Create Pending SR

**`POST /api/my-pending/store-requisition/:bu_code`**

**AppIdGuard:** `my-pending.storeRequisition.create`

**Response:** `201 Created`

### Save Pending SR

**`PATCH /api/my-pending/store-requisition/:bu_code/:id/save`**

**AppIdGuard:** `my-pending.storeRequisition.update`

**Response:** `200 OK`

### Submit Pending SR

**`PATCH /api/my-pending/store-requisition/:bu_code/:id/submit`**

**AppIdGuard:** `my-pending.storeRequisition.submit`

**Response:** `200 OK`

### Approve Pending SR

**`PATCH /api/my-pending/store-requisition/:bu_code/:id/approve`**

**AppIdGuard:** `my-pending.storeRequisition.approve`

**Response:** `200 OK`

### Reject Pending SR

**`PATCH /api/my-pending/store-requisition/:bu_code/:id/reject`**

**AppIdGuard:** `my-pending.storeRequisition.reject`

**Response:** `200 OK`

### Review Pending SR

**`PATCH /api/my-pending/store-requisition/:bu_code/:id/review`**

**AppIdGuard:** `my-pending.storeRequisition.review`

**Response:** `200 OK`

### Delete Pending SR

**`DELETE /api/my-pending/store-requisition/:bu_code/:id`**

**AppIdGuard:** `my-pending.storeRequisition.delete`

**Response:** `200 OK`

---

## Workflow Queries

**Base Path:** `/api/:bu_code/workflow`

### Get Workflow by Document Type

**`GET /api/:bu_code/workflow/type/:type`**

**AppIdGuard:** `workflow.findByType`

Get the workflow definition for a specific document type.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bu_code` | string | Yes | Business unit code |
| `type` | string | Yes | Document type (e.g., `purchase-request`, `purchase-order`, `store-requisition`) |

**Response:** `200 OK` — Serialized with `WorkflowDetailResponseSchema`

```json
{
  "data": {
    "id": "uuid",
    "name": "string",
    "type": "string",
    "stages": [
      {
        "id": "uuid",
        "name": "string",
        "order": 1,
        "roles": ["uuid"]
      }
    ]
  }
}
```

### Get Previous Workflow Stages

**`GET /api/:bu_code/workflow/:workflow_id/previous_stages`**

Get available previous stages for "send back for review" action.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bu_code` | string | Yes | Business unit code |
| `workflow_id` | UUID | Yes | Workflow ID |

**Response:** `200 OK`
