# Swagger Tag Taxonomy Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize `apps/backend-gateway` OpenAPI tags into 9 groups × 52 tags (via `x-tagGroups`) driven by a single mapping file, applied to all 144 controllers, and guarded by a verification check.

**Architecture:** One source of truth (`apps/backend-gateway/src/swagger/tag-groups.ts`) defines the tag set and group structure, consumed at runtime by `main.ts`. A sibling mapping (`scripts/swagger-sync/tag-mapping.json`) records the controller-path → tag assignment. A codemod (`scripts/swagger-sync/retag.ts`) applies the mapping in bulk. A headless verifier (`apps/backend-gateway/scripts/verify-swagger.ts`) boots the Nest app, builds the OpenAPI document, and asserts every operation is tagged with a declared tag that appears in exactly one group.

**Tech Stack:** TypeScript, Bun 1.2, NestJS 11, `@nestjs/swagger` 11, `@scalar/nestjs-api-reference`, `bun:test` for script tests, Jest for gateway tests.

**Spec:** `docs/superpowers/specs/2026-04-22-swagger-tag-redesign-design.md`

---

## File Structure

### New files
| Path | Responsibility |
|---|---|
| `apps/backend-gateway/src/swagger/tag-groups.ts` | Exports `SWAGGER_TAGS` (52 entries) and `SWAGGER_TAG_GROUPS` (9 entries). Single source of truth for runtime + scripts. |
| `apps/backend-gateway/src/swagger/tag-groups.spec.ts` | Jest spec asserting structural invariants: 52 tags, 9 groups, union of group tags = tag set, no duplicates. |
| `scripts/swagger-sync/tag-mapping.json` | `{ "<controller-path-relative-to-repo-root>": "<tag-name>" }` — 144 entries. |
| `scripts/swagger-sync/tag-mapping.ts` | TypeScript helper: loads JSON, validates entries against `SWAGGER_TAGS` at runtime. |
| `scripts/swagger-sync/retag.ts` | Codemod: reads mapping, rewrites `@ApiTags(...)` in each file. Pure transform `applyRetagToContent(content, newTag)` plus a CLI entry. |
| `scripts/swagger-sync/__tests__/retag.test.ts` | Covers all `@ApiTags` forms (single-arg, multi-arg, multi-line, missing). |
| `scripts/swagger-sync/__tests__/mapping.test.ts` | Covers mapping coverage, valid tag values, no dangling keys. |
| `scripts/swagger-sync/README.md` | Short operator doc: how to regenerate mapping, run codemod, run verification. |
| `apps/backend-gateway/scripts/verify-swagger.ts` | Boots `AppModule`, builds OpenAPI doc via `SwaggerModule.createDocument`, runs 5 invariants, exits non-zero on fail. |
| `apps/backend-gateway/scripts/__tests__/verify-swagger.spec.ts` | Unit tests for the pure invariant functions. |

### Modified files
| Path | Change |
|---|---|
| `apps/backend-gateway/src/main.ts` | Replace 12 hardcoded `.addTag(...)` lines with a loop over `SWAGGER_TAGS`; inject `x-tagGroups` onto `document_http` and `document_https` after `createDocument`. |
| `package.json` (root) | Add `"swagger:retag"`, `"swagger:retag:dry"`, `"swagger:verify"` scripts. |
| 143 controllers across `apps/backend-gateway/src/{app,auth,notification,platform,config,application}/...` | Single `@ApiTags(...)` decorator replaced by codemod — one line per file, no other change. |

---

## Task 1: Create `tag-groups.ts` source of truth

**Files:**
- Create: `apps/backend-gateway/src/swagger/tag-groups.ts`
- Create: `apps/backend-gateway/src/swagger/tag-groups.spec.ts`

- [ ] **Step 1: Write the failing spec**

Create `apps/backend-gateway/src/swagger/tag-groups.spec.ts`:

```ts
import { SWAGGER_TAGS, SWAGGER_TAG_GROUPS } from './tag-groups';

describe('SWAGGER_TAGS', () => {
  it('has 52 entries', () => {
    expect(SWAGGER_TAGS).toHaveLength(52);
  });

  it('has no duplicate names', () => {
    const names = SWAGGER_TAGS.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('every tag has a non-empty description', () => {
    for (const t of SWAGGER_TAGS) {
      expect(t.description.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('SWAGGER_TAG_GROUPS', () => {
  it('has 9 groups', () => {
    expect(SWAGGER_TAG_GROUPS).toHaveLength(9);
  });

  it('group names are unique', () => {
    const names = SWAGGER_TAG_GROUPS.map((g) => g.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('every group tag exists in SWAGGER_TAGS', () => {
    const declared = new Set(SWAGGER_TAGS.map((t) => t.name));
    for (const g of SWAGGER_TAG_GROUPS) {
      for (const tagName of g.tags) {
        expect(declared.has(tagName)).toBe(true);
      }
    }
  });

  it('every declared tag appears in exactly one group', () => {
    const counts = new Map<string, number>();
    for (const g of SWAGGER_TAG_GROUPS) {
      for (const tagName of g.tags) {
        counts.set(tagName, (counts.get(tagName) ?? 0) + 1);
      }
    }
    for (const t of SWAGGER_TAGS) {
      expect(counts.get(t.name)).toBe(1);
    }
  });

  it('groups are in documented order', () => {
    expect(SWAGGER_TAG_GROUPS.map((g) => g.name)).toEqual([
      'Getting Started',
      'Platform Administration',
      'Business Unit Configuration',
      'Procurement',
      'Inventory',
      'Workflow & Approval',
      'Reporting & Insights',
      'Notifications',
      'User Profile & Access',
    ]);
  });
});
```

- [ ] **Step 2: Run spec to verify it fails**

Run: `cd apps/backend-gateway && bun run test -- tag-groups.spec`
Expected: FAIL — module `./tag-groups` not found.

- [ ] **Step 3: Implement `tag-groups.ts`**

Create `apps/backend-gateway/src/swagger/tag-groups.ts`:

