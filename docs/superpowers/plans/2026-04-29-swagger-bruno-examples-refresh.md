# Swagger & Bruno Examples Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring all gateway endpoints to a consistent documentation quality bar by filling missing Swagger examples, filling empty Bruno bodies, and rewriting every Bruno docs block to a richer template (Path/Query Params, Headers, Permissions, Sample Body/Response, Error Responses).

**Architecture:** Pre-work removes the unused `bruno:sync:payloads` tool and produces a permission-role mapping cache. Then iterate alphabetically over the 9 Bruno top-level folders. For each folder, apply a per-endpoint workflow (discover → inspect → update Swagger → update Bruno body → rewrite Bruno docs) and commit per folder. Orphan endpoints are tracked across the run and archived in one final commit via `bun run bruno:sync`.

**Tech Stack:** NestJS gateway with `@nestjs/swagger`, Bruno API client (`.bru` files), TypeScript, Bun runtime, existing `scripts/bruno-sync` tooling.

**Spec:** [`docs/superpowers/specs/2026-04-29-swagger-bruno-examples-refresh-design.md`](../specs/2026-04-29-swagger-bruno-examples-refresh-design.md)

---

## Files Structure

### Created
- `scripts/swagger-bruno-refresh/permission-role-map.json` — generated cache of `{ "configuration.currency:view": ["Requestor", "HOD", ...], ... }`
- `scripts/swagger-bruno-refresh/orphan-tracker.md` — running log of `.bru` files whose gateway controller no longer exists; populated as we go

### Modified (during pre-work)
- `package.json` — remove `bruno:sync:payloads` and `bruno:sync:payloads:dry` npm scripts
- `CLAUDE.md` — remove the paragraph about `bun run bruno:sync:payloads` in the Bruno API Collections section
- `scripts/bruno-sync/README.md` — remove the payload-sync section

### Deleted (during pre-work)
- `scripts/bruno-sync/payloads.ts`
- `scripts/bruno-sync/payload-sync/` (entire directory: 8 files)

### Modified (during per-folder tasks)
- `apps/backend-gateway/src/**/*.dto.ts` — fill missing `@ApiProperty({ example })` only
- `apps/backend-gateway/src/**/swagger/request.ts` and `response.ts` — fill missing examples only
- `apps/bruno/carmen-inventory/<folder>/**/*.bru` — fill empty `body:json`, rewrite `docs` blocks

---

## Per-Endpoint Workflow (Recipe — apply to every endpoint)

Each module folder under a top-level Bruno folder contains one or more `.bru` files. For each `.bru` file, follow these steps in order. **This recipe is referenced by every per-folder task below — do not skip steps.**

### R1. Identify the controller method

1. Open the `.bru` file. Note the HTTP verb block (`get`/`post`/`put`/`patch`/`delete`) and `url:` value.
2. Strip `{{host}}` and `{{bu_code}}` placeholders. The remaining path is the gateway route (e.g., `/api/config/currency/:id`).
3. Find the matching controller in `apps/backend-gateway/src/`:

   ```bash
   grep -rln "@Controller.*'<api-prefix>'" apps/backend-gateway/src
   ```

4. In the controller, find the method whose decorator matches the verb + sub-path (e.g., `@Patch(':id')`). Note its decorators: `@ApiOperation`, `@ApiBody`, `@ApiParam`, `@ApiQuery`, `@UseGuards`, `@ApiBearerAuth`.

   **If no matching controller method exists**: append a line to `scripts/swagger-bruno-refresh/orphan-tracker.md` formatted as `- <relative-bru-path> — <verb> <url>` and continue to the next `.bru` file. Do not delete the file — final cleanup uses `bun run bruno:sync`.

### R2. Inspect the request DTO

1. Read the request DTO referenced by the method (e.g., `@Body() dto: CreateCurrencyDto`).
2. For each field, check whether it has `@ApiProperty({ example: ... })` or `@ApiPropertyOptional({ example: ... })`. If yes, **skip that field**. If no, **add a realistic example** consistent with the conventions below.

