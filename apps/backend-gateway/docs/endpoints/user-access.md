# User Access API

> Base URL: `https://{host}:{port}/api`

## Table of Contents

- [User Profile & Permissions](#user-profile--permissions)
- [User Location](#user-location)
- [User Business Unit](#user-business-unit)
- [Activity Log](#activity-log)

## Overview

User access endpoints manage the authenticated user's location access, default business unit, and activity logging.

**Authentication:** All endpoints require `KeycloakGuard` + `AppIdGuard` + `x-app-id` header.

---

## User Profile & Permissions

### Get User Profile

**`GET /api/user/profile`**

**AppIdGuard:** `user.getProfile`

Get the authenticated user's profile information.

**Response:** `200 OK`

---

### Get User Permissions

**`GET /api/user/permission`**

Get the authenticated user's permission set across all business units.

**Response:** `200 OK`

---

### List Users in Tenant

**`GET /api/:bu_code/users`**

**AppIdGuard:** `user.getAllUserInTenant`

List all users within the specified business unit/tenant.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bu_code` | string | Yes | Business unit code |

**Query Parameters:** Standard pagination

**Response:** `200 OK`

---

### Update User Profile

**`PUT /api/user/:user_id`**

**AppIdGuard:** `user.updateUserById`

Update a user's profile information.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user_id` | UUID | Yes | Target user ID |

**Response:** `200 OK`

---

## User Location

### Get User's Accessible Locations

**`GET /api/:bu_code/user-location`**

**AppIdGuard:** `userLocation.findAll`

Returns locations the authenticated user has access to within the specified business unit.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bu_code` | string | Yes | Business unit code |

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "code": "string",
      "type": "string",
      "is_active": true
    }
  ]
}
```

---

## User Business Unit

### Set Default Business Unit

**`POST /api/business-unit/default`**

**AppIdGuard:** `userBusinessUnit.setDefaultTenant`

Set the user's default tenant/business unit for the application.

**Request Body:**

```json
{
  "tenant_id": "uuid — required, business unit ID to set as default"
}
```

**Response:** `200 OK`

```json
{
  "data": {
    "message": "Default business unit set successfully"
  }
}
```

---

## Activity Log

### List Activity Logs

**`GET /api/:bu_code/activity-log`**

**AppIdGuard:** `activityLog.findAll`

View audit trail of user actions within the business unit.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bu_code` | string | Yes | Business unit code |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `entity_type` | string | No | Filter by entity type (e.g., `purchase-request`, `product`) |
| `entity_id` | UUID | No | Filter by specific entity ID |
| `actor_id` | UUID | No | Filter by user who performed the action |
| `action` | string | No | Filter by action type (e.g., `create`, `update`, `delete`) |
| `start_date` | string | No | Filter from date (ISO format) |
| `end_date` | string | No | Filter to date (ISO format) |
| `search` | string | No | Full-text search |
| `page` | number | No | Page number (default: 1) |
| `perPage` | number | No | Items per page (default: 10) |

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": "uuid",
      "entity_type": "string",
      "entity_id": "uuid",
      "action": "string",
      "actor_id": "uuid",
      "actor_name": "string",
      "changes": {},
      "created_at": "2026-03-13T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 10,
    "total": 100
  }
}
```