```ts
export type SwaggerTag = {
  name: string;
  description: string;
};

export type SwaggerTagGroup = {
  name: string;
  tags: string[];
};

export const SWAGGER_TAGS: SwaggerTag[] = [
  // Group 1 — Getting Started
  { name: 'Authentication', description: 'Login, logout, password change, token refresh via Keycloak' },
  { name: 'App Info',        description: 'App-level metadata, version, health' },

  // Group 2 — Platform Administration
  { name: 'Platform: Clusters',                description: 'Tenant clusters (hotel chains / franchise groups)' },
  { name: 'Platform: Business Units',          description: 'BU registration, activation, subscriptions' },
  { name: 'Platform: Users',                   description: 'Platform-level users (cross-BU)' },
  { name: 'Platform: User ↔ Cluster',          description: 'Assign users to clusters' },
  { name: 'Platform: User ↔ Business Unit',    description: 'Assign users to business units' },
  { name: 'Platform: Application Roles',       description: 'Define application-level roles' },
  { name: 'Platform: Application Permissions', description: 'Define application-level permissions' },
  { name: 'Platform: Role ↔ Permission',       description: 'Bind permissions to roles' },
  { name: 'Platform: Report Templates',        description: 'Platform-wide report template catalog' },

  // Group 3 — Business Unit Configuration
  { name: 'Config: Currencies & FX',     description: 'Currencies, exchange rates' },
  { name: 'Config: Locations',           description: 'Locations, location-user, product-location, delivery points' },
  { name: 'Config: Departments',         description: 'Departments, department-user assignments' },
  { name: 'Config: Products',            description: 'Products, categories, sub-categories, item groups' },
  { name: 'Config: Units',               description: 'Units of measure, unit conversions' },
  { name: 'Config: Vendors',             description: 'Vendors, vendor business types, credit terms, credit-note reasons' },
  { name: 'Config: Tax & Cost Types',    description: 'Tax profiles, adjustment types, extra-cost types' },
  { name: 'Config: Recipes',             description: 'Recipe, category, cuisine, equipment, equipment-category' },
  { name: 'Config: Price Lists',         description: 'Price list master data' },
  { name: 'Config: Workflows',           description: 'Workflow definitions' },
  { name: 'Config: Roles & Permissions', description: 'BU-level role/permission binding' },
  { name: 'Config: System',              description: 'App-config, running codes, SQL query runner, dimensions' },

  // Group 4 — Procurement
  { name: 'Procurement: Purchase Requests',    description: 'PR header, details, templates, comments' },
  { name: 'Procurement: Purchase Orders',      description: 'PO header, details, comments' },
  { name: 'Procurement: Good Received Notes',  description: 'GRN header, details, comments' },
  { name: 'Procurement: Credit Notes',         description: 'Credit notes, reasons, details, comments' },
  { name: 'Procurement: Request for Pricing',  description: 'RFP header, details, comments' },
  { name: 'Procurement: Store Requisitions',   description: 'SR header, details, comments' },
  { name: 'Procurement: Extra Costs',          description: 'Extra-cost document comments' },
  { name: 'Procurement: Vendor Products',      description: 'Vendor-specific product catalog' },
  { name: 'Procurement: Price Lists',          description: 'Active price lists, templates, price check' },

  // Group 5 — Inventory
  { name: 'Inventory: Stock In',         description: 'Stock-in header, details, comments' },
  { name: 'Inventory: Stock Out',        description: 'Stock-out header, details, comments' },
  { name: 'Inventory: Transfers',        description: 'Transfer header, details, comments' },
  { name: 'Inventory: Physical Count',   description: 'Physical count, periods, details, comments' },
  { name: 'Inventory: Spot Check',       description: 'Spot check header, details, comments' },
  { name: 'Inventory: Adjustments',      description: 'Inventory adjustments' },
  { name: 'Inventory: Transactions',     description: 'Read-only ledger of all stock movements' },
  { name: 'Inventory: Periods',          description: 'Inventory period open/close' },

  // Group 6 — Workflow & Approval
  { name: 'Workflow: Operations',   description: 'Runtime workflow state transitions and comments' },
  { name: 'Workflow: My Pending',   description: "Documents awaiting current user's action" },
  { name: 'Workflow: My Approvals', description: 'Documents the current user has acted on' },

  // Group 7 — Reporting & Insights
  { name: 'Reports: Dashboard',         description: 'Aggregated KPI endpoints for dashboards' },
  { name: 'Reports: Reports',           description: 'Formal report generation' },
  { name: 'Reports: Activity Log',      description: 'Audit trail / activity feed' },
  { name: 'Reports: News',              description: 'Announcements / news feed' },
  { name: 'Documents: File Management', description: 'Attachment upload/download, document metadata' },

  // Group 8 — Notifications
  { name: 'Notifications', description: 'REST endpoints for notifications. WebSocket server at /ws documented here.' },

  // Group 9 — User Profile & Access
  { name: 'User: Profile',        description: 'Current user profile' },
  { name: 'User: Business Units', description: "User's BU assignments and BU directory" },
  { name: 'User: Locations',      description: "User's location assignments" },
];

export const SWAGGER_TAG_GROUPS: SwaggerTagGroup[] = [
  { name: 'Getting Started', tags: ['Authentication', 'App Info'] },
  {
    name: 'Platform Administration',
    tags: [
      'Platform: Clusters',
      'Platform: Business Units',
      'Platform: Users',
      'Platform: User ↔ Cluster',
      'Platform: User ↔ Business Unit',
      'Platform: Application Roles',
      'Platform: Application Permissions',
      'Platform: Role ↔ Permission',
      'Platform: Report Templates',
    ],
  },
  {
    name: 'Business Unit Configuration',
    tags: [
      'Config: Currencies & FX',
      'Config: Locations',
      'Config: Departments',
      'Config: Products',
      'Config: Units',
      'Config: Vendors',
      'Config: Tax & Cost Types',
      'Config: Recipes',
      'Config: Price Lists',
      'Config: Workflows',
      'Config: Roles & Permissions',
      'Config: System',
    ],
  },
  {
    name: 'Procurement',
    tags: [
      'Procurement: Purchase Requests',
      'Procurement: Purchase Orders',
      'Procurement: Good Received Notes',
      'Procurement: Credit Notes',
      'Procurement: Request for Pricing',
      'Procurement: Store Requisitions',
      'Procurement: Extra Costs',
      'Procurement: Vendor Products',
      'Procurement: Price Lists',
    ],
  },
  {
    name: 'Inventory',
    tags: [
      'Inventory: Stock In',
      'Inventory: Stock Out',
      'Inventory: Transfers',
      'Inventory: Physical Count',
      'Inventory: Spot Check',
      'Inventory: Adjustments',
      'Inventory: Transactions',
      'Inventory: Periods',
    ],
  },
  {
    name: 'Workflow & Approval',
    tags: ['Workflow: Operations', 'Workflow: My Pending', 'Workflow: My Approvals'],
  },
  {
    name: 'Reporting & Insights',
    tags: [
      'Reports: Dashboard',
      'Reports: Reports',
      'Reports: Activity Log',
      'Reports: News',
      'Documents: File Management',
    ],
  },
  { name: 'Notifications', tags: ['Notifications'] },
  {
    name: 'User Profile & Access',
    tags: ['User: Profile', 'User: Business Units', 'User: Locations'],
  },
];
```

- [ ] **Step 4: Run spec to verify it passes**

Run: `cd apps/backend-gateway && bun run test -- tag-groups.spec`
Expected: PASS, 6 tests green.

- [ ] **Step 5: Commit**

```bash
git add apps/backend-gateway/src/swagger/tag-groups.ts apps/backend-gateway/src/swagger/tag-groups.spec.ts
git commit -m "feat(gateway): add swagger tag-groups source of truth

Defines SWAGGER_TAGS (52) and SWAGGER_TAG_GROUPS (9) consumed by
main.ts and codemod/verification scripts.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Create controller-to-tag mapping JSON with coverage test

**Files:**
- Create: `scripts/swagger-sync/tag-mapping.json`
- Create: `scripts/swagger-sync/tag-mapping.ts`
- Create: `scripts/swagger-sync/__tests__/mapping.test.ts`
- Create: `scripts/swagger-sync/README.md`

- [ ] **Step 1: Write the failing test**

Create `scripts/swagger-sync/__tests__/mapping.test.ts`:

```ts
import { describe, it, expect } from 'bun:test';
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { loadMapping } from '../tag-mapping';
import { SWAGGER_TAGS } from '../../../apps/backend-gateway/src/swagger/tag-groups';

const REPO_ROOT = join(import.meta.dir, '..', '..', '..');
const GATEWAY_SRC = join(REPO_ROOT, 'apps', 'backend-gateway', 'src');

function walkControllers(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      out.push(...walkControllers(full));
    } else if (entry.endsWith('.controller.ts') && !entry.endsWith('.spec.ts')) {
      out.push(relative(REPO_ROOT, full));
    }
  }
  return out;
}

const actual = walkControllers(GATEWAY_SRC).sort();
const mapping = loadMapping();
const mapped = Object.keys(mapping).sort();
const declaredTags = new Set(SWAGGER_TAGS.map((t) => t.name));

