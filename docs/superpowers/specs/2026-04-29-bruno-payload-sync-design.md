# Bruno Payload Sync — Design

**Status:** Approved (brainstorming)
**Date:** 2026-04-29
**Owner:** Engineering / DX
**Related:** `docs/superpowers/specs/2026-04-22-bruno-sync-design.md` (parent tool), `apps/backend-gateway/src/main.ts` (Scalar/Swagger setup)

---

## 1. Problem

`apps/bruno/carmen-inventory/` contains 977 `.bru` files. Of these, ~401 hit endpoints with a request body (POST / PATCH / PUT). Most of those files have an empty `body:json { {} }` block — even when the corresponding gateway DTO already declares a complete schema with examples via `@ApiProperty({ example: ... })`.

Devs must currently:
- Open the gateway DTO source file
- Hand-copy field names and example values into the Bruno body block
- Repeat for every new endpoint and every DTO change

This is slow, error-prone, and the Bruno collection drifts behind the Swagger spec over time.

## 2. Goal

Add a tool that synchronises sample request payloads from the gateway's OpenAPI spec into Bruno `.bru` files, scoped to all domains (`auth`, `config`, `inventory`, `master-data`, `procurement`, `platform`, `user-management`, `documents-and-reports`, `my-pending`).

Non-goals:
- Generating multipart / form-urlencoded bodies (out of scope for v1 — file uploads are rare)
- Auto-rebuilding `swagger.json` (devs must run gateway build/start themselves)
- Modifying response examples (already documented in `### Sample Response` blocks)
- Touching `.bru` files in `_archived/`

## 3. Decisions (from brainstorming)

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Extend existing `scripts/bruno-sync/` rather than build a new tool | Reuse parser + types; co-located concern |
| 2 | New CLI entry-point: `payloads.ts` (separate from `index.ts`) | Reconciliation and payload sync are different concerns; share infrastructure but split entry-points |
| 3 | Source of truth: `apps/backend-gateway/swagger.json` (pre-generated) | Already produced by gateway start-up; no extra build step |
| 4 | Overwrite policy: **only when body is empty** | Preserve any payload a dev has hand-customised |
| 5 | Value priority: Swagger first (operation example → schema example → property example → property default → enum[0]) → fallback `### Sample Body` from `.bru` docs → fallback type-based default | Swagger is canonical; docs is a useful secondary source for fields lacking examples |

## 4. Architecture

### 4.1 Commands (root `package.json`)

```jsonc
{
  "scripts": {
    "bruno:sync:payloads": "bun run scripts/bruno-sync/payloads.ts --apply",
    "bruno:sync:payloads:dry": "bun run scripts/bruno-sync/payloads.ts"
  }
}
```

Default mode is dry-run. `--apply` writes changes. `--verbose` shows skipped files.

### 4.2 Workflow

```
1. Dev edits a DTO in apps/backend-gateway/
2. Dev rebuilds gateway → swagger.json regenerates
3. bun run bruno:sync:payloads:dry  → preview diff
4. bun run bruno:sync:payloads      → write changes
5. Commit .bru changes alongside DTO change
```

If `swagger.json` mtime is older than `apps/backend-gateway/src/**` mtime, the tool prints a warning but does not block (devs may have intentionally skipped a rebuild).

## 5. Components

New directory: `scripts/bruno-sync/payload-sync/`

```
scripts/bruno-sync/
├── index.ts                    (existing — bruno-sync reconciler)
├── types.ts                    (existing — extend with PayloadSyncResult types)
├── parser/                     (existing — shared)
├── reconciler/                 (existing)
├── generator/                  (existing)
├── payloads.ts                 NEW — CLI entry point
└── payload-sync/               NEW — module
    ├── openapi-loader.ts
    ├── operation-matcher.ts
    ├── schema-resolver.ts
    ├── example-extractor.ts
    ├── payload-generator.ts
    ├── body-block-writer.ts
    └── reporter.ts
```

### 5.1 Module responsibilities

| Module | Input | Output | Side effects |
|--------|-------|--------|--------------|
| `openapi-loader` | path | `OpenAPIDocument` (typed) + staleness flag | reads FS |
| `operation-matcher` | parsed `.bru` (method+url) + OpenAPI paths | matched `Operation` or `null` + reason | none |
| `schema-resolver` | `$ref` / `allOf` / `oneOf` / inline schema, root doc | flat resolved schema | none |
| `example-extractor` | resolved schema + `.bru` docs `Sample Body` text | concrete value | none |
| `payload-generator` | resolved schema + extractor | JSON object | none |
| `body-block-writer` | raw `.bru` text + new payload string | new raw `.bru` text | none |
| `reporter` | `Result[]` | console output + summary + exit code | writes stdout |

Pure functions everywhere except `openapi-loader` (reads FS) and the apply phase in `payloads.ts` (writes FS).

### 5.2 Type additions (`types.ts`)

