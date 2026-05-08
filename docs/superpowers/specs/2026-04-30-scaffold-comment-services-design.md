# Scaffold Missing Comment Services in micro-business — Design

**Date:** 2026-04-30
**Status:** Draft

## Goal

สร้าง codemod ที่ scaffold controller / service / module ให้ครบทุก `*-comment` service ใน `apps/micro-business/src/` โดยใช้ `purchase-request-comment` เป็น template และ generate ตาม service ที่ gateway ต้องการ — เพื่อปิด gap ที่ทำให้ gateway routes 500 (TCP message ส่งไปแต่ micro-business ไม่มี handler)

## Current State

- **Gateway:** มี 46 `*-comment` services ใน `apps/backend-gateway/src/application/*-comment/`
- **micro-business:** มีแค่ 2 services (`purchase-request-comment`, `good-received-note-comment`) ที่มี controller/service/module ครบ
- **Missing:** 44 services มีแค่ `dto/` folder (Zod schemas) แต่ขาด controller/service/module — ทำให้ TCP messages ไม่มี handler รองรับ
- **Prisma:** มี 48 `tb_*_comment` tables ใน tenant schema; tables ทั้งหมดมี structure เดียวกันต่างแค่ `{entity}_id` field และ relation

## Architecture

**Codemod location:** `scripts/scaffold-comment-services/`

```
scripts/scaffold-comment-services/
├── run.ts                  # CLI entry point
├── service-discovery.ts    # Scan gateway dirs vs micro-business dirs → return missing services
├── name-resolver.ts        # 'purchase-order-comment' → name variants
├── domain-resolver.ts      # 'purchase-order-comment' → 'procurement' (using existing dto folder location)
├── template-loader.ts      # Read purchase-request-comment files as templates
├── template-renderer.ts    # Substitute name tokens in template strings
├── file-writer.ts          # Write rendered files (idempotent: skip if exists)
├── module-registrar.ts     # Patch app.module.ts: imports + imports[] array
├── reporter.ts             # Format dry-run / apply summary
├── README.md
└── __tests__/              # Unit tests for pure functions (name-resolver, template-renderer)
```

**`package.json` (root):**
```json
"scaffold:comments": "bun scripts/scaffold-comment-services/run.ts",
"scaffold:comments:dry": "bun scripts/scaffold-comment-services/run.ts --dry-run"
```

### Pipeline

```
Gateway dirs ──┐
               ├─→ service-discovery ─→ [missing services list]
micro-business ┘
                          ↓
        ┌─────────────────┴─────────────────┐
        ↓                                   ↓
For each missing service:           Module registration:
  1. domain-resolver                  Read app.module.ts
  2. name-resolver                    Add 44 imports
  3. template-loader (cached)         Add 44 entries to imports[]
  4. template-renderer
  5. file-writer (3 files)
                          ↓
                     Reporter
```

## Components

### 1. `service-discovery.ts`

```ts
export interface MissingService {
  kebab: string;      // 'purchase-order-comment'
  domain: string;     // 'procurement' | 'master' | 'inventory'
  dtoPath: string;    // existing dto folder path
}

export function findMissingServices(
  gatewayAppDir: string,
  microBusinessSrcDir: string,
): MissingService[];
```

