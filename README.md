# Carmen Backend

Multi-tenant hospitality ERP backend: procurement, inventory, recipes, master data.

Status: active development; APIs may change between minor versions.

## What Carmen is

Carmen is a multi-tenant SaaS backend for hotel and hospitality operations.
The platform manages the procurement-to-inventory lifecycle — purchase
requests, purchase orders, good-received notes, stock movements, inventory
counts — plus the master data (locations, vendors, products, units) and
supporting functions (recipes, audit logging, RBAC) that hospitality
operators depend on.

The system is multi-tenant by design: a shared platform schema holds
user/role/subscription data across all tenants, while each tenant gets
its own data schema for products, inventory, procurement, and recipes.

## Core capabilities

Each bullet links to the primary artifact so you can verify the feature
exists in code.

- **Procurement workflow** — Purchase Request → Purchase Order → Good Received Note. See [`apps/bruno/carmen-inventory/procurement/purchase-request/`](apps/bruno/carmen-inventory/procurement/purchase-request/), [`procurement/purchase-order/`](apps/bruno/carmen-inventory/procurement/purchase-order/), [`procurement/good-received-note/`](apps/bruno/carmen-inventory/procurement/good-received-note/).
- **Inventory movements** — stock in/out, physical counts, adjustments, inter-location transfers via store requisitions. See [`apps/bruno/carmen-inventory/inventory/stock-in/`](apps/bruno/carmen-inventory/inventory/stock-in/), [`inventory/stock-out/`](apps/bruno/carmen-inventory/inventory/stock-out/), [`inventory/store-requisition/`](apps/bruno/carmen-inventory/inventory/store-requisition/).
- **Master data** — locations, vendors, products, units of measure, departments. See [`apps/bruno/carmen-inventory/config/`](apps/bruno/carmen-inventory/config/) and [`master-data/`](apps/bruno/carmen-inventory/master-data/).
- **Recipes** — dish templates with ingredient breakdown, categories, cuisines, and equipment. See [`apps/bruno/carmen-inventory/config/recipe/`](apps/bruno/carmen-inventory/config/recipe/) and tenant Prisma models `tb_recipe*`.
- **Audit logging** — structured events with per-entity history. See [`packages/log-events-library/`](packages/log-events-library/).
- **RBAC via Keycloak** — roles, permissions, cluster/business-unit scoping. See [`apps/micro-keycloak-api/`](apps/micro-keycloak-api/) and [`apps/bruno/carmen-inventory/auth/`](apps/bruno/carmen-inventory/auth/).
- **Real-time notifications** — Socket.io-based push channel. See [`apps/micro-notification/`](apps/micro-notification/).

## Architecture at a glance

API gateway pattern with TCP inter-service RPC. A single HTTP entry point
forwards domain requests to microservices via NestJS `@MessagePattern()`
handlers. Auth is Keycloak-based with JWT validation proxied through a
dedicated service.

```
                       ┌─────────────────────┐
   HTTPS :4001 ───────▶│   backend-gateway   │◀─── /swagger, /ws
   HTTP  :4000         └──────────┬──────────┘
                                  │ TCP
             ┌────────────────────┼─────────────────────────┐
             ▼                    ▼                         ▼
    ┌────────────────┐   ┌────────────────┐        ┌────────────────┐
    │ micro-business │   │   micro-file   │  ...   │ micro-keycloak │
    │   TCP 5020     │   │   TCP 5007     │        │    TCP 5013    │
    └────────────────┘   └────────────────┘        └────────────────┘
```

- `micro-business` — consolidated business logic (auth, clusters, inventory, master data, procurement, recipes, logging).
- `micro-file` — file storage.
- `micro-notification` — real-time notifications (Socket.io).
- `micro-keycloak-api` — Keycloak integration.
- `micro-cluster` — cluster management.

Two Prisma schemas: **platform** (cross-tenant: users, clusters, roles,
subscriptions) and **tenant** (per-tenant: products, inventory,
procurement, recipes, vendors, locations). Both use UUID primary keys
and soft deletes.

