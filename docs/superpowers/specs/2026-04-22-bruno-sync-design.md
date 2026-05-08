# Bruno Sync Tool — Design Spec

**Date:** 2026-04-22
**Status:** Draft — pending user review
**Owner:** Carmen backend team

## Problem

Bruno API collection at `apps/bruno/carmen-inventory/` has drifted from the actual gateway endpoints. Some `.bru` files point to endpoints that no longer exist; many new gateway endpoints have no corresponding `.bru` file; request paths, methods, and body shapes are inconsistent with the current controllers. Maintaining this by hand across 100+ modules is not sustainable.

## Goal

Provide a repeatable tool that reconciles `apps/bruno/carmen-inventory/` with the gateway controllers as the single source of truth, while preserving the hand-tuned environments, auth flow, and custom scripts.

## Non-Goals

- Parsing or generating requests for microservices directly (only the gateway HTTP surface is synced).
- Running or booting the gateway (no Swagger JSON fetching).
- Generating Bruno tests/assertions beyond empty placeholders.
- Automatically filling request bodies with realistic data — bodies are structural placeholders from DTO shape only.
- Supporting API versioning (`@Version()`) in v1 — flagged as known limitation.

## Decisions (from brainstorming)

- **Scope:** Full sync across all gateway domains.
- **Clean mode:** Hybrid — regenerate domain folders, preserve `environments/`, `auth/`, `bruno.json`, and custom scripts within existing files.
- **Source of truth:** Controller decorators (AST parse), not Swagger JSON.
- **Tooling:** Permanent, committed script. Re-runnable.
- **Orphan handling:** Move to `_archived/<YYYY-MM-DD>/<original-path>/`, never delete.

## Architecture

### Location

```
scripts/bruno-sync/
├── index.ts              # CLI entry (bun run scripts/bruno-sync/index.ts)
├── config.ts             # paths, preserved dirs, folder mapping rules
├── parser/
│   ├── controller.ts     # parse .controller.ts → endpoint metadata
│   ├── dto.ts            # resolve DTO import chain → body schema
│   └── global-prefix.ts  # read main.ts → global prefix
├── generator/
│   ├── bru-writer.ts     # endpoint metadata → .bru file content
│   ├── bru-parser.ts     # parse existing .bru → sections (for merge)
│   └── folder-mapper.ts  # gateway module path → Bruno folder path
├── reconciler/
│   ├── diff.ts           # gateway endpoints × existing .bru → {new, update, orphan}
│   ├── merger.ts         # preserve user sections on UPDATE
│   └── archiver.ts       # move orphans → _archived/
└── __tests__/
    ├── parser.test.ts
    ├── folder-mapper.test.ts
    └── merger.test.ts
```

### Dependencies

- `ts-morph` — TypeScript AST parsing (already used elsewhere or added as dev dep)
- `bun:test` — test runner (repo standard)
- No runtime Bruno dependency; `.bru` format is plain text and generated as strings

### Execution Flow

1. **Load global prefix.** Read `apps/backend-gateway/src/main.ts`, detect `app.setGlobalPrefix('...')`. Default to empty if not found.
2. **Scan controllers.** Walk `apps/backend-gateway/src/{application,config,platform}/**/*.controller.ts`.
3. **Extract endpoints.** Per controller, per method decorator → emit metadata:
   ```ts
   {
     module: string            // e.g. "application/good-received-note"
     controllerPath: string    // from @Controller('...')
     method: 'GET'|'POST'|'PATCH'|'PUT'|'DELETE'
     methodPath: string        // from @Get('...') etc.
     fullPath: string          // prefix + controllerPath + methodPath, normalized
     methodName: string        // controller method, e.g. "createOne"
     pathParams: string[]      // from @Param
     queryParams: string[]     // from @Query
     bodyDto?: string          // class name from @Body() type
     isPublic: boolean         // has @Public() decorator
   }
   ```
4. **Resolve body DTOs.** For each endpoint with a body, resolve DTO class → property list + types. Generate JSON skeleton using placeholders (`"": ""`, `"": 0`, `"": false`, `"": []`, `"": {}`). Handle `extends`, arrays, nested objects. Cycle detect.
5. **Scan existing Bruno.** Walk `apps/bruno/carmen-inventory/`, excluding preserved paths: `environments/`, `auth/`, `bruno.json`, `_archived/`. Parse each `.bru` → sections.
6. **Diff.** Match by derived file path (folder + filename):
   - **NEW:** endpoint exists in gateway, no matching `.bru` → generate.
   - **UPDATE:** both exist → regenerate `.bru` structure, merge-preserve user sections.
   - **ORPHAN:** `.bru` exists, no matching endpoint → schedule archive.
7. **Apply.** Unless `--dry-run`:
   - Write NEW and UPDATE `.bru` files.
   - Move ORPHAN files to `_archived/<YYYY-MM-DD>/<original-relative-path>/`, create or append `_archived/README.md` with provenance line.
8. **Report.** Print summary: added N, updated N, archived N, warnings N, parse errors N.

### Folder Mapping

Bruno collection uses **business-domain grouping** (not gateway module-path grouping). Top-level folders today: `procurement/`, `inventory/`, `master-data/`, `user-management/`, `documents-and-reports/`, `my-pending/`, `config/`, `platform/`, `auth/`.

Mapping strategy:

1. **Preserve existing location.** If a `.bru` already exists anywhere in the tree matching a gateway module (by module slug), keep that location. The domain taxonomy is human-curated and must be preserved.
2. **Config & platform** — deterministic mapping:
   - `src/config/config_<name>/` → `config/<name>/`
   - `src/config/<name>/` (no prefix) → `config/<name>/`
   - `src/platform/platform_<name>/` → `platform/<name>/`
   - `src/platform/<name>/` (no prefix) → `platform/<name>/`
3. **Application modules with no existing `.bru`** — land in `_uncategorized/<module-name>/` with a warning in the report. Users move them to the appropriate domain folder (`procurement/`, `inventory/`, etc.) manually. Subsequent runs will pick up the new location via rule (1).

Name transformations: underscores → hyphens (`config_adjustment-type` → `config/adjustment-type`).

### Module → Existing Folder Resolution

On each run, build an index `{moduleSlug → existingFolderPath}` by scanning existing `.bru` files:
- Extract a `moduleSlug` from each file's URL (first meaningful path segment after `/api/` or any global prefix, plus optional sub-segment for disambiguation).
- If multiple files from the same module slug live in one folder → that folder is the canonical location.
- If the same slug appears in multiple folders → log conflict warning; pick the folder with the most files as canonical; rest become orphans in next run.

### File Naming

`{METHOD}-{slug}.bru` where `slug` is derived from controller method name in kebab-case:
- `createOne` → `POST-create.bru`
- `findAll` → `GET-list.bru`
- `findOne` → `GET-by-id.bru`
- `update` → `PATCH-update.bru`
- `remove` → `DELETE-remove.bru`

Collisions (same method-slug in folder) → append disambiguator from `methodPath` (e.g. `GET-list-by-vendor.bru`).

### `.bru` Template

```
meta {
  name: {generated name}
  type: http
  seq: {auto}
}

{method} {
  url: {{base_url}}{fullPath}
  body: {json|none}
  auth: {bearer|none}
}

headers {
  x-app-id: {{x_app_id}}
  Content-Type: application/json
}

auth:bearer {
  token: {{access_token}}
}

query {
  ~{queryParam1}: 
}

body:json {
  { /* DTO skeleton or empty */ }
}

vars:pre-request {
  ~{pathParam1}: 
}
```

`:bu_code` path param → substituted with `{{bu_code}}` (existing env var).
Other path params → `{{param_name}}` + listed in `vars:pre-request` with commented placeholder.

### Preservation on Update

When regenerating an existing `.bru`, the following sections are **preserved verbatim** from the original:
- `vars:*` (except auto-managed path-param placeholders)
- `script:pre-request`
- `script:post-response`
- `tests`
- `docs`
- `seq` value (within `meta`)

Regenerated (overwritten): `meta.name`, `meta.type`, `{method}` block URL, `headers`, `body:json` structure (with merge: new fields added, existing user fields kept).

### Orphan Archival

Target: `apps/bruno/carmen-inventory/_archived/<YYYY-MM-DD>/<original-relative-path>/<filename>.bru`

Create `_archived/README.md` (or append if exists):
```
# Archived Bruno Requests

Files moved here by `bruno-sync` when the corresponding gateway endpoint could not be found.
Review periodically and delete when confirmed obsolete.

## 2026-04-22
- `config/old-thing/GET-list.bru` — endpoint `GET /api/config/old-thing` not found in gateway controllers
```

`_archived/` is excluded from all subsequent sync runs.

## CLI

```bash
bun run scripts/bruno-sync/index.ts          # apply changes
bun run scripts/bruno-sync/index.ts --dry-run  # report only
bun run scripts/bruno-sync/index.ts --verbose  # include per-file diffs
```

Registered in root `package.json`:
```json
"scripts": {
  "bruno:sync": "bun run scripts/bruno-sync/index.ts",
  "bruno:sync:dry": "bun run scripts/bruno-sync/index.ts --dry-run"
}
```

## Edge Cases

1. **Empty `@Controller()`** — all pathing from method decorators.
2. **Multi-segment controller path** with params (`@Controller('bu/:bu_code/grn')`) — handled as prefix to every method.
3. **Versioning `@Version()`** — log warning, skip (v1 limitation).
4. **Zod DTOs via `nestjs-zod`** — attempt Zod schema inspection; on failure, emit `{}` with `// TODO: see {DtoName}` comment.
5. **Union / discriminated types** — pick first variant, comment in body.
6. **Circular DTO references** — depth-limit to 3, then `{}`.
7. **Dynamic paths** (path built from variables) — log warning, skip file.
8. **`@Public()` methods** — `auth: none`, no `auth:bearer` block.
9. **Parse errors** — non-fatal, collected into warnings; run exits 0.
10. **Fatal errors** (missing gateway dir, bad config) — exit 1.

## Testing

- **Parser unit tests:** controller with no `@Controller` arg, nested path with params, multiple HTTP methods on one class, `@Public`, guards combined with non-guard decorators.
- **Folder-mapper unit tests:** all prefix variants (`config_*`, `platform_*`, plain), underscore-to-hyphen conversion.
- **Merger unit tests:** preserve `script:post-response`, add new body field without clobbering user value, preserve `seq`.
- **Integration smoke:** run on real gateway dir → assert summary counts non-zero, no crash, known module file exists.

Target coverage: ≥80% on reconciler + parser; generator tested via golden files.

## Rollout

1. Land script + tests in a PR.
2. Run `bun run bruno:sync:dry` → paste report in PR description for review.
3. In a follow-up PR, run `bun run bruno:sync` → commit the resulting Bruno diffs and `_archived/` contents together.
4. Document in `CLAUDE.md` under "Agent-specific commands": when adding new gateway endpoints, run `bun run bruno:sync` before opening PR.

## Relationship to `scripts/generate-bruno.py`

An existing Python script `scripts/generate-bruno.py` generates `.bru` files from `apps/backend-gateway/swagger.json`. The new `bruno-sync` tool supersedes it:
- Different source of truth (controller AST vs. Swagger JSON).
- Adds diff + merge + archive logic the Python script lacks.
- Preserves user scripts/vars which the Python script overwrites.

**Plan:** land `bruno-sync` first. Delete `scripts/generate-bruno.py` in the same PR to avoid two competing tools. Record this removal in the PR description.

## Known Limitations

- No API versioning support.
- Body generation for complex Zod schemas is best-effort.
- Bruno `tests` block is not populated (empty placeholder).
- No detection of deprecated endpoints still defined in controllers.

## Out of Scope (Future Work)

- Swagger JSON source mode (`--source=swagger`).
- Auto-generating realistic body examples from example values in DTOs.
- Bruno `assert`/`tests` block generation from response DTOs.
- Syncing microservice TCP `@MessagePattern()` handlers (separate tool).
