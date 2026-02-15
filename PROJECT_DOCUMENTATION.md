# Carmen Turborepo Backend v2 - Project Documentation

**Version**: 1.0
**Date**: 15 February 2026
**Project**: Carmen Turborepo Backend v2

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Folder Structure](#2-folder-structure)
3. [Technology Stack](#3-technology-stack)
4. [Service Architecture & Workflow Diagram](#4-service-architecture--workflow-diagram)
5. [Database Architecture](#5-database-architecture)
6. [ERD Diagram (Entity Relationship Diagram)](#6-erd-diagram-entity-relationship-diagram)
7. [Inter-Service Communication](#7-inter-service-communication)
8. [Build & Deployment Workflow](#8-build--deployment-workflow)
9. [Deployment Architecture](#9-deployment-architecture)
10. [Environment Configuration](#10-environment-configuration)
11. [Shared Packages](#11-shared-packages)
12. [API Documentation & Testing](#12-api-documentation--testing)

---

## 1. Project Overview

Carmen Turborepo Backend v2 is a **multi-tenant microservices backend** built with a **monorepo** architecture using **Turborepo**. The system manages business operations including authentication, inventory management, procurement, master data, file storage, notifications, and scheduled tasks.

### Key Characteristics

- **Monorepo**: Turborepo 2.5.8 with Bun 1.2.5 as package manager
- **Framework**: NestJS 11.x (primary), Elysia (micro-cronjob)
- **Language**: TypeScript 5.8.2
- **Database**: PostgreSQL with Prisma 6.19.1 ORM
- **Multi-tenant**: Separate Platform and Tenant database schemas
- **Containerized**: Docker multi-stage builds with Docker Compose orchestration

---

## 2. Folder Structure

```
carmen-turborepo-backend-v2/
|
|-- apps/                                    # Microservices (Applications)
|   |-- backend-gateway/                     # API Gateway (NestJS + Express)
|   |   |-- src/
|   |   |   |-- modules/                     # Feature modules (auth, cluster, inventory, etc.)
|   |   |   |-- common/                      # Shared utilities, guards, interceptors
|   |   |   |-- main.ts                      # Entry point (HTTP + HTTPS + WebSocket)
|   |   |-- Dockerfile
|   |   |-- package.json
|   |
|   |-- micro-business/                      # Consolidated Business Service (NestJS)
|   |   |-- src/
|   |   |   |-- authen/                      # Authentication, roles, permissions
|   |   |   |-- cluster/                     # Cluster & business unit management
|   |   |   |-- inventory/                   # GRN, stock in/out, transfers
|   |   |   |-- master/                      # Products, vendors, locations, currencies, units
|   |   |   |-- procurement/                 # Purchase orders, requests, credit notes
|   |   |   |-- recipe/                      # Recipe management
|   |   |   |-- license/                     # License management
|   |   |   |-- log/                         # Activity logging
|   |   |   |-- notification/                # Internal notifications
|   |   |-- Dockerfile
|   |   |-- package.json
|   |
|   |-- micro-file/                          # File Storage Service (NestJS)
|   |   |-- src/                             # MinIO/S3 integration
|   |   |-- Dockerfile
|   |   |-- package.json
|   |
|   |-- micro-cronjob/                       # Cron Job Service (Elysia + Bun)
|   |   |-- src/
|   |   |   |-- crons/                       # Dynamic cron job definitions
|   |   |   |-- index.ts                     # Entry point
|   |   |-- Dockerfile
|   |   |-- package.json
|   |
|   |-- micro-keycloak-api/                  # Keycloak Auth Integration (NestJS)
|   |   |-- src/
|   |   |-- Dockerfile
|   |   |-- package.json
|   |
|   |-- micro-notification/                  # Real-time Notification Service (NestJS)
|   |   |-- src/
|   |   |-- Dockerfile
|   |   |-- package.json
|   |
|   |-- bruno/                               # API Testing Collections (Bruno)
|
|-- packages/                                # Shared Libraries
|   |-- prisma-shared-schema-platform/       # Platform DB Prisma Schema & Client
|   |   |-- prisma/
|   |   |   |-- schema.prisma                # Platform schema definition
|   |   |   |-- migrations/                  # Database migrations
|   |   |   |-- seed/                        # Seed data scripts
|   |   |-- src/
|   |   |-- package.json
|   |
|   |-- prisma-shared-schema-tenant/         # Tenant DB Prisma Schema & Client
|   |   |-- prisma/
|   |   |   |-- schema.prisma                # Tenant schema definition
|   |   |   |-- migrations/                  # Database migrations
|   |   |   |-- seed/                        # Seed & mock data scripts
|   |   |-- src/
|   |   |-- package.json
|   |
|   |-- log-events-library/                  # Audit Logging Library
|   |   |-- src/                             # NestJS interceptor for audit trails
|   |   |-- package.json
|   |
|   |-- eslint-config/                       # Shared ESLint Configuration
|       |-- package.json
|
|-- nginx/                                   # Nginx Reverse Proxy Configs
|   |-- carmen-api.conf                      # API Gateway proxy (Port 4000 SSL)
|   |-- carmen-app.conf                      # Frontend app proxy (Port 80/443)
|   |-- carmen-platform.conf                 # Platform admin proxy (Port 81 SSL)
|
|-- scripts/                                 # Build & setup scripts
|-- .github/workflows/                       # CI/CD GitHub Actions
|   |-- build.yml                            # Build, Docker push, Deploy pipeline
|
|-- docker-compose.yml                       # Container orchestration
|-- turbo.json                               # Turborepo task configuration
|-- package.json                             # Root workspace definition
|-- tsconfig.json                            # Root TypeScript config
|-- bun.lock                                 # Dependency lock file
|-- build-all.sh                             # Build helper script
```

---

## 3. Technology Stack

| Category              | Technology                      | Version    |
|-----------------------|---------------------------------|------------|
| Runtime               | Bun                             | 1.2.5      |
| Node.js               | Node.js                         | >= 18      |
| Language              | TypeScript                      | 5.8.2      |
| Main Framework        | NestJS                          | 11.x       |
| Alt Framework         | Elysia (micro-cronjob)          | Latest     |
| Database ORM          | Prisma                          | 6.19.1     |
| Database              | PostgreSQL                      | -          |
| Monorepo Tool         | Turborepo                       | 2.5.8      |
| Compiler              | SWC                             | 1.13.5     |
| Auth                  | Passport + JWT + Keycloak       | -          |
| WebSocket             | Socket.io                       | -          |
| File Storage          | MinIO (S3-compatible)           | -          |
| Logging               | Winston + Loki                  | -          |
| Error Tracking        | Sentry                          | -          |
| API Docs              | Swagger + Scalar                | -          |
| Containerization      | Docker + Docker Compose         | -          |
| CI/CD                 | GitHub Actions                  | -          |
| Reverse Proxy         | Nginx                           | -          |
| Cache                 | Redis (ioredis)                 | -          |

---

## 4. Service Architecture & Workflow Diagram

### 4.1 High-Level Architecture

```
                            +------------------+
                            |     Nginx        |
                            | (Reverse Proxy)  |
                            +--------+---------+
                                     |
                          SSL/HTTPS (Port 4000)
                                     |
                                     v
+------------------------------------------------------------------------+
|                                                                        |
|                      backend-gateway (NestJS)                          |
|                      Port: 4000 (HTTP) / 4001 (HTTPS)                 |
|                                                                        |
|   +-- REST API Routing ----+-- WebSocket Gateway --+-- Swagger/Scalar  |
|   |                        |                       |                   |
+---+------------------------+-----------------------+-------------------+
    |            |           |           |           |           |
    | TCP        | TCP       | TCP       | TCP       | TCP       | TCP
    v            v           v           v           v           v
+--------+ +--------+ +---------+ +---------+ +----------+ +----------+
| micro- | | micro- | | micro-  | | micro-  | | micro-   | | micro-   |
|business| | file   | | cronjob | |keycloak | |notifica- | |business  |
|(auth)  | |        | |         | |  -api   | |  tion    | |(other    |
|        | |        | |         | |         | |          | | modules) |
+---+----+ +---+----+ +----+----+ +----+----+ +----+-----+ +----+-----+
    |          |            |           |           |            |
    v          v            v           v           v            v
+--------+ +--------+ +--------+ +---------+ +--------+  +---------+
|Platform| | MinIO  | |Platform| |Keycloak | |Platform|  | Tenant  |
|  DB    | |Storage | |  DB    | | Server  | |  DB    |  |   DB    |
+--------+ +--------+ +--------+ +---------+ +--------+  +---------+
```

### 4.2 Request Flow Diagram

```
Client Request
      |
      v
+-----+------+
|   Nginx    |  (SSL Termination / Reverse Proxy)
+-----+------+
      |
      v
+-----+------+
| backend-   |
| gateway    |
+-----+------+
      |
      |  1. JWT Authentication Guard
      |  2. Role/Permission Check
      |  3. Request Validation
      |
      v
+-----+------+
| Controller |  (Route handler in gateway)
+-----+------+
      |
      |  TCP Message Pattern
      |  e.g., { cmd: 'get_products' }
      |
      v
+-----+------+
| Micro-     |  (Target microservice)
| service    |
+-----+------+
      |
      |  1. Business Logic
      |  2. Prisma ORM Query
      |  3. Database Operation
      |
      v
+-----+------+
| PostgreSQL |
| Database   |
+-----+------+
      |
      v
  Response flows back through the same path
```

### 4.3 Microservice Details

| Service               | Framework      | TCP Port | HTTP Port | Purpose                                          |
|-----------------------|----------------|----------|-----------|--------------------------------------------------|
| backend-gateway       | NestJS+Express | -        | 4000/4001 | API Gateway, routing, auth, WebSocket             |
| micro-business        | NestJS         | 5020     | 6020      | Auth, Cluster, Inventory, Master, Procurement, Recipe |
| micro-file            | NestJS         | 5007     | 6007      | File upload/download via MinIO/S3                 |
| micro-cronjob         | Elysia+Bun     | 5012     | -         | Scheduled task execution                          |
| micro-keycloak-api    | NestJS         | 5013     | -         | Keycloak SSO integration                          |
| micro-notification    | NestJS         | 5006     | 6006      | Real-time notifications via WebSocket             |

### 4.4 micro-business Internal Modules

```
micro-business (Port 5020/6020)
|
|-- authen/          --> User authentication, login, token management
|   |-- role/        --> Role definitions (admin, manager, staff, etc.)
|   |-- permission/  --> Fine-grained permission control
|
|-- cluster/         --> Multi-tenant cluster management
|   |-- business-unit/ --> Business unit CRUD & configuration
|
|-- inventory/       --> Inventory operations
|   |-- grn/         --> Goods Received Notes
|   |-- stock-in/    --> Stock intake
|   |-- stock-out/   --> Stock dispatch
|   |-- transfer/    --> Inter-location transfers
|
|-- master/          --> Master data management
|   |-- product/     --> Product catalog
|   |-- vendor/      --> Vendor/supplier management
|   |-- location/    --> Warehouse/store locations
|   |-- currency/    --> Currency configuration
|   |-- unit/        --> Unit of measurement
|
|-- procurement/     --> Purchasing operations
|   |-- purchase-order/   --> PO creation & management
|   |-- purchase-request/ --> PR workflow
|   |-- credit-note/      --> Credit note handling
|
|-- recipe/          --> Recipe/BOM management
|-- license/         --> License & subscription management
|-- log/             --> Activity audit logging
```

---

## 5. Database Architecture

### 5.1 Dual-Schema Design

The system uses a **dual-schema** architecture with two separate PostgreSQL database connections:

```
+---------------------------------------------------+
|                  PostgreSQL Server                 |
|                                                   |
|  +---------------------+  +--------------------+  |
|  |  Platform Database   |  |  Tenant Database   |  |
|  |  (SYSTEM_DATABASE_   |  |  (DATABASE_URL)    |  |
|  |   URL)               |  |                    |  |
|  |                      |  |                    |  |
|  | - tb_cluster         |  | - tb_product       |  |
|  | - tb_business_unit   |  | - tb_vendor        |  |
|  | - tb_user            |  | - tb_location      |  |
|  | - tb_platform_user   |  | - tb_grn           |  |
|  | - tb_application_role|  | - tb_stock_in      |  |
|  | - tb_permission      |  | - tb_stock_out     |  |
|  | - tb_subscription    |  | - tb_transfer      |  |
|  | - tb_activity_log    |  | - tb_purchase_order|  |
|  |                      |  | - tb_currency      |  |
|  +---------------------+  | - tb_unit          |  |
|                            | - tb_tax_type      |  |
|                            +--------------------+  |
+---------------------------------------------------+
```

### 5.2 Platform Schema (prisma-shared-schema-platform)

Manages system-wide data that is shared across all tenants:

| Table                     | Purpose                                   |
|---------------------------|-------------------------------------------|
| `tb_cluster`              | Tenant/organization clusters              |
| `tb_business_unit`        | Business units within clusters            |
| `tb_user`                 | Application users                         |
| `tb_platform_user`        | Platform-level admin users                |
| `tb_application_role`     | Role definitions (admin, manager, etc.)   |
| `tb_permission`           | Granular permissions                      |
| `tb_subscription_detail`  | Subscription/license details              |

### 5.3 Tenant Schema (prisma-shared-schema-tenant)

Manages business operation data specific to each tenant:

| Table                     | Purpose                                   |
|---------------------------|-------------------------------------------|
| `tb_product`              | Product catalog                           |
| `tb_vendor`               | Vendor/supplier records                   |
| `tb_location`             | Warehouse/store locations                 |
| `tb_grn`                  | Goods Received Notes                      |
| `tb_stock_in`             | Stock intake records                      |
| `tb_stock_out`            | Stock dispatch records                    |
| `tb_transfer`             | Inter-location transfer records           |
| `tb_purchase_order`       | Purchase orders                           |
| `tb_purchase_request`     | Purchase requests                         |
| `tb_credit_note`          | Credit notes                              |
| `tb_currency`             | Currency definitions                      |
| `tb_unit`                 | Units of measurement                      |
| `tb_tax_type`             | Tax type configurations                   |

### 5.4 Database Conventions

- **Table prefix**: `tb_` for data tables, `enum_` for enum types
- **Primary keys**: UUID format
- **Naming**: snake_case for all columns
- **Audit fields**: `created_at`, `created_by_id`, `updated_at`, `updated_by_id`, `deleted_at` (soft delete)
- **Timestamps**: With timezone support
- **Prisma features**: `postgresqlExtensions`, `relationJoins`

### 5.5 Database Connection Flow

```
Service Startup
      |
      v
+-----+------+
| Prisma     |  (ORM Layer)
| Client     |
+-----+------+
      |
      |-- SYSTEM_DATABASE_URL -----> Platform DB (system-wide data)
      |-- SYSTEM_DIRECT_URL -------> Platform DB (migrations, direct)
      |
      |-- DATABASE_URL ------------> Tenant DB (business data)
      |
      v
+-----+------+
| PostgreSQL |
| Server     |
+-----------+
```

### 5.6 Database Management Scripts

```bash
# Generate Prisma clients from schemas
bun run db:generate

# Run pending migrations (development)
bun run db:migrate

# Deploy migrations (production)
bun run db:deploy

# Reset database (development only!)
bun run db:migrate:reset

# Seed data
bun run db:seed
```

---

## 6. ERD Diagram (Entity Relationship Diagram)

### 6.1 Platform Database ERD

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        PLATFORM DATABASE ERD                                    │
│                     (SYSTEM_DATABASE_URL)                                        │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐       ┌──────────────────────────┐
│     tb_cluster       │       │       tb_user            │
├──────────────────────┤       ├──────────────────────────┤
│ id          UUID  PK │       │ id            UUID    PK │
│ code        VARCHAR  │       │ username      VARCHAR    │
│ name        VARCHAR  │       │ email         VARCHAR    │
│ alias_name  VARCHAR  │       │ platform_role ENUM       │
│ logo_url    VARCHAR  │       │ is_active     BOOLEAN    │
│ is_active   BOOLEAN  │       │ is_consent    BOOLEAN    │
│ info        JSON     │       │ socket_id     VARCHAR    │
│ created_at  TIMESTZ  │       │ is_online     BOOLEAN    │
│ created_by  UUID  FK │───┐   │ consent_at    TIMESTZ    │
│ updated_by  UUID  FK │───┤   │ created_at    TIMESTZ    │
│ deleted_at  TIMESTZ  │   │   │ created_by    UUID    FK │
└──────┬───────────────┘   │   │ updated_by    UUID    FK │
       │                   │   │ deleted_at    TIMESTZ    │
       │ 1:N               └──►└──────┬───────────────────┘
       │                              │
       ▼                              │ 1:N
┌──────────────────────────┐          │
│   tb_business_unit       │          │
├──────────────────────────┤          │
│ id            UUID    PK │          │
│ cluster_id    UUID    FK │◄─────────┘ (via tb_user_tb_business_unit)
│ code          VARCHAR    │
│ name          VARCHAR    │
│ alias_name    VARCHAR    │
│ description   VARCHAR    │
│ info          JSON       │
│ is_hq         BOOLEAN    │
│ is_active     BOOLEAN    │
│ db_connection VARCHAR    │
│ config        JSON       │
│ created_by    UUID    FK │
│ updated_by    UUID    FK │
│ deleted_at    TIMESTZ    │
└──────┬───────────────────┘
       │
       │ 1:N                              1:N
       ▼                    ┌──────────────────────────────┐
┌──────────────────────┐    │  tb_user_tb_business_unit    │
│ tb_application_role  │    ├──────────────────────────────┤
├──────────────────────┤    │ id               UUID     PK │
│ id         UUID   PK │    │ user_id          UUID     FK │──► tb_user
│ bu_id      UUID   FK │    │ business_unit_id UUID     FK │──► tb_business_unit
│ name       VARCHAR   │    │ role             ENUM       │
│ description VARCHAR  │    │ is_default       BOOLEAN    │
│ is_active  BOOLEAN   │    │ is_active        BOOLEAN    │
│ created_by UUID   FK │    │ created_by       UUID    FK │
│ updated_by UUID   FK │    │ deleted_at       TIMESTZ    │
│ deleted_at TIMESTZ   │    └──────────────────────────────┘
└──────┬───────────────┘
       │
       │ N:M (via junction table)
       ▼
┌─────────────────────────────────────┐     ┌──────────────────────┐
│ tb_application_role_tb_permission   │     │   tb_permission      │
├─────────────────────────────────────┤     ├──────────────────────┤
│ id                  UUID         PK │     │ id          UUID  PK │
│ application_role_id UUID         FK │──┐  │ resource    VARCHAR  │
│ permission_id       UUID         FK │──┼─►│ action      VARCHAR  │
│ is_active           BOOLEAN        │  │  │ description VARCHAR  │
│ created_by          UUID         FK │  │  │ created_by  UUID  FK │
│ deleted_at          TIMESTZ        │  │  │ deleted_at  TIMESTZ  │
└─────────────────────────────────────┘  │  └──────────────────────┘
                                         │
                                         └──► tb_application_role

┌──────────────────────────────────────────────────────────────────┐
│                     OTHER PLATFORM TABLES                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────────────────────────┐  │
│  │  tb_cluster_user │  │  tb_user_tb_application_role         │  │
│  ├──────────────────┤  ├──────────────────────────────────────┤  │
│  │ id        UUID PK│  │ id                   UUID         PK │  │
│  │ user_id   UUID FK│  │ user_id              UUID         FK │  │
│  │ cluster_id UUID FK│  │ application_role_id  UUID         FK │  │
│  │ role      ENUM   │  │ created_by           UUID         FK │  │
│  │ is_active BOOL   │  │ deleted_at           TIMESTZ        │  │
│  └──────────────────┘  └──────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────┐  ┌─────────────────────┐                   │
│  │ tb_subscription  │  │ tb_user_profile     │                   │
│  ├──────────────────┤  ├─────────────────────┤                   │
│  │ id        UUID PK│  │ id         UUID  PK │                   │
│  │ cluster_id UUID FK│  │ user_id    UUID  FK │                   │
│  │ sub_number VAR   │  │ firstname  VARCHAR  │                   │
│  │ start_date DATE  │  │ middlename VARCHAR  │                   │
│  │ end_date   DATE  │  │ lastname   VARCHAR  │                   │
│  │ status    ENUM   │  │ telephone  VARCHAR  │                   │
│  └───────┬──────────┘  │ bio        JSON     │                   │
│          │ 1:N         └─────────────────────┘                   │
│          ▼                                                       │
│  ┌─────────────────────────┐  ┌─────────────────────────┐        │
│  │ tb_subscription_detail  │  │ tb_business_unit_       │        │
│  ├─────────────────────────┤  │        tb_module        │        │
│  │ id              UUID PK │  ├─────────────────────────┤        │
│  │ subscription_id UUID FK │  │ id              UUID PK │        │
│  │ bu_id           UUID FK │  │ bu_id           UUID FK │        │
│  │ module_id       UUID FK │  │ module_id       UUID FK │        │
│  └─────────────────────────┘  └─────────────────────────┘        │
│                                                                  │
│  ┌──────────────────┐  ┌────────────────────┐                    │
│  │   tb_module      │  │  tb_notification   │                    │
│  ├──────────────────┤  ├────────────────────┤                    │
│  │ id     UUID   PK │  │ id        UUID  PK │                    │
│  │ name   VARCHAR   │  │ from_user UUID  FK │                    │
│  │ desc   VARCHAR   │  │ to_user   UUID  FK │                    │
│  └──────────────────┘  │ type      VARCHAR  │                    │
│                        │ category  VARCHAR  │                    │
│  ┌──────────────────┐  │ title     VARCHAR  │                    │
│  │   tb_password    │  │ message   VARCHAR  │                    │
│  ├──────────────────┤  │ metadata  JSON     │                    │
│  │ id     UUID   PK │  │ is_read   BOOLEAN  │                    │
│  │ user_id UUID  FK │  │ is_sent   BOOLEAN  │                    │
│  │ hash   VARCHAR   │  └────────────────────┘                    │
│  │ is_active BOOL   │                                            │
│  │ expired_on TIMESTZ│  ┌─────────────────────────┐              │
│  └──────────────────┘  │ tb_user_login_session   │              │
│                        ├─────────────────────────┤              │
│  ┌──────────────────┐  │ id         UUID      PK │              │
│  │ tb_message_format│  │ token      VARCHAR      │              │
│  ├──────────────────┤  │ token_type ENUM         │              │
│  │ id     UUID   PK │  │ user_id    UUID      FK │              │
│  │ name   VARCHAR   │  │ expired_on TIMESTZ      │              │
│  │ message VARCHAR  │  └─────────────────────────┘              │
│  │ is_email  BOOL   │                                            │
│  │ is_sms    BOOL   │  ┌──────────────────┐                      │
│  │ is_in_app BOOL   │  │  tb_currency_iso │                      │
│  └──────────────────┘  ├──────────────────┤                      │
│                        │ id       UUID PK │                      │
│  ┌──────────────────┐  │ iso_code VARCHAR │                      │
│  │    tb_news       │  │ name     VARCHAR │                      │
│  ├──────────────────┤  │ symbol   VARCHAR │                      │
│  │ id     UUID   PK │  └──────────────────┘                      │
│  │ title  VARCHAR   │                                            │
│  │ contents TEXT    │  ┌──────────────────┐                      │
│  │ url    VARCHAR   │  │  tb_shot_url     │                      │
│  │ image  VARCHAR   │  ├──────────────────┤                      │
│  └──────────────────┘  │ id        UUID PK│                      │
│                        │ url_token VARCHAR│                      │
│                        │ token     VARCHAR│                      │
│                        │ expired_at TIMESTZ│                     │
│                        │ receiver_email VAR│                     │
│                        └──────────────────┘                      │
└──────────────────────────────────────────────────────────────────┘

Platform Enums:
  enum_platform_role: super_admin | platform_admin | support_manager |
                      support_staff | security_officer | integration_developer | user
  enum_cluster_user_role: admin | user
  enum_user_business_unit_role: admin | user
  enum_subscription_status: active | inactive | expired
  enum_token_type: access_token | refresh_token
```

### 6.2 Platform Database - Relationship Summary

```
tb_cluster ──< tb_business_unit          (1 Cluster has many Business Units)
tb_cluster ──< tb_cluster_user           (1 Cluster has many Cluster Users)
tb_cluster ──< tb_subscription           (1 Cluster has many Subscriptions)

tb_business_unit ──< tb_application_role         (1 BU has many Roles)
tb_business_unit ──< tb_user_tb_business_unit    (N:M Users <-> Business Units)
tb_business_unit ──< tb_business_unit_tb_module  (N:M Business Units <-> Modules)
tb_business_unit ──< tb_subscription_detail      (1 BU has many Subscription Details)

tb_user ──< tb_cluster_user                  (N:M Users <-> Clusters)
tb_user ──< tb_user_tb_business_unit         (N:M Users <-> Business Units)
tb_user ──< tb_user_tb_application_role      (N:M Users <-> Roles)
tb_user ──< tb_password                      (1 User has many Passwords)
tb_user ── tb_user_profile                   (1:1 User Profile)
tb_user ──< tb_user_login_session            (1 User has many Sessions)
tb_user ──< tb_notification (from/to)        (1 User sends/receives Notifications)

tb_application_role ──< tb_application_role_tb_permission  (N:M Roles <-> Permissions)
tb_subscription ──< tb_subscription_detail               (1 Sub has many Details)
tb_module ──< tb_subscription_detail                     (1 Module in many Sub Details)
tb_module ──< tb_business_unit_tb_module                 (N:M Modules <-> BUs)
```

### 6.3 Tenant Database ERD - Master Data

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         TENANT DATABASE ERD                                     │
│                        (DATABASE_URL)                                            │
│                     Section: MASTER DATA                                         │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐
│      tb_product          │
├──────────────────────────┤         ┌────────────────────────┐
│ id            UUID    PK │         │  tb_product_category   │
│ code          VARCHAR    │         ├────────────────────────┤
│ name          VARCHAR    │    ┌───►│ id          UUID    PK │
│ local_name    VARCHAR    │    │    │ code        VARCHAR    │
│ description   VARCHAR    │    │    │ name        VARCHAR    │
│ category_id   UUID    FK │────┘    │ local_name  VARCHAR    │
│ sub_cat_id    UUID    FK │────┐    │ description VARCHAR    │
│ item_group_id UUID    FK │──┐ │    │ is_active   BOOLEAN    │
│ unit_id       UUID    FK │─┐│ │    └────────────────────────┘
│ tax_profile_id UUID   FK │┐│││
│ status        ENUM       ││││ │    ┌────────────────────────────┐
│ min_qty       DECIMAL    ││││ └───►│ tb_product_sub_category    │
│ max_qty       DECIMAL    ││││      ├────────────────────────────┤
│ min_par       DECIMAL    ││││      │ id            UUID      PK │
│ max_par       DECIMAL    ││││      │ category_id   UUID      FK │──► tb_product_category
│ avg_cost      DECIMAL    ││││      │ code          VARCHAR      │
│ last_cost     DECIMAL    ││││      │ name          VARCHAR      │
│ std_cost      DECIMAL    ││││      │ is_active     BOOLEAN      │
│ dimension     JSON       ││││      └────────────────────────────┘
│ info          JSON       ││││
│ note          VARCHAR    │││ │     ┌────────────────────────────┐
│ created_at    TIMESTZ    │││ └────►│ tb_product_item_group      │
│ created_by    UUID    FK │││       ├────────────────────────────┤
│ updated_by    UUID    FK │││       │ id            UUID      PK │
│ deleted_at    TIMESTZ    │││       │ code          VARCHAR      │
│ doc_version   INT        │││       │ name          VARCHAR      │
└──────┬───────────────────┘││       │ is_active     BOOLEAN      │
       │                    ││       └────────────────────────────┘
       │ 1:N                ││
       ▼                    ││       ┌──────────────────────┐
┌──────────────────────┐    │└──────►│     tb_unit          │
│ tb_product_location  │    │        ├──────────────────────┤
├──────────────────────┤    │        │ id        UUID    PK │
│ id        UUID    PK │    │        │ code      VARCHAR    │
│ product_id UUID   FK │    │        │ name      VARCHAR    │
│ location_id UUID  FK │───►│        │ local_name VARCHAR   │
│ is_active BOOLEAN    │    │        │ type      ENUM       │
│ bin       VARCHAR    │    │        │ is_active BOOLEAN    │
└──────────────────────┘    │        └──────┬───────────────┘
                            │               │ 1:N
┌──────────────────────┐    │               ▼
│ tb_product_tb_vendor │    │        ┌──────────────────────┐
├──────────────────────┤    │        │  tb_unit_conversion  │
│ id        UUID    PK │    │        ├──────────────────────┤
│ product_id UUID   FK │    │        │ id         UUID   PK │
│ vendor_id  UUID   FK │───►│        │ from_unit  UUID   FK │
│ is_primary BOOLEAN   │    │        │ to_unit    UUID   FK │
│ vendor_product_code  │    │        │ factor     DECIMAL   │
└──────────────────────┘    │        └──────────────────────┘
                            │
                            │        ┌──────────────────────┐
                            └───────►│   tb_tax_profile     │
                                     ├──────────────────────┤
                                     │ id        UUID    PK │
                                     │ code      VARCHAR    │
                                     │ name      VARCHAR    │
                                     │ tax_type  ENUM       │
                                     │ tax_rate  DECIMAL    │
                                     │ calc_method ENUM     │
                                     │ is_active BOOLEAN    │
                                     └──────────────────────┘

┌──────────────────────┐     ┌──────────────────────────┐
│     tb_location      │     │       tb_vendor          │
├──────────────────────┤     ├──────────────────────────┤
│ id        UUID    PK │     │ id            UUID    PK │
│ code      VARCHAR    │     │ code          VARCHAR    │
│ name      VARCHAR    │     │ name          VARCHAR    │
│ local_name VARCHAR   │     │ local_name    VARCHAR    │
│ type      ENUM       │     │ tax_id        VARCHAR    │
│ description VARCHAR  │     │ credit_term_id UUID  FK  │──► tb_credit_term
│ is_active BOOLEAN    │     │ is_active     BOOLEAN    │
│ dimension JSON       │     │ dimension     JSON       │
│ info      JSON       │     │ info          JSON       │
└──────────────────────┘     └──────┬───────────────────┘
                                    │ 1:N
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
          ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐
          │tb_vendor_    │ │tb_vendor_    │ │tb_vendor_        │
          │  address     │ │  contact     │ │  business_type   │
          ├──────────────┤ ├──────────────┤ ├──────────────────┤
          │ id    UUID PK│ │ id    UUID PK│ │ id      UUID  PK │
          │ vendor_id FK │ │ vendor_id FK │ │ vendor_id    FK  │
          │ type  ENUM   │ │ name VARCHAR │ │ type   VARCHAR   │
          │ address VAR  │ │ email VARCHAR│ └──────────────────┘
          │ city   VAR   │ │ phone VARCHAR│
          │ country VAR  │ └──────────────┘
          └──────────────┘

┌──────────────────────┐     ┌──────────────────────┐
│    tb_currency       │     │   tb_department      │
├──────────────────────┤     ├──────────────────────┤
│ id        UUID    PK │     │ id        UUID    PK │
│ code      VARCHAR    │     │ code      VARCHAR    │
│ name      VARCHAR    │     │ name      VARCHAR    │
│ symbol    VARCHAR    │     │ local_name VARCHAR   │
│ is_default BOOLEAN   │     │ is_active BOOLEAN    │
│ is_active BOOLEAN    │     └──────┬───────────────┘
└──────┬───────────────┘            │ 1:N
       │ 1:N                        ▼
       ▼                     ┌──────────────────────┐
┌──────────────────────┐     │  tb_department_user  │
│   tb_exchange_rate   │     ├──────────────────────┤
├──────────────────────┤     │ id        UUID    PK │
│ id        UUID    PK │     │ dept_id   UUID    FK │
│ currency_id UUID  FK │     │ user_id   UUID       │
│ rate      DECIMAL    │     │ is_active BOOLEAN    │
│ effective_date DATE  │     └──────────────────────┘
└──────────────────────┘

┌──────────────────────┐     ┌──────────────────────┐
│  tb_delivery_point   │     │   tb_credit_term     │
├──────────────────────┤     ├──────────────────────┤
│ id        UUID    PK │     │ id        UUID    PK │
│ code      VARCHAR    │     │ code      VARCHAR    │
│ name      VARCHAR    │     │ name      VARCHAR    │
│ is_active BOOLEAN    │     │ days      INT        │
└──────────────────────┘     │ is_active BOOLEAN    │
                             └──────────────────────┘
```

### 6.4 Tenant Database ERD - Procurement Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         TENANT DATABASE ERD                                     │
│                     Section: PROCUREMENT FLOW                                    │
└─────────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────┐
  │  tb_purchase_request (PR)   │
  ├─────────────────────────────┤
  │ id             UUID      PK │
  │ doc_number     VARCHAR      │
  │ doc_date       DATE         │        ┌──────────────────────────────────┐
  │ doc_status     ENUM         │        │ tb_purchase_request_detail       │
  │ location_id    UUID      FK │──►loc  ├──────────────────────────────────┤
  │ department_id  UUID      FK │──►dept │ id                 UUID      PK  │
  │ delivery_date  DATE         │        │ purchase_request_id UUID     FK  │
  │ workflow_id    UUID      FK │        │ product_id          UUID     FK  │──► tb_product
  │ remark         VARCHAR      │        │ unit_id             UUID     FK  │──► tb_unit
  │ dimension      JSON         │        │ qty                 DECIMAL      │
  │ doc_version    INT          │        │ remark              VARCHAR      │
  │ created_by     UUID      FK │        │ dimension           JSON         │
  │ deleted_at     TIMESTZ      │        └──────────────────────────────────┘
  └─────────────┬───────────────┘
                │ 1:N
                ▼
  ┌─────────────────────────────┐
  │  tb_purchase_order (PO)     │
  ├─────────────────────────────┤
  │ id             UUID      PK │
  │ doc_number     VARCHAR      │
  │ doc_date       DATE         │        ┌──────────────────────────────────┐
  │ doc_status     ENUM         │        │ tb_purchase_order_detail         │
  │ vendor_id      UUID      FK │──►vend ├──────────────────────────────────┤
  │ location_id    UUID      FK │──►loc  │ id                 UUID      PK  │
  │ currency_id    UUID      FK │──►cur  │ purchase_order_id  UUID      FK  │
  │ credit_term_id UUID      FK │──►ct   │ product_id         UUID      FK  │──► tb_product
  │ delivery_date  DATE         │        │ unit_id            UUID      FK  │──► tb_unit
  │ pr_id          UUID      FK │──►PR   │ qty                DECIMAL       │
  │ exchange_rate  DECIMAL      │        │ price              DECIMAL       │
  │ subtotal       DECIMAL      │        │ discount           DECIMAL       │
  │ tax_amount     DECIMAL      │        │ tax_amount         DECIMAL       │
  │ total_amount   DECIMAL      │        │ total              DECIMAL       │
  │ workflow_id    UUID      FK │        │ pr_detail_id       UUID      FK  │──► PR detail
  │ dimension      JSON         │        │ dimension          JSON          │
  │ doc_version    INT          │        └──────────────────────────────────┘
  │ created_by     UUID      FK │
  │ deleted_at     TIMESTZ      │
  └─────────────┬───────────────┘
                │ 1:N
                ▼
  ┌──────────────────────────────────┐
  │ tb_good_received_note (GRN)      │
  ├──────────────────────────────────┤
  │ id              UUID          PK │
  │ doc_number      VARCHAR          │
  │ doc_date        DATE             │   ┌──────────────────────────────────┐
  │ type            ENUM             │   │ tb_good_received_note_detail     │
  │ status          ENUM             │   ├──────────────────────────────────┤
  │ vendor_id       UUID          FK │   │ id               UUID        PK  │
  │ location_id     UUID          FK │   │ grn_id           UUID        FK  │
  │ po_id           UUID          FK │─► │ product_id       UUID        FK  │──► tb_product
  │ invoice_number  VARCHAR          │   │ unit_id          UUID        FK  │──► tb_unit
  │ subtotal        DECIMAL          │   │ qty              DECIMAL         │
  │ tax_amount      DECIMAL          │   │ price            DECIMAL         │
  │ total_amount    DECIMAL          │   │ po_detail_id     UUID        FK  │──► PO detail
  │ workflow_id     UUID          FK │   │ tax_amount       DECIMAL         │
  │ dimension       JSON             │   │ total            DECIMAL         │
  │ doc_version     INT              │   └────────┬─────────────────────────┘
  │ created_by      UUID          FK │            │ 1:N
  │ deleted_at      TIMESTZ          │            ▼
  └──────────────────────────────────┘   ┌──────────────────────────────────┐
                                         │ tb_good_received_note_detail_item│
                                         ├──────────────────────────────────┤
                                         │ id               UUID        PK  │
                                         │ grn_detail_id    UUID        FK  │
                                         │ batch_number     VARCHAR         │
                                         │ expiry_date      DATE            │
                                         │ qty              DECIMAL         │
                                         └──────────────────────────────────┘

  ┌──────────────────────────────────┐
  │      tb_credit_note              │
  ├──────────────────────────────────┤
  │ id              UUID          PK │
  │ doc_number      VARCHAR          │   ┌──────────────────────────────────┐
  │ doc_date        DATE             │   │ tb_credit_note_detail            │
  │ type            ENUM             │   ├──────────────────────────────────┤
  │ doc_status      ENUM             │   │ id               UUID        PK  │
  │ vendor_id       UUID          FK │   │ credit_note_id   UUID        FK  │
  │ location_id     UUID          FK │   │ product_id       UUID        FK  │
  │ grn_id          UUID          FK │──►│ unit_id          UUID        FK  │
  │ reason_id       UUID          FK │   │ qty              DECIMAL         │
  │ subtotal        DECIMAL          │   │ price            DECIMAL         │
  │ tax_amount      DECIMAL          │   │ grn_detail_id    UUID        FK  │
  │ total_amount    DECIMAL          │   └──────────────────────────────────┘
  │ workflow_id     UUID          FK │
  │ created_by      UUID          FK │
  │ deleted_at      TIMESTZ          │
  └──────────────────────────────────┘

PROCUREMENT FLOW:
  PR (Purchase Request) ──► PO (Purchase Order) ──► GRN (Goods Received Note) ──► Credit Note
```

### 6.5 Tenant Database ERD - Inventory & Stock

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         TENANT DATABASE ERD                                     │
│                     Section: INVENTORY & STOCK                                   │
└─────────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────────────────────┐
  │  tb_inventory_transaction    │
  ├──────────────────────────────┤
  │ id            UUID        PK │
  │ doc_type      ENUM           │    ┌───────────────────────────────────┐
  │ doc_id        UUID           │    │ tb_inventory_transaction_detail   │
  │ doc_number    VARCHAR        │    ├───────────────────────────────────┤
  │ transaction_date DATE        │    │ id               UUID         PK  │
  │ location_id   UUID        FK │    │ transaction_id   UUID         FK  │
  │ created_by    UUID        FK │    │ product_id       UUID         FK  │
  │ deleted_at    TIMESTZ        │    │ unit_id          UUID         FK  │
  └──────────────────────────────┘    │ qty              DECIMAL          │
                                      │ cost             DECIMAL          │
                                      │ running_qty      DECIMAL          │
                                      │ running_cost     DECIMAL          │
                                      └───────────────────────────────────┘

  ┌──────────────────────────┐        ┌──────────────────────────────┐
  │     tb_stock_in          │        │    tb_stock_in_detail        │
  ├──────────────────────────┤        ├──────────────────────────────┤
  │ id          UUID      PK │        │ id             UUID       PK │
  │ doc_number  VARCHAR      │   1:N  │ stock_in_id    UUID       FK │
  │ doc_date    DATE         │───────►│ product_id     UUID       FK │──► tb_product
  │ doc_status  ENUM         │        │ unit_id        UUID       FK │──► tb_unit
  │ location_id UUID      FK │──►loc  │ qty            DECIMAL       │
  │ workflow_id UUID      FK │        │ cost           DECIMAL       │
  │ remark      VARCHAR      │        │ remark         VARCHAR       │
  │ dimension   JSON         │        │ dimension      JSON          │
  │ created_by  UUID      FK │        └──────────────────────────────┘
  │ deleted_at  TIMESTZ      │
  └──────────────────────────┘

  ┌──────────────────────────┐        ┌──────────────────────────────┐
  │     tb_stock_out         │        │    tb_stock_out_detail       │
  ├──────────────────────────┤        ├──────────────────────────────┤
  │ id          UUID      PK │        │ id             UUID       PK │
  │ doc_number  VARCHAR      │   1:N  │ stock_out_id   UUID       FK │
  │ doc_date    DATE         │───────►│ product_id     UUID       FK │──► tb_product
  │ doc_status  ENUM         │        │ unit_id        UUID       FK │──► tb_unit
  │ location_id UUID      FK │──►loc  │ qty            DECIMAL       │
  │ workflow_id UUID      FK │        │ cost           DECIMAL       │
  │ remark      VARCHAR      │        │ remark         VARCHAR       │
  │ dimension   JSON         │        │ dimension      JSON          │
  │ created_by  UUID      FK │        └──────────────────────────────┘
  │ deleted_at  TIMESTZ      │
  └──────────────────────────┘

  ┌──────────────────────────┐        ┌──────────────────────────────┐
  │     tb_transfer          │        │    tb_transfer_detail        │
  ├──────────────────────────┤        ├──────────────────────────────┤
  │ id          UUID      PK │        │ id             UUID       PK │
  │ doc_number  VARCHAR      │   1:N  │ transfer_id    UUID       FK │
  │ doc_date    DATE         │───────►│ product_id     UUID       FK │──► tb_product
  │ doc_status  ENUM         │        │ unit_id        UUID       FK │──► tb_unit
  │ from_loc_id UUID      FK │──►loc  │ qty            DECIMAL       │
  │ to_loc_id   UUID      FK │──►loc  │ cost           DECIMAL       │
  │ workflow_id UUID      FK │        │ remark         VARCHAR       │
  │ remark      VARCHAR      │        │ dimension      JSON          │
  │ dimension   JSON         │        └──────────────────────────────┘
  │ created_by  UUID      FK │
  │ deleted_at  TIMESTZ      │
  └──────────────────────────┘

  ┌──────────────────────────┐        ┌──────────────────────────────┐
  │   tb_store_requisition   │        │ tb_store_requisition_detail  │
  ├──────────────────────────┤        ├──────────────────────────────┤
  │ id          UUID      PK │   1:N  │ id             UUID       PK │
  │ doc_number  VARCHAR      │───────►│ requisition_id UUID       FK │
  │ doc_date    DATE         │        │ product_id     UUID       FK │
  │ doc_status  ENUM         │        │ unit_id        UUID       FK │
  │ from_loc_id UUID      FK │        │ qty            DECIMAL       │
  │ to_loc_id   UUID      FK │        └──────────────────────────────┘
  │ workflow_id UUID      FK │
  └──────────────────────────┘

  ┌──────────────────────────┐        ┌──────────────────────────────┐
  │     tb_count_stock       │        │    tb_count_stock_detail     │
  ├──────────────────────────┤        ├──────────────────────────────┤
  │ id          UUID      PK │   1:N  │ id             UUID       PK │
  │ doc_number  VARCHAR      │───────►│ count_stock_id UUID       FK │
  │ count_date  DATE         │        │ product_id     UUID       FK │
  │ status      ENUM         │        │ unit_id        UUID       FK │
  │ location_id UUID      FK │        │ system_qty     DECIMAL       │
  │ type        ENUM         │        │ count_qty      DECIMAL       │
  │ created_by  UUID      FK │        │ diff_qty       DECIMAL       │
  └──────────────────────────┘        └──────────────────────────────┘

  ┌──────────────────────────┐        ┌──────────────────────────────┐
  │     tb_spot_check        │        │    tb_spot_check_detail      │
  ├──────────────────────────┤        ├──────────────────────────────┤
  │ id          UUID      PK │   1:N  │ id             UUID       PK │
  │ doc_number  VARCHAR      │───────►│ spot_check_id  UUID       FK │
  │ check_date  DATE         │        │ product_id     UUID       FK │
  │ status      ENUM         │        │ system_qty     DECIMAL       │
  │ method      ENUM         │        │ count_qty      DECIMAL       │
  │ location_id UUID      FK │        │ diff_qty       DECIMAL       │
  └──────────────────────────┘        └──────────────────────────────┘
```

### 6.6 Tenant Database ERD - Pricing, Financial & Config

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         TENANT DATABASE ERD                                     │
│                  Section: PRICING, FINANCIAL & CONFIG                             │
└─────────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────────────────┐        ┌──────────────────────────────┐
  │     tb_pricelist         │        │    tb_pricelist_detail       │
  ├──────────────────────────┤        ├──────────────────────────────┤
  │ id          UUID      PK │   1:N  │ id             UUID       PK │
  │ doc_number  VARCHAR      │───────►│ pricelist_id   UUID       FK │
  │ vendor_id   UUID      FK │        │ product_id     UUID       FK │──► tb_product
  │ status      ENUM         │        │ unit_id        UUID       FK │──► tb_unit
  │ effective_date DATE      │        │ price          DECIMAL       │
  │ compare_type   ENUM      │        │ remark         VARCHAR       │
  │ created_by  UUID      FK │        └──────────────────────────────┘
  └──────────────────────────┘

  ┌──────────────────────────────────┐
  │  tb_request_for_pricing (RFP)    │   ┌─────────────────────────────────┐
  ├──────────────────────────────────┤   │ tb_request_for_pricing_detail   │
  │ id            UUID            PK │   ├─────────────────────────────────┤
  │ doc_number    VARCHAR            │1:N│ id              UUID         PK  │
  │ vendor_id     UUID            FK │──►│ rfp_id          UUID         FK  │
  │ status        ENUM               │   │ product_id      UUID         FK  │
  │ created_by    UUID            FK │   │ unit_id         UUID         FK  │
  └──────────────────────────────────┘   │ qty             DECIMAL          │
                                         │ price           DECIMAL          │
                                         └─────────────────────────────────┘

  ┌──────────────────────────┐        ┌──────────────────────────────┐
  │     tb_extra_cost        │        │    tb_extra_cost_detail      │
  ├──────────────────────────┤        ├──────────────────────────────┤
  │ id          UUID      PK │   1:N  │ id             UUID       PK │
  │ doc_number  VARCHAR      │───────►│ extra_cost_id  UUID       FK │
  │ doc_date    DATE         │        │ grn_detail_id  UUID       FK │──► GRN detail
  │ type_id     UUID      FK │──►type │ amount         DECIMAL       │
  │ grn_id      UUID      FK │──►GRN  │ allocate_type  ENUM          │
  │ total_amount DECIMAL     │        └──────────────────────────────┘
  └──────────────────────────┘

  ┌──────────────────────────┐        ┌──────────────────────────────┐
  │    tb_jv_header          │        │    tb_jv_detail              │
  ├──────────────────────────┤        ├──────────────────────────────┤
  │ id          UUID      PK │   1:N  │ id             UUID       PK │
  │ doc_number  VARCHAR      │───────►│ jv_header_id   UUID       FK │
  │ doc_date    DATE         │        │ account        VARCHAR       │
  │ status      ENUM         │        │ debit          DECIMAL       │
  │ description VARCHAR      │        │ credit         DECIMAL       │
  │ created_by  UUID      FK │        │ description    VARCHAR       │
  └──────────────────────────┘        └──────────────────────────────┘

  ┌──────────────────────────┐        ┌──────────────────────────────┐
  │    tb_period             │        │    tb_period_snapshot        │
  ├──────────────────────────┤        ├──────────────────────────────┤
  │ id          UUID      PK │   1:N  │ id             UUID       PK │
  │ name        VARCHAR      │───────►│ period_id      UUID       FK │
  │ start_date  DATE         │        │ product_id     UUID       FK │
  │ end_date    DATE         │        │ location_id    UUID       FK │
  │ status      ENUM         │        │ qty            DECIMAL       │
  │ location_id UUID      FK │        │ cost           DECIMAL       │
  └──────────────────────────┘        └──────────────────────────────┘

  ┌────────────────────────────────────────────────────────────────────┐
  │                  CONFIGURATION TABLES                              │
  ├────────────────────────────────────────────────────────────────────┤
  │                                                                    │
  │  ┌──────────────────────────┐  ┌──────────────────────────────┐   │
  │  │   tb_workflow            │  │ tb_config_running_code       │   │
  │  ├──────────────────────────┤  ├──────────────────────────────┤   │
  │  │ id        UUID        PK │  │ id          UUID          PK │   │
  │  │ name      VARCHAR        │  │ doc_type    VARCHAR          │   │
  │  │ type      ENUM           │  │ prefix      VARCHAR          │   │
  │  │ config    JSON           │  │ running_number INT           │   │
  │  │ is_active BOOLEAN        │  │ format      VARCHAR          │   │
  │  └──────────────────────────┘  └──────────────────────────────┘   │
  │                                                                    │
  │  ┌──────────────────────────┐  ┌──────────────────────────────┐   │
  │  │ tb_application_config   │  │ tb_application_user_config   │   │
  │  ├──────────────────────────┤  ├──────────────────────────────┤   │
  │  │ id       UUID         PK │  │ id          UUID          PK │   │
  │  │ key      ENUM            │  │ user_id     UUID             │   │
  │  │ value    JSON            │  │ config      JSON             │   │
  │  └──────────────────────────┘  └──────────────────────────────┘   │
  │                                                                    │
  │  ┌──────────────────────────┐  ┌──────────────────────────────┐   │
  │  │    tb_dimension          │  │ tb_dimension_display_in      │   │
  │  ├──────────────────────────┤  ├──────────────────────────────┤   │
  │  │ id       UUID         PK │  │ id          UUID          PK │   │
  │  │ name     VARCHAR         │  │ dimension_id UUID         FK │   │
  │  │ type     ENUM            │  │ display_in  ENUM             │   │
  │  │ is_active BOOLEAN        │  └──────────────────────────────┘   │
  │  └──────────────────────────┘                                      │
  │                                                                    │
  │  ┌──────────────────────────┐  ┌──────────────────────────────┐   │
  │  │    tb_menu               │  │    tb_attachment             │   │
  │  ├──────────────────────────┤  ├──────────────────────────────┤   │
  │  │ id       UUID         PK │  │ id          UUID          PK │   │
  │  │ name     VARCHAR         │  │ ref_id      UUID             │   │
  │  │ parent_id UUID        FK │  │ ref_type    VARCHAR          │   │
  │  │ path     VARCHAR         │  │ file_name   VARCHAR          │   │
  │  │ icon     VARCHAR         │  │ file_url    VARCHAR          │   │
  │  │ seq      INT             │  │ file_size   INT              │   │
  │  └──────────────────────────┘  └──────────────────────────────┘   │
  │                                                                    │
  │  ┌──────────────────────────┐  ┌──────────────────────────────┐   │
  │  │  tb_adjustment_type     │  │    tb_user_location          │   │
  │  ├──────────────────────────┤  ├──────────────────────────────┤   │
  │  │ id       UUID         PK │  │ id          UUID          PK │   │
  │  │ name     VARCHAR         │  │ user_id     UUID             │   │
  │  │ type     ENUM            │  │ location_id UUID          FK │   │
  │  │ is_active BOOLEAN        │  │ is_default  BOOLEAN          │   │
  │  └──────────────────────────┘  └──────────────────────────────┘   │
  └────────────────────────────────────────────────────────────────────┘
```

### 6.7 Tenant Database - Key Enums

| Enum | Values |
|------|--------|
| `enum_doc_status` | draft, pending, approved, rejected, cancelled, closed |
| `enum_purchase_request_doc_status` | draft, pending_approval, approved, rejected, cancelled, closed |
| `enum_purchase_order_doc_status` | draft, pending_approval, approved, rejected, cancelled, partially_received, closed |
| `enum_good_received_note_status` | draft, pending, approved, rejected, cancelled |
| `enum_good_received_note_type` | po_based, non_po |
| `enum_credit_note_type` | return, price_adjustment, damage |
| `enum_credit_note_doc_status` | draft, pending, approved, rejected, cancelled |
| `enum_location_type` | warehouse, store, kitchen, bar |
| `enum_unit_type` | inventory, order, recipe |
| `enum_tax_type` | vat, service_charge, withholding_tax |
| `enum_calculation_method` | inclusive, exclusive |
| `enum_transaction_type` | stock_in, stock_out, transfer_in, transfer_out, grn, adjustment |
| `enum_activity_action` | create, update, delete, approve, reject, cancel, close |
| `enum_count_stock_status` | draft, in_progress, completed, cancelled |
| `enum_spot_check_status` | draft, in_progress, completed |
| `enum_spot_check_method` | random, full |
| `enum_period_status` | open, closed |
| `enum_jv_status` | draft, posted, cancelled |
| `enum_pricelist_status` | draft, active, expired, cancelled |
| `enum_workflow_type` | approval, notification |
| `enum_vendor_address_type` | billing, shipping, both |
| `enum_product_status_type` | active, inactive, discontinued |
| `enum_dimension_type` | text, number, date, select |
| `enum_issue_status` | open, in_progress, resolved, closed |
| `enum_issue_priority` | low, medium, high, critical |

### 6.8 Complete Relationship Summary

```
PLATFORM DATABASE RELATIONSHIPS:
════════════════════════════════
tb_cluster ──<< tb_business_unit ──<< tb_application_role ──<< tb_application_role_tb_permission >>── tb_permission
                    │                       │
                    │──<< tb_business_unit_tb_module >>── tb_module
                    │──<< tb_subscription_detail >>── tb_subscription >>── tb_cluster
                    │──<< tb_user_tb_business_unit >>── tb_user
                    │                                     │
tb_cluster ──<< tb_cluster_user >>───────────────────────│
                                                          │──<< tb_user_tb_application_role >>── tb_application_role
                                                          │── tb_user_profile (1:1)
                                                          │──<< tb_password
                                                          │──<< tb_user_login_session
                                                          │──<< tb_notification (from/to)

TENANT DATABASE RELATIONSHIPS:
══════════════════════════════
                                  MASTER DATA
tb_product_category ──<< tb_product_sub_category
tb_product_category <<── tb_product ──>> tb_product_sub_category
tb_product ──>> tb_product_item_group
tb_product ──>> tb_unit (base unit)
tb_product ──>> tb_tax_profile
tb_product ──<< tb_product_location >>── tb_location
tb_product ──<< tb_product_tb_vendor >>── tb_vendor
tb_vendor ──<< tb_vendor_address
tb_vendor ──<< tb_vendor_contact
tb_vendor ──<< tb_vendor_business_type
tb_vendor ──>> tb_credit_term
tb_unit ──<< tb_unit_conversion (from/to)
tb_currency ──<< tb_exchange_rate
tb_department ──<< tb_department_user

                               PROCUREMENT FLOW
tb_purchase_request ──<< tb_purchase_request_detail
tb_purchase_order ──>> tb_purchase_request (optional)
tb_purchase_order ──>> tb_vendor
tb_purchase_order ──>> tb_location
tb_purchase_order ──>> tb_currency
tb_purchase_order ──<< tb_purchase_order_detail ──>> tb_product, tb_unit
tb_good_received_note ──>> tb_purchase_order (optional)
tb_good_received_note ──>> tb_vendor, tb_location
tb_good_received_note ──<< tb_good_received_note_detail ──<< tb_good_received_note_detail_item
tb_credit_note ──>> tb_good_received_note (optional)
tb_credit_note ──<< tb_credit_note_detail

                              INVENTORY OPERATIONS
tb_stock_in ──<< tb_stock_in_detail ──>> tb_product, tb_unit
tb_stock_out ──<< tb_stock_out_detail ──>> tb_product, tb_unit
tb_transfer ──<< tb_transfer_detail ──>> tb_product, tb_unit
tb_store_requisition ──<< tb_store_requisition_detail
tb_count_stock ──<< tb_count_stock_detail
tb_spot_check ──<< tb_spot_check_detail
tb_inventory_transaction ──<< tb_inventory_transaction_detail
                                ──<< tb_inventory_transaction_cost_layer

                              FINANCIAL & CONFIG
tb_extra_cost ──<< tb_extra_cost_detail
tb_jv_header ──<< tb_jv_detail
tb_period ──<< tb_period_snapshot
tb_pricelist ──<< tb_pricelist_detail
tb_request_for_pricing ──<< tb_request_for_pricing_detail
tb_dimension ──<< tb_dimension_display_in
tb_menu (self-referencing: parent_id)

Legend: ──<< = One-to-Many | ──>> = Many-to-One (FK) | >>──<< = Many-to-Many
```

---

## 7. Inter-Service Communication

### 7.1 Communication Protocols

```
+---------------------------------------------------------------+
|                Communication Methods                          |
|                                                               |
|  +-------------------+  +------------------+  +------------+  |
|  | TCP Microservice  |  | HTTP REST API    |  | WebSocket  |  |
|  | (Primary)         |  | (Secondary)      |  | (Realtime) |  |
|  |                   |  |                  |  |            |  |
|  | - Inter-service   |  | - External APIs  |  | - Live     |  |
|  |   communication   |  | - Health checks  |  |   notifs   |  |
|  | - Message pattern  |  | - Swagger docs   |  | - Updates  |  |
|  |   based           |  | - Direct access  |  |            |  |
|  +-------------------+  +------------------+  +------------+  |
|                                                               |
|  +-------------------+  +------------------+                  |
|  | gRPC (Optional)   |  | Message Queues   |                  |
|  |                   |  | (Optional)       |                  |
|  | - High perf RPC   |  | - RabbitMQ/AMQP  |                  |
|  | - Proto-based     |  | - Kafka          |                  |
|  |                   |  | - NATS / MQTT    |                  |
|  +-------------------+  +------------------+                  |
+---------------------------------------------------------------+
```

### 7.2 TCP Communication Pattern

```typescript
// Gateway (Client) sends TCP message:
this.businessClient.send({ cmd: 'get_products' }, payload);

// Micro-business (Server) receives and processes:
@MessagePattern({ cmd: 'get_products' })
async getProducts(payload: GetProductsDto) {
  return this.productService.findAll(payload);
}
```

### 7.3 Service Connection Map

```
backend-gateway
    |
    |-- TCP --> micro-business    (5020)  [auth, cluster, inventory, master, procurement]
    |-- TCP --> micro-file        (5007)  [file upload/download]
    |-- TCP --> micro-cronjob     (5012)  [cron job management]
    |-- TCP --> micro-keycloak-api(5013)  [SSO authentication]
    |-- TCP --> micro-notification(5006)  [notifications]
    |
    |-- WebSocket <--> Clients           [real-time updates]
```

---

## 8. Build & Deployment Workflow

### 8.1 Development Workflow

```
Developer Machine
      |
      v
+-----+------+
| bun run    |
| dev        |  (Watch mode with hot reload)
+-----+------+
      |
      |  Turborepo orchestrates:
      |
      |  1. db:generate    --> Generate Prisma clients
      |  2. build:package  --> Build shared packages
      |  3. dev (each app) --> Start all services in watch mode
      |
      v
  All services running locally with hot reload
```

### 8.2 Build Process

```
bun run build
      |
      v
+-----+------+
| Turborepo  |  (Parallel execution with dependency graph)
+-----+------+
      |
      |  Step 1: db:generate
      |  +-- prisma-shared-schema-platform: npx prisma generate
      |  +-- prisma-shared-schema-tenant:   npx prisma generate
      |
      |  Step 2: build:package
      |  +-- log-events-library: SWC compile --> dist/
      |  +-- prisma-shared-schema-platform:  SWC compile --> dist/
      |  +-- prisma-shared-schema-tenant:    SWC compile --> dist/
      |
      |  Step 3: build (all apps in parallel)
      |  +-- backend-gateway:     SWC compile --> dist/
      |  +-- micro-business:      SWC compile --> dist/
      |  +-- micro-file:          SWC compile --> dist/
      |  +-- micro-cronjob:       SWC compile --> dist/
      |  +-- micro-keycloak-api:  SWC compile --> dist/
      |  +-- micro-notification:  SWC compile --> dist/
      |
      v
  Build artifacts cached by Turborepo
```

### 8.3 CI/CD Pipeline (GitHub Actions)

```
Git Push to main
      |
      v
+-----+------+
|  GitHub    |
|  Actions   |
+-----+------+
      |
      |  Phase 1: BUILD
      |  +-- Checkout code
      |  +-- Setup Bun
      |  +-- bun install
      |  +-- turbo run build (with remote cache on S3)
      |
      |  Phase 2: DOCKER BUILD (Matrix - 6 services in parallel)
      |  +-- Build Docker image for each service
      |  +-- Tag with git SHA + "latest"
      |  +-- Push to AWS ECR
      |
      |  Phase 3: DEPLOY
      |  +-- SSH to EC2 instance
      |  +-- docker-compose pull
      |  +-- docker-compose up -d --remove-orphans
      |  +-- Cleanup dangling images
      |
      v
  Production deployed!
```

### 8.4 Docker Build Process (Per Service)

```
Dockerfile (Multi-stage)
      |
      v
+-----+------+
| BUILDER    |  (Stage 1)
| Stage      |
+-----+------+
      |
      |  1. Base: node:22-bookworm-slim
      |  2. Install: OpenSSL, Bun
      |  3. Copy: root configs (package.json, turbo.json, tsconfig.json)
      |  4. Copy: packages/ (shared libraries)
      |  5. Copy: apps/<service>/ (target service)
      |  6. Run: bun install
      |  7. Run: npm run build
      |
      v
+-----+------+
| RUNNER     |  (Stage 2)
| Stage      |
+-----+------+
      |
      |  1. Base: node:22-bookworm-slim
      |  2. Install: OpenSSL, Bun
      |  3. Copy: root configs
      |  4. Copy: packages/ dist from builder
      |  5. Copy: app dist/ from builder
      |  6. Run: bun install --production
      |  7. Set: NODE_ENV=production
      |  8. Expose: service ports
      |  9. CMD: bun run start:prod
      |
      v
  Optimized production Docker image
```

---

## 9. Deployment Architecture

### 9.1 Production Server Layout

```
+==================================================================+
|                    Production EC2 Instance                        |
|                                                                  |
|  +-----------------------------------------------------------+  |
|  |                     Nginx (Reverse Proxy)                  |  |
|  |                                                            |  |
|  |  Port 4000 (SSL) --> backend-gateway:4010                  |  |
|  |  Port 80/443     --> Frontend App:3000                     |  |
|  |  Port 81 (SSL)   --> Platform Admin:3001                   |  |
|  +-----------------------------------------------------------+  |
|                              |                                   |
|  +-----------------------------------------------------------+  |
|  |              Docker Compose (carmen-network)               |  |
|  |                                                            |  |
|  |  +------------------+  +-----------------+                 |  |
|  |  | backend-gateway  |  | micro-business  |                 |  |
|  |  | 4010:4000        |  | 5020:5020       |                 |  |
|  |  | 4011:4001        |  | 6020:6020       |                 |  |
|  |  +------------------+  +-----------------+                 |  |
|  |                                                            |  |
|  |  +------------------+  +-----------------+                 |  |
|  |  | micro-file       |  | micro-cronjob   |                 |  |
|  |  | 5007:5007        |  | 5012:5012       |                 |  |
|  |  | 6007:6007        |  | 6012:6012       |                 |  |
|  |  +------------------+  +-----------------+                 |  |
|  |                                                            |  |
|  |  +------------------+  +-----------------+                 |  |
|  |  | micro-keycloak   |  | micro-          |                 |  |
|  |  |   -api           |  | notification    |                 |  |
|  |  | 5013:5013        |  | 5006:5006       |                 |  |
|  |  | 6013:6013        |  | 6006:6006       |                 |  |
|  |  +------------------+  +-----------------+                 |  |
|  |                                                            |  |
|  |  +------------------+                                      |  |
|  |  | turbo-cache      |  (Turborepo Remote Cache)            |  |
|  |  | 3333:3000        |                                      |  |
|  |  +------------------+                                      |  |
|  +-----------------------------------------------------------+  |
|                              |                                   |
|  +-----------------------------------------------------------+  |
|  |                    External Services                       |  |
|  |                                                            |  |
|  |  +------------------+  +-----------------+                 |  |
|  |  | PostgreSQL       |  | MinIO/S3        |                 |  |
|  |  | - Platform DB    |  | (File Storage)  |                 |  |
|  |  | - Tenant DB      |  |                 |                 |  |
|  |  +------------------+  +-----------------+                 |  |
|  |                                                            |  |
|  |  +------------------+  +-----------------+                 |  |
|  |  | Redis            |  | Keycloak        |                 |  |
|  |  | (Cache/Session)  |  | (SSO Server)    |                 |  |
|  |  +------------------+  +-----------------+                 |  |
|  |                                                            |  |
|  |  +------------------+  +-----------------+                 |  |
|  |  | Grafana Loki     |  | Sentry          |                 |  |
|  |  | (Log Aggregation)|  | (Error Tracking)|                 |  |
|  |  +------------------+  +-----------------+                 |  |
|  +-----------------------------------------------------------+  |
+==================================================================+
```

### 9.2 Port Mapping Summary

| Service              | Container TCP | Container HTTP | Host TCP | Host HTTP |
|----------------------|---------------|----------------|----------|-----------|
| backend-gateway      | 4000          | 4001 (HTTPS)   | 4010     | 4011      |
| micro-business       | 5020          | 6020           | 5020     | 6020      |
| micro-file           | 5007          | 6007           | 5007     | 6007      |
| micro-cronjob        | 5012          | 6012           | 5012     | 6012      |
| micro-keycloak-api   | 5013          | 6013           | 5013     | 6013      |
| micro-notification   | 5006          | 6006           | 5006     | 6006      |
| turbo-cache          | 3000          | -              | 3333     | -         |

---

## 10. Environment Configuration

### 10.1 backend-gateway

```env
# Gateway Ports
GATEWAY_SERVICE_HOST=localhost
GATEWAY_SERVICE_PORT=4000
GATEWAY_SERVICE_HTTPS_PORT=4001

# Service Connections (TCP)
BUSINESS_SERVICE_HOST=micro-business
BUSINESS_SERVICE_PORT=5020
BUSINESS_SERVICE_HTTP_PORT=6020

FILE_SERVICE_HOST=micro-file
FILE_SERVICE_PORT=5007
FILE_SERVICE_HTTP_PORT=6007

NOTIFICATION_SERVICE_HOST=micro-notification
NOTIFICATION_SERVICE_PORT=5006
NOTIFICATION_SERVICE_HTTP_PORT=6006

CRONJOB_SERVICE_HOST=micro-cronjob
CRONJOB_SERVICE_PORT=5012

KEYCLOAK_API_SERVICE_HOST=micro-keycloak-api
KEYCLOAK_API_SERVICE_PORT=5013

# Email/SMTP
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=password

# Logging
LOKI_HOST=loki.example.com
LOKI_PORT=3100
LOKI_PROTOCOL=http
```

### 10.2 Database Configuration

```env
# Platform Database
SYSTEM_DATABASE_URL=postgresql://user:pass@host:5432/platform_db
SYSTEM_DIRECT_URL=postgresql://user:pass@host:5432/platform_db

# Tenant Database
DATABASE_URL=postgresql://user:pass@host:5432/tenant_db
```

### 10.3 micro-file (MinIO)

```env
MINIO_ENDPOINT=http://minio-host:9000
MINIO_ACCESS_KEY=access_key
MINIO_SECRET_KEY=secret_key
MINIO_BUCKET_NAME=carmen
```

---

## 11. Shared Packages

### 11.1 @repo/prisma-shared-schema-platform

- **Purpose**: Prisma Client and schema for Platform database
- **Exports**: PrismaClient, generated types, seed utilities
- **Used by**: backend-gateway, micro-business, micro-notification

### 11.2 @repo/prisma-shared-schema-tenant

- **Purpose**: Prisma Client and schema for Tenant database
- **Exports**: PrismaClient, generated types, seed/mock utilities
- **Used by**: backend-gateway, micro-business
- **Features**: ERD generation, test utilities (Vitest)

### 11.3 @repo/log-events-library

- **Purpose**: Audit logging for database operations
- **Exports**: NestJS interceptor, Zod schemas
- **Features**: Tracks create/update/delete actions with user context
- **Storage**: File-based and database logging options

### 11.4 @repo/eslint-config

- **Purpose**: Shared ESLint + Prettier configuration
- **Used by**: All apps and packages

---

## 12. API Documentation & Testing

### 12.1 Swagger / Scalar API Docs

Each service exposes API documentation at the `/swagger` endpoint:

- **Gateway**: `https://api.domain.com/swagger`
- **micro-business**: `http://localhost:6020/swagger`
- **micro-notification**: `http://localhost:6006/swagger`

Features:
- Auto-generated from NestJS decorators
- Bearer token authentication
- Scalar UI for interactive testing

### 12.2 Health Check Endpoints

| Service              | Health Check URL                    |
|----------------------|-------------------------------------|
| backend-gateway      | `http://localhost:4000/health`      |
| backend-gateway SSL  | `https://localhost:4001/health`     |
| micro-business       | `http://localhost:6020/health`      |
| micro-notification   | `http://localhost:6006/health`      |

### 12.3 API Testing

- **Bruno**: API testing collections located in `apps/bruno/`
- **Jest + Supertest**: Unit and integration tests
- **Vitest**: Used in prisma-shared-schema-tenant for database tests

---

## End of Document

**Prepared by**: Claude Code (AI Assistant)
**Date**: 15 February 2026
**Project**: Carmen Turborepo Backend v2