Full architecture diagrams: [`docs/architecture-system.md`](docs/architecture-system.md).

## Tech stack

Bun · NestJS 11 · TypeScript · Prisma · PostgreSQL · Turborepo · Keycloak · Socket.io

---

## Getting started (dev)

Prerequisites:

- Bun ≥ 1.2.5
- PostgreSQL (local or remote)
- A Keycloak instance (local docker or shared dev server)

5-step quickstart:

```bash
# 1. Clone
git clone <repository-url> && cd carmen-turborepo-backend-v2

# 2. Install + build shared packages
bun run setup

# 3. Copy .env.example → .env per service (repeat for each apps/*/)
cp apps/backend-gateway/.env.example apps/backend-gateway/.env
cp apps/micro-business/.env.example apps/micro-business/.env
# ...etc. for micro-file, micro-keycloak-api, micro-notification, micro-cluster

# 4. Generate Prisma clients
bun run db:generate

# 5. Start the common dev subset (gateway + business + keycloak API)
bun run dev:base
```

Detailed walkthrough: [`docs/ops-start-dev-base.md`](docs/ops-start-dev-base.md).

## Running services

```bash
bun run dev              # all services
bun run dev:base         # gateway + business + keycloak API (common)
bun run dev:business     # business service only
bun run build            # build all
bun run build:package    # build shared packages only
bun run lint
bun run format
bun run check-types
```

See `package.json` scripts for the full list.

## Database

- Two Prisma schemas generate distinct clients: `@repo/prisma-shared-schema-platform` and `@repo/prisma-shared-schema-tenant`.
- Root scripts run across both: `bun run db:generate`, `bun run db:migrate`.
- Per-schema operations: `cd packages/prisma-shared-schema-<platform|tenant> && bun run db:seed`.
- Schema deployment guides: [`docs/deploy-platform-schema.md`](docs/deploy-platform-schema.md), [`docs/deploy-tenant-schema.md`](docs/deploy-tenant-schema.md).

## Deployment

- Docker Compose: [`docs/deploy-docker-run.md`](docs/deploy-docker-run.md).
- SSL / Keycloak configuration: [`docs/ops-fix-ssl-keycloak.md`](docs/ops-fix-ssl-keycloak.md).
- Kubernetes: see the k8s section in [`docs/architecture-system.md`](docs/architecture-system.md).
- Backup / restore: [`docs/ops-backup.md`](docs/ops-backup.md) and the backup scripts under [`scripts/backup/`](scripts/backup/).
- Prisma upgrade procedure: [`docs/ops-prisma-upgrade-script.md`](docs/ops-prisma-upgrade-script.md).

## API

- **Swagger:** available on the gateway at `/swagger` (HTTP :4000 or HTTPS :4001).
- **Bruno collections:** [`apps/bruno/carmen-inventory/`](apps/bruno/carmen-inventory/) — login variants, per-domain requests, environments for localhost + dev server.
- **Response wrapper:** `{ data, status, success, message, timestamp }`.

## Project layout

```
carmen-turborepo-backend-v2/
├── apps/
│   ├── backend-gateway/     # HTTP gateway, routes → TCP microservices
│   ├── bruno/               # API test collections (.bru files)
│   ├── micro-business/      # Consolidated business logic
│   ├── micro-cluster/       # Cluster management
│   ├── micro-file/          # File storage
│   ├── micro-keycloak-api/  # Keycloak integration
│   └── micro-notification/  # Socket.io notifications
├── packages/
│   ├── eslint-config/
│   ├── log-events-library/
│   ├── prisma-shared-schema-platform/
│   └── prisma-shared-schema-tenant/
├── docs/                    # Flat-prefix docs: architecture-*, deploy-*, ops-*, domain-*, design-*
├── scripts/                 # Operational scripts (deploy, migrate, backup/)
├── CLAUDE.md                # Agent-oriented conventions and gotchas
├── README.md                # This file
└── package.json
```

## Contributing / conventions

See [`CLAUDE.md`](CLAUDE.md) for code conventions, testing patterns, and agent/dev guidance.

## Support

Open a GitHub issue on this repo.