describe('tag-mapping.json', () => {
  it('contains exactly 144 entries', () => {
    expect(mapped.length).toBe(144);
  });

  it('covers every controller in apps/backend-gateway/src', () => {
    const missing = actual.filter((p) => !mapping[p]);
    expect(missing).toEqual([]);
  });

  it('has no entries pointing to non-existent files', () => {
    const ghosts = mapped.filter((p) => !actual.includes(p));
    expect(ghosts).toEqual([]);
  });

  it('every mapping value is a declared tag', () => {
    const invalid = mapped.filter((p) => !declaredTags.has(mapping[p]));
    expect(invalid).toEqual([]);
  });
});
```

- [ ] **Step 2: Create `tag-mapping.ts` loader**

Create `scripts/swagger-sync/tag-mapping.ts`:

```ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export type TagMapping = Record<string, string>;

export function loadMapping(): TagMapping {
  const path = join(import.meta.dir, 'tag-mapping.json');
  return JSON.parse(readFileSync(path, 'utf8')) as TagMapping;
}
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd /path/to/repo && bun test scripts/swagger-sync/__tests__/mapping.test.ts`
Expected: FAIL — `tag-mapping.json` ENOENT.

- [ ] **Step 4: Create `tag-mapping.json` from the spec**

Create `scripts/swagger-sync/tag-mapping.json` with all 144 entries. Copy the exact mapping from spec Section 5, written as a flat JSON object keyed by `apps/backend-gateway/src/<relative path>`:

```json
{
  "apps/backend-gateway/src/app.controller.ts": "App Info",
  "apps/backend-gateway/src/auth/auth.controller.ts": "Authentication",
  "apps/backend-gateway/src/notification/notification.controller.ts": "Notifications",

  "apps/backend-gateway/src/platform/platform_cluster/platform_cluster.controller.ts": "Platform: Clusters",
  "apps/backend-gateway/src/platform/platform_business-unit/platform_business-unit.controller.ts": "Platform: Business Units",
  "apps/backend-gateway/src/platform/platform-user/platform-user.controller.ts": "Platform: Users",
  "apps/backend-gateway/src/platform/platform_user-cluster/platform_user-cluster.controller.ts": "Platform: User ↔ Cluster",
  "apps/backend-gateway/src/platform/platform_user-business-unit/platform_user-business-unit.controller.ts": "Platform: User ↔ Business Unit",
  "apps/backend-gateway/src/platform/application-role/application-role.controller.ts": "Platform: Application Roles",
  "apps/backend-gateway/src/platform/application-permission/application-permission.controller.ts": "Platform: Application Permissions",
  "apps/backend-gateway/src/platform/application-role-permission/application-role-permission.controller.ts": "Platform: Role ↔ Permission",
  "apps/backend-gateway/src/platform/platform_report-template/platform_report-template.controller.ts": "Platform: Report Templates",

  "apps/backend-gateway/src/config/config_currencies/config_currencies.controller.ts": "Config: Currencies & FX",
  "apps/backend-gateway/src/config/config_exchange-rate/config_exchange-rate.controller.ts": "Config: Currencies & FX",
  "apps/backend-gateway/src/application/currencies/currencies.controller.ts": "Config: Currencies & FX",
  "apps/backend-gateway/src/application/currency-comment/currency-comment.controller.ts": "Config: Currencies & FX",
  "apps/backend-gateway/src/application/exchange-rate-comment/exchange-rate-comment.controller.ts": "Config: Currencies & FX",

  "apps/backend-gateway/src/config/config_locations/config_locations.controller.ts": "Config: Locations",
  "apps/backend-gateway/src/config/config_locations-user/config_locations-user.controller.ts": "Config: Locations",
  "apps/backend-gateway/src/config/config_user-location/config_user-location.controller.ts": "Config: Locations",
  "apps/backend-gateway/src/config/config_location-product/config_location-product.controller.ts": "Config: Locations",
  "apps/backend-gateway/src/config/config_product-location/config_product-location.controller.ts": "Config: Locations",
  "apps/backend-gateway/src/config/config_delivery-point/config_delivery-point.controller.ts": "Config: Locations",
  "apps/backend-gateway/src/application/locations/locations.controller.ts": "Config: Locations",
  "apps/backend-gateway/src/application/location-comment/location-comment.controller.ts": "Config: Locations",
  "apps/backend-gateway/src/application/delivery-point-comment/delivery-point-comment.controller.ts": "Config: Locations",

  "apps/backend-gateway/src/config/config_departments/config_departments.controller.ts": "Config: Departments",
  "apps/backend-gateway/src/config/config_department-user/config_department-user.controller.ts": "Config: Departments",
  "apps/backend-gateway/src/application/department/department.controller.ts": "Config: Departments",
  "apps/backend-gateway/src/application/department-comment/department-comment.controller.ts": "Config: Departments",

  "apps/backend-gateway/src/config/config_products/config_products.controller.ts": "Config: Products",
  "apps/backend-gateway/src/config/config_product-category/config_product-category.controller.ts": "Config: Products",
  "apps/backend-gateway/src/config/config_product-sub-category/config_product-sub-category.controller.ts": "Config: Products",
  "apps/backend-gateway/src/config/config_product-item-group/config_product-item-group.controller.ts": "Config: Products",
  "apps/backend-gateway/src/application/products/products.controller.ts": "Config: Products",
  "apps/backend-gateway/src/application/product-comment/product-comment.controller.ts": "Config: Products",
  "apps/backend-gateway/src/application/product-category-comment/product-category-comment.controller.ts": "Config: Products",
  "apps/backend-gateway/src/application/product-sub-category-comment/product-sub-category-comment.controller.ts": "Config: Products",
  "apps/backend-gateway/src/application/product-item-group-comment/product-item-group-comment.controller.ts": "Config: Products",

  "apps/backend-gateway/src/config/config_units/config_units.controller.ts": "Config: Units",
  "apps/backend-gateway/src/config/config_unit_comment/config_unit_comment.controller.ts": "Config: Units",
  "apps/backend-gateway/src/application/unit-conversion/unit-conversion.controller.ts": "Config: Units",
  "apps/backend-gateway/src/application/unit-comment/unit-comment.controller.ts": "Config: Units",

  "apps/backend-gateway/src/config/config_vendors/config_vendors.controller.ts": "Config: Vendors",
  "apps/backend-gateway/src/config/config_vendor_business_type/config_vendor_business_type.controller.ts": "Config: Vendors",
  "apps/backend-gateway/src/config/config_credit_term/config_credit_term.controller.ts": "Config: Vendors",
  "apps/backend-gateway/src/config/config_credit-note-reason/config_credit-note-reason.controller.ts": "Config: Vendors",
  "apps/backend-gateway/src/application/credit-term/credit-term.controller.ts": "Config: Vendors",
  "apps/backend-gateway/src/application/credit-term-comment/credit-term-comment.controller.ts": "Config: Vendors",
  "apps/backend-gateway/src/application/vendor-comment/vendor-comment.controller.ts": "Config: Vendors",
  "apps/backend-gateway/src/application/vendor-business-type/vendor-business-type.controller.ts": "Config: Vendors",
  "apps/backend-gateway/src/application/vendor-business-type-comment/vendor-business-type-comment.controller.ts": "Config: Vendors",

  "apps/backend-gateway/src/config/config_tax_profile/config_tax_profile.controller.ts": "Config: Tax & Cost Types",
  "apps/backend-gateway/src/config/config_adjustment-type/config_adjustment-type.controller.ts": "Config: Tax & Cost Types",
  "apps/backend-gateway/src/config/config_extra_cost_type/config_extra_cost_type.controller.ts": "Config: Tax & Cost Types",
  "apps/backend-gateway/src/application/tax-profile/tax-profile.controller.ts": "Config: Tax & Cost Types",
  "apps/backend-gateway/src/application/tax-profile-comment/tax-profile-comment.controller.ts": "Config: Tax & Cost Types",

  "apps/backend-gateway/src/config/config_recipe/config_recipe.controller.ts": "Config: Recipes",
  "apps/backend-gateway/src/config/config_recipe-category/config_recipe-category.controller.ts": "Config: Recipes",
  "apps/backend-gateway/src/config/config_recipe-cuisine/config_recipe-cuisine.controller.ts": "Config: Recipes",
  "apps/backend-gateway/src/config/config_recipe-equipment/config_recipe-equipment.controller.ts": "Config: Recipes",
  "apps/backend-gateway/src/config/config_recipe-equipment-category/config_recipe-equipment-category.controller.ts": "Config: Recipes",

  "apps/backend-gateway/src/config/config_price-list/config_price-list.controller.ts": "Config: Price Lists",

  "apps/backend-gateway/src/config/config_workflows/config_workflows.controller.ts": "Config: Workflows",

  "apps/backend-gateway/src/config/config_application_role/config_application_role.controller.ts": "Config: Roles & Permissions",
  "apps/backend-gateway/src/config/config_permission/config_permission.controller.ts": "Config: Roles & Permissions",
  "apps/backend-gateway/src/config/config_user_application_role/config_user_application_role.controller.ts": "Config: Roles & Permissions",

  "apps/backend-gateway/src/config/config_app_config/config_app_config.controller.ts": "Config: System",
  "apps/backend-gateway/src/config/config_running-code/config_running-code.controller.ts": "Config: System",
  "apps/backend-gateway/src/config/config_sql_query/config_sql_query.controller.ts": "Config: System",
  "apps/backend-gateway/src/application/config-running-code-comment/config-running-code-comment.controller.ts": "Config: System",
  "apps/backend-gateway/src/application/dimension-comment/dimension-comment.controller.ts": "Config: System",

  "apps/backend-gateway/src/application/purchase-request/purchase-request.controller.ts": "Procurement: Purchase Requests",
  "apps/backend-gateway/src/application/purchase-request-comment/purchase-request-comment.controller.ts": "Procurement: Purchase Requests",
  "apps/backend-gateway/src/application/purchase-request-detail-comment/purchase-request-detail-comment.controller.ts": "Procurement: Purchase Requests",
  "apps/backend-gateway/src/application/purchase-request-template/purchase-request-template.controller.ts": "Procurement: Purchase Requests",
  "apps/backend-gateway/src/application/purchase-request-template-comment/purchase-request-template-comment.controller.ts": "Procurement: Purchase Requests",

  "apps/backend-gateway/src/application/purchase-order/purchase-order.controller.ts": "Procurement: Purchase Orders",
  "apps/backend-gateway/src/application/purchase-order-comment/purchase-order-comment.controller.ts": "Procurement: Purchase Orders",
  "apps/backend-gateway/src/application/purchase-order-detail-comment/purchase-order-detail-comment.controller.ts": "Procurement: Purchase Orders",

  "apps/backend-gateway/src/application/good-received-note/good-received-note.controller.ts": "Procurement: Good Received Notes",
  "apps/backend-gateway/src/application/good-received-note-comment/good-received-note-comment.controller.ts": "Procurement: Good Received Notes",
  "apps/backend-gateway/src/application/good-received-note-detail-comment/good-received-note-detail-comment.controller.ts": "Procurement: Good Received Notes",

  "apps/backend-gateway/src/application/credit-note/credit-note.controller.ts": "Procurement: Credit Notes",
  "apps/backend-gateway/src/application/credit-note-comment/credit-note-comment.controller.ts": "Procurement: Credit Notes",
  "apps/backend-gateway/src/application/credit-note-detail-comment/credit-note-detail-comment.controller.ts": "Procurement: Credit Notes",
  "apps/backend-gateway/src/application/credit-note-reason/credit-note-reason.controller.ts": "Procurement: Credit Notes",

  "apps/backend-gateway/src/application/request-for-pricing/request-for-pricing.controller.ts": "Procurement: Request for Pricing",
  "apps/backend-gateway/src/application/request-for-pricing-comment/request-for-pricing-comment.controller.ts": "Procurement: Request for Pricing",
  "apps/backend-gateway/src/application/request-for-pricing-detail-comment/request-for-pricing-detail-comment.controller.ts": "Procurement: Request for Pricing",

  "apps/backend-gateway/src/application/store-requisition/store-requisition.controller.ts": "Procurement: Store Requisitions",
  "apps/backend-gateway/src/application/store-requisition-comment/store-requisition-comment.controller.ts": "Procurement: Store Requisitions",
  "apps/backend-gateway/src/application/store-requisition-detail-comment/store-requisition-detail-comment.controller.ts": "Procurement: Store Requisitions",

  "apps/backend-gateway/src/application/extra-cost-comment/extra-cost-comment.controller.ts": "Procurement: Extra Costs",
  "apps/backend-gateway/src/application/extra-cost-detail-comment/extra-cost-detail-comment.controller.ts": "Procurement: Extra Costs",

  "apps/backend-gateway/src/application/vendor-product/vendor-product.controller.ts": "Procurement: Vendor Products",

  "apps/backend-gateway/src/application/price-list/price-list.controller.ts": "Procurement: Price Lists",
  "apps/backend-gateway/src/application/price-list/check-price-list.controller.ts": "Procurement: Price Lists",
  "apps/backend-gateway/src/application/price-list-template/price-list-template.controller.ts": "Procurement: Price Lists",
  "apps/backend-gateway/src/application/pricelist-comment/pricelist-comment.controller.ts": "Procurement: Price Lists",
  "apps/backend-gateway/src/application/pricelist-detail-comment/pricelist-detail-comment.controller.ts": "Procurement: Price Lists",
  "apps/backend-gateway/src/application/pricelist-template-comment/pricelist-template-comment.controller.ts": "Procurement: Price Lists",
  "apps/backend-gateway/src/application/pricelist-template-detail-comment/pricelist-template-detail-comment.controller.ts": "Procurement: Price Lists",

  "apps/backend-gateway/src/application/stock-in/stock-in.controller.ts": "Inventory: Stock In",
  "apps/backend-gateway/src/application/stock-in-detail/stock-in-detail.controller.ts": "Inventory: Stock In",
  "apps/backend-gateway/src/application/stock-in-comment/stock-in-comment.controller.ts": "Inventory: Stock In",
  "apps/backend-gateway/src/application/stock-in-detail-comment/stock-in-detail-comment.controller.ts": "Inventory: Stock In",

  "apps/backend-gateway/src/application/stock-out/stock-out.controller.ts": "Inventory: Stock Out",
  "apps/backend-gateway/src/application/stock-out-detail/stock-out-detail.controller.ts": "Inventory: Stock Out",
  "apps/backend-gateway/src/application/stock-out-comment/stock-out-comment.controller.ts": "Inventory: Stock Out",
  "apps/backend-gateway/src/application/stock-out-detail-comment/stock-out-detail-comment.controller.ts": "Inventory: Stock Out",

  "apps/backend-gateway/src/application/transfer/transfer.controller.ts": "Inventory: Transfers",
  "apps/backend-gateway/src/application/transfer-detail/transfer-detail.controller.ts": "Inventory: Transfers",
  "apps/backend-gateway/src/application/transfer-comment/transfer-comment.controller.ts": "Inventory: Transfers",
  "apps/backend-gateway/src/application/transfer-detail-comment/transfer-detail-comment.controller.ts": "Inventory: Transfers",

  "apps/backend-gateway/src/application/physical-count/physical-count.controller.ts": "Inventory: Physical Count",
  "apps/backend-gateway/src/application/physical-count-comment/physical-count-comment.controller.ts": "Inventory: Physical Count",
  "apps/backend-gateway/src/application/physical-count-detail-comment/physical-count-detail-comment.controller.ts": "Inventory: Physical Count",
  "apps/backend-gateway/src/application/physical-count-period/physical-count-period.controller.ts": "Inventory: Physical Count",
  "apps/backend-gateway/src/application/physical-count-period-comment/physical-count-period-comment.controller.ts": "Inventory: Physical Count",
  "apps/backend-gateway/src/application/count-stock-comment/count-stock-comment.controller.ts": "Inventory: Physical Count",
  "apps/backend-gateway/src/application/count-stock-detail-comment/count-stock-detail-comment.controller.ts": "Inventory: Physical Count",

  "apps/backend-gateway/src/application/spot-check/spot-check.controller.ts": "Inventory: Spot Check",
  "apps/backend-gateway/src/application/spot-check-comment/spot-check-comment.controller.ts": "Inventory: Spot Check",
  "apps/backend-gateway/src/application/spot-check-detail-comment/spot-check-detail-comment.controller.ts": "Inventory: Spot Check",

  "apps/backend-gateway/src/application/inventory-adjustment/inventory-adjustment.controller.ts": "Inventory: Adjustments",

  "apps/backend-gateway/src/application/inventory-transaction/inventory-transaction.controller.ts": "Inventory: Transactions",

  "apps/backend-gateway/src/application/period/period.controller.ts": "Inventory: Periods",
  "apps/backend-gateway/src/application/period-comment/period-comment.controller.ts": "Inventory: Periods",

  "apps/backend-gateway/src/application/workflow/workflow.controller.ts": "Workflow: Operations",
  "apps/backend-gateway/src/application/workflow-comment/workflow-comment.controller.ts": "Workflow: Operations",
  "apps/backend-gateway/src/application/my-pending/purchase-request/my-pending.purchase-request.controller.ts": "Workflow: My Pending",
  "apps/backend-gateway/src/application/my-pending/purchase-order/my-pending.purchase-order.controller.ts": "Workflow: My Pending",
  "apps/backend-gateway/src/application/my-pending/store-requisition/my-pending.store-requisition.controller.ts": "Workflow: My Pending",
  "apps/backend-gateway/src/application/my-pending/my-approve/my-approve.controller.ts": "Workflow: My Approvals",

  "apps/backend-gateway/src/application/dashboard/dashboard.controller.ts": "Reports: Dashboard",
  "apps/backend-gateway/src/application/report/report.controller.ts": "Reports: Reports",
  "apps/backend-gateway/src/application/activity-log/activity-log.controller.ts": "Reports: Activity Log",
  "apps/backend-gateway/src/application/news/news.controller.ts": "Reports: News",
  "apps/backend-gateway/src/application/document-management/document-management.controller.ts": "Documents: File Management",

  "apps/backend-gateway/src/application/user/user.controller.ts": "User: Profile",
  "apps/backend-gateway/src/application/user-business-unit/user-business-unit.controller.ts": "User: Business Units",
  "apps/backend-gateway/src/application/business-unit/business-unit.controller.ts": "User: Business Units",
  "apps/backend-gateway/src/application/user-location/user-location.controller.ts": "User: Locations"
}
```

- [ ] **Step 5: Run coverage test to verify it passes**

Run: `cd /path/to/repo && bun test scripts/swagger-sync/__tests__/mapping.test.ts`
Expected: PASS, 4 tests green.

- [ ] **Step 6: Write short README**

Create `scripts/swagger-sync/README.md`:

```markdown
# swagger-sync