### R3. Inspect the response DTO

1. Find the controller method's `@ApiOkResponse({ type: ... })` / `@ApiCreatedResponse({ type: ... })` / explicit return type.
2. Trace through to the response DTO (often under `swagger/response.ts` next to the controller).
3. Apply the same rule as R2: fill missing examples only.

### R4. Trace exceptions thrown

1. Read the controller method body and the corresponding gateway service.
2. List every `throw new <Exception>(...)` you encounter (e.g., `BadRequestException`, `NotFoundException`, `ConflictException`, `ForbiddenException`).
3. For each exception, capture: HTTP status (from the exception class) + the trigger condition (the `if` that precedes the throw). This populates the **Error Responses** table in the docs.

   **If the controller delegates to micro-business via TCP** (`this.client.send(...)`): the throws happen on the microservice side. Either trace into `apps/micro-business/src/<domain>` for the matching `@MessagePattern` handler, or — when the trace is non-trivial — record only the gateway-side throws and add a note in the docs: `> Service-layer errors propagate via TCP; see micro-business for full list.`

### R5. Update Swagger DTO examples (skip if exists)

1. Edit the DTO file(s) found in R2/R3.
2. Use `Edit` tool to add `example` keys to existing `@ApiProperty(...)` calls. **Do not change the `description`, `type`, or `required` fields.**
3. Examples follow these conventions:

   | Field semantic | Example value |
   |----------------|---------------|
   | UUID id | `"019638a6-2a00-7c4f-8e46-9b7a52c80c4d"` (UUID v7) |
   | Code/number | `"PR-2026-0001"`, `"GRN-2026-0042"`, `"CUR-001"` |
   | Currency code | `"THB"`, `"USD"` |
   | Language code | `"EN"`, `"TH"` |
   | Date | `"2026-04-29"` |
   | Timestamp | `"2026-04-29T08:30:00.000Z"` |
   | Decimal price | `1250.00` |
   | Decimal quantity | `10.5` |
   | Email | `"john.doe@carmensoftware.com"` |
   | Boolean flag | match common usage; `true` for active, `false` for deleted/disabled |
   | Free-text name | realistic domain phrase, e.g., `"Thai Baht"`, `"Bangkok Main Warehouse"` |
   | Description | one sentence in English |

### R6. Update Bruno `body:json` (skip if non-empty)

1. Open the `.bru` file. Locate the `body:json { ... }` block.
2. If the block is empty (only contains `{}` or whitespace inside braces) **and** the verb is `post` / `put` / `patch`: replace the body with the same JSON object that R5 produced for the request DTO.
3. If the block already has content, **skip**. Move on.
4. If the verb is `get` / `delete`: there should be no `body:json` block; if there is, leave it alone.

### R7. Rewrite Bruno `docs` block (always)