- Scan `apps/backend-gateway/src/application/*-comment/` → list of kebab names
- For each, check `apps/micro-business/src/*/{kebab}/` exists with `.controller.ts` file
- Return ones missing controller (existence of `dto/` alone doesn't count as scaffolded)
- Determine domain by walking `apps/micro-business/src/{master,procurement,inventory}/{kebab}/dto/` — first match wins

### 2. `name-resolver.ts`

```ts
export interface NameVariants {
  kebab: string;        // 'purchase-order'
  kebabFull: string;    // 'purchase-order-comment'
  snake: string;        // 'purchase_order'
  snakeFull: string;    // 'purchase_order_comment'
  pascal: string;       // 'PurchaseOrder'
  pascalFull: string;   // 'PurchaseOrderComment'
  camel: string;        // 'purchaseOrder'
  camelFull: string;    // 'purchaseOrderComment'
  parentIdField: string; // 'purchase_order_id'
}

export function resolveNames(kebab: string): NameVariants;
```

Rules:
- Strip `-comment` suffix → entity kebab
- Convert kebab to snake/pascal/camel via simple split-and-join

### 3. `template-loader.ts`

```ts
export interface Template {
  controller: string;  // raw text of purchase-request-comment.controller.ts
  service: string;
  module: string;
}

export function loadTemplate(rootDir: string): Template;
```

- Read 3 files from `apps/micro-business/src/procurement/purchase-request-comment/`
- Cache in memory (called once per run)

### 4. `template-renderer.ts`

```ts
export function render(
  template: Template,
  templateNames: NameVariants,  // from purchase-request-comment
  targetNames: NameVariants,
): { controller: string; service: string; module: string };
```

Substitution algorithm:
- Replace **all occurrences** of `templateNames.kebabFull` → `targetNames.kebabFull`
- Replace `templateNames.kebab` → `targetNames.kebab` (after kebabFull, to avoid prefix collisions)
- Same for snake → snake, pascal → pascal, camel → camel (longer first)
- Replace `templateNames.parentIdField` → `targetNames.parentIdField`

To avoid double-replacement: do all substitutions in one pass with a single regex alternation, OR substitute longer tokens before shorter ones.

### 5. `file-writer.ts`

```ts
export function writeServiceFiles(
  service: MissingService,
  rendered: { controller: string; service: string; module: string },
  options: { dryRun: boolean },
): { written: string[]; skipped: string[] };
```

- Target dir: `apps/micro-business/src/{domain}/{kebabFull}/`
- Write 3 files: `{kebabFull}.controller.ts`, `{kebabFull}.service.ts`, `{kebabFull}.module.ts`
- **Idempotent:** if a file already exists, skip (do not overwrite — protect manual edits)
- Dry run: report what would be written, no I/O

### 6. `module-registrar.ts`

```ts
export function registerModules(
  appModulePath: string,
  services: MissingService[],
  options: { dryRun: boolean },
): { addedImports: string[]; addedRefs: string[] };
```

Strategy:
- Read `apps/micro-business/src/app.module.ts` as text
- For each service, check if its module is already imported (search for `${PascalFull}Module`); skip if present
- Add import lines after the **last existing comment-module import** (search for the last `*Comment*Module' from`)
- Add module references to the `imports: [...]` array (insert before the closing `]` of the array; preserve indentation)
- Dry run: report counts, do not write

### 7. `reporter.ts`

Output a tree-style summary:
```
Discovered: 46 gateway services
Already scaffolded: 2 (purchase-request-comment, good-received-note-comment)
Missing: 44

  master/        21 services
  procurement/   13 services
  inventory/     10 services

Files to write:    132 (44 services × 3 files)
Modules to register: 44 (in app.module.ts)
```

In `--dry-run` mode print the per-file plan; in apply mode print results plus any skipped (already exists) entries.

## Edge Cases & Risk Mitigation

- **Existing files:** writer is idempotent — never overwrite. Engineers can hand-tune one service after scaffold without losing work on re-run.
- **Module already registered:** registrar checks for the symbol before adding.
- **Missing dto folder:** if a gateway service has no corresponding `apps/micro-business/src/*/{kebab}-comment/dto/` folder, log a warning and skip (cannot determine domain). User must create the dto folder first.
- **Token collision in template rendering:** substitute longer tokens before shorter ones (e.g., `kebabFull` before `kebab`) to prevent partial replacements.
- **Comment / docstring drift:** template comments mention "purchase request" — these get substituted too via the kebab/pascal substitution.
- **Prisma table name in service body:** template uses `tb_purchase_request_comment` — substitution covers this via `snakeFull`.

## Out of Scope

- Tests: not generating `.spec.ts` files for the scaffolded services (existing comment services don't have spec files either).
- Updating fileUrl helper: that's #18 which already merged.
- Modifying gateway code: codemod is read-only on gateway side.
- Fixing existing `purchase-request-comment` template: scaffold is 1:1 copy. Bugs in template are inherited; fix at template level after scaffold lands.
- Adding new gateway routes: codemod consumes existing routes only.

## Testing

**Unit tests (pure functions):**
- `name-resolver.spec.ts` — verify variant outputs for `purchase-order-comment`, `physical-count-period-comment`, `unit-comment`
- `template-renderer.spec.ts` — verify substitution preserves formatting, doesn't double-substitute, doesn't corrupt unrelated tokens (e.g., a comment that contains the word "request" unrelated to the entity)

**No tests** for: `service-discovery` (filesystem-bound, smoke-test via dry-run), `file-writer` (filesystem-bound), `module-registrar` (smoke-test via dry-run on a copy)

**Manual verification after apply:**
1. `bunx tsc --noEmit` in `apps/micro-business` — must pass
2. Run `bun run dev` in micro-business — must boot without `@MessagePattern` registration errors
3. From gateway, hit a previously-500ing endpoint (e.g., `GET /api/T02/purchase-order-comment/{id}`) — must return 200 with comment payload (or 404 if no comments, but not 500)

## Success Criteria

- All 44 missing services have `.controller.ts` + `.service.ts` + `.module.ts` files
- `app.module.ts` imports and registers all 44 modules
- `bunx tsc --noEmit` passes in micro-business
- A representative sample of previously-500 gateway endpoints (e.g., `purchase-order-comment`, `currency-comment`, `tax-profile-comment`) responds 200/404 instead of 500