Tooling that keeps `@ApiTags(...)` across 144 gateway controllers aligned
with the single source of truth in
`apps/backend-gateway/src/swagger/tag-groups.ts`.

## Files
- `tag-mapping.json` — `<controller-path>` → `<tag-name>`.
- `retag.ts` — codemod that applies `tag-mapping.json`.
- `tag-mapping.ts` — loader + validation helpers.

## Commands (from repo root)
- `bun run swagger:retag:dry` — print diff, no writes.
- `bun run swagger:retag` — apply codemod.
- `bun run swagger:verify` — headless Nest boot + tag invariants.

## When to update
Any new `*.controller.ts` in `apps/backend-gateway/src/` must add an
entry to `tag-mapping.json`, otherwise CI's `swagger:verify` step fails.

## Spec
`docs/superpowers/specs/2026-04-22-swagger-tag-redesign-design.md`
```

- [ ] **Step 7: Commit**

```bash
git add scripts/swagger-sync/
git commit -m "feat(swagger-sync): add controller-to-tag mapping and coverage test

Source of truth for which Swagger tag each controller belongs to. Test
asserts 144 controllers covered, all tag values declared, no ghost paths.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Build codemod `retag.ts` (pure transform + CLI)

**Files:**
- Create: `scripts/swagger-sync/retag.ts`
- Create: `scripts/swagger-sync/__tests__/retag.test.ts`

