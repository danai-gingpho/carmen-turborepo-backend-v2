# Swagger & Bruno Examples Refresh — Design Spec

**Date**: 2026-04-29
**Owner**: Thammanoon Semapru
**Status**: Approved (pending implementation plan)

## Goal

Refresh the API documentation surface across the gateway to bring all endpoints to a consistent quality bar:

1. **Swagger DTO examples** — every request/response field has a realistic `@ApiProperty({ example })`.
2. **Bruno `body:json`** — every POST/PUT/PATCH endpoint has a usable example body.
3. **Bruno `docs`** — every endpoint has a full bilingual docs block following a single template.

## Scope

### In scope

- All Bruno top-level folders under `apps/bruno/carmen-inventory/`:
  `auth`, `config`, `documents-and-reports`, `inventory`, `master-data`, `my-pending`, `platform`, `procurement`, `user-management`
- The matching gateway controllers and DTOs under `apps/backend-gateway/src/`
- Removal of the `bruno:sync:payloads` tool and its references

### Out of scope

- `apps/bruno/carmen-inventory/_archived/` and `_uncategorized/`
- DTO shape changes, Zod schema changes, controller logic, business logic
- Code refactoring beyond what the documentation work directly requires

## Update Rules

For each endpoint:

| Asset | Skip if exists? |
|-------|-----------------|
| Swagger `@ApiProperty({ example })` | **Yes** — only fill missing fields |
| Bruno `body:json` | **Yes** — only fill if empty (`{}` or whitespace) |
| Bruno `docs` block | **No** — always rewrite to the new template |

## Source of Truth (per endpoint)

- **Controller method** → HTTP verb, path, decorators (`@ApiTags`, `@RequirePermissions`, `@UseGuards`)
- **Request DTO** (Zod schema + DTO class) → fields, types, constraints
- **Response DTO + return type** → response shape (trace through service delegate to micro-business if needed)
- **Controller body** → `throw new XxxException(...)` for Error Responses
- **Permission seed** (`packages/prisma-shared-schema-platform/prisma/seed/permission*.ts`) → `permission_key → [roles]` mapping

## Bruno Docs Template

Every endpoint's `docs` block is rewritten to this structure. Sections without content are omitted (no "N/A" placeholders).

````markdown
## <Endpoint Title>
<คำอธิบายภาษาไทย: ทำอะไร, ใช้ตอนไหน, มีผลข้างเคียงไหม>

<English description: same content in English>

### Path Parameters
| Name | Type | Description |
|------|------|-------------|
| `bu_code` | string | Business unit code |

### Query Parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number |

### Headers
| Name | Required | Description |
|------|----------|-------------|
| `Authorization` | Yes | `Bearer {{access_token}}` |
| `x-app-id` | Yes | `{{x_app_id}}` |

### Permissions
- **Permission key**: `purchase-request:create`
- **Roles**: Requestor, HOD, Purchaser, FC, GM, Owner

### Sample Body
```json
{ ... }
```

### Sample Response
```json
{
  "data": { ... },
  "paginate": null,
  "status": 201,
  "success": true,
  "message": "Success",
  "timestamp": "2026-04-29T00:00:00.000Z"
}
```

### Error Responses
| Status | When |
|--------|------|
| 400 | `vendor_id` not found in business unit |
| 403 | User lacks `purchase-request:create` permission |
| 409 | `pr_no` duplicated within current period |
````

### Section rules

- **Path Parameters / Query Parameters / Sample Body** — included only if the endpoint has them. GET endpoints with no body do not get a Sample Body section.
- **Headers** — always present (at minimum `Authorization` for authenticated endpoints and `x-app-id`).
- **Permissions** — if the endpoint is public, write `Public — no auth required` instead of the bullet list.
- **Error Responses** — list only what the controller/service actually throws. If nothing is thrown by this endpoint, write `None handled by this endpoint`.

## Example Value Conventions

