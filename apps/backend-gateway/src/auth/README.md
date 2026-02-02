# Authentication & Authorization Module

This module provides Keycloak-based authentication and role-based permission management for the Carmen backend gateway.

## Architecture Overview

### Components

1. **Guards**
   - `KeycloakGuard`: Handles authentication, BU validation, and user context setup
   - `PermissionGuard`: Validates user permissions against route requirements

2. **Services**
   - `PermissionService`: Centralized service for fetching and checking user permissions

3. **Strategies**
   - `KeycloakStrategy`: Passport strategy for validating Keycloak tokens

4. **Decorators**
   - `@Permission()`: Route-level decorator for specifying required permissions

5. **Interfaces**
   - Shared TypeScript interfaces for type safety across the auth module

## Usage

### Basic Controller Setup

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { PermissionGuard } from 'src/auth/guards/permission.guard';
import { Permission } from 'src/auth/decorators/permission.decorator';

@Controller('api')
@UseGuards(KeycloakGuard, PermissionGuard)
export class MyController {

  // No specific permission required - authenticated users only
  @Get('basic-endpoint')
  async basicEndpoint() {
    return { message: 'Accessible by any authenticated user' };
  }

  // Requires specific permission
  @Get('protected-endpoint')
  @Permission({ 'procurement.purchase_request': ['view'] })
  async protectedEndpoint() {
    return { message: 'Accessible only with view permission' };
  }

  // Requires multiple permissions
  @Get('admin-endpoint')
  @Permission({
    'procurement.purchase_request': ['view', 'create'],
    'master.vendor': ['view']
  })
  async adminEndpoint() {
    return { message: 'Accessible with multiple permissions' };
  }
}
```

### Permission Naming Convention

**Resource Format**: Use dot notation
- Example: `procurement.purchase_request`, `master.vendor`

**Action Format**: Use underscore
- Basic: `view`, `create`, `update`, `delete`
- Hierarchical: `view_all`, `view_department`, `create_draft`

**Hierarchical Matching**:
- `view_all` or `view_department` will satisfy `view` requirement
- More specific permissions inherit base permissions

### Business Unit (BU) Validation

The `KeycloakGuard` automatically validates BU access. BU codes can be passed via:

**Query Parameter:**
```
GET /api/C1/purchase-request?bu_code=C1
GET /api/purchase-request?bu_code=C1,C2  // Multiple BUs
```

**Path Parameter:**
```
GET /api/C1/purchase-request/123
```

Headers are automatically set based on BU validation:
- `x-bu-code`: BU code(s)
- `x-bu-role`: User's role in the BU
- `x-bu-id`: BU identifier
- `x-bu-datas`: JSON array with full BU details

## Authentication Flow

```
1. Request arrives with Bearer token
   ↓
2. KeycloakGuard validates token with Keycloak
   ↓
3. KeycloakGuard validates BU access
   ↓
4. PermissionService fetches user permissions from database
   ↓
5. User context attached to request
   ↓
6. PermissionGuard checks required permissions (if @Permission decorator present)
   ↓
7. Request proceeds to controller
```

## Permission Service API

The `PermissionService` provides methods for working with permissions:

### `getUserPermissions(userId: string)`
Fetches all permissions for a user from the database.

**Returns:** `Promise<UserPermissions>`
```typescript
{
  "procurement.purchase_request": ["view", "create", "update"],
  "master.vendor": ["view"]
}
```

### `hasPermission(userPermissions, resource, actions)`
Checks if user has specific permissions for a resource.

**Parameters:**
- `userPermissions`: User's permission object
- `resource`: Resource name (e.g., 'procurement.purchase_request')
- `actions`: Array of required actions (e.g., ['view', 'create'])

**Returns:** `boolean`

### `hasAllPermissions(userPermissions, requiredPermissions)`
Checks if user has all required permissions across multiple resources.

**Parameters:**
- `userPermissions`: User's permission object
- `requiredPermissions`: Object with required permissions

**Returns:** `boolean`

## Database Schema

Permissions are stored in the following tables:

```
tb_user_tb_application_role
  ├─ user_id (FK)
  └─ application_role_id (FK)
      └─ tb_application_role
          └─ tb_application_role_tb_permission
              └─ permission_id (FK)
                  └─ tb_permission
                      ├─ resource (string)
                      └─ action (string)
```

## Error Handling

The guards throw `UnauthorizedException` with descriptive messages:

- **Authentication Failed**: Invalid or missing token
- **BU Access Denied**: User doesn't have access to requested BU
- **Permission Denied**: User lacks required permissions

## Logging

All guards and services use `BackendLogger` for consistent logging:

- **Debug**: Permission checks, successful operations
- **Warn**: Failed authorization attempts
- **Error**: Service failures, database errors

## Type Safety

All components use TypeScript interfaces for type safety:

- `AuthenticatedUser`: User data attached to request
- `ValidatedUser`: User data from Keycloak
- `BusinessUnit`: BU information
- `KeycloakUserInfo`: Raw Keycloak user info
- `UserPermissions`: Permission object format

## Best Practices

1. **Always use both guards together** for protected routes:
   ```typescript
   @UseGuards(KeycloakGuard, PermissionGuard)
   ```

2. **Apply guards at controller level** for consistency:
   ```typescript
   @Controller('api')
   @UseGuards(KeycloakGuard, PermissionGuard)
   export class MyController {}
   ```

3. **Use @Permission decorator only when needed**:
   - Omit for routes accessible to all authenticated users
   - Add for routes requiring specific permissions

4. **Follow permission naming conventions**:
   - Resources: dot.notation
   - Actions: underscore_notation

5. **Leverage hierarchical permissions**:
   - Define specific permissions (view_all, view_department)
   - They automatically satisfy base requirements (view)

## Testing

When testing controllers with these guards:

```typescript
// Mock the guards
const mockKeycloakGuard = { canActivate: jest.fn(() => true) };
const mockPermissionGuard = { canActivate: jest.fn(() => true) };

// Override guards in test module
.overrideGuard(KeycloakGuard)
.useValue(mockKeycloakGuard)
.overrideGuard(PermissionGuard)
.useValue(mockPermissionGuard)
```

## Migration from Old Code

If migrating from the old implementation:

1. ✅ Imports updated to use shared interfaces
2. ✅ Console.log statements removed
3. ✅ Permission logic extracted to service
4. ✅ Better error messages
5. ✅ Improved type safety
6. ✅ Single Responsibility Principle applied

No changes required in controller code - the API remains the same!