1. Locate the `docs { ... }` block in the `.bru` file. If missing, insert one after the `meta` block.
2. **Replace the entire block contents** with the template below, populating every section that applies. Sections that don't apply are omitted (no `N/A`).

   Template:

   ````markdown
   docs {
     ## <Endpoint Title — derived from @ApiOperation summary>
     <คำอธิบายภาษาไทย จาก x-description-th หรือเขียนใหม่ให้สื่อความ>

     <English description from @ApiOperation description>

     ### Path Parameters
     | Name | Type | Description |
     |------|------|-------------|
     | `bu_code` | string | Business unit code |
     | `id` | string (UUID) | Currency ID |

     ### Query Parameters
     | Name | Type | Required | Default | Description |
     |------|------|----------|---------|-------------|
     | `page` | number | No | 1 | Page number |
     | `perpage` | number | No | 10 | Items per page |

     ### Headers
     | Name | Required | Description |
     |------|----------|-------------|
     | `Authorization` | Yes | `Bearer {{access_token}}` |
     | `x-app-id` | Yes | `{{x_app_id}}` |

     ### Permissions
     - **Permission key**: `configuration.currency:create`
     - **Roles**: HOD, Purchase, Approval

     > Role names come from `seed.role-permission.ts`. The full set is **Requestor, HOD, Purchase, Approval** (4 roles, not the persona names from `auth/login/`). Always look up the actual role list from `scripts/swagger-bruno-refresh/permission-role-map.json` — do not hand-pick.

     ### Sample Body
     ```json
     { "code": "THB", "name": "Thai Baht", ... }
     ```

     ### Sample Response
     ```json
     {
       "data": { "id": "019638a6-2a00-7c4f-8e46-9b7a52c80c4d" },
       "paginate": null,
       "status": 201,
       "success": true,
       "message": "Success",
       "timestamp": "2026-04-29T08:30:00.000Z"
     }
     ```

     ### Error Responses
     | Status | When |
     |--------|------|
     | 400 | `code` is empty or already exists in this business unit |
     | 403 | User lacks `configuration.currency:create` permission |
   }
   ````

3. Section-specific rules:
   - **Path Parameters**: include only if the URL has `:param` segments or `{{var}}` placeholders. Always include `bu_code` if it appears.
   - **Query Parameters**: include only if the controller method has `@Query()` parameters or `@ApiQuery` decorators.
   - **Headers**: always include both rows; omit `Authorization` only if the controller has no Keycloak-auth guard (rare; auth endpoints).
   - **Permissions**: derive the permission key from the controller's URL using the convention in R8. Look up roles from `permission-role-map.json`. If the endpoint has no Keycloak guard, use `Public — no auth required` and omit the bullet.
   - **Sample Body**: include only for `post`/`put`/`patch`. Use the same JSON as R6.
   - **Sample Response**: always include. Use realistic values from R5; for list endpoints fill `paginate` with realistic numbers (`{ "page": 1, "perpage": 10, "pages": 5, "total": 42, "prev": null, "next": 2 }`); for single-resource responses set `paginate: null`.
   - **Error Responses**: list only what was found in R4. If nothing thrown beyond standard guard errors, write `> No service-specific errors thrown by this endpoint.` instead of an empty table.

### R8. Permission key convention (used by R7)

Derive the permission key from the controller URL and HTTP verb:

| URL segment pattern | Resource (left of `:`) |
|---------------------|------------------------|
| `/api/config/currency` | `configuration.currency` |
| `/api/config/exchange-rate` | `configuration.exchange_rate` |
| `/api/config/department` | `configuration.department` |
| `/api/config/location` | `configuration.location` |
| `/api/procurement/purchase-request` | `procurement.purchase_request` |
| `/api/inventory/stock-in` | `inventory_management.stock_in` |
| `/api/master-data/product` | `product_management.product` |
| `/api/master-data/vendor` | `vendor_management.vendor` |

