# Carmen Turborepo Backend

A microservices-based backend system built with NestJS and managed as a monorepo using Turborepo.

## Project Overview

Carmen is a comprehensive enterprise resource planning (ERP) system with a focus on procurement, inventory, and master data management. This monorepo contains all backend microservices and shared packages.

## Architecture

### Microservices (apps/)

- **backend-gateway** - API Gateway service for routing and orchestration
- **micro-authen** - Authentication and authorization service
- **micro-cluster** - Cluster management service
- **micro-cronjob** - Scheduled task management service
- **micro-file** - File storage and management service
- **micro-license** - License management service
- **micro-notification** - Notification service
- **micro-tenant-inventory** - Tenant-specific inventory management
- **micro-tenant-master** - Tenant-specific master data management
- **micro-tenant-procurement** - Tenant-specific procurement management
- **micro-tenant-recipe** - Tenant-specific recipe management

### Shared Packages (packages/)

- **@repo/eslint-config** - Shared ESLint configurations
- **@repo/shared-microservice-library** - Common utilities and helpers for microservices
- **@repo/prisma-shared-schema-platform** - Shared Prisma schema for platform-level data
- **@repo/prisma-shared-schema-tenant** - Shared Prisma schema for tenant-level data

## Tech Stack

- **Runtime**: Bun 1.2.5
- **Framework**: NestJS 11.x
- **Language**: TypeScript 5.8.2
- **Database ORM**: Prisma 6.10.x
- **Monorepo Tool**: Turborepo 2.5.x
- **API Documentation**: Swagger/OpenAPI
- **Error Tracking**: Sentry
- **Build Tool**: SWC

## Prerequisites

- Node.js >= 18
- Bun >= 1.2.5
- PostgreSQL (for Prisma databases)

## Getting Started

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd carmen-turborepo-backend

# Install dependencies and setup
bun install
```

The `postinstall` script will automatically build shared packages.

### Environment Setup

Each microservice requires its own `.env` file. Copy the example environment files:

```bash
# Example for micro-authen
cp apps/micro-authen/.env.example apps/micro-authen/.env
```

Configure the environment variables according to your setup.

### Database Setup

```bash
# Generate Prisma clients
bun run db:generate

# Run migrations
bun run db:migrate

# Deploy to production
bun run db:deploy
```

## Development

### Start All Services

```bash
# Development mode
bun run dev

# Development mode (base services only)
bun run dev:base

# Development mode (tenant services only)
bun run dev:tenant

# Development mode (production configuration)
bun run dev:prod
```

### Start Individual Service

```bash
cd apps/micro-authen
bun run dev
```

### Build

```bash
# Build all services
bun run build

# Build shared packages only
bun run build:package
```

### Code Quality

```bash
# Run linting
bun run lint

# Format code
bun run format

# Type checking
bun run check-types
```

## Production

```bash
# Build for production
bun run build

# Start production servers
bun run start:prod
```

## Project Structure

```
carmen-turborepo-backend/
├── apps/                    # Microservices
│   ├── backend-gateway/
│   ├── micro-authen/
│   ├── micro-cluster/
│   ├── micro-cronjob/
│   ├── micro-file/
│   ├── micro-license/
│   ├── micro-notification/
│   ├── micro-tenant-inventory/
│   ├── micro-tenant-master/
│   ├── micro-tenant-procurement/
│   └── micro-tenant-recipe/
├── packages/                # Shared packages
│   ├── eslint-config/
│   ├── shared-microservice-library/
│   ├── prisma-shared-schema-platform/
│   └── prisma-shared-schema-tenant/
├── package.json
├── turbo.json
└── README.md
```

## API Testing

Bruno API collections are available in `apps/bruno/` for testing endpoints.

## Key Features

- **Multi-tenant Architecture**: Separate schemas and services for platform and tenant data
- **Microservices Pattern**: Independent, scalable services
- **Shared Code**: Common libraries and utilities across services
- **Type Safety**: Full TypeScript support across the monorepo
- **Database Management**: Prisma ORM with migration support
- **API Documentation**: Auto-generated Swagger documentation
- **Error Tracking**: Integrated Sentry for monitoring

## Turborepo Features

This monorepo uses Turborepo for:

- **Smart Caching**: Build outputs are cached to speed up subsequent builds
- **Parallel Execution**: Tasks run in parallel where possible
- **Dependency Graph**: Automatically understands service dependencies
- **Incremental Builds**: Only rebuilds what changed

## Common Tasks

### Adding a New Microservice

1. Create a new directory in `apps/`
2. Initialize the NestJS project
3. Add workspace reference in root `package.json`
4. Update `turbo.json` if needed

### Adding a New Shared Package

1. Create a new directory in `packages/`
2. Initialize the package with `package.json`
3. Add to workspaces in root `package.json`
4. Run `bun run build:package`

### Updating Dependencies

```bash
# Check for updates
npx npm-check-updates

# Update all dependencies
npx npm-check-updates -u
bun install
```

## Troubleshooting

### Prisma Client Not Found

```bash
bun run db:generate
```

### Build Failures

```bash
# Clean and rebuild
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules
bun install
bun run build:package
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run linting and type checks
4. Submit a pull request

## License

[Your License Here]

## Support

For issues and questions, please contact the development team or create an issue in the repository.
