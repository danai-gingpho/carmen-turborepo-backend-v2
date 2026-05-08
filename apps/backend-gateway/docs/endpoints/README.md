# Carmen Backend Gateway — API Endpoint Documentation

> Base URL: `https://{host}:{port}` (default HTTP:4000, HTTPS:4001)

## Table of Contents

| Domain | File | Endpoints | Description |
|--------|------|-----------|-------------|
| [Authentication](./authentication.md) | `authentication.md` | 11 | Login, logout, registration, password management |
| [Platform Admin](./platform-admin.md) | `platform-admin.md` | 42 | Clusters, business units, users, roles, permissions |
| [Configuration](./configuration.md) | `configuration.md` | 180+ | All tenant-scoped configuration (products, locations, vendors, workflows, etc.) |
| [Procurement](./procurement.md) | `procurement.md` | 83+ | Purchase requests, purchase orders, GRN, store requisitions, credit notes, RFP, PR comments/templates, credit note reasons |
| [Inventory](./inventory.md) | `inventory.md` | 76+ | Stock in/out, transfers, adjustments, physical counts, spot checks, standalone detail CRUD |
| [Master Data](./master-data.md) | `master-data.md` | 21+ | Application-level read views (products by location, currencies, departments, etc.), token-based price list check |
| [Workflow & Approval](./workflow-approval.md) | `workflow-approval.md` | 40+ | My pending approvals for PR, PO, SR and workflow queries |
| [Notification](./notification.md) | `notification.md` | 3 | Notification proxy to micro-notification service |
| [User Access](./user-access.md) | `user-access.md` | 9 | User profile, permissions, user-location, business unit defaults, activity logs |
| [Document Management](./document-management.md) | `document-management.md` | 6 | File upload, download, metadata, presigned URLs |

## Common Information

### Authentication

All endpoints (except login, register, forgot-password, refresh-token) require:

```
Authorization: Bearer {access_token}
x-app-id: {uuid}
```

- `access_token` is obtained from `POST /api/auth/login`
- `x-app-id` identifies the client application (UUID format)

### Response Wrapper

All responses follow this envelope format:

```json
{
  "data": { ... },
  "status": 200,
  "success": true,
  "message": "Success",
  "timestamp": "2026-03-13T10:00:00.000Z"
}
```

For list endpoints with pagination:

```json
{
  "data": [ ... ],
  "status": 200,
  "success": true,
  "message": "Success",
  "timestamp": "2026-03-13T10:00:00.000Z",
  "pagination": {
    "page": 1,
    "perPage": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Pagination Query Parameters

All list endpoints support:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `search` | string | — | Full-text search across relevant fields |
| `page` | number | 1 | Page number |
| `perPage` | number | 10 | Items per page |
| `orderBy` | string | — | Sort field (e.g., `created_at`) |
| `orderDirection` | string | `desc` | Sort direction: `asc` or `desc` |
| `filter` | string | — | JSON-encoded filter criteria |

### Multi-Tenancy

Most application and configuration endpoints include `:bu_code` in the path:

```
/api/config/{bu_code}/products
/api/{bu_code}/purchase-request
```

The `bu_code` scopes the request to a specific business unit (tenant). The authenticated user must have access to the specified business unit.

### Version Parameter

All endpoints accept an optional `?version=latest` query parameter for API versioning.

### Error Codes

| Status | Description |
|--------|-------------|
| 400 | Bad Request — Validation failed (Zod schema) |
| 401 | Unauthorized — Missing or invalid Bearer token |
| 403 | Forbidden — Insufficient permissions |
| 404 | Not Found — Resource does not exist |
| 409 | Conflict — Duplicate or constraint violation |
| 500 | Internal Server Error |

### Guards

Endpoints are protected by a combination of guards:

1. **KeycloakGuard** — Validates Bearer token via Keycloak, resolves user context and business unit access
2. **PermissionGuard** — Checks granular permissions (applied after KeycloakGuard)
3. **AppIdGuard** — Validates `x-app-id` header and logs endpoint access

Guard order: `KeycloakGuard` → `PermissionGuard` → `AppIdGuard`

### Request Headers (set by KeycloakGuard)

After authentication, the following headers are available internally:

| Header | Description |
|--------|-------------|
| `x-bu-code` | Business unit code(s) |
| `x-bu-id` | Business unit ID(s) |
| `x-bu-role` | Role in business unit(s) |
| `x-bu-datas` | JSON array with full BU details including permissions |

### Health Check

The gateway exposes two root endpoints (excluded from Swagger docs):

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Root endpoint |
| GET | `/health` | Health check endpoint |

These endpoints do not require authentication.
