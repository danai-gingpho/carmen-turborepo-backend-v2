# Testing Guide for Refactored Guards

## Fixed Issues

### Problem
The `PermissionGuard` and `KeycloakGuard` were not properly injectable because:
1. The `AuthModule` was not a global module
2. The guards were not properly exported
3. The `KeycloakGuard` was missing from the providers/exports

### Solution
1. ✅ Made `AuthModule` a `@Global()` module
2. ✅ Added `KeycloakGuard` to providers and exports
3. ✅ Guards and `PermissionService` are now available throughout the app

## How to Test

### 1. Build Test
```bash
npm run build
# Should compile without errors ✅
```

### 2. Start the Application
```bash
npm run start:dev
```

### 3. Test Authentication Flow

#### Test 1: Unauthenticated Request
```bash
curl -X GET http://localhost:4000/api/purchase-request
```

**Expected Result:** `401 Unauthorized - Authentication failed`

#### Test 2: Authenticated Request (No Permission Required)
```bash
TOKEN="your-keycloak-token"
curl -X GET "http://localhost:4000/api/C1/purchase-request/123" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Result:**
- ✅ If token valid and user has BU access: Returns data
- ❌ If BU access denied: `401 Unauthorized - Access denied. You do not have permission for the following BU code(s): C1`

#### Test 3: Authenticated Request (Permission Required)
```bash
TOKEN="your-keycloak-token"
curl -X GET "http://localhost:4000/api/purchase-request?bu_code=C1" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Result:**
- ✅ If user has `procurement.purchase_request:view` permission: Returns data
- ❌ If user lacks permission: `401 Unauthorized - Permission denied: You do not have the required permissions to access this resource`

### 4. Check Logs

The refactored guards now use `BackendLogger` instead of `console.log`. Look for:

```
[KeycloakGuard] User authenticated and authorized for BU codes
[PermissionGuard] Checking permissions
[PermissionGuard] Permission check passed
```

Or for failures:

```
[KeycloakGuard] User attempted to access unauthorized BU codes
[PermissionGuard] Permission denied: User lacks required permissions
```

## Testing Different Scenarios

### Scenario 1: Multiple BU Codes
```bash
curl -X GET "http://localhost:4000/api/purchase-request?bu_code=C1,C2" \
  -H "Authorization: Bearer $TOKEN"
```

### Scenario 2: Multiple Permissions Required
The route with multiple permissions:
```typescript
@Permission({
  'procurement.purchase_request': ['view', 'create'],
  'master.vendor': ['view']
})
```

User must have ALL specified permissions.

### Scenario 3: Hierarchical Permissions
If user has `procurement.purchase_request:view_all`, they automatically satisfy `view` requirement.

## Debugging Tips

### Enable Debug Logging
Set environment variable:
```bash
LOG_LEVEL=debug npm run start:dev
```

### Check User Permissions
The `KeycloakGuard` fetches and logs permissions. Check logs for:
```
[PermissionService] User permissions fetched successfully
```

### Verify Guard Order
Guards MUST be in this order:
```typescript
@UseGuards(KeycloakGuard, PermissionGuard)
```

**Why?** `KeycloakGuard` sets `request.user.permissions`, which `PermissionGuard` needs.

## Common Issues & Solutions

### Issue 1: "Cannot inject dependencies"
**Cause:** `AuthModule` not global or guards not exported
**Solution:** ✅ Already fixed - `AuthModule` is now `@Global()`

### Issue 2: "Permission denied" even with correct permissions
**Cause:** Permission resource or action name mismatch
**Debug:**
1. Check the `@Permission()` decorator on the route
2. Check the database: `tb_permission` table
3. Ensure resource uses dot notation: `procurement.purchase_request`
4. Ensure actions match exactly: `view`, not `read`

### Issue 3: "User not authenticated" in PermissionGuard
**Cause:** `KeycloakGuard` not running before `PermissionGuard`
**Solution:** Ensure guard order: `@UseGuards(KeycloakGuard, PermissionGuard)`

### Issue 4: Permissions not updating
**Cause:** No caching implemented yet, should update on every request
**Debug:** Check database directly and restart the application

## Integration Test Example

```typescript
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Purchase Request Permission (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it('should deny access without token', () => {
    return request(app.getHttpServer())
      .get('/api/purchase-request?bu_code=C1')
      .expect(401);
  });

  it('should deny access without permission', () => {
    // Mock a token without purchase_request:view permission
    const tokenWithoutPermission = 'mock-token-no-permission';

    return request(app.getHttpServer())
      .get('/api/purchase-request?bu_code=C1')
      .set('Authorization', `Bearer ${tokenWithoutPermission}`)
      .expect(401);
  });

  it('should allow access with correct permission', () => {
    // Mock a token with purchase_request:view permission
    const tokenWithPermission = 'mock-token-with-permission';

    return request(app.getHttpServer())
      .get('/api/purchase-request?bu_code=C1')
      .set('Authorization', `Bearer ${tokenWithPermission}`)
      .expect(200);
  });

  afterAll(async () => {
    await app.close();
  });
});
```

## Verification Checklist

- ✅ Application builds without errors
- ✅ Application starts without errors
- ✅ Unauthenticated requests are rejected
- ✅ Authenticated requests without BU access are rejected
- ✅ Authenticated requests without required permissions are rejected
- ✅ Authenticated requests with correct permissions are allowed
- ✅ Logs show proper debug information (no console.log)
- ✅ Error messages are descriptive

## Next Steps

1. **Add Caching**: Implement Redis caching in `PermissionService`
2. **Add Metrics**: Track permission checks and failures
3. **Add Tests**: Write comprehensive unit and integration tests
4. **Add Documentation**: Update API documentation with permission requirements

## Support

If you encounter issues:
1. Check the logs for detailed error messages
2. Verify the database has correct permissions
3. Ensure Keycloak is configured correctly
4. Review the [README.md](./README.md) for architecture details