- Use **realistic, domain-appropriate values**:
  - IDs: full UUID v7 strings (e.g., `"019638a6-2a00-7c4f-8e46-9b7a52c80c4d"`)
  - Codes: `"PR-2026-0001"`, `"GRN-2026-0042"`, `"THB"`, `"EN"`
  - Quantities and prices: realistic numbers (`10.5`, `1250.00`)
  - Timestamps: ISO 8601 strings ending `Z` (e.g., `"2026-04-29T08:30:00.000Z"`)
- **Pagination response** — use realistic-looking counts (e.g., `total: 42`, `pages: 5`, `prev: null`, `next: 2`).
- **Sample Response** — generated from the response DTO using the same realistic-value convention. Listing endpoints include `paginate`; single-resource endpoints set `paginate: null`.

## Pre-work (one-time, before starting the first module)

1. **Remove `bruno:sync:payloads`**
   - Delete `scripts/bruno-sync/payloads.ts` (and `payload-sync/` directory if present)
   - Remove npm scripts `bruno:sync:payloads` and `bruno:sync:payloads:dry` from the root `package.json`
   - Remove the corresponding section from `CLAUDE.md` (Bruno API Collections)
   - Remove the corresponding section from `scripts/bruno-sync/README.md`
   - Verify nothing imports the deleted code: `bun run check-types`
2. **Build permission → roles mapping**
   - Read `packages/prisma-shared-schema-platform/prisma/seed/permission*.ts`
   - Produce a JSON map `{ "purchase-request:create": ["Requestor", "HOD", ...] }`
   - Cache it at a working location (e.g., `scripts/swagger-bruno-refresh/permission-role-map.json`) for use during docs generation

## Per-Module Workflow

A "module" = one Bruno folder containing endpoints (e.g., `auth/login/`, `config/currency/`, `procurement/purchase-request/`).

For each module, in alphabetical order within its parent folder:

1. **Discover** — list `.bru` files, parse `meta`, `url`, HTTP verb. Map each to the gateway controller method whose path + verb matches.
2. **Inspect** — read controller, request DTO, response DTO, and trace any thrown exceptions.
3. **Update Swagger DTOs** — fill missing `@ApiProperty({ example })` on request and response DTO fields.
4. **Update Bruno `body:json`** — for empty bodies on POST/PUT/PATCH, copy the Swagger example verbatim.
5. **Rewrite Bruno `docs`** — replace the docs block with the new template, populating every section that applies.
6. **Verify** — run `bun run check-types` for affected packages and `bun run bruno:sync:dry` to confirm no endpoint drift.

## Orphan Handling

- A Bruno endpoint whose controller no longer exists in the gateway is an **orphan**.
- Orphans are **collected into a tracking list during the run, not removed inline**.
- After the entire run completes, run `bun run bruno:sync` once to archive orphans in a single commit (separate from the per-folder docs commits).

## Commit Cadence

- **One commit per Bruno top-level folder** (not per module).
- Commit message format: `docs(<folder>): refresh swagger examples and bruno docs`
  - Examples: `docs(auth): refresh swagger examples and bruno docs`, `docs(procurement): refresh swagger examples and bruno docs`
- The pre-work and orphan cleanup get their own separate commits.

## Order of Execution

Top-level folders are processed alphabetically:

1. `auth/`
2. `config/`
3. `documents-and-reports/`
4. `inventory/`
5. `master-data/`
6. `my-pending/`
7. `platform/`
8. `procurement/`
9. `user-management/`

## Verification

- After each folder commit: `bun run check-types`, `bun run bruno:sync:dry` (no diff expected)
- After all folders: `bun run bruno:sync:dry` to surface the orphan list, then `bun run bruno:sync` for the final archive commit

## Open Items / Known Limitations

- Sample Response shapes are derived from response DTOs without running the live API. If a service mutates the response in ways the DTO does not capture, the example may diverge. Future enrichment can replace generated examples with real captures.
- The permission → roles mapping is a snapshot at the time of generation. If the seed changes mid-refresh, regenerate the mapping cache.
