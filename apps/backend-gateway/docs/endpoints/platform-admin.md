# Platform Admin API

> Base URL: `https://{host}:{port}/api-system`

## Table of Contents

- [Clusters](#clusters)
- [Business Units](#business-units)
- [Platform Users](#platform-users)
- [Application Roles](#application-roles)
- [Application Permissions](#application-permissions)
- [Role-Permission Mapping](#role-permission-mapping)
- [User-Business Unit Assignment](#user-business-unit-assignment)
- [User-Cluster Assignment](#user-cluster-assignment)

## Overview

Platform Admin endpoints manage system-wide resources: organizational structure (clusters, business units), user accounts, and role-based access control. These operate on the **platform schema** (not tenant-scoped).

**Authentication:** All endpoints require `KeycloakGuard` (Bearer token) + `x-app-id` header.

**Common Query Parameters:** All list endpoints support pagination (`search`, `page`, `perPage`, `orderBy`) via `@ApiUserFilterQueries()`.

---

## Clusters

Manage organizational clusters (groups of business units).

### List All Clusters

**`GET /api-system/cluster`**

**AppIdGuard:** `cluster.findAll`

**Query Parameters:** Standard pagination + `search`, `page`, `perPage`, `orderBy`

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "code": "string",
      "description": "string",
      "is_active": true,
      "created_at": "2026-03-13T10:00:00.000Z",
      "updated_at": "2026-03-13T10:00:00.000Z"
    }
  ],
  "status": 200,
  "success": true
}
```

### Get Cluster by ID

**`GET /api-system/cluster/:id`**

**AppIdGuard:** `cluster.findOne`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Cluster ID |

**Response:** `200 OK` — Single cluster object

### Create Cluster

**`POST /api-system/cluster`**

**AppIdGuard:** `cluster.create`

**Request Body:**

```json
{
  "name": "string — required",
  "code": "string — required, unique",
  "description": "string — optional",
  "is_active": "boolean — optional, default true"
}
```

**Response:** `201 Created`

### Update Cluster

**`PUT /api-system/cluster/:id`**

**AppIdGuard:** `cluster.update`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Cluster ID |

**Request Body:** Same as create (all fields optional for update)

**Response:** `200 OK`

### Delete Cluster

**`DELETE /api-system/cluster/:id`**

**AppIdGuard:** `cluster.delete`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Cluster ID |

**Response:** `200 OK`

---

## Business Units

Manage business units (tenants) within clusters.

### List All Business Units

**`GET /api-system/business-unit`**

**AppIdGuard:** `businessUnit.findAll`

**Query Parameters:** Standard pagination

**Response:** `200 OK` — Paginated list of business units

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "code": "string",
      "cluster_id": "uuid",
      "description": "string",
      "is_active": true,
      "created_at": "2026-03-13T10:00:00.000Z"
    }
  ]
}
```

### Get Business Unit by ID

**`GET /api-system/business-unit/:id`**

**AppIdGuard:** `businessUnit.findOne`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Business unit ID |

**Response:** `200 OK`

### Create Business Unit

**`POST /api-system/business-unit`**

**AppIdGuard:** `businessUnit.create`

**Request Body:**

```json
{
  "name": "string — required",
  "code": "string — required, unique",
  "cluster_id": "uuid — required",
  "description": "string — optional",
  "is_active": "boolean — optional, default true"
}
```

**Response:** `201 Created`

### Update Business Unit

**`PUT /api-system/business-unit/:id`**

**AppIdGuard:** `businessUnit.update`

**Response:** `200 OK`

### Delete Business Unit

**`DELETE /api-system/business-unit/:id`**

**AppIdGuard:** `businessUnit.delete`

**Response:** `200 OK`

---

## Platform Users

Manage system user accounts. Syncs with Keycloak.

### Fetch Users from Keycloak

**`POST /api-system/fetch-user`**

**AppIdGuard:** `platform-user.fetch`

Synchronizes user data from Keycloak into the platform database.

**Response:** `200 OK`

### List Users

**`GET /api-system/user`**

**AppIdGuard:** `platform-user.list`

**Query Parameters:** Standard pagination

**Response:** `200 OK` — Paginated user list

```json
{
  "data": [
    {
      "id": "uuid",
      "username": "string",
      "email": "string",
      "first_name": "string",
      "last_name": "string",
      "is_active": true,
      "created_at": "2026-03-13T10:00:00.000Z"
    }
  ]
}
```

### Get User by ID

**`GET /api-system/user/:id`**

**AppIdGuard:** `platform-user.get`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | User ID |

**Response:** `200 OK`

### Create User

**`POST /api-system/user`**

**AppIdGuard:** `platform-user.create`

**Request Body:** `CreatePlatformUserRequestDto`

```json
{
  "username": "string — required",
  "email": "string — required, valid email",
  "first_name": "string — required",
  "last_name": "string — required",
  "is_active": "boolean — optional, default true"
}
```

**Response:** `201 Created`

### Update User

**`PUT /api-system/user/:id`**

**AppIdGuard:** `platform-user.update`

**Request Body:** `UpdatePlatformUserRequestDto` (same fields, all optional)

**Response:** `200 OK`

### Delete User

**`DELETE /api-system/user/:id`**

**AppIdGuard:** `platform-user.delete`

**Response:** `200 OK` (soft delete)

---

## Application Roles

Manage roles that can be assigned to users within business units.

### List All Roles

**`GET /api-system/role`**

**AppIdGuard:** `application-role.findAll`

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "description": "string",
      "is_active": true
    }
  ]
}
```

### Get Role by ID

**`GET /api-system/role/:id`**

**AppIdGuard:** `application-role.findOne`

**Response:** `200 OK`

### Create Role

**`POST /api-system/role`**

**AppIdGuard:** `application-role.create`

**Request Body:**

```json
{
  "name": "string — required",
  "description": "string — optional",
  "is_active": "boolean — optional, default true"
}
```

**Response:** `201 Created`

### Update Role

**`PUT /api-system/role/:id`**

**AppIdGuard:** `application-role.update`

**Response:** `200 OK`

### Delete Role

**`DELETE /api-system/role/:id`**

**AppIdGuard:** `application-role.delete`

**Response:** `200 OK`

---

## Application Permissions

Manage granular permissions that can be assigned to roles.

### List All Permissions

**`GET /api-system/permission`**

**AppIdGuard:** `application-permission.findAll`

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": "uuid",
      "key": "string — e.g., procurement.purchase_request",
      "name": "string",
      "description": "string",
      "actions": ["view", "create", "update", "delete"]
    }
  ]
}
```

### Get Permission by ID

**`GET /api-system/permission/:id`**

**AppIdGuard:** `application-permission.findOne`

**Response:** `200 OK`

### Create Permission

**`POST /api-system/permission`**

**AppIdGuard:** `application-permission.create`

**Request Body:**

```json
{
  "key": "string — required, unique identifier",
  "name": "string — required",
  "description": "string — optional",
  "actions": ["string — array of allowed actions"]
}
```

**Response:** `201 Created`

### Update Permission

**`PUT /api-system/permission/:id`**

**AppIdGuard:** `application-permission.update`

**Response:** `200 OK`

### Delete Permission

**`DELETE /api-system/permission/:id`**

**AppIdGuard:** `application-permission.delete`

**Response:** `200 OK`

---

## Role-Permission Mapping

Assign and remove permissions from roles.

### Get Permissions by Role

**`GET /api-system/role-permission/role/:roleId/permissions`**

**AppIdGuard:** `application-role-permission.getPermissionsByRole`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `roleId` | UUID | Yes | Role ID |

**Response:** `200 OK` — List of permissions assigned to the role

### Get Roles by Permission

**`GET /api-system/role-permission/permission/:permissionId/roles`**

**AppIdGuard:** `application-role-permission.getRolesByPermission`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `permissionId` | UUID | Yes | Permission ID |

**Response:** `200 OK` — List of roles that have this permission

### Assign Permissions to Role (Bulk)

**`POST /api-system/role-permission/assign-permissions`**

**AppIdGuard:** `application-role-permission.assignPermissionsToRole`

**Request Body:**

```json
{
  "role_id": "uuid — required",
  "permission_ids": ["uuid — array of permission IDs"]
}
```

**Response:** `200 OK`

### Assign Single Permission to Role

**`POST /api-system/role-permission/assign-permission`**

**AppIdGuard:** `application-role-permission.assignPermissionToRole`

**Request Body:**

```json
{
  "role_id": "uuid — required",
  "permission_id": "uuid — required"
}
```

**Response:** `200 OK`

### Remove Permissions from Role (Bulk)

**`DELETE /api-system/role-permission/remove-permissions`**

**AppIdGuard:** `application-role-permission.removePermissionsFromRole`

**Request Body:**

```json
{
  "role_id": "uuid — required",
  "permission_ids": ["uuid — array of permission IDs"]
}
```

**Response:** `200 OK`

### Remove Single Permission from Role

**`DELETE /api-system/role-permission/remove-permission`**

**AppIdGuard:** `application-role-permission.removePermissionFromRole`

**Request Body:**

```json
{
  "role_id": "uuid — required",
  "permission_id": "uuid — required"
}
```

**Response:** `200 OK`

---

## User-Business Unit Assignment

Manage user assignments to business units.

### List All User-Business Unit Mappings

**`GET /api-system/user/business-unit`**

**AppIdGuard:** `userBusinessUnit.findAll`

**Query Parameters:** Standard pagination

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "business_unit_id": "uuid",
      "role_id": "uuid",
      "is_active": true
    }
  ]
}
```

### Get User-Business Unit by ID

**`GET /api-system/user/business-unit/:id`**

**AppIdGuard:** `userBusinessUnit.findOne`

**Response:** `200 OK`

### Create User-Business Unit Assignment

**`POST /api-system/user/business-unit`**

**AppIdGuard:** `userBusinessUnit.create`

**Request Body:**

```json
{
  "user_id": "uuid — required",
  "business_unit_id": "uuid — required",
  "role_id": "uuid — required"
}
```

**Response:** `201 Created`

### Update User-Business Unit Assignment

**`PATCH /api-system/user/business-unit/:id`**

**AppIdGuard:** `userBusinessUnit.update`

**Response:** `200 OK`

### Delete User-Business Unit Assignment

**`DELETE /api-system/user/business-unit/:id`**

**AppIdGuard:** `userBusinessUnit.delete`

**Response:** `200 OK`

---

## User-Cluster Assignment

Manage user assignments to clusters.

### List All User-Cluster Mappings

**`GET /api-system/user/cluster`**

**AppIdGuard:** `userCluster.findAll`

**Query Parameters:** Standard pagination

**Response:** `200 OK`

### Get User-Cluster by ID

**`GET /api-system/user/cluster/:id`**

**AppIdGuard:** `userCluster.findOne`

**Response:** `200 OK`

### Create User-Cluster Assignment

**`POST /api-system/user/cluster`**

**AppIdGuard:** `userCluster.create`

**Request Body:**

```json
{
  "user_id": "uuid — required",
  "cluster_id": "uuid — required"
}
```

**Response:** `201 Created`

### Update User-Cluster Assignment

**`PUT /api-system/user/cluster/:id`**

**AppIdGuard:** `userCluster.update`

**Response:** `200 OK`

### Delete User-Cluster Assignment

**`DELETE /api-system/user/cluster/:id`**

**AppIdGuard:** `userCluster.delete`

**Response:** `200 OK`