```ts
export type PayloadSyncStatus =
  | 'UPDATED'                  // body was empty, replaced with generated payload
  | 'SKIPPED_NOT_EMPTY'        // body has content; preserved
  | 'SKIPPED_NO_BODY'          // .bru declares body: none
  | 'SKIPPED_NON_JSON_BODY'    // multipart, form-urlencoded
  | 'NO_MATCH'                 // no OpenAPI operation matches method+path
  | 'NO_REQUEST_BODY'          // OpenAPI op has no requestBody
  | 'WARNING';                 // matched but resolution had warnings (oneOf, circular)

export interface PayloadSyncResult {
  filePath: string;
  status: PayloadSyncStatus;
  warnings: string[];
  diff?: { before: string; after: string };
}
```

## 6. Data Flow

```
load swagger.json
    │
    ▼
glob .bru files (exclude _archived/)
    │
    ▼
for each file:
    parse → check body block exists & is JSON
                                │
                                ▼
                       body empty?  ──no──► SKIPPED_NOT_EMPTY
                                │ yes
                                ▼
              match method+path → operation
                                │
                       no match? ──► NO_MATCH
                                │ matched
                                ▼
                  resolve requestBody schema
                                │
                       no body? ──► NO_REQUEST_BODY
                                │ has body
                                ▼
                  extract examples + generate JSON
                                │
                                ▼
                  write new body block (preserve rest)
                                │
                                ▼
                          UPDATED (or DRY_RUN)
                                │
                                ▼
                            reporter
```

### 6.1 Path normalisation

Bruno URL: `{{host}}/api/config/{{bu_code}}/credit-term`
OpenAPI path: `/api/config/{bu_code}/credit-term`

Normalisation rules (applied to both sides before comparison):
1. Strip `{{host}}` and any leading scheme/authority
2. Replace `{{var}}` and `:var` with `{var}`
3. Strip trailing slash and query string
4. Lowercase nothing — paths are case-sensitive

### 6.2 Empty body detection

Treat as empty if, after stripping comments and trimming whitespace, the body block contains only `{}` or `{\n}` or is entirely empty. Anything else is "non-empty" and is preserved.

### 6.3 Example priority chain (per field)

```
1. operation.requestBody.content['application/json'].example
   (if present at top level → use whole object, skip per-property walk)
2. schema.example (top level)
3. property.example
4. property.default
5. enum[0]  (if schema is enum)
6. Parsed value from .bru's `### Sample Body` docs section
   (parse the JSON, look up the matching field path)
7. Type-based default:
     string  → ""
     number  → 0
     integer → 0
     boolean → false
     array   → []        (except details.add — see §7)
     object  → {}
     nullable + no example → type-based default (NOT null)
```

### 6.4 Format-specific defaults

| `format` | Default value |
|----------|---------------|
| `date-time` | `"2026-04-29T00:00:00.000Z"` |
| `date` | `"2026-04-29"` |
| `uuid` | `""` |
| `email` | `"user@example.com"` |
| `uri` / `url` | `"https://example.com"` |

## 7. Edge Cases

| Case | Handling |
|------|----------|
| `details: { add: [...] }` (project convention — all create endpoints) | When an array property is nested under a `details.add` key path AND its items resolve to an object schema, generate exactly one populated element. Empty arrays would be unusable for testing. All other arrays follow the type-based default in §6.3 step 7 (`[]`). |
| `oneOf` / `anyOf` | Pick first variant. Emit `WARNING` so dev reviews. |
| `allOf` | Merge all schemas into single resolved schema. |
| `$ref` cycle | Resolver tracks visited refs. On cycle, emit `null`, depth cap = 5, emit `WARNING`. |
| `additionalProperties: true` | Do not generate extra fields. |
| `required` not exhaustive | Generate ALL declared properties (Bruno is for testing — show every option). |
| Bruno method = GET / DELETE with body block | Skip; do not touch. |
| `body: multipart-form` / `form-urlencoded` | `SKIPPED_NON_JSON_BODY` for v1. |
| `requestBody.required: false` | Still generate (give dev a starting template). |
| OpenAPI operation missing | `NO_MATCH` with reason "method+path not found in spec". |
| Bruno `body:json` block missing entirely on POST | Treat as empty for purposes of overwrite — generate and add the block. |

### 7.1 Idempotency invariant

After a successful `--apply` run, immediately re-running `--apply` produces zero `UPDATED` results. (All files now have non-empty bodies → all skip.)

## 8. Error Handling

| Severity | Condition | Behaviour |
|----------|-----------|-----------|
| Fatal (exit 1) | `swagger.json` missing or invalid JSON | Print error, abort before any write |
| Fatal (exit 1) | `apps/bruno/carmen-inventory/` missing | Print error, abort |
| Warning (exit 0) | `swagger.json` mtime < gateway src mtime | Print "stale openapi" warning, continue |
| Warning (exit 0, in reporter) | `oneOf` / `anyOf` / circular | Listed in WARNING section of summary |
| Info (only with `--verbose`) | Files in SKIPPED_* statuses | Hidden by default; visible in verbose |

Writes are non-atomic (single `writeFileSync`). Bruno files are tiny and there are no concurrent readers; if process dies mid-run, `git diff` shows partial state — devs revert or re-run.

## 9. Reporter Output

```
Bruno Payload Sync — DRY RUN