- [ ] **Step 1: Write the failing test**

Create `scripts/swagger-sync/__tests__/retag.test.ts`:

```ts
import { describe, it, expect } from 'bun:test';
import { applyRetagToContent } from '../retag';

describe('applyRetagToContent', () => {
  it('replaces a single-arg @ApiTags', () => {
    const input = `
@Controller('api')
@ApiTags('Procurement')
export class Foo {}
`;
    const out = applyRetagToContent(input, 'Procurement: Purchase Orders');
    expect(out).toContain(`@ApiTags('Procurement: Purchase Orders')`);
    expect(out).not.toContain(`@ApiTags('Procurement')`);
  });

  it('replaces a multi-arg @ApiTags with single arg', () => {
    const input = `@ApiTags('Configuration', 'Recipe Equipment Category')\nclass X {}`;
    const out = applyRetagToContent(input, 'Config: Recipes');
    expect(out).toBe(`@ApiTags('Config: Recipes')\nclass X {}`);
  });

  it('handles multi-line @ApiTags', () => {
    const input = `@ApiTags(\n  'Old',\n  'Other',\n)\nclass X {}`;
    const out = applyRetagToContent(input, 'New');
    expect(out).toBe(`@ApiTags('New')\nclass X {}`);
  });

  it('handles double-quoted tag', () => {
    const input = `@ApiTags("Procurement")\nclass X {}`;
    const out = applyRetagToContent(input, 'Procurement: Purchase Orders');
    expect(out).toBe(`@ApiTags('Procurement: Purchase Orders')\nclass X {}`);
  });

  it('inserts @ApiTags if missing, before @Controller', () => {
    const input = `import { Controller } from '@nestjs/common';\nimport { ApiTags } from '@nestjs/swagger';\n\n@Controller('api')\nexport class Foo {}\n`;
    const out = applyRetagToContent(input, 'App Info');
    expect(out).toContain(`@ApiTags('App Info')\n@Controller('api')`);
  });

  it('adds missing import for ApiTags', () => {
    const input = `import { Controller } from '@nestjs/common';\n\n@Controller('api')\nexport class Foo {}\n`;
    const out = applyRetagToContent(input, 'App Info');
    expect(out).toContain(`import { ApiTags } from '@nestjs/swagger'`);
    expect(out).toContain(`@ApiTags('App Info')\n@Controller('api')`);
  });

  it('is idempotent — running twice produces same result', () => {
    const input = `@ApiTags('Procurement')\nclass X {}`;
    const once = applyRetagToContent(input, 'Procurement: Purchase Orders');
    const twice = applyRetagToContent(once, 'Procurement: Purchase Orders');
    expect(twice).toBe(once);
  });

  it('returns unchanged string when already correct', () => {
    const input = `@ApiTags('Procurement: Purchase Orders')\nclass X {}`;
    const out = applyRetagToContent(input, 'Procurement: Purchase Orders');
    expect(out).toBe(input);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test scripts/swagger-sync/__tests__/retag.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `retag.ts`**

Create `scripts/swagger-sync/retag.ts`:

```ts
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadMapping } from './tag-mapping';

const API_TAGS_RE = /@ApiTags\(\s*([^)]*)\s*\)/s;
const IMPORT_RE = /import\s+\{([^}]*)\}\s+from\s+['"]@nestjs\/swagger['"];?/;
const CONTROLLER_RE = /^@Controller\(/m;

export function applyRetagToContent(content: string, newTag: string): string {
  const desired = `@ApiTags('${newTag}')`;
  let out = content;

  if (API_TAGS_RE.test(out)) {
    out = out.replace(API_TAGS_RE, desired);
  } else {
    out = insertApiTags(out, desired);
  }

  out = ensureApiTagsImport(out);
  return out;
}

function insertApiTags(content: string, desired: string): string {
  const m = content.match(CONTROLLER_RE);
  if (!m || m.index === undefined) return content;
  const before = content.slice(0, m.index);
  const after = content.slice(m.index);
  return `${before}${desired}\n${after}`;
}

function ensureApiTagsImport(content: string): string {
  const imp = content.match(IMPORT_RE);
  if (imp) {
    const names = imp[1].split(',').map((s) => s.trim()).filter(Boolean);
    if (names.includes('ApiTags')) return content;
    const merged = [...names, 'ApiTags'].sort().join(', ');
    return content.replace(IMPORT_RE, `import { ${merged} } from '@nestjs/swagger';`);
  }
  // No swagger import at all — add one after the last nestjs/common import
  const commonRe = /(import\s+\{[^}]*\}\s+from\s+['"]@nestjs\/common['"];?)/;
  const cm = content.match(commonRe);
  if (cm && cm.index !== undefined) {
    const insertPos = cm.index + cm[0].length;
    return `${content.slice(0, insertPos)}\nimport { ApiTags } from '@nestjs/swagger';${content.slice(insertPos)}`;
  }
  // Fall back: prepend
  return `import { ApiTags } from '@nestjs/swagger';\n${content}`;
}

type RunOptions = { apply: boolean };

async function main(): Promise<void> {
  const opts: RunOptions = { apply: process.argv.includes('--apply') };
  const mapping = loadMapping();
  const repoRoot = join(import.meta.dir, '..', '..');

  let changed = 0;
  let unchanged = 0;
  const failures: string[] = [];

  for (const [relPath, tag] of Object.entries(mapping)) {
    const abs = join(repoRoot, relPath);
    let original: string;
    try {
      original = readFileSync(abs, 'utf8');
    } catch (e) {
      failures.push(`${relPath}: ${(e as Error).message}`);
      continue;
    }
    const next = applyRetagToContent(original, tag);
    if (next === original) {
      unchanged++;
      continue;
    }
    changed++;
    if (opts.apply) {
      writeFileSync(abs, next);
    } else {
      console.log(`~ ${relPath}  →  ${tag}`);
    }
  }

  console.log(
    `\n${opts.apply ? 'applied' : 'dry-run'}: changed=${changed} unchanged=${unchanged} failed=${failures.length}`,
  );
  if (failures.length) {
    for (const f of failures) console.error(`! ${f}`);
    process.exit(1);
  }
}

if (import.meta.main) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test scripts/swagger-sync/__tests__/retag.test.ts`
Expected: PASS, 8 tests green.

- [ ] **Step 5: Add npm scripts to root `package.json`**

Edit `package.json` at repo root — add to the `scripts` block (keep alphabetical-ish with existing `bruno:*`):

```json
"swagger:retag": "bun run scripts/swagger-sync/retag.ts --apply",
"swagger:retag:dry": "bun run scripts/swagger-sync/retag.ts",
"swagger:verify": "cd apps/backend-gateway && bun run scripts/verify-swagger.ts"
```

- [ ] **Step 6: Commit**

```bash
git add scripts/swagger-sync/retag.ts scripts/swagger-sync/__tests__/retag.test.ts package.json
git commit -m "feat(swagger-sync): add @ApiTags codemod with tests

Pure-function transform covers single-arg, multi-arg, multi-line, and
missing @ApiTags cases. CLI has --apply flag; default is dry-run.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Dry-run, review, apply codemod

**Files:**
- Modify: 143 `*.controller.ts` files (one `@ApiTags(...)` line each)

- [ ] **Step 1: Dry-run to see what will change**

Run: `bun run swagger:retag:dry | tee /tmp/swagger-retag-dry.txt`
Expected: ~130–140 lines starting with `~`, then a summary `dry-run: changed=N unchanged=M failed=0`.
`N + M` must equal 144.

- [ ] **Step 2: Review dry-run output for surprises**

Check `/tmp/swagger-retag-dry.txt`:
- Every printed line matches `~ <path>  →  <tag>` where the tag is one of the 52 declared.
- No `!` (failure) lines.
- Spot-check 5 entries against `tag-mapping.json`.

- [ ] **Step 3: Apply the codemod**

Run: `bun run swagger:retag`
Expected: same counts as dry-run, no failures.

- [ ] **Step 4: Review git diff summary**

Run: `git status --short && git diff --stat | tail -5`
Expected: modified `*.controller.ts` files only; no unrelated files changed.

- [ ] **Step 5: Format and lint**

Run: `bun run format && bun run lint`
Expected: both succeed. The lint pass also re-wraps any long lines.

- [ ] **Step 6: Type-check and build**

Run: `bun run check-types && bun run build`
Expected: both succeed. If the build fails, it will be because a controller had an import conflict — inspect the specific file, fix by hand, rerun.

- [ ] **Step 7: Run the mapping test once more**

Run: `bun test scripts/swagger-sync/__tests__/mapping.test.ts`
Expected: PASS — confirms no controller was moved/renamed by the codemod.

- [ ] **Step 8: Commit the bulk retag**

```bash
git add apps/backend-gateway/src
git commit -m "refactor(gateway): apply swagger tag codemod to 144 controllers

Every controller now uses a single @ApiTags(...) from the 52-tag set
defined in apps/backend-gateway/src/swagger/tag-groups.ts.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Rewire `main.ts` to use `tag-groups.ts` + inject `x-tagGroups`

**Files:**
- Modify: `apps/backend-gateway/src/main.ts`

- [ ] **Step 1: Replace the 12 hardcoded `.addTag(...)` with a loop + import**

Edit `apps/backend-gateway/src/main.ts`:

Add this import at the top with the other swagger imports:

```ts
import { SWAGGER_TAGS, SWAGGER_TAG_GROUPS } from './swagger/tag-groups';
```

Replace the block from `.addTag('Authentication', ...)` down through the last `.addTag('Workflow & Approval', ...)` (12 lines) with:

```ts
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      in: 'header',
    });
  for (const t of SWAGGER_TAGS) {
    config.addTag(t.name, t.description);
  }
  config
    .addApiKey(
      {
```

Note: `DocumentBuilder` returns `this` on most methods but `.build()` returns the final config. Keep the `config` as the builder and call `.build()` at the end. Current code already uses that style — just weave the loop in.

Concretely, rewrite the declaration so it reads:

```ts
  const docConfigBuilder = new DocumentBuilder()
    .setTitle('CarmenSoftware')
    .setDescription('CarmenSoftware API Gateway')
    .setVersion(APP_VERSION)
    .addServer(`http://localhost:${gatewayPort}`, 'local environment (http)')
    .addServer(`https://localhost:${gatewayPortHttps}`, 'local environment (https)')
    .addServer(`https://dev.blueledgers.com:${gatewayPortHttps}`, 'dev environment (https)')
    .addServer(`http://dev.blueledgers.com:${gatewayPort}`, 'dev environment (http)')
    .addServer('https://43.209.126.252', 'UAT environment')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      in: 'header',
    });

  for (const t of SWAGGER_TAGS) {
    docConfigBuilder.addTag(t.name, t.description);
  }

  const config = docConfigBuilder
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-app-id',
        in: 'header',
        description: 'Application ID',
      },
      'x-app-id',
    )
    .build();