(Match against keys in `seed.permission.ts` — if a path segment doesn't map cleanly, look up the closest resource in the seed file.)

| HTTP verb | Action (right of `:`) |
|-----------|------------------------|
| `GET` | `view` |
| `POST` | `create` |
| `PATCH` / `PUT` | `update` |
| `DELETE` | `delete` |

If no entry matches the resource in the seed → write `> Permission key not found in seed; review needed.` and continue.

---

## Task 1: Remove `bruno:sync:payloads` Tool

**Files:**
- Modify: `package.json`
- Modify: `CLAUDE.md`
- Modify: `scripts/bruno-sync/README.md`
- Delete: `scripts/bruno-sync/payloads.ts`
- Delete: `scripts/bruno-sync/payload-sync/` (directory)

- [ ] **Step 1: Verify nothing imports the payload-sync code**

```bash
grep -rn "from.*payload-sync\|from.*scripts/bruno-sync/payloads" \
  apps packages scripts 2>/dev/null
```

Expected: only matches inside `scripts/bruno-sync/` itself (the payloads.ts entrypoint and its co-located helpers). No matches under `apps/` or `packages/`.

- [ ] **Step 2: Delete `scripts/bruno-sync/payloads.ts` and `scripts/bruno-sync/payload-sync/`**

```bash
rm scripts/bruno-sync/payloads.ts
rm -rf scripts/bruno-sync/payload-sync
```

- [ ] **Step 3: Remove npm scripts from `package.json`**

Edit `package.json`. Find the two lines:

```json
    "bruno:sync:payloads": "bun run scripts/bruno-sync/payloads.ts --apply",
    "bruno:sync:payloads:dry": "bun run scripts/bruno-sync/payloads.ts",
```

Delete both lines. Keep `bruno:sync` and `bruno:sync:dry`.

- [ ] **Step 4: Remove the section in `CLAUDE.md`**

Edit `CLAUDE.md`. Find the paragraph starting with `To sync sample request bodies from Swagger into .bru files, run \`bun run bruno:sync:payloads\`.` Delete that entire paragraph (it ends with `Use \`bun run bruno:sync:payloads:dry\` to preview. See \`scripts/bruno-sync/README.md\` for details.`).

- [ ] **Step 5: Remove the corresponding section in `scripts/bruno-sync/README.md`**

Open `scripts/bruno-sync/README.md`. Find any section/heading referring to `bruno:sync:payloads` or "payload sync". Delete it. Keep all sections about the main `bruno:sync` tool.

- [ ] **Step 6: Type-check**

```bash
bun run check-types
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore(bruno-sync): remove unused payload-sync tool"
```

---

## Task 2: Build Permission → Roles Mapping Cache

**Files:**
- Create: `scripts/swagger-bruno-refresh/permission-role-map.json`
- Create: `scripts/swagger-bruno-refresh/orphan-tracker.md`

- [ ] **Step 1: Create the working directory**

```bash
mkdir -p scripts/swagger-bruno-refresh
```

- [ ] **Step 2: Read the role-permission seed**

Read `packages/prisma-shared-schema-platform/prisma/seed.role-permission.ts` end-to-end. The structure is `{ <RoleName>: { <resource>: <action[]> } }` (e.g., `Requestor: { "configuration.currency": ["view"], ... }`).

- [ ] **Step 3: Build the inverted mapping**

For every role and resource × action pair, produce an entry in a JSON object keyed by `"<resource>:<action>"`:

Example: if the seed contains `Requestor: { "configuration.currency": ["view"] }` and `HOD: { "configuration.currency": ["view", "create"] }`, the result includes:

```json
{
  "configuration.currency:view": ["Requestor", "HOD"],
  "configuration.currency:create": ["HOD"]
}
```

Write it to `scripts/swagger-bruno-refresh/permission-role-map.json`.

- [ ] **Step 4: Verify mapping is non-empty and well-formed**

```bash
bun -e "const m = require('./scripts/swagger-bruno-refresh/permission-role-map.json'); const keys = Object.keys(m); console.log('keys:', keys.length); console.log('sample:', JSON.stringify(m[keys[0]]))"
```

Expected: `keys:` is well above 50, sample is a JSON array of role names (strings).

- [ ] **Step 5: Initialize orphan tracker**

Write `scripts/swagger-bruno-refresh/orphan-tracker.md` with:

```markdown
# Orphan Bruno Endpoints

Endpoints discovered in `apps/bruno/carmen-inventory/` whose gateway controller no longer exists.
Resolved at the end of the run via `bun run bruno:sync`.

## List

(populated during per-folder tasks)
```

- [ ] **Step 6: Commit**

```bash
git add scripts/swagger-bruno-refresh
git commit -m "chore: add permission-role mapping cache for swagger/bruno docs refresh"
```

---

## Task 3: Folder `auth/`

**Files:**
- Modify: `apps/backend-gateway/src/auth/dto/auth.dto.ts`, `apps/backend-gateway/src/auth/auth.controller.ts` (only example values, no behavior changes)
- Modify: `apps/bruno/carmen-inventory/auth/**/*.bru`

**Modules in alphabetical order:**

`auth/login/` (multiple variants), then top-level files: `02 - Logout.bru`, `03 - Register.bru`, `04 - Invite User.bru`, `05 - Register Confirm.bru`, `06 - Refresh Token.bru`, `07 - Forgot Password.bru`, `08 - Reset Password With Token.bru`, `09 - Reset Password.bru`, `10 - Change Password.bru`.

- [ ] **Step 1: List the modules and `.bru` files in this folder**

```bash
find apps/bruno/carmen-inventory/auth -name "*.bru" | sort
```

- [ ] **Step 2: For each `.bru` file in the listing, apply the per-endpoint workflow R1–R7**

   - Auth endpoints have no Keycloak permission key (login/register/refresh are pre-auth). For docs **Permissions** section write `Public — no auth required` and omit the bullet, except for `Invite User` and `Change Password` which require auth: those use `Permission key: <best match from seed, or "Authenticated user only">`.
   - Login variants (under `auth/login/`) all hit the same endpoint (`POST /api/auth/login`); use the same Sample Body template, but vary user identifiers in each file's `body:json` to match the variant's role (e.g., `requestor.bru` uses `requestor@carmensoftware.com`).

- [ ] **Step 3: Verify**

```bash
bun run check-types
bun run bruno:sync:dry
```

Expected: `check-types` passes; `bruno:sync:dry` reports no add/update/archive (i.e., the URL set is unchanged — we didn't add new endpoints).

- [ ] **Step 4: Commit**

```bash
git add apps/backend-gateway/src/auth apps/bruno/carmen-inventory/auth scripts/swagger-bruno-refresh/orphan-tracker.md
git commit -m "docs(auth): refresh swagger examples and bruno docs"
```

---

## Task 4: Folder `config/`

**Files:**
- Modify: `apps/backend-gateway/src/config/**/*.dto.ts`, `apps/backend-gateway/src/config/**/swagger/*.ts` (only example values)
- Modify: `apps/bruno/carmen-inventory/config/**/*.bru`

**Modules in alphabetical order (apply per-endpoint workflow R1–R7 to each):**

`adjustment-type`, `app_config`, `application-roles`, `credit-note-reason`, `credit-term`, `currencies`, `delivery-point`, `department-user`, `departments`, `exchange-rate`, `extra-cost-type`, `location-product`, `locations`, `locations-user`, `permissions`, `price-list`, `product-category`, `product-item-group`, `product-location`, `product-sub-category`, `products`, `recipe`, `recipe-category`, `recipe-cuisine`, `recipe-equipment`, `recipe-equipment-category`, `running-code`, `sql_query`, `tax-profile`, `unit-comment`, `units`, `user-application-roles`, `user-location`, `vendor-business-type`, `vendors`, `workflows`.

- [ ] **Step 1: List the modules and `.bru` files**

```bash
find apps/bruno/carmen-inventory/config -name "*.bru" | sort
```

- [ ] **Step 2: For each module subfolder above, apply per-endpoint workflow R1–R7 to every `.bru` inside it**

   For comment-suffix modules (e.g., `unit-comment`): the gateway controller is at `apps/backend-gateway/src/config/<module>/`. Comment endpoints share a common shape (text + attachments) — refer to `docs/design-comment-logic.md` for response shape.

- [ ] **Step 3: Verify**

```bash
bun run check-types
bun run bruno:sync:dry
```

Expected: `check-types` passes; `bruno:sync:dry` reports no diff.

- [ ] **Step 4: Commit**

```bash
git add apps/backend-gateway/src/config apps/bruno/carmen-inventory/config scripts/swagger-bruno-refresh/orphan-tracker.md
git commit -m "docs(config): refresh swagger examples and bruno docs"
```

---

## Task 5: Folder `documents-and-reports/`

**Files:**
- Modify: matching gateway controllers under `apps/backend-gateway/src/` for activity-log, documents, report
- Modify: `apps/bruno/carmen-inventory/documents-and-reports/**/*.bru`

**Modules in alphabetical order:** `activity-log`, `documents`, `report`.

- [ ] **Step 1: List the modules and `.bru` files**

```bash
find apps/bruno/carmen-inventory/documents-and-reports -name "*.bru" | sort
```

- [ ] **Step 2: For each module above, apply per-endpoint workflow R1–R7**

   - `report` endpoints often return file streams or large JSON payloads — for **Sample Response**, show only the metadata wrapper (`status`, `success`, `message`, `timestamp`) and put `"data": "<binary stream>"` or a truncated representative object.

- [ ] **Step 3: Verify**

```bash
bun run check-types
bun run bruno:sync:dry
```

- [ ] **Step 4: Commit**

```bash
git add apps/backend-gateway/src apps/bruno/carmen-inventory/documents-and-reports scripts/swagger-bruno-refresh/orphan-tracker.md
git commit -m "docs(documents-and-reports): refresh swagger examples and bruno docs"
```

---

## Task 6: Folder `inventory/`

**Files:**
- Modify: matching gateway controllers under `apps/backend-gateway/src/` for inventory domains
- Modify: `apps/bruno/carmen-inventory/inventory/**/*.bru`

**Modules in alphabetical order:**

`inventory-adjustment`, `inventory-transaction`, `physical-count`, `physical-count-comment`, `physical-count-detail-comment`, `physical-count-period`, `physical-count-period-comment`, `spot-check`, `spot-check-comment`, `spot-check-detail-comment`, `stock-in`, `stock-in-comment`, `stock-in-detail-comment`, `stock-out`, `stock-out-comment`, `stock-out-detail-comment`, `store-requisition`, `store-requisition-comment`, `store-requisition-detail-comment`, `unit-conversion`.

- [ ] **Step 1: List the modules and `.bru` files**

```bash
find apps/bruno/carmen-inventory/inventory -name "*.bru" | sort
```

- [ ] **Step 2: For each module above, apply per-endpoint workflow R1–R7**

   - `*-comment` and `*-detail-comment` modules follow the unified comment logic from `docs/design-comment-logic.md`. Common request body: `{ message, mentions: [], attachments?: [{ url, key, content_type, size }] }`. Common response: `{ id, message, mentions, attachments, created_at, created_by_id }`.

- [ ] **Step 3: Verify**

```bash
bun run check-types
bun run bruno:sync:dry
```

- [ ] **Step 4: Commit**

```bash
git add apps/backend-gateway/src apps/bruno/carmen-inventory/inventory scripts/swagger-bruno-refresh/orphan-tracker.md
git commit -m "docs(inventory): refresh swagger examples and bruno docs"
```

---

## Task 7: Folder `master-data/`

**Files:**
- Modify: matching gateway controllers under `apps/backend-gateway/src/` for master-data domains
- Modify: `apps/bruno/carmen-inventory/master-data/**/*.bru`

**Modules in alphabetical order:**

`config-running-code-comment`, `credit-term-comment`, `currencies`, `currency-comment`, `delivery-point-comment`, `department`, `department-comment`, `dimension-comment`, `exchange-rate-comment`, `location-comment`, `locations`, `news`, `period`, `period-comment`, `pricelist-comment`, `pricelist-detail-comment`, `pricelist-template-comment`, `pricelist-template-detail-comment`, `product-category-comment`, `product-comment`, `product-item-group-comment`, `product-sub-category-comment`, `products`, `tax-profile`, `tax-profile-comment`, `unit-comment`, `vendor-business-type-comment`, `vendor-comment`, `vendor-product`, `workflow`, `workflow-comment`.

- [ ] **Step 1: List the modules and `.bru` files**

```bash
find apps/bruno/carmen-inventory/master-data -name "*.bru" | sort
```

- [ ] **Step 2: For each module above, apply per-endpoint workflow R1–R7**

   - `*-comment` modules: same convention as Task 6.
   - `currencies`, `locations`, `products`, `tax-profile` may overlap conceptually with `config/` modules. They are different controllers (different paths) — treat them independently.

- [ ] **Step 3: Verify**

```bash
bun run check-types
bun run bruno:sync:dry
```

- [ ] **Step 4: Commit**

```bash
git add apps/backend-gateway/src apps/bruno/carmen-inventory/master-data scripts/swagger-bruno-refresh/orphan-tracker.md
git commit -m "docs(master-data): refresh swagger examples and bruno docs"
```

---

## Task 8: Folder `my-pending/`

**Files:**
- Modify: matching gateway controllers
- Modify: `apps/bruno/carmen-inventory/my-pending/**/*.bru`

**Modules in alphabetical order:** `my-approve`, `purchase-order`, `purchase-request`, `store-requisition`.

- [ ] **Step 1: List the modules and `.bru` files**

```bash
find apps/bruno/carmen-inventory/my-pending -name "*.bru" | sort
```

- [ ] **Step 2: For each module above, apply per-endpoint workflow R1–R7**

   - `my-pending/*` endpoints typically scope to the authenticated user. For **Sample Response**, show that the data array reflects the requester's pending items only. Add a sentence to the description: "Returns only items pending the requesting user's action / แสดงเฉพาะรายการที่รอการดำเนินการของผู้ใช้ปัจจุบัน".

- [ ] **Step 3: Verify**

```bash
bun run check-types
bun run bruno:sync:dry
```

- [ ] **Step 4: Commit**

```bash
git add apps/backend-gateway/src apps/bruno/carmen-inventory/my-pending scripts/swagger-bruno-refresh/orphan-tracker.md
git commit -m "docs(my-pending): refresh swagger examples and bruno docs"
```

---

## Task 9: Folder `platform/`

**Files:**
- Modify: matching gateway controllers under `apps/backend-gateway/src/platform/`
- Modify: `apps/bruno/carmen-inventory/platform/**/*.bru`

**Modules in alphabetical order:**

`business-unit`, `cluster`, `permission`, `platform-user`, `report-template`, `role`, `role-permission`, `user`, `user-business-unit`, `user-cluster`.

- [ ] **Step 1: List the modules and `.bru` files**

```bash
find apps/bruno/carmen-inventory/platform -name "*.bru" | sort
```

- [ ] **Step 2: For each module above, apply per-endpoint workflow R1–R7**

   - Platform endpoints are cross-tenant and typically restricted to platform admins. **Permissions**: most platform endpoints are not in the BU-level role-permission seed; mark these as `Permission: Platform admin only` and omit the role bullet.

- [ ] **Step 3: Verify**

```bash
bun run check-types
bun run bruno:sync:dry
```

- [ ] **Step 4: Commit**

```bash
git add apps/backend-gateway/src/platform apps/bruno/carmen-inventory/platform scripts/swagger-bruno-refresh/orphan-tracker.md
git commit -m "docs(platform): refresh swagger examples and bruno docs"
```

---

## Task 10: Folder `procurement/`

**Files:**
- Modify: matching gateway controllers under `apps/backend-gateway/src/procurement/` (or wherever they live)
- Modify: `apps/bruno/carmen-inventory/procurement/**/*.bru`

**Modules in alphabetical order:**

`credit-note`, `credit-note-comment`, `credit-note-detail-comment`, `credit-note-reason`, `credit-term`, `extra-cost-comment`, `extra-cost-detail-comment`, `good-received-note`, `good-received-note-comment`, `good-received-note-detail-comment`, `price-list`, `price-list-template`, `purchase-order`, `purchase-order-comment`, `purchase-order-detail-comment`, `purchase-request`, `purchase-request-comment`, `purchase-request-detail-comment`, `purchase-request-template`, `purchase-request-template-comment`, `request-for-pricing`, `request-for-pricing-comment`, `request-for-pricing-detail-comment`.

- [ ] **Step 1: List the modules and `.bru` files**

```bash
find apps/bruno/carmen-inventory/procurement -name "*.bru" | sort
```

- [ ] **Step 2: For each module above, apply per-endpoint workflow R1–R7**

   - Procurement modules use the `details: { add: [...] }` create pattern (per memory). Sample Bodies for `create` endpoints follow this structure when applicable.
   - Comment modules use unified comment logic (Task 6 note).

- [ ] **Step 3: Verify**

```bash
bun run check-types
bun run bruno:sync:dry
```

- [ ] **Step 4: Commit**

```bash
git add apps/backend-gateway/src apps/bruno/carmen-inventory/procurement scripts/swagger-bruno-refresh/orphan-tracker.md
git commit -m "docs(procurement): refresh swagger examples and bruno docs"
```

---

## Task 11: Folder `user-management/`

**Files:**
- Modify: matching gateway controllers
- Modify: `apps/bruno/carmen-inventory/user-management/**/*.bru`

**Modules in alphabetical order:** `user`, `user-business-unit`.

- [ ] **Step 1: List the modules and `.bru` files**

```bash
find apps/bruno/carmen-inventory/user-management -name "*.bru" | sort
```

- [ ] **Step 2: For each module above, apply per-endpoint workflow R1–R7**

- [ ] **Step 3: Verify**

```bash
bun run check-types
bun run bruno:sync:dry
```

- [ ] **Step 4: Commit**

```bash
git add apps/backend-gateway/src apps/bruno/carmen-inventory/user-management scripts/swagger-bruno-refresh/orphan-tracker.md
git commit -m "docs(user-management): refresh swagger examples and bruno docs"
```

---

## Task 12: Final Orphan Cleanup

**Files:**
- Read: `scripts/swagger-bruno-refresh/orphan-tracker.md`
- Modify: `apps/bruno/carmen-inventory/_archived/` (via `bruno:sync`)

- [ ] **Step 1: Review the orphan tracker**

Read `scripts/swagger-bruno-refresh/orphan-tracker.md`. Confirm every entry is genuinely orphaned (the gateway endpoint really doesn't exist) and not a path-mapping mistake on our side.

```bash
cat scripts/swagger-bruno-refresh/orphan-tracker.md
```

- [ ] **Step 2: Run dry-run to preview**

```bash
bun run bruno:sync:dry
```

Expected: report lists adds/updates/archives. The archive list should match (or be a superset of) the orphan tracker.

- [ ] **Step 3: Apply**

```bash
bun run bruno:sync
```

- [ ] **Step 4: Verify**

```bash
bun run bruno:sync:dry
```

Expected: clean — no diff.

- [ ] **Step 5: Commit**

```bash
git add apps/bruno/carmen-inventory scripts/swagger-bruno-refresh/orphan-tracker.md
git commit -m "chore(bruno): archive orphan endpoints from docs refresh"
```

---

## Verification Checklist (run after Task 12)

- [ ] `bun run check-types` — passes everywhere
- [ ] `bun run bruno:sync:dry` — clean, no diff
- [ ] `bun run lint` (gateway only) — passes
- [ ] Spot-check 3 random `.bru` files: each has the new docs template fully filled in for sections that apply
- [ ] Spot-check 3 random gateway DTOs: every `@ApiProperty` either previously had `example` or now does
- [ ] Open Swagger UI (`/swagger`) on local gateway and visually confirm 5 random endpoints render examples in the "Try it out" panel
