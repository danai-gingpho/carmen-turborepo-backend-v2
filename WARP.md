# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a TypeScript Turborepo monorepo for Carmen Software's hotel management backend system. It implements a microservices architecture using NestJS with the following key characteristics:

- **Multi-tenant SaaS platform** supporting hotel operations
- **Platform/tenant separation** with dedicated Prisma schemas for each
- **Microservice-based architecture** with API Gateway pattern
- **Domain-driven design** with separate services for authentication, notifications, inventory, procurement, etc.

## Repository Structure

```
apps/                           # Microservice applications
├── backend-gateway/           # API Gateway (HTTP/HTTPS on ports 4000)
├── micro-authen/             # Authentication service (TCP:5001, HTTP:6001)
├── micro-cluster/            # Cluster management (TCP:5002, HTTP:6002)
├── micro-file/               # File management (TCP:5007, HTTP:6007)
├── micro-license/            # License management (TCP:5003, HTTP:6003)
├── micro-notification/       # Notification service (TCP:5006, HTTP:6006)
├── micro-reports/            # Reporting service (TCP:5004, HTTP:6004)
├── micro-tenant-*/           # Tenant-specific services (inventory, master, procurement, recipe)
└── bruno/                    # API testing collection

packages/                      # Shared packages
├── eslint-config/            # Shared ESLint configurations
├── prisma-shared-schema-platform/ # Platform-level database schema
├── prisma-shared-schema-tenant/   # Tenant-level database schema
└── shared-microservice-library/   # Common DTOs and utilities
```

## Development Commands

### Quick Start
```bash
# Install dependencies and build packages
bun install && turbo run build:package

# Or use the setup script
bun run setup
```

### Development Workflows
```bash
# Start all microservices in development mode
bun run dev

# Start base services only (gateway + auth + cluster)
bun run dev:base

# Start tenant-specific services
bun run dev:tenant

# Start production build in development
bun run dev:prod

# Build all applications
bun run build

# Run linting across all packages
bun run lint

# Format code
bun run format

# Type checking
bun run check-types
```

### Individual Service Development
```bash
# Start specific microservices (defined in turbo.json)
turbo run dev:gateway
turbo run dev:authen
turbo run dev:cluster
turbo run dev:file
turbo run dev:license
turbo run dev:notification
turbo run dev:report
turbo run dev:tenant:inventory
turbo run dev:tenant:master
turbo run dev:tenant:procurement
turbo run dev:tenant:recipe
```

### Testing Commands
```bash
# Run tests for all services
turbo run test

# Run tests with coverage
turbo run test:cov

# Run tests in watch mode
turbo run test:watch

# Run end-to-end tests
turbo run test:e2e

# Run tests for a specific service
cd apps/micro-authen && bun run test
```

### Database Operations
```bash
# Generate Prisma clients for both schemas
bun run db:generate

# Run database migrations
bun run db:migrate

# Deploy migrations to production
bun run db:deploy

# Database operations per schema
cd packages/prisma-shared-schema-platform
bun run db:migrate
bun run db:seed
bun run db:mock

cd packages/prisma-shared-schema-tenant  
bun run db:migrate
bun run db:seed
bun run db:mock
```

### Container Operations
```bash
# Build and run all services with Docker
docker-compose up --build

# Run specific services
docker-compose up api-backend-gateway api-micro-authen
```

## Architecture Patterns

### Microservice Communication
- **API Gateway**: Single entry point at port 4000 (HTTP) / 4001 (HTTPS)
- **Service Mesh**: TCP communication between microservices on dedicated ports
- **Message Patterns**: Uses NestJS microservice decorators for RPC communication
- **Authentication**: JWT-based auth handled by micro-authen service
- **Logging**: Winston with Loki integration for centralized logging

### Database Architecture
- **Platform Schema**: User management, clusters, business units, permissions, subscriptions
- **Tenant Schema**: Business-specific data (products, inventory, procurement, recipes)
- **Multi-tenancy**: Separate database connections per business unit via `db_connection` field
- **ORM**: Prisma with code generation for type safety

### Service Groupings
- **Core Services**: Gateway, Authentication, Cluster management
- **Platform Services**: License, File, Notification, Reports
- **Tenant Services**: Inventory, Master data, Procurement, Recipe management

## Key Development Patterns

### Adding New Microservices
1. Create new app directory under `apps/micro-{service-name}/`
2. Configure service ports in docker-compose.yml
3. Add Turbo scripts in turbo.json
4. Implement NestJS microservice with TCP transport
5. Register routes in API Gateway
6. Add shared types to `shared-microservice-library` if needed

### Working with Prisma Schemas
- Platform schema changes affect user management and core platform features
- Tenant schema changes affect business operations for all tenants  
- Always run `db:generate` after schema changes before building
- Use seed scripts for development data, mock scripts for testing

### Environment Configuration
- Each microservice has its own `.env.example` file
- Services discover each other via host/port configuration
- Database connections configured per business unit for multi-tenancy

### Testing Strategy
- Each service has Jest configuration
- API testing available via Bruno collection in `apps/bruno/`
- Coverage collection configured per service
- E2E testing setup available

## Business Domain Context

This system manages hotel operations including:
- **Multi-property management** (clusters → business units)
- **Department organization** (IT, HR, housekeeping, kitchens: Thai, Chinese, Western)
- **User roles** (admin, manager, staff)
- **Product catalog** (food, beverages, general merchandise, assets)
- **Procurement workflows** with approval processes
- **Inventory tracking** across departments
- **Recipe management** for kitchen operations
- **Notification system** for workflow alerts
- **Reporting** for business intelligence

## Package Manager

This project uses **Bun** as the primary package manager (`packageManager: "bun@1.2.5"`). All commands should use `bun` instead of `npm` or `yarn` for consistency with the configured toolchain.