```

- [ ] **Step 2: Inject `x-tagGroups` after `createDocument`**

Immediately after the two `SwaggerModule.createDocument(...)` calls (assigning `document_http` and `document_https`), add:

```ts
  (document_http  as unknown as Record<string, unknown>)['x-tagGroups']  = SWAGGER_TAG_GROUPS;
  (document_https as unknown as Record<string, unknown>)['x-tagGroups'] = SWAGGER_TAG_GROUPS;
```

- [ ] **Step 3: Type-check and build**

Run: `cd apps/backend-gateway && bun run check-types && bun run build`
Expected: both succeed.

- [ ] **Step 4: Start gateway locally and load Scalar**

Run: `cd apps/backend-gateway && bun run dev`
In another terminal:
- `curl -s http://localhost:4000/swagger | head -c 200` → returns HTML starting with `<!doctype html>`.
- Open `http://localhost:4000/swagger` in a browser.
Expected: Scalar UI loads; left nav shows 9 groups in documented order.

Kill the dev server when done.

- [ ] **Step 5: Commit**

```bash
git add apps/backend-gateway/src/main.ts
git commit -m "feat(gateway): wire tag-groups.ts into DocumentBuilder + inject x-tagGroups

Swagger now builds its tag list and group structure from a single
source of truth. Scalar renders 9-group navigation at /swagger.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Build `verify-swagger.ts` (pure checks + headless boot)

**Files:**
- Create: `apps/backend-gateway/scripts/verify-swagger.ts`
- Create: `apps/backend-gateway/scripts/__tests__/verify-swagger.spec.ts`

- [ ] **Step 1: Write the failing spec**

Create `apps/backend-gateway/scripts/__tests__/verify-swagger.spec.ts`:

```ts
import { runInvariants, type OpenApiDocLite } from '../verify-swagger';
import { SWAGGER_TAGS, SWAGGER_TAG_GROUPS } from '../../src/swagger/tag-groups';

const declaredTagNames = SWAGGER_TAGS.map((t) => t.name);

function baseDoc(tagsOnOp: string[]): OpenApiDocLite {
  return {
    paths: {
      '/a': { get: { tags: tagsOnOp } },
    },
    'x-tagGroups': SWAGGER_TAG_GROUPS,
  };
}

describe('runInvariants', () => {
  it('passes for a document that uses a declared tag inside a group', () => {
    const doc = baseDoc([declaredTagNames[0]]);
    const result = runInvariants(doc, SWAGGER_TAGS, SWAGGER_TAG_GROUPS);
    expect(result.failures).toEqual([]);
  });

  it('fails when an operation has no tags', () => {
    const doc = baseDoc([]);
    const result = runInvariants(doc, SWAGGER_TAGS, SWAGGER_TAG_GROUPS);
    expect(result.failures.some((f) => /untagged/i.test(f))).toBe(true);
  });

  it('fails when an operation uses an undeclared tag', () => {
    const doc = baseDoc(['Nonexistent Tag']);
    const result = runInvariants(doc, SWAGGER_TAGS, SWAGGER_TAG_GROUPS);
    expect(result.failures.some((f) => /undeclared/i.test(f))).toBe(true);
  });

  it('fails when a declared tag is not used by any operation', () => {
    const doc: OpenApiDocLite = { paths: {}, 'x-tagGroups': SWAGGER_TAG_GROUPS };
    const result = runInvariants(doc, SWAGGER_TAGS, SWAGGER_TAG_GROUPS);
    expect(result.failures.some((f) => /unused/i.test(f))).toBe(true);
  });

  it('fails when x-tagGroups references a tag not in SWAGGER_TAGS', () => {
    const doc: OpenApiDocLite = {
      paths: { '/a': { get: { tags: [declaredTagNames[0]] } } },
      'x-tagGroups': [{ name: 'Bogus', tags: ['Nope'] }, ...SWAGGER_TAG_GROUPS],
    };
    const result = runInvariants(doc, SWAGGER_TAGS, SWAGGER_TAG_GROUPS);
    expect(result.failures.some((f) => /group.*Bogus/i.test(f))).toBe(true);
  });

  it('fails when a declared tag is not part of any group', () => {
    const reducedGroups = SWAGGER_TAG_GROUPS.map((g) =>
      g.name === 'Getting Started' ? { ...g, tags: ['Authentication'] } : g,
    );
    const doc: OpenApiDocLite = {
      paths: {
        '/a': { get: { tags: ['Authentication'] } },
        '/b': { get: { tags: ['App Info'] } },
      },
      'x-tagGroups': reducedGroups,
    };
    const result = runInvariants(doc, SWAGGER_TAGS, reducedGroups);
    expect(result.failures.some((f) => /App Info.*not in any group/i.test(f))).toBe(true);
  });
});
```

- [ ] **Step 2: Create `verify-swagger.ts` with pure checks**

Create `apps/backend-gateway/scripts/verify-swagger.ts`:

```ts
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { patchNestJsSwagger } from 'nestjs-zod';
import { AppModule } from '../src/app.module';
import { SWAGGER_TAGS, SWAGGER_TAG_GROUPS, type SwaggerTag, type SwaggerTagGroup } from '../src/swagger/tag-groups';

export type OpenApiOperation = { tags?: string[] };
export type OpenApiDocLite = {
  paths: Record<string, Record<string, OpenApiOperation>>;
  'x-tagGroups'?: Array<{ name: string; tags: string[] }>;
};

export type InvariantResult = { failures: string[] };

export function runInvariants(
  doc: OpenApiDocLite,
  tags: SwaggerTag[],
  groups: SwaggerTagGroup[],
): InvariantResult {
  const failures: string[] = [];
  const declared = new Set(tags.map((t) => t.name));
  const usedOnOps = new Set<string>();

  // 1 + 2: every operation has at least one declared tag
  for (const [p, methods] of Object.entries(doc.paths ?? {})) {
    for (const [m, op] of Object.entries(methods ?? {})) {
      const t = op.tags ?? [];
      if (t.length === 0) {
        failures.push(`untagged operation: ${m.toUpperCase()} ${p}`);
        continue;
      }
      for (const name of t) {
        if (!declared.has(name)) {
          failures.push(`undeclared tag '${name}' on ${m.toUpperCase()} ${p}`);
        }
        usedOnOps.add(name);
      }
    }
  }

  // 3: every declared tag is used by at least one op
  for (const t of tags) {
    if (!usedOnOps.has(t.name)) failures.push(`unused declared tag: ${t.name}`);
  }

  // 4: every tag in x-tagGroups is declared
  for (const g of groups) {
    for (const name of g.tags) {
      if (!declared.has(name)) failures.push(`group '${g.name}' references undeclared tag: ${name}`);
    }
  }

  // 5: every declared tag is in exactly one group
  const inGroupCount = new Map<string, number>();
  for (const g of groups) for (const n of g.tags) inGroupCount.set(n, (inGroupCount.get(n) ?? 0) + 1);
  for (const t of tags) {
    const c = inGroupCount.get(t.name) ?? 0;
    if (c === 0) failures.push(`declared tag '${t.name}' is not in any group`);
    if (c > 1) failures.push(`declared tag '${t.name}' is in ${c} groups`);
  }

  return { failures };
}