Updated:    87 files       (would write)
Skipped:    314 files      (body not empty — preserved)
No match:   3 files        (gateway operation missing)
Warnings:   2 files        (oneOf / circular ref — review)

Updated files:
  apps/bruno/carmen-inventory/config/credit-term/03 - Create Credit Term.bru
  apps/bruno/carmen-inventory/config/currencies/03 - Create Currency.bru
  ...

Warnings:
  apps/bruno/carmen-inventory/.../foo.bru — oneOf at requestBody (picked first variant)
  apps/bruno/carmen-inventory/.../bar.bru — circular ref (truncated at depth 5)

No match:
  apps/bruno/carmen-inventory/.../zombie.bru — POST /api/v1/legacy not in OpenAPI

Run with --apply to write changes.
```

With `--apply`, replace "would write" with "wrote" and remove the trailing hint.

## 10. Testing

Test framework: Bun test (matches existing `scripts/bruno-sync/__tests__/` setup).

```
scripts/bruno-sync/__tests__/payload-sync/
├── unit/
│   ├── schema-resolver.test.ts
│   ├── example-extractor.test.ts
│   ├── payload-generator.test.ts
│   ├── operation-matcher.test.ts
│   ├── body-block-writer.test.ts
│   └── empty-body-detector.test.ts
├── integration/
│   └── full-pipeline.test.ts
└── fixtures/
    ├── openapi/
    │   ├── simple.json
    │   ├── nested-details-add.json
    │   ├── circular-ref.json
    │   └── enum-and-formats.json
    └── bruno/
        ├── empty-body.bru
        ├── populated-body.bru
        ├── with-sample-docs.bru
        └── no-match-url.bru
```

### 10.1 Critical test cases (Given-When-Then)

1. **Idempotency** — Given populated body, when run twice, then second run = 0 UPDATED.
2. **Details.add pattern** — Given DTO with `details.add[]`, when generate, then array contains one element with all properties populated.
3. **Priority chain** — Given schema has both `property.example` and docs `Sample Body`, when extract, then `property.example` wins.
4. **Skip non-empty** — Given body `{ "name": "test" }`, when run, then file is unchanged + status SKIPPED_NOT_EMPTY.
5. **Path normalisation** — Given Bruno URL `{{host}}/api/{{bu_code}}/x` and OpenAPI path `/api/{bu_code}/x`, when match, then operation found.
6. **Stale OpenAPI** — Given `swagger.json` older than gateway src, when run, then warning emitted, exit 0.
7. **Preserve docs/headers/params** — Given `.bru` with docs/headers/auth/query/params blocks, when payload rewritten, then all other blocks byte-identical.
8. **Format defaults** — Given `format: date-time`, when generate, then ISO string emitted.
9. **Enum handling** — Given enum field with no example, when generate, then enum[0] used.
10. **Nullable defaults** — Given `nullable: true` field with no example, when generate, then type-based default (not `null`).

### 10.2 Manual smoke test

After `--apply`:
1. Pick one updated `.bru` from each domain (auth, config, inventory, master-data, procurement, platform, user-management).
2. Open Bruno → load environment → Send.
3. Verify: server response is 2xx or 4xx (validation error is fine — proves body parsed). Any 500 from malformed JSON = fail.

### 10.3 Coverage target

≥ 90 % statements on `payload-sync/` directory (matches existing `bruno-sync` standard).

## 11. Out of Scope (future work)

- Multipart / form-urlencoded body generation
- Auto-rebuild of `swagger.json` (would couple this tool to gateway lifecycle)
- Bruno `Sample Response` synchronisation (response examples — separate concern)
- Bruno `params:path` and `query` block sync (path/query parameter examples)
- Diff-based partial updates (e.g. add only newly-introduced fields without overwriting existing body) — current rule is "skip non-empty entirely"

## 12. Rollout

1. Implement + tests
2. Run `bun run bruno:sync:payloads:dry` on full collection
3. Spot-check 5–10 generated files across domains
4. Run `bun run bruno:sync:payloads` to apply
5. Manual smoke test (§10.2)
6. Commit `.bru` changes in a single PR titled `feat(bruno): sync sample payloads from OpenAPI spec`
7. Update `scripts/bruno-sync/README.md` with the new command
8. Update root `CLAUDE.md` "Bruno API Collections" section with the new sync workflow

## 13. Open Questions

None at design time. Implementation may surface schema patterns in real `swagger.json` not covered above — those become test fixtures + edge-case entries.
