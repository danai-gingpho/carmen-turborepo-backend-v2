# Carmen Hotel Management Backend - AI Coding Agent Instructions

## Architecture Overview

This is a **multi-tenant SaaS hotel management backend** using **Turborepo + NestJS microservices**:

- **Platform/Tenant Separation**: Two distinct Prisma schemas (`prisma-shared-schema-platform/` for system-wide data, `prisma-shared-schema-tenant/` for hotel-specific data)
- **API Gateway Pattern**: `backend-gateway/` (ports 4000/4001 HTTP/HTTPS) routes to microservices via TCP/HTTP
- **Microservice Communication**: Each service runs dual ports (TCP for inter-service, HTTP for direct access)
- **Service Ports**: Authentication (5001/6001), Cluster (5002/6002), License (5003/6003), Reports (5004/6004), Notification (5006/6006), File (5007/6007)

## Critical Development Patterns

### Service Structure
- Each microservice follows: `main.ts` → TCP microservice + HTTP server setup
- Use `@repo/shared-microservice-library` for common DTOs/interfaces
- Environment config via `libs/config.env.ts` in each service
- Winston logging with `BackendLogger` from `common/helpers/backend.logger.ts`

### Database Patterns
- **Platform schema**: Users, roles, business units, licensing (multi-tenant system data)
- **Tenant schema**: Hotel operations (inventory, procurement, products, recipes)
- Both use UUID primary keys with `gen_random_uuid()`
- Audit fields: `created_at`, `created_by_id`, `updated_at`, `updated_by_id`

### Build & Development
```bash
# Essential commands (use these, not npm/yarn)
bun run setup              # Initial setup
bun run dev               # Start all services
bun run dev:base          # Platform services only
bun run dev:tenant        # Tenant services only
turbo run db:generate     # Generate Prisma clients
turbo run build:package   # Build shared packages first
```

## TypeScript Conventions (from cursorrule.cursor)

### Naming & Structure
- **PascalCase**: Classes (`UserService`, `AuthModule`)
- **camelCase**: Variables, methods (`getUserById`, `isActive`)
- **kebab-case**: Files, folders (`micro-authen`, `user-service.ts`)
- **UPPERCASE**: Environment variables (`AUTH_SERVICE_PORT`)
- **Boolean naming**: `isLoading`, `hasError`, `canDelete`
- **One export per file rule**

### Function Guidelines
- Max 20 statements per function
- Use early returns to avoid nesting
- Default parameters over null checks
- Higher-order functions (map/filter/reduce) preferred
- Arrow functions for simple logic (≤3 statements), named functions otherwise

### NestJS Specific
- Modular architecture: one module per domain/route
- Controllers handle routes, Services contain business logic
- Use `@repo/common` pattern for shared decorators, guards, interceptors
- DTOs with Zod validation for inputs, simple types for outputs
- Global exception filter and middleware in gateway

## Key Integration Points

- **Prisma Generation**: Always run `turbo run db:generate` after schema changes
- **Package Dependencies**: Shared packages must build before apps (`build:package` dependency)
- **Docker Services**: Each microservice has individual Dockerfile, orchestrated via docker-compose
- **API Testing**: Bruno collections in `apps/bruno/` for service testing
- **SSL Support**: Gateway runs HTTP/HTTPS with cert files in `src/cert/`

## Common Debugging Commands

```bash
# Check service status
docker-compose ps

# View specific service logs  
docker-compose logs micro-authen

# Database operations
cd packages/prisma-shared-schema-platform
npx prisma migrate dev
npx prisma studio

# Build troubleshooting
turbo run build --filter=micro-authen
```

## File References

- Microservice entry points: `apps/*/src/main.ts`
- Shared types: `packages/shared-microservice-library/src/`
- Environment config: `apps/*/src/libs/config.env.ts`
- Platform DB: `packages/prisma-shared-schema-platform/prisma/schema.prisma`
- Tenant DB: `packages/prisma-shared-schema-tenant/prisma/schema.prisma`
- Build configuration: `turbo.json`, `package.json` scripts