async function main(): Promise<void> {
  patchNestJsSwagger();
  const app = await NestFactory.create(AppModule, { logger: false });
  const builder = new DocumentBuilder().setTitle('verify').setVersion('0');
  for (const t of SWAGGER_TAGS) builder.addTag(t.name, t.description);
  const config = builder.build();
  const document = SwaggerModule.createDocument(app as any, config);
  (document as unknown as Record<string, unknown>)['x-tagGroups'] = SWAGGER_TAG_GROUPS;

  const { failures } = runInvariants(document as unknown as OpenApiDocLite, SWAGGER_TAGS, SWAGGER_TAG_GROUPS);
  await app.close();

  if (failures.length === 0) {
    console.log('swagger-verify: PASS');
    process.exit(0);
  }
  console.error(`swagger-verify: FAIL (${failures.length})`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

if (import.meta.main) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
```

- [ ] **Step 3: Run spec to verify it passes**

Run: `cd apps/backend-gateway && bun run test -- verify-swagger.spec`
Expected: PASS, 6 tests green.

- [ ] **Step 4: Commit**

```bash
git add apps/backend-gateway/scripts/verify-swagger.ts apps/backend-gateway/scripts/__tests__/verify-swagger.spec.ts
git commit -m "feat(gateway): add swagger tag verification script

Boots AppModule headlessly, builds the OpenAPI doc, asserts every
operation uses a declared tag in exactly one x-tagGroup.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Run end-to-end verification against the real app

**Files:** none modified; only runs the verifier.

- [ ] **Step 1: Run the verifier**

Run: `bun run swagger:verify`
Expected: `swagger-verify: PASS` — exit code 0.

- [ ] **Step 2: If it fails**

Each `  - <reason>` line is actionable. Common cases:
- `untagged operation: X /y` — the controller's `@ApiTags(...)` was lost. Open the file, re-apply the mapping, commit the fix.
- `undeclared tag 'Foo'` — a controller used a stale tag. Re-run `bun run swagger:retag` and commit.
- `unused declared tag: Foo` — a tag exists in `tag-groups.ts` but no controller uses it. Either add a controller mapping or remove the tag from `tag-groups.ts` (updating the spec if needed).

Re-run `bun run swagger:verify` until PASS.

- [ ] **Step 3: No-op commit checkpoint (optional)**

If Step 2 produced commits, leave them in place — they are fixup commits for the bulk retag. Otherwise skip.

---

## Task 8: Full-repo validation

**Files:** none modified.

- [ ] **Step 1: Lint**

Run: `bun run lint`
Expected: succeeds.

- [ ] **Step 2: Type-check across workspaces**

Run: `bun run check-types`
Expected: succeeds.

- [ ] **Step 3: Gateway tests**

Run: `cd apps/backend-gateway && bun run test`
Expected: all tests pass, including the new `tag-groups.spec.ts` and `verify-swagger.spec.ts`.

- [ ] **Step 4: Script tests**

Run: `bun test scripts/swagger-sync/__tests__/`
Expected: all pass.

- [ ] **Step 5: Build gateway**

Run: `cd apps/backend-gateway && bun run build`
Expected: build succeeds.

- [ ] **Step 6: Commit any formatting changes**

Run: `git status --short`
If there are any `M` entries from Step 1's lint auto-fix:

```bash
git add -u
git commit -m "style: lint auto-fix after swagger retag

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

Otherwise skip.

---

## Task 9: Manual Scalar smoke test

**Files:** none.

- [ ] **Step 1: Start gateway**

Run: `cd apps/backend-gateway && bun run dev`
Wait for `Gateway HTTP listening on port 4000`.

- [ ] **Step 2: Open Scalar at `http://localhost:4000/swagger` in a browser**

Verify each checklist item:

- [ ] Left nav shows exactly 9 group headings in this order: Getting Started, Platform Administration, Business Unit Configuration, Procurement, Inventory, Workflow & Approval, Reporting & Insights, Notifications, User Profile & Access.
- [ ] Expanding "Procurement" shows 9 sub-entries (Purchase Requests ... Price Lists).
- [ ] Clicking "Procurement: Purchase Requests" lists endpoints from `purchase-request`, its template, and all four `*-comment` controllers together.
- [ ] Clicking "Notifications" shows the notification REST endpoints; the description mentions WebSocket at `/ws`.
- [ ] The old `Master` / `Master Data` tags do not appear anywhere.

- [ ] **Step 3: Open Swagger JSON and spot-check**

Run: `curl -s http://localhost:4000/swagger-json > /tmp/swagger.json || curl -s http://localhost:4000/swagger/json > /tmp/swagger.json`
If neither URL works (Scalar may not re-expose the raw JSON), skip — Task 7's verifier already confirmed the invariants.

Expected when available: `jq '.["x-tagGroups"] | length' /tmp/swagger.json` returns `9`.

- [ ] **Step 4: Stop the gateway**

Ctrl-C in the dev terminal.

---

## Task 10: Update root docs + open PR

**Files:**
- Modify: `CLAUDE.md` (under the "Gotchas" or "Additional Code Conventions" section) — add a one-liner about the new workflow.

- [ ] **Step 1: Edit `CLAUDE.md`**

Add this bullet to the `## Additional Code Conventions` list in `CLAUDE.md`:

```markdown
- **Swagger tags**: `@ApiTags(...)` on a gateway controller must match the
  mapping in `scripts/swagger-sync/tag-mapping.json`. The tag set and
  2-level group structure are defined in
  `apps/backend-gateway/src/swagger/tag-groups.ts`. Run
  `bun run swagger:retag:dry` to preview changes, `bun run swagger:retag`
  to apply, and `bun run swagger:verify` to confirm the OpenAPI document
  is consistent. When adding a new gateway controller, add its mapping
  first.
```

- [ ] **Step 2: Final commit**

```bash
git add CLAUDE.md
git commit -m "docs: note swagger tag workflow in CLAUDE.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 3: Push branch + open PR**

```bash
git push -u origin HEAD
gh pr create --title "Redesign swagger tag taxonomy (9 groups / 52 tags)" --body "$(cat <<'EOF'
## Summary
- Reorganizes 144 gateway controllers into 9 tag groups via `x-tagGroups`, rendered natively by Scalar at `/swagger`.
- Adds `apps/backend-gateway/src/swagger/tag-groups.ts` as the single source of truth for tags + groups.
- Adds `scripts/swagger-sync/` (mapping JSON + codemod + tests) and `apps/backend-gateway/scripts/verify-swagger.ts` (headless verifier).
- Replaces the duplicate `Master` / `Master Data` tags and 3 undeclared tags (`SQL Query`, `Report`, `Dashboard`) with a coherent taxonomy designed for external integrators.

## Test plan
- [ ] `bun run swagger:verify` → PASS
- [ ] `cd apps/backend-gateway && bun run test` → PASS (including new specs)
- [ ] `bun test scripts/swagger-sync/__tests__` → PASS
- [ ] `bun run check-types && bun run lint && bun run build` → PASS
- [ ] Manual: open `/swagger`, confirm 9 groups and sub-tags per the smoke-test checklist in `docs/superpowers/plans/2026-04-22-swagger-tag-redesign.md` Task 9.

Spec: `docs/superpowers/specs/2026-04-22-swagger-tag-redesign-design.md`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 4: Print PR URL**

`gh` prints the URL on success — copy it into the conversation for the user.

---

## Appendix — Rollback

If anything downstream breaks after merge:

```bash
git revert <merge-commit-sha>
git push
```

The change is pure OpenAPI metadata (no runtime, DB, or deployment impact), so revert is instantaneous.

## Appendix — Adding a new controller in the future

1. Create the controller (e.g. `apps/backend-gateway/src/application/foo/foo.controller.ts`).
2. Add an entry to `scripts/swagger-sync/tag-mapping.json`:
   `"apps/backend-gateway/src/application/foo/foo.controller.ts": "<existing tag>"`.
3. Add `@ApiTags('<existing tag>')` to the controller, or run `bun run swagger:retag` which will insert it.
4. Run `bun run swagger:verify` — must PASS before merge.
