# Bruno Payload Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `bun run bruno:sync:payloads` command that fills empty `body:json` blocks in `apps/bruno/carmen-inventory/**/*.bru` from `apps/backend-gateway/swagger.json`, preserving any non-empty body the dev has customised.

**Architecture:** Extend `scripts/bruno-sync/` with a new entry-point `payloads.ts` and a `payload-sync/` module containing seven pure-function units (loader, matcher, resolver, extractor, generator, writer, reporter). Reuse the existing `parser/bru-parser.ts` and `types.ts` infrastructure. Source of truth is the gateway's `swagger.json` (already produced by `apps/backend-gateway/src/main.ts` via `@scalar/nestjs-api-reference` + `SwaggerModule`).

**Tech Stack:** TypeScript + Bun runtime + Bun test framework. No new dependencies (parse OpenAPI as plain JSON, no external schema library).

**Spec:** `docs/superpowers/specs/2026-04-29-bruno-payload-sync-design.md`

---

## File Structure

**New files:**

| Path | Responsibility |
|------|---------------|
| `scripts/bruno-sync/payloads.ts` | CLI entry-point; orchestrates the pipeline |
| `scripts/bruno-sync/payload-sync/openapi-loader.ts` | Read `swagger.json`, detect staleness vs gateway src |
| `scripts/bruno-sync/payload-sync/operation-matcher.ts` | Normalise paths and match Bruno URL → OpenAPI operation |
| `scripts/bruno-sync/payload-sync/schema-resolver.ts` | Resolve `$ref`, merge `allOf`, pick first of `oneOf`/`anyOf`, detect cycles |
| `scripts/bruno-sync/payload-sync/example-extractor.ts` | Walk priority chain (operation example → schema example → property example → default → enum[0] → docs Sample Body → type-based) |
| `scripts/bruno-sync/payload-sync/payload-generator.ts` | Build a JSON value from a resolved schema using the extractor |
| `scripts/bruno-sync/payload-sync/body-block-writer.ts` | Replace `body:json { ... }` block in a `.bru` file's raw text, preserving every other byte |
| `scripts/bruno-sync/payload-sync/empty-body-detector.ts` | Decide whether a body block counts as empty |
| `scripts/bruno-sync/payload-sync/reporter.ts` | Format the run summary, set exit code |
| `scripts/bruno-sync/__tests__/payload-sync/unit/<module>.test.ts` | Unit tests per module |
| `scripts/bruno-sync/__tests__/payload-sync/integration/full-pipeline.test.ts` | End-to-end test on fixtures |
| `scripts/bruno-sync/__tests__/payload-sync/fixtures/openapi/*.json` | Hand-crafted OpenAPI fixtures |
| `scripts/bruno-sync/__tests__/payload-sync/fixtures/bruno/*.bru` | Hand-crafted `.bru` fixtures |

**Files modified:**

| Path | Change |
|------|--------|
| `scripts/bruno-sync/types.ts` | Add `PayloadSyncStatus`, `PayloadSyncResult`, `OpenApiDocument`, etc. |
| `package.json` (root) | Add `bruno:sync:payloads` and `bruno:sync:payloads:dry` scripts |
| `scripts/bruno-sync/README.md` | Document the new command |
| `CLAUDE.md` (root) | Note the new sync workflow under Bruno API Collections |

---

## Task 1: Add OpenAPI types and PayloadSyncResult to `types.ts`

**Files:**
- Modify: `scripts/bruno-sync/types.ts`

- [ ] **Step 1: Add OpenAPI and result types to `types.ts`**

Append to `scripts/bruno-sync/types.ts`:

```ts
// ───────────────────────────────────────────────────────────────────────────
// Payload Sync types
// ───────────────────────────────────────────────────────────────────────────

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [k: string]: JsonValue };

export interface OpenApiSchema {
  type?: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object' | 'null';
  format?: string;
  example?: JsonValue;
  default?: JsonValue;
  enum?: JsonValue[];
  nullable?: boolean;
  required?: string[];
  properties?: Record<string, OpenApiSchema>;
  items?: OpenApiSchema;
  $ref?: string;
  allOf?: OpenApiSchema[];
  oneOf?: OpenApiSchema[];
  anyOf?: OpenApiSchema[];
  additionalProperties?: boolean | OpenApiSchema;
}

export interface OpenApiMediaType {
  schema?: OpenApiSchema;
  example?: JsonValue;
}

export interface OpenApiRequestBody {
  required?: boolean;
  content?: Record<string, OpenApiMediaType>;
}

export interface OpenApiOperation {
  operationId?: string;
  tags?: string[];
  requestBody?: OpenApiRequestBody;
}

export interface OpenApiPathItem {
  get?: OpenApiOperation;
  post?: OpenApiOperation;
  put?: OpenApiOperation;
  patch?: OpenApiOperation;
  delete?: OpenApiOperation;
  head?: OpenApiOperation;
  options?: OpenApiOperation;
}

export interface OpenApiDocument {
  openapi?: string;
  paths: Record<string, OpenApiPathItem>;
  components?: {
    schemas?: Record<string, OpenApiSchema>;
  };
}

export type PayloadSyncStatus =
  | 'UPDATED'
  | 'SKIPPED_NOT_EMPTY'
  | 'SKIPPED_NO_BODY'
  | 'SKIPPED_NON_JSON_BODY'
  | 'NO_MATCH'
  | 'NO_REQUEST_BODY'
  | 'WARNING';

export interface PayloadSyncResult {
  filePath: string;
  relativePath: string;
  status: PayloadSyncStatus;
  warnings: string[];
  before?: string;
  after?: string;
}

export interface PayloadSyncReport {
  results: PayloadSyncResult[];
  staleOpenapi: boolean;
  dryRun: boolean;
}
```

- [ ] **Step 2: Run TypeScript compile to confirm no errors**

Run: `cd scripts/bruno-sync && bun build types.ts --target=bun --outdir=/tmp/typecheck 2>&1 | head -20`

Expected: builds without errors. If the existing file already has imports/exports, the new types should append cleanly.

- [ ] **Step 3: Commit**

```bash
git add scripts/bruno-sync/types.ts
git commit -m "$(cat <<'EOF'
feat(bruno-sync): add OpenAPI and payload sync types

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Implement `empty-body-detector.ts` (TDD)

**Files:**
- Test: `scripts/bruno-sync/__tests__/payload-sync/unit/empty-body-detector.test.ts`
- Create: `scripts/bruno-sync/payload-sync/empty-body-detector.ts`

- [ ] **Step 1: Create test fixtures directory + write failing tests**

```bash
mkdir -p scripts/bruno-sync/__tests__/payload-sync/unit
mkdir -p scripts/bruno-sync/__tests__/payload-sync/integration
mkdir -p scripts/bruno-sync/__tests__/payload-sync/fixtures/openapi
mkdir -p scripts/bruno-sync/__tests__/payload-sync/fixtures/bruno
mkdir -p scripts/bruno-sync/payload-sync
```

Create `scripts/bruno-sync/__tests__/payload-sync/unit/empty-body-detector.test.ts`:

```ts
import { describe, it, expect } from 'bun:test';
import { isEmptyBody } from '../../../payload-sync/empty-body-detector';

describe('isEmptyBody', () => {
  it('returns true for "{}"', () => {
    expect(isEmptyBody('{}')).toBe(true);
  });

  it('returns true for "{ }"', () => {
    expect(isEmptyBody('{ }')).toBe(true);
  });

  it('returns true for "  {}  "', () => {
    expect(isEmptyBody('  {}  ')).toBe(true);
  });

  it('returns true for multi-line empty object', () => {
    expect(isEmptyBody('\n  {\n  }\n')).toBe(true);
  });

  it('returns true for empty string', () => {
    expect(isEmptyBody('')).toBe(true);
  });

  it('returns true for whitespace only', () => {
    expect(isEmptyBody('   \n  \n')).toBe(true);
  });

  it('returns false for object with one field', () => {
    expect(isEmptyBody('{\n  "name": "x"\n}')).toBe(false);
  });

  it('returns false for object with whitespace and field', () => {
    expect(isEmptyBody('  {\n    "name": "x"\n  }  ')).toBe(false);
  });

  it('returns false for non-object content', () => {
    expect(isEmptyBody('"just a string"')).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd scripts/bruno-sync && bun test __tests__/payload-sync/unit/empty-body-detector.test.ts 2>&1 | tail -20`

Expected: FAIL — module not found / `isEmptyBody is not a function`.

- [ ] **Step 3: Implement `empty-body-detector.ts`**

Create `scripts/bruno-sync/payload-sync/empty-body-detector.ts`:

```ts
export function isEmptyBody(rawBody: string): boolean {
  const trimmed = rawBody.trim();
  if (trimmed === '') return true;
  if (trimmed === '{}') return true;
  // Object with only whitespace or trivia inside
  const inner = trimmed.replace(/^\{/, '').replace(/\}$/, '').trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}') && inner === '') {
    return true;
  }
  return false;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd scripts/bruno-sync && bun test __tests__/payload-sync/unit/empty-body-detector.test.ts 2>&1 | tail -10`

Expected: 9 pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/bruno-sync/payload-sync/empty-body-detector.ts \
        scripts/bruno-sync/__tests__/payload-sync/unit/empty-body-detector.test.ts
git commit -m "$(cat <<'EOF'
feat(bruno-sync): add empty-body-detector for payload sync

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Implement `operation-matcher.ts` (TDD)

**Files:**
- Test: `scripts/bruno-sync/__tests__/payload-sync/unit/operation-matcher.test.ts`
- Create: `scripts/bruno-sync/payload-sync/operation-matcher.ts`

- [ ] **Step 1: Write failing tests**

Create `scripts/bruno-sync/__tests__/payload-sync/unit/operation-matcher.test.ts`:

```ts
import { describe, it, expect } from 'bun:test';
import {
  normalisePath,
  normaliseBrunoUrl,
  matchOperation,
} from '../../../payload-sync/operation-matcher';
import type { OpenApiDocument } from '../../../types';

describe('normaliseBrunoUrl', () => {
  it('strips {{host}} prefix', () => {
    expect(normaliseBrunoUrl('{{host}}/api/credit-term')).toBe('/api/credit-term');
  });

  it('replaces {{var}} with {var}', () => {
    expect(normaliseBrunoUrl('{{host}}/api/{{bu_code}}/x')).toBe('/api/{bu_code}/x');
  });

  it('replaces :var with {var}', () => {
    expect(normaliseBrunoUrl('{{host}}/api/x/:id')).toBe('/api/x/{id}');
  });

  it('strips trailing slash', () => {
    expect(normaliseBrunoUrl('{{host}}/api/x/')).toBe('/api/x');
  });

  it('strips query string', () => {
    expect(normaliseBrunoUrl('{{host}}/api/x?foo=1')).toBe('/api/x');
  });

  it('handles ~prefix query placeholders gracefully', () => {
    expect(normaliseBrunoUrl('{{host}}/api/x?~version=')).toBe('/api/x');
  });
});

describe('normalisePath', () => {
  it('is a no-op for already-normalised paths', () => {
    expect(normalisePath('/api/x/{id}')).toBe('/api/x/{id}');
  });

  it('strips trailing slash', () => {
    expect(normalisePath('/api/x/')).toBe('/api/x');
  });
});

describe('matchOperation', () => {
  const doc: OpenApiDocument = {
    paths: {
      '/api/auth/login': {
        post: { operationId: 'login' },
      },
      '/api/{bu_code}/credit-term': {
        get: { operationId: 'list' },
        post: { operationId: 'create' },
      },
      '/api/{bu_code}/credit-term/{id}': {
        patch: { operationId: 'patch' },
      },
    },
  };

  it('matches POST /api/auth/login', () => {
    const r = matchOperation(doc, 'post', '{{host}}/api/auth/login');
    expect(r.operation?.operationId).toBe('login');
  });

  it('matches POST with bu_code variable', () => {
    const r = matchOperation(doc, 'post', '{{host}}/api/{{bu_code}}/credit-term');
    expect(r.operation?.operationId).toBe('create');
  });

  it('matches PATCH with multiple path params', () => {
    const r = matchOperation(doc, 'patch', '{{host}}/api/{{bu_code}}/credit-term/:id');
    expect(r.operation?.operationId).toBe('patch');
  });

  it('returns null when method not present', () => {
    const r = matchOperation(doc, 'delete', '{{host}}/api/auth/login');
    expect(r.operation).toBeNull();
    expect(r.reason).toContain('method delete');
  });

  it('returns null when path not present', () => {
    const r = matchOperation(doc, 'post', '{{host}}/api/zombie');
    expect(r.operation).toBeNull();
    expect(r.reason).toContain('not found');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd scripts/bruno-sync && bun test __tests__/payload-sync/unit/operation-matcher.test.ts 2>&1 | tail -10`

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `operation-matcher.ts`**

Create `scripts/bruno-sync/payload-sync/operation-matcher.ts`:

```ts
import type { OpenApiDocument, OpenApiOperation, OpenApiPathItem } from '../types';

const HTTP_METHODS: (keyof OpenApiPathItem)[] = [
  'get', 'post', 'put', 'patch', 'delete', 'head', 'options',
];

export function normalisePath(path: string): string {
  let p = path;
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p;
}

export function normaliseBrunoUrl(url: string): string {
  let u = url.trim();
  // strip query string
  const q = u.indexOf('?');
  if (q >= 0) u = u.slice(0, q);
  // strip {{host}} or any leading {{var}} that isn't a path param
  u = u.replace(/^\{\{[a-zA-Z0-9_]+\}\}/, '');
  // {{var}} → {var}
  u = u.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, '{$1}');
  // :var → {var}
  u = u.replace(/:([a-zA-Z0-9_]+)/g, '{$1}');
  return normalisePath(u);
}

export interface MatchResult {
  operation: OpenApiOperation | null;
  reason?: string;
}

export function matchOperation(
  doc: OpenApiDocument,
  method: string,
  brunoUrl: string,
): MatchResult {
  const m = method.toLowerCase() as keyof OpenApiPathItem;
  if (!HTTP_METHODS.includes(m)) {
    return { operation: null, reason: `unknown method ${method}` };
  }
  const target = normaliseBrunoUrl(brunoUrl);
  const pathItem = doc.paths[target];
  if (!pathItem) {
    // Try matching with normalisePath on each registered path (cheap loop)
    for (const [registeredPath, item] of Object.entries(doc.paths)) {
      if (normalisePath(registeredPath) === target) {
        const op = item[m];
        if (!op) {
          return {
            operation: null,
            reason: `path matched but method ${m} not declared`,
          };
        }
        return { operation: op };
      }
    }
    return { operation: null, reason: `path not found in spec: ${target}` };
  }
  const op = pathItem[m];
  if (!op) {
    return { operation: null, reason: `path matched but method ${m} not declared` };
  }
  return { operation: op };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd scripts/bruno-sync && bun test __tests__/payload-sync/unit/operation-matcher.test.ts 2>&1 | tail -10`

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/bruno-sync/payload-sync/operation-matcher.ts \
        scripts/bruno-sync/__tests__/payload-sync/unit/operation-matcher.test.ts
git commit -m "$(cat <<'EOF'
feat(bruno-sync): add operation-matcher for payload sync

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Implement `schema-resolver.ts` (TDD)

**Files:**
- Test: `scripts/bruno-sync/__tests__/payload-sync/unit/schema-resolver.test.ts`
- Create: `scripts/bruno-sync/payload-sync/schema-resolver.ts`

- [ ] **Step 1: Write failing tests**

Create `scripts/bruno-sync/__tests__/payload-sync/unit/schema-resolver.test.ts`:

```ts
import { describe, it, expect } from 'bun:test';
import { resolveSchema, MAX_REF_DEPTH } from '../../../payload-sync/schema-resolver';
import type { OpenApiDocument, OpenApiSchema } from '../../../types';

const doc: OpenApiDocument = {
  paths: {},
  components: {
    schemas: {
      Foo: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string', example: 'foo' },
        },
        required: ['id'],
      },
      Bar: {
        type: 'object',
        properties: {
          foo: { $ref: '#/components/schemas/Foo' },
        },
      },
      Cycle: {
        type: 'object',
        properties: {
          self: { $ref: '#/components/schemas/Cycle' },
        },
      },
    },
  },
};

describe('resolveSchema', () => {
  it('resolves a $ref to its target schema', () => {
    const r = resolveSchema({ $ref: '#/components/schemas/Foo' }, doc);
    expect(r.schema.type).toBe('object');
    expect(r.schema.properties?.name?.example).toBe('foo');
  });

  it('passes through inline schema unchanged', () => {
    const inline: OpenApiSchema = { type: 'string', example: 'hi' };
    const r = resolveSchema(inline, doc);
    expect(r.schema).toEqual(inline);
  });

  it('merges allOf into a single object schema', () => {
    const s: OpenApiSchema = {
      allOf: [
        { type: 'object', properties: { a: { type: 'string' } } },
        { type: 'object', properties: { b: { type: 'number' } } },
      ],
    };
    const r = resolveSchema(s, doc);
    expect(r.schema.type).toBe('object');
    expect(r.schema.properties?.a?.type).toBe('string');
    expect(r.schema.properties?.b?.type).toBe('number');
  });

  it('picks first variant for oneOf and emits warning', () => {
    const s: OpenApiSchema = {
      oneOf: [
        { type: 'string' },
        { type: 'number' },
      ],
    };
    const r = resolveSchema(s, doc);
    expect(r.schema.type).toBe('string');
    expect(r.warnings.some((w) => /oneOf/i.test(w))).toBe(true);
  });

  it('picks first variant for anyOf and emits warning', () => {
    const s: OpenApiSchema = {
      anyOf: [
        { type: 'object' },
        { type: 'array' },
      ],
    };
    const r = resolveSchema(s, doc);
    expect(r.schema.type).toBe('object');
    expect(r.warnings.some((w) => /anyOf/i.test(w))).toBe(true);
  });

  it('detects circular ref and emits warning', () => {
    const r = resolveSchema(
      { $ref: '#/components/schemas/Cycle' },
      doc,
    );
    expect(r.warnings.some((w) => /circular/i.test(w))).toBe(true);
  });

  it('exposes MAX_REF_DEPTH = 5', () => {
    expect(MAX_REF_DEPTH).toBe(5);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd scripts/bruno-sync && bun test __tests__/payload-sync/unit/schema-resolver.test.ts 2>&1 | tail -10`

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `schema-resolver.ts`**

Create `scripts/bruno-sync/payload-sync/schema-resolver.ts`:

```ts
import type { OpenApiDocument, OpenApiSchema } from '../types';

export const MAX_REF_DEPTH = 5;
const REF_PREFIX = '#/components/schemas/';

export interface ResolveResult {
  schema: OpenApiSchema;
  warnings: string[];
}

export function resolveSchema(
  schema: OpenApiSchema,
  doc: OpenApiDocument,
  visited: string[] = [],
): ResolveResult {
  const warnings: string[] = [];
  return { schema: resolveInner(schema, doc, visited, warnings), warnings };
}

function resolveInner(
  schema: OpenApiSchema,
  doc: OpenApiDocument,
  visited: string[],
  warnings: string[],
): OpenApiSchema {
  if (schema.$ref) {
    const ref = schema.$ref;
    if (!ref.startsWith(REF_PREFIX)) {
      warnings.push(`unsupported $ref: ${ref}`);
      return { type: 'object' };
    }
    const name = ref.slice(REF_PREFIX.length);
    if (visited.includes(name)) {
      warnings.push(`circular ref detected at ${name}`);
      return { type: 'object', nullable: true };
    }
    if (visited.length >= MAX_REF_DEPTH) {
      warnings.push(`max ref depth (${MAX_REF_DEPTH}) reached at ${name}`);
      return { type: 'object', nullable: true };
    }
    const target = doc.components?.schemas?.[name];
    if (!target) {
      warnings.push(`unresolved $ref: ${ref}`);
      return { type: 'object' };
    }
    return resolveInner(target, doc, [...visited, name], warnings);
  }

  if (schema.allOf && schema.allOf.length > 0) {
    const merged: OpenApiSchema = { type: 'object', properties: {}, required: [] };
    for (const part of schema.allOf) {
      const resolved = resolveInner(part, doc, visited, warnings);
      if (resolved.properties) {
        merged.properties = { ...merged.properties, ...resolved.properties };
      }
      if (resolved.required) {
        merged.required = [...(merged.required ?? []), ...resolved.required];
      }
    }
    return merged;
  }

  if (schema.oneOf && schema.oneOf.length > 0) {
    warnings.push(`oneOf encountered — picked first variant`);
    return resolveInner(schema.oneOf[0], doc, visited, warnings);
  }

  if (schema.anyOf && schema.anyOf.length > 0) {
    warnings.push(`anyOf encountered — picked first variant`);
    return resolveInner(schema.anyOf[0], doc, visited, warnings);
  }

  return schema;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd scripts/bruno-sync && bun test __tests__/payload-sync/unit/schema-resolver.test.ts 2>&1 | tail -10`

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/bruno-sync/payload-sync/schema-resolver.ts \
        scripts/bruno-sync/__tests__/payload-sync/unit/schema-resolver.test.ts
git commit -m "$(cat <<'EOF'
feat(bruno-sync): add schema-resolver for OpenAPI refs and composition

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Implement `example-extractor.ts` (TDD)

**Files:**
- Test: `scripts/bruno-sync/__tests__/payload-sync/unit/example-extractor.test.ts`
- Create: `scripts/bruno-sync/payload-sync/example-extractor.ts`

- [ ] **Step 1: Write failing tests**

Create `scripts/bruno-sync/__tests__/payload-sync/unit/example-extractor.test.ts`:

```ts
import { describe, it, expect } from 'bun:test';
import {
  extractFromOperationLevel,
  extractFromSchema,
  parseSampleBodyFromDocs,
  formatDefault,
} from '../../../payload-sync/example-extractor';
import type { OpenApiOperation, OpenApiSchema } from '../../../types';

describe('extractFromOperationLevel', () => {
  it('returns operation requestBody example when present', () => {
    const op: OpenApiOperation = {
      requestBody: {
        content: {
          'application/json': {
            schema: { type: 'object' },
            example: { name: 'top-level' },
          },
        },
      },
    };
    expect(extractFromOperationLevel(op)).toEqual({ name: 'top-level' });
  });

  it('returns null when there is no top-level example', () => {
    const op: OpenApiOperation = {
      requestBody: {
        content: { 'application/json': { schema: { type: 'object' } } },
      },
    };
    expect(extractFromOperationLevel(op)).toBeNull();
  });
});

describe('extractFromSchema (per-property priority)', () => {
  it('uses property.example when present', () => {
    const s: OpenApiSchema = { type: 'string', example: 'hello' };
    expect(extractFromSchema(s)).toBe('hello');
  });

  it('falls back to property.default', () => {
    const s: OpenApiSchema = { type: 'string', default: 'def' };
    expect(extractFromSchema(s)).toBe('def');
  });

  it('falls back to enum[0]', () => {
    const s: OpenApiSchema = { type: 'string', enum: ['a', 'b'] };
    expect(extractFromSchema(s)).toBe('a');
  });

  it('returns undefined when nothing matches (caller falls back to type-default)', () => {
    const s: OpenApiSchema = { type: 'string' };
    expect(extractFromSchema(s)).toBeUndefined();
  });
});

describe('formatDefault (type-based defaults)', () => {
  it('string → ""', () => expect(formatDefault({ type: 'string' })).toBe(''));
  it('number → 0', () => expect(formatDefault({ type: 'number' })).toBe(0));
  it('integer → 0', () => expect(formatDefault({ type: 'integer' })).toBe(0));
  it('boolean → false', () => expect(formatDefault({ type: 'boolean' })).toBe(false));
  it('array → []', () =>
    expect(formatDefault({ type: 'array', items: { type: 'string' } })).toEqual([]));
  it('object → {}', () => expect(formatDefault({ type: 'object' })).toEqual({}));

  it('format date-time → ISO string', () =>
    expect(formatDefault({ type: 'string', format: 'date-time' })).toBe(
      '2026-04-29T00:00:00.000Z',
    ));
  it('format date → date string', () =>
    expect(formatDefault({ type: 'string', format: 'date' })).toBe('2026-04-29'));
  it('format uuid → empty string', () =>
    expect(formatDefault({ type: 'string', format: 'uuid' })).toBe(''));
  it('format email → user@example.com', () =>
    expect(formatDefault({ type: 'string', format: 'email' })).toBe('user@example.com'));
  it('format uri → https://example.com', () =>
    expect(formatDefault({ type: 'string', format: 'uri' })).toBe('https://example.com'));
});

describe('parseSampleBodyFromDocs', () => {
  it('returns null when docs has no sample body block', () => {
    expect(parseSampleBodyFromDocs('## Some doc\n')).toBeNull();
  });

  it('extracts JSON object from `### Sample Body` code fence', () => {
    const docs = `
## Create

### Sample Body
\`\`\`json
{
  "name": "test"
}
\`\`\`
`;
    expect(parseSampleBodyFromDocs(docs)).toEqual({ name: 'test' });
  });

  it('returns null on unparseable JSON', () => {
    const docs = '### Sample Body\n```json\n{ bad\n```\n';
    expect(parseSampleBodyFromDocs(docs)).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd scripts/bruno-sync && bun test __tests__/payload-sync/unit/example-extractor.test.ts 2>&1 | tail -10`

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `example-extractor.ts`**

Create `scripts/bruno-sync/payload-sync/example-extractor.ts`:

```ts
import type { JsonValue, OpenApiOperation, OpenApiSchema } from '../types';

const ISO_DATE_TIME = '2026-04-29T00:00:00.000Z';
const ISO_DATE = '2026-04-29';

export function extractFromOperationLevel(op: OpenApiOperation): JsonValue | null {
  const content = op.requestBody?.content?.['application/json'];
  if (!content) return null;
  if (content.example !== undefined) return content.example;
  if (content.schema?.example !== undefined) return content.schema.example;
  return null;
}

export function extractFromSchema(schema: OpenApiSchema): JsonValue | undefined {
  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;
  if (schema.enum && schema.enum.length > 0) return schema.enum[0];
  return undefined;
}

export function formatDefault(schema: OpenApiSchema): JsonValue {
  if (schema.type === 'string') {
    switch (schema.format) {
      case 'date-time': return ISO_DATE_TIME;
      case 'date': return ISO_DATE;
      case 'uuid': return '';
      case 'email': return 'user@example.com';
      case 'uri':
      case 'url':
        return 'https://example.com';
      default: return '';
    }
  }
  if (schema.type === 'number' || schema.type === 'integer') return 0;
  if (schema.type === 'boolean') return false;
  if (schema.type === 'array') return [];
  if (schema.type === 'object') return {};
  if (schema.type === 'null') return null;
  return null;
}

const SAMPLE_BODY_RE = /###\s*Sample Body\s*\n+```json\s*\n([\s\S]*?)```/i;

export function parseSampleBodyFromDocs(docs: string): JsonValue | null {
  const match = docs.match(SAMPLE_BODY_RE);
  if (!match) return null;
  try {
    return JSON.parse(match[1]) as JsonValue;
  } catch {
    return null;
  }
}

export function lookupInDocsValue(
  docsValue: JsonValue | null,
  fieldName: string,
): JsonValue | undefined {
  if (!docsValue || typeof docsValue !== 'object' || Array.isArray(docsValue)) {
    return undefined;
  }
  const obj = docsValue as { [k: string]: JsonValue };
  return fieldName in obj ? obj[fieldName] : undefined;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd scripts/bruno-sync && bun test __tests__/payload-sync/unit/example-extractor.test.ts 2>&1 | tail -10`

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/bruno-sync/payload-sync/example-extractor.ts \
        scripts/bruno-sync/__tests__/payload-sync/unit/example-extractor.test.ts
git commit -m "$(cat <<'EOF'
feat(bruno-sync): add example-extractor with priority chain

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Implement `payload-generator.ts` (TDD)

**Files:**
- Test: `scripts/bruno-sync/__tests__/payload-sync/unit/payload-generator.test.ts`
- Create: `scripts/bruno-sync/payload-sync/payload-generator.ts`

- [ ] **Step 1: Write failing tests**

Create `scripts/bruno-sync/__tests__/payload-sync/unit/payload-generator.test.ts`:

```ts
import { describe, it, expect } from 'bun:test';
import { generatePayload } from '../../../payload-sync/payload-generator';
import type { OpenApiDocument, OpenApiOperation, OpenApiSchema } from '../../../types';

const emptyDoc: OpenApiDocument = { paths: {}, components: { schemas: {} } };

function opWithSchema(schema: OpenApiSchema): OpenApiOperation {
  return {
    requestBody: { content: { 'application/json': { schema } } },
  };
}

describe('generatePayload', () => {
  it('returns top-level operation example verbatim when present', () => {
    const op: OpenApiOperation = {
      requestBody: {
        content: {
          'application/json': {
            schema: { type: 'object' },
            example: { whole: 'thing' },
          },
        },
      },
    };
    const r = generatePayload(op, emptyDoc, '');
    expect(r.value).toEqual({ whole: 'thing' });
  });

  it('builds object with all declared properties', () => {
    const op = opWithSchema({
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Alice' },
        age: { type: 'integer' },
        active: { type: 'boolean' },
      },
    });
    const r = generatePayload(op, emptyDoc, '');
    expect(r.value).toEqual({ name: 'Alice', age: 0, active: false });
  });

  it('uses property.example > default > enum[0] > type-default', () => {
    const op = opWithSchema({
      type: 'object',
      properties: {
        a: { type: 'string', example: 'X' },
        b: { type: 'string', default: 'Y' },
        c: { type: 'string', enum: ['P', 'Q'] },
        d: { type: 'string' },
      },
    });
    const r = generatePayload(op, emptyDoc, '');
    expect(r.value).toEqual({ a: 'X', b: 'Y', c: 'P', d: '' });
  });

  it('falls back to docs Sample Body when schema lacks examples', () => {
    const op = opWithSchema({
      type: 'object',
      properties: {
        name: { type: 'string' },
        code: { type: 'string' },
      },
    });
    const docs = '### Sample Body\n```json\n{ "name": "from-docs", "code": "ABC" }\n```\n';
    const r = generatePayload(op, emptyDoc, docs);
    expect(r.value).toEqual({ name: 'from-docs', code: 'ABC' });
  });

  it('populates one element for arrays named "add" with object items', () => {
    const op = opWithSchema({
      type: 'object',
      properties: {
        details: {
          type: 'object',
          properties: {
            store_requisition_detail: {
              type: 'object',
              properties: {
                add: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      qty: { type: 'integer' },
                      note: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    const r = generatePayload(op, emptyDoc, '');
    const v = r.value as Record<string, unknown>;
    const add = (((v.details as Record<string, unknown>).store_requisition_detail) as Record<string, unknown>).add;
    expect(Array.isArray(add)).toBe(true);
    expect((add as unknown[]).length).toBe(1);
    expect((add as { qty: number; note: string }[])[0]).toEqual({ qty: 0, note: '' });
  });

  it('non-add arrays default to empty array', () => {
    const op = opWithSchema({
      type: 'object',
      properties: {
        tags: { type: 'array', items: { type: 'string' } },
      },
    });
    const r = generatePayload(op, emptyDoc, '');
    expect(r.value).toEqual({ tags: [] });
  });

  it('respects format-specific defaults (date-time, uuid, email)', () => {
    const op = opWithSchema({
      type: 'object',
      properties: {
        when: { type: 'string', format: 'date-time' },
        id: { type: 'string', format: 'uuid' },
        contact: { type: 'string', format: 'email' },
      },
    });
    const r = generatePayload(op, emptyDoc, '');
    expect(r.value).toEqual({
      when: '2026-04-29T00:00:00.000Z',
      id: '',
      contact: 'user@example.com',
    });
  });

  it('returns null + warning when operation has no requestBody', () => {
    const r = generatePayload({}, emptyDoc, '');
    expect(r.value).toBeNull();
    expect(r.warnings.some((w) => /no requestBody/i.test(w))).toBe(true);
  });

  it('resolves $ref in property schemas', () => {
    const doc: OpenApiDocument = {
      paths: {},
      components: {
        schemas: {
          Foo: { type: 'string', example: 'foo-value' },
        },
      },
    };
    const op = opWithSchema({
      type: 'object',
      properties: { foo: { $ref: '#/components/schemas/Foo' } },
    });
    const r = generatePayload(op, doc, '');
    expect(r.value).toEqual({ foo: 'foo-value' });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd scripts/bruno-sync && bun test __tests__/payload-sync/unit/payload-generator.test.ts 2>&1 | tail -10`

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `payload-generator.ts`**

Create `scripts/bruno-sync/payload-sync/payload-generator.ts`:

```ts
import type {
  JsonValue,
  OpenApiDocument,
  OpenApiOperation,
  OpenApiSchema,
} from '../types';
import { resolveSchema } from './schema-resolver';
import {
  extractFromOperationLevel,
  extractFromSchema,
  formatDefault,
  parseSampleBodyFromDocs,
  lookupInDocsValue,
} from './example-extractor';

export interface GenerateResult {
  value: JsonValue | null;
  warnings: string[];
}

export function generatePayload(
  op: OpenApiOperation,
  doc: OpenApiDocument,
  docsBlock: string,
): GenerateResult {
  const warnings: string[] = [];

  // Top-level operation example wins outright.
  const top = extractFromOperationLevel(op);
  if (top !== null) return { value: top, warnings };

  const content = op.requestBody?.content?.['application/json'];
  if (!content || !content.schema) {
    warnings.push('operation has no requestBody schema');
    return { value: null, warnings };
  }

  const docsValue = parseSampleBodyFromDocs(docsBlock);
  const value = buildFromSchema(content.schema, doc, docsValue, '', warnings);
  return { value, warnings };
}

function buildFromSchema(
  schema: OpenApiSchema,
  doc: OpenApiDocument,
  docsValue: JsonValue | null,
  fieldKey: string,
  warnings: string[],
): JsonValue {
  const resolved = resolveSchema(schema, doc);
  warnings.push(...resolved.warnings);
  const s = resolved.schema;

  // 1. Schema example (top of priority chain for this field)
  const fromSchema = extractFromSchema(s);
  if (fromSchema !== undefined) return fromSchema;

  // 2. Object: walk properties
  if (s.type === 'object' || s.properties) {
    const out: { [k: string]: JsonValue } = {};
    const props = s.properties ?? {};
    for (const [key, propSchema] of Object.entries(props)) {
      const childDocs = lookupInDocsValue(docsValue, key) ?? null;
      out[key] = buildFromSchema(propSchema, doc, childDocs, key, warnings);
    }
    return out;
  }

  // 3. Array: special-case "add" arrays of objects
  if (s.type === 'array' && s.items) {
    const itemResolved = resolveSchema(s.items, doc);
    warnings.push(...itemResolved.warnings);
    const isAddArrayOfObjects =
      fieldKey === 'add' &&
      (itemResolved.schema.type === 'object' ||
        itemResolved.schema.properties !== undefined);
    if (isAddArrayOfObjects) {
      const childDocsArr =
        Array.isArray(docsValue) && docsValue.length > 0 ? docsValue[0] : null;
      const elem = buildFromSchema(s.items, doc, childDocsArr, '', warnings);
      return [elem];
    }
    return [];
  }

  // 4. Docs fallback for primitives that have no schema-level hints
  const fromDocs = docsValue;
  if (fromDocs !== null && typeof fromDocs !== 'object') {
    return fromDocs;
  }

  // 5. Type-based default
  return formatDefault(s);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd scripts/bruno-sync && bun test __tests__/payload-sync/unit/payload-generator.test.ts 2>&1 | tail -10`

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/bruno-sync/payload-sync/payload-generator.ts \
        scripts/bruno-sync/__tests__/payload-sync/unit/payload-generator.test.ts
git commit -m "$(cat <<'EOF'
feat(bruno-sync): add payload-generator with priority chain and details.add support

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Implement `body-block-writer.ts` (TDD)

**Files:**
- Test: `scripts/bruno-sync/__tests__/payload-sync/unit/body-block-writer.test.ts`
- Create: `scripts/bruno-sync/payload-sync/body-block-writer.ts`

- [ ] **Step 1: Write failing tests**

Create `scripts/bruno-sync/__tests__/payload-sync/unit/body-block-writer.test.ts`:

```ts
import { describe, it, expect } from 'bun:test';
import { replaceBodyJsonBlock } from '../../../payload-sync/body-block-writer';

const sample = `meta {
  name: Create x
  type: http
  seq: 3
}

post {
  url: {{host}}/api/x
  body: json
  auth: bearer
}

headers {
  x-app-id: {{x_app_id}}
  Content-Type: application/json
}

auth:bearer {
  token: {{access_token}}
}

body:json {
  {}
}

docs {
  ## docs preserved
}
`;

describe('replaceBodyJsonBlock', () => {
  it('replaces existing empty body:json with new payload', () => {
    const out = replaceBodyJsonBlock(sample, { name: 'Alice', age: 0 });
    expect(out).toContain('body:json {\n  {\n    "name": "Alice",\n    "age": 0\n  }\n}');
  });

  it('preserves meta, post, headers, auth and docs blocks verbatim', () => {
    const out = replaceBodyJsonBlock(sample, { name: 'X' });
    expect(out).toContain('## docs preserved');
    expect(out).toContain('  url: {{host}}/api/x');
    expect(out).toContain('Content-Type: application/json');
    expect(out).toContain('seq: 3');
  });

  it('inserts a body:json block after the headers block when none exists', () => {
    const noBody = `meta {
  name: x
}

post {
  url: {{host}}/api/x
  body: json
  auth: bearer
}

headers {
  x-app-id: {{x_app_id}}
}
`;
    const out = replaceBodyJsonBlock(noBody, { foo: 'bar' });
    expect(out).toContain('body:json {');
    expect(out).toContain('"foo": "bar"');
  });

  it('formats payload with two-space indent inside the block', () => {
    const out = replaceBodyJsonBlock(sample, { a: 1, b: { c: 2 } });
    // Outer object indented 2 spaces; inner object indented 4 spaces.
    expect(out).toContain('  {\n    "a": 1,');
    expect(out).toContain('    "b": {\n      "c": 2\n    }');
  });

  it('roundtrips: re-parsing replaced body via bru parser preserves payload', async () => {
    const { parseBruText } = await import('../../../generator/bru-parser');
    const out = replaceBodyJsonBlock(sample, { hello: 'world' });
    const parsed = parseBruText(out);
    expect(parsed.body_json).toContain('"hello": "world"');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd scripts/bruno-sync && bun test __tests__/payload-sync/unit/body-block-writer.test.ts 2>&1 | tail -10`

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `body-block-writer.ts`**

Create `scripts/bruno-sync/payload-sync/body-block-writer.ts`:

```ts
import type { JsonValue } from '../types';

const BODY_JSON_BLOCK_RE = /body:json\s*\{([\s\S]*?)\n\}/m;
const HEADERS_BLOCK_END_RE = /(headers\s*\{[\s\S]*?\n\})\s*\n/;

export function formatPayload(value: JsonValue): string {
  const json = JSON.stringify(value, null, 2);
  return json
    .split('\n')
    .map((line) => '  ' + line) // 2-space outer indent for body:json contents
    .join('\n');
}

export function replaceBodyJsonBlock(text: string, payload: JsonValue): string {
  const formatted = formatPayload(payload);
  const newBlock = `body:json {\n${formatted}\n}`;
  if (BODY_JSON_BLOCK_RE.test(text)) {
    return text.replace(BODY_JSON_BLOCK_RE, newBlock);
  }
  // No existing body:json block — insert after headers block
  const m = text.match(HEADERS_BLOCK_END_RE);
  if (m) {
    return text.replace(
      HEADERS_BLOCK_END_RE,
      `${m[1]}\n\n${newBlock}\n\n`,
    );
  }
  // Fallback: append at end
  return text.trimEnd() + '\n\n' + newBlock + '\n';
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd scripts/bruno-sync && bun test __tests__/payload-sync/unit/body-block-writer.test.ts 2>&1 | tail -10`

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/bruno-sync/payload-sync/body-block-writer.ts \
        scripts/bruno-sync/__tests__/payload-sync/unit/body-block-writer.test.ts
git commit -m "$(cat <<'EOF'
feat(bruno-sync): add body-block-writer that preserves non-body sections

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Implement `openapi-loader.ts` (TDD)

**Files:**
- Test: `scripts/bruno-sync/__tests__/payload-sync/unit/openapi-loader.test.ts`
- Create: `scripts/bruno-sync/payload-sync/openapi-loader.ts`

- [ ] **Step 1: Write failing tests**

Create `scripts/bruno-sync/__tests__/payload-sync/unit/openapi-loader.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync, utimesSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadOpenApi } from '../../../payload-sync/openapi-loader';

const tmpRoot = join(tmpdir(), `openapi-loader-${Date.now()}`);
const swaggerPath = join(tmpRoot, 'swagger.json');
const srcDir = join(tmpRoot, 'src');
const srcFile = join(srcDir, 'a.ts');

beforeAll(() => {
  mkdirSync(tmpRoot, { recursive: true });
  mkdirSync(srcDir, { recursive: true });
  writeFileSync(swaggerPath, JSON.stringify({ paths: { '/x': {} } }));
  writeFileSync(srcFile, 'x');
});

afterAll(() => {
  rmSync(tmpRoot, { recursive: true, force: true });
});

describe('loadOpenApi', () => {
  it('parses a valid swagger.json', () => {
    const r = loadOpenApi(swaggerPath, srcDir);
    expect(r.doc.paths['/x']).toBeDefined();
  });

  it('detects fresh swagger.json (mtime >= src mtime)', () => {
    const futureTime = new Date(Date.now() + 60_000);
    utimesSync(swaggerPath, futureTime, futureTime);
    const r = loadOpenApi(swaggerPath, srcDir);
    expect(r.stale).toBe(false);
  });

  it('detects stale swagger.json (mtime < src mtime)', () => {
    const pastTime = new Date(Date.now() - 60_000);
    utimesSync(swaggerPath, pastTime, pastTime);
    const futureTime = new Date(Date.now() + 60_000);
    utimesSync(srcFile, futureTime, futureTime);
    const r = loadOpenApi(swaggerPath, srcDir);
    expect(r.stale).toBe(true);
  });

  it('throws on missing swagger.json', () => {
    expect(() => loadOpenApi('/nonexistent/swagger.json', srcDir)).toThrow();
  });

  it('throws on invalid JSON', () => {
    const bad = join(tmpRoot, 'bad.json');
    writeFileSync(bad, '{ not valid');
    expect(() => loadOpenApi(bad, srcDir)).toThrow();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd scripts/bruno-sync && bun test __tests__/payload-sync/unit/openapi-loader.test.ts 2>&1 | tail -10`

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `openapi-loader.ts`**

Create `scripts/bruno-sync/payload-sync/openapi-loader.ts`:

```ts
import { readFileSync, statSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { OpenApiDocument } from '../types';

export interface LoadResult {
  doc: OpenApiDocument;
  stale: boolean;
  swaggerMtimeMs: number;
  newestSrcMtimeMs: number;
}

function newestMtime(dir: string): number {
  let newest = 0;
  const stack: string[] = [dir];
  while (stack.length > 0) {
    const cur = stack.pop()!;
    let entries: { name: string; isDirectory: () => boolean; isFile: () => boolean }[] = [];
    try {
      entries = readdirSync(cur, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      const full = join(cur, e.name);
      if (e.isDirectory()) {
        if (e.name === 'node_modules' || e.name === 'dist') continue;
        stack.push(full);
      } else if (e.isFile()) {
        try {
          const st = statSync(full);
          if (st.mtimeMs > newest) newest = st.mtimeMs;
        } catch {
          // ignore
        }
      }
    }
  }
  return newest;
}

export function loadOpenApi(swaggerPath: string, gatewaySrcDir: string): LoadResult {
  const text = readFileSync(swaggerPath, 'utf8');
  const doc = JSON.parse(text) as OpenApiDocument;
  if (!doc.paths || typeof doc.paths !== 'object') {
    throw new Error(`invalid OpenAPI document at ${swaggerPath}: missing paths`);
  }
  const swaggerMtimeMs = statSync(swaggerPath).mtimeMs;
  const newestSrcMtimeMs = newestMtime(gatewaySrcDir);
  return {
    doc,
    stale: newestSrcMtimeMs > swaggerMtimeMs,
    swaggerMtimeMs,
    newestSrcMtimeMs,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd scripts/bruno-sync && bun test __tests__/payload-sync/unit/openapi-loader.test.ts 2>&1 | tail -10`

Expected: 5 pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/bruno-sync/payload-sync/openapi-loader.ts \
        scripts/bruno-sync/__tests__/payload-sync/unit/openapi-loader.test.ts
git commit -m "$(cat <<'EOF'
feat(bruno-sync): add openapi-loader with staleness check

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Implement `reporter.ts` (TDD)

**Files:**
- Test: `scripts/bruno-sync/__tests__/payload-sync/unit/reporter.test.ts`
- Create: `scripts/bruno-sync/payload-sync/reporter.ts`

- [ ] **Step 1: Write failing tests**

Create `scripts/bruno-sync/__tests__/payload-sync/unit/reporter.test.ts`:

```ts
import { describe, it, expect } from 'bun:test';
import { formatReport } from '../../../payload-sync/reporter';
import type { PayloadSyncReport } from '../../../types';

describe('formatReport', () => {
  it('shows counts for each status', () => {
    const report: PayloadSyncReport = {
      dryRun: true,
      staleOpenapi: false,
      results: [
        { filePath: '/a', relativePath: 'a.bru', status: 'UPDATED', warnings: [] },
        { filePath: '/b', relativePath: 'b.bru', status: 'UPDATED', warnings: [] },
        { filePath: '/c', relativePath: 'c.bru', status: 'SKIPPED_NOT_EMPTY', warnings: [] },
        { filePath: '/d', relativePath: 'd.bru', status: 'NO_MATCH', warnings: ['x'] },
      ],
    };
    const out = formatReport(report, false);
    expect(out).toContain('Updated:');
    expect(out).toContain('2 files');
    expect(out).toContain('Skipped:');
    expect(out).toContain('No match:');
    expect(out).toContain('Warnings:');
  });

  it('lists updated paths', () => {
    const report: PayloadSyncReport = {
      dryRun: false,
      staleOpenapi: false,
      results: [
        { filePath: '/a', relativePath: 'updated.bru', status: 'UPDATED', warnings: [] },
      ],
    };
    const out = formatReport(report, false);
    expect(out).toContain('updated.bru');
  });

  it('mentions DRY RUN header when dryRun is true', () => {
    const report: PayloadSyncReport = {
      dryRun: true,
      staleOpenapi: false,
      results: [],
    };
    const out = formatReport(report, false);
    expect(out).toContain('DRY RUN');
  });

  it('shows stale OpenAPI warning', () => {
    const report: PayloadSyncReport = {
      dryRun: false,
      staleOpenapi: true,
      results: [],
    };
    const out = formatReport(report, false);
    expect(out).toContain('stale');
  });

  it('hides skipped file lists by default; shows them in verbose', () => {
    const report: PayloadSyncReport = {
      dryRun: false,
      staleOpenapi: false,
      results: [
        { filePath: '/a', relativePath: 'a.bru', status: 'SKIPPED_NOT_EMPTY', warnings: [] },
      ],
    };
    const normal = formatReport(report, false);
    const verbose = formatReport(report, true);
    expect(normal.includes('a.bru')).toBe(false);
    expect(verbose.includes('a.bru')).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd scripts/bruno-sync && bun test __tests__/payload-sync/unit/reporter.test.ts 2>&1 | tail -10`

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `reporter.ts`**

Create `scripts/bruno-sync/payload-sync/reporter.ts`:

```ts
import type { PayloadSyncReport, PayloadSyncResult, PayloadSyncStatus } from '../types';

function group(
  results: PayloadSyncResult[],
  status: PayloadSyncStatus,
): PayloadSyncResult[] {
  return results.filter((r) => r.status === status);
}

function listSection(title: string, items: PayloadSyncResult[]): string {
  if (items.length === 0) return '';
  const lines = [`${title}:`];
  for (const r of items) {
    const w = r.warnings.length > 0 ? ` — ${r.warnings.join('; ')}` : '';
    lines.push(`  ${r.relativePath}${w}`);
  }
  return lines.join('\n');
}

export function formatReport(report: PayloadSyncReport, verbose: boolean): string {
  const updated = group(report.results, 'UPDATED');
  const skippedEmpty = group(report.results, 'SKIPPED_NOT_EMPTY');
  const skippedNoBody = group(report.results, 'SKIPPED_NO_BODY');
  const skippedNonJson = group(report.results, 'SKIPPED_NON_JSON_BODY');
  const noMatch = group(report.results, 'NO_MATCH');
  const noBody = group(report.results, 'NO_REQUEST_BODY');
  const warnings = report.results.filter((r) => r.warnings.length > 0);

  const lines: string[] = [];
  lines.push(`Bruno Payload Sync${report.dryRun ? ' — DRY RUN' : ''}`);
  if (report.staleOpenapi) {
    lines.push('WARNING: swagger.json is older than gateway src — rebuild gateway first.');
  }
  lines.push('');
  lines.push(`Updated:    ${updated.length} files${report.dryRun ? '       (would write)' : '       (wrote)'}`);
  lines.push(`Skipped:    ${skippedEmpty.length + skippedNoBody.length + skippedNonJson.length} files       (preserved)`);
  lines.push(`No match:   ${noMatch.length} files       (gateway operation missing)`);
  lines.push(`No body:    ${noBody.length} files       (operation has no requestBody)`);
  lines.push(`Warnings:   ${warnings.length} files       (review)`);

  const sections: string[] = [
    listSection('Updated files', updated),
    listSection('Warnings', warnings),
    listSection('No match', noMatch),
  ];
  if (verbose) {
    sections.push(
      listSection('Skipped (body not empty)', skippedEmpty),
      listSection('Skipped (no body declared)', skippedNoBody),
      listSection('Skipped (non-JSON body)', skippedNonJson),
      listSection('No requestBody', noBody),
    );
  }
  for (const s of sections) {
    if (s) {
      lines.push('');
      lines.push(s);
    }
  }
  if (report.dryRun && updated.length > 0) {
    lines.push('');
    lines.push('Run with --apply to write changes.');
  }
  return lines.join('\n');
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd scripts/bruno-sync && bun test __tests__/payload-sync/unit/reporter.test.ts 2>&1 | tail -10`

Expected: 5 pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/bruno-sync/payload-sync/reporter.ts \
        scripts/bruno-sync/__tests__/payload-sync/unit/reporter.test.ts
git commit -m "$(cat <<'EOF'
feat(bruno-sync): add reporter for payload sync results

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Wire up CLI entry-point `payloads.ts` + integration test

**Files:**
- Test: `scripts/bruno-sync/__tests__/payload-sync/integration/full-pipeline.test.ts`
- Test fixtures: `scripts/bruno-sync/__tests__/payload-sync/fixtures/openapi/simple.json`, `fixtures/bruno/*.bru`
- Create: `scripts/bruno-sync/payloads.ts`

- [ ] **Step 1: Create test fixtures**

Create `scripts/bruno-sync/__tests__/payload-sync/fixtures/openapi/simple.json`:

```json
{
  "openapi": "3.0.0",
  "paths": {
    "/api/{bu_code}/credit-term": {
      "post": {
        "operationId": "createCreditTerm",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/CreateCreditTermDto"
              }
            }
          }
        }
      }
    },
    "/api/auth/login": {
      "post": {
        "operationId": "login",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "email": { "type": "string", "format": "email" },
                  "password": { "type": "string", "minLength": 6 }
                },
                "required": ["email", "password"]
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "CreateCreditTermDto": {
        "type": "object",
        "properties": {
          "name": { "type": "string", "example": "Net 30" },
          "code": { "type": "string", "example": "N30" },
          "is_active": { "type": "boolean", "default": true }
        },
        "required": ["name", "code"]
      }
    }
  }
}
```

Create `scripts/bruno-sync/__tests__/payload-sync/fixtures/bruno/empty-body.bru`:

```
meta {
  name: Create credit-term
  type: http
  seq: 3
}

post {
  url: {{host}}/api/{{bu_code}}/credit-term
  body: json
  auth: bearer
}

headers {
  x-app-id: {{x_app_id}}
  Content-Type: application/json
}

body:json {
  {}
}

docs {
  ## Create
}
```

Create `scripts/bruno-sync/__tests__/payload-sync/fixtures/bruno/populated-body.bru`:

```
meta {
  name: Login
  type: http
  seq: 1
}

post {
  url: {{host}}/api/auth/login
  body: json
  auth: none
}

headers {
  Content-Type: application/json
}

body:json {
  {
    "email": "custom@example.com",
    "password": "custom-pw"
  }
}
```

Create `scripts/bruno-sync/__tests__/payload-sync/fixtures/bruno/no-match.bru`:

```
meta {
  name: Zombie
  type: http
  seq: 99
}

post {
  url: {{host}}/api/zombie
  body: json
  auth: bearer
}

headers {
  x-app-id: {{x_app_id}}
}

body:json {
  {}
}
```

- [ ] **Step 2: Write failing integration test**

Create `scripts/bruno-sync/__tests__/payload-sync/integration/full-pipeline.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, copyFileSync, readFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { runPayloadSync } from '../../../payloads';

const fixturesDir = join(import.meta.dir, '..', 'fixtures');
const openapiFixture = join(fixturesDir, 'openapi', 'simple.json');

let tmpBruno: string;

beforeEach(() => {
  tmpBruno = join(tmpdir(), `payload-sync-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(tmpBruno, { recursive: true });
  for (const f of ['empty-body.bru', 'populated-body.bru', 'no-match.bru']) {
    copyFileSync(join(fixturesDir, 'bruno', f), join(tmpBruno, f));
  }
});

afterEach(() => {
  rmSync(tmpBruno, { recursive: true, force: true });
});

describe('runPayloadSync (integration)', () => {
  it('updates empty body, skips populated, reports no-match (dry run)', async () => {
    const report = await runPayloadSync({
      brunoRoot: tmpBruno,
      swaggerPath: openapiFixture,
      gatewaySrcDir: dirname(openapiFixture),
      apply: false,
      verbose: true,
    });
    const byName = (n: string) => report.results.find((r) => r.relativePath.endsWith(n))!;
    expect(byName('empty-body.bru').status).toBe('UPDATED');
    expect(byName('populated-body.bru').status).toBe('SKIPPED_NOT_EMPTY');
    expect(byName('no-match.bru').status).toBe('NO_MATCH');
  });

  it('does not write files when dry run', async () => {
    const before = readFileSync(join(tmpBruno, 'empty-body.bru'), 'utf8');
    await runPayloadSync({
      brunoRoot: tmpBruno,
      swaggerPath: openapiFixture,
      gatewaySrcDir: dirname(openapiFixture),
      apply: false,
      verbose: false,
    });
    const after = readFileSync(join(tmpBruno, 'empty-body.bru'), 'utf8');
    expect(after).toBe(before);
  });

  it('writes files when apply=true', async () => {
    await runPayloadSync({
      brunoRoot: tmpBruno,
      swaggerPath: openapiFixture,
      gatewaySrcDir: dirname(openapiFixture),
      apply: true,
      verbose: false,
    });
    const after = readFileSync(join(tmpBruno, 'empty-body.bru'), 'utf8');
    expect(after).toContain('"name": "Net 30"');
    expect(after).toContain('"code": "N30"');
    expect(after).toContain('"is_active": true');
  });

  it('is idempotent: second run produces 0 UPDATED', async () => {
    await runPayloadSync({
      brunoRoot: tmpBruno,
      swaggerPath: openapiFixture,
      gatewaySrcDir: dirname(openapiFixture),
      apply: true,
      verbose: false,
    });
    const second = await runPayloadSync({
      brunoRoot: tmpBruno,
      swaggerPath: openapiFixture,
      gatewaySrcDir: dirname(openapiFixture),
      apply: true,
      verbose: false,
    });
    const updated = second.results.filter((r) => r.status === 'UPDATED');
    expect(updated.length).toBe(0);
  });

  it('preserves docs and headers blocks byte-identical except body', async () => {
    const before = readFileSync(join(tmpBruno, 'empty-body.bru'), 'utf8');
    await runPayloadSync({
      brunoRoot: tmpBruno,
      swaggerPath: openapiFixture,
      gatewaySrcDir: dirname(openapiFixture),
      apply: true,
      verbose: false,
    });
    const after = readFileSync(join(tmpBruno, 'empty-body.bru'), 'utf8');
    expect(after).toContain('## Create');
    expect(after).toContain('Content-Type: application/json');
    expect(after).toContain('seq: 3');
    expect(before).not.toBe(after);
  });
});
```

- [ ] **Step 3: Run integration test to verify it fails**

Run: `cd scripts/bruno-sync && bun test __tests__/payload-sync/integration/ 2>&1 | tail -10`

Expected: FAIL — `runPayloadSync` not exported from `payloads.ts`.

- [ ] **Step 4: Implement `payloads.ts`**

Create `scripts/bruno-sync/payloads.ts`:

```ts
#!/usr/bin/env bun
import { readdir } from 'node:fs/promises';
import { writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { GATEWAY_SRC, BRUNO_ROOT } from './config';
import { parseBruText } from './generator/bru-parser';
import { loadOpenApi } from './payload-sync/openapi-loader';
import { matchOperation } from './payload-sync/operation-matcher';
import { generatePayload } from './payload-sync/payload-generator';
import { isEmptyBody } from './payload-sync/empty-body-detector';
import { replaceBodyJsonBlock } from './payload-sync/body-block-writer';
import { formatReport } from './payload-sync/reporter';
import type { PayloadSyncReport, PayloadSyncResult } from './types';

const SWAGGER_PATH = join(process.cwd(), 'apps/backend-gateway/swagger.json');

export interface RunOptions {
  brunoRoot: string;
  swaggerPath: string;
  gatewaySrcDir: string;
  apply: boolean;
  verbose: boolean;
}

async function walk(dir: string, out: string[] = []): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === '_archived' || e.name === 'environments' || e.name === 'auth') continue;
      await walk(full, out);
    } else if (e.isFile() && e.name.endsWith('.bru') && e.name !== 'folder.bru') {
      out.push(full);
    }
  }
  return out;
}

export async function runPayloadSync(opts: RunOptions): Promise<PayloadSyncReport> {
  const loaded = loadOpenApi(opts.swaggerPath, opts.gatewaySrcDir);
  const files = await walk(opts.brunoRoot);
  const results: PayloadSyncResult[] = [];

  for (const file of files) {
    const relPath = relative(opts.brunoRoot, file);
    const text = await Bun.file(file).text();
    const sections = parseBruText(text);

    if (!sections.method) continue;
    if (sections.body_json === undefined) {
      // No body block AND method is GET/DELETE => skip silently.
      const method = sections.method.verb.toUpperCase();
      if (method === 'GET' || method === 'DELETE' || method === 'HEAD' || method === 'OPTIONS') continue;
      results.push({
        filePath: file,
        relativePath: relPath,
        status: 'SKIPPED_NO_BODY',
        warnings: [],
      });
      continue;
    }

    if (!isEmptyBody(sections.body_json)) {
      results.push({
        filePath: file,
        relativePath: relPath,
        status: 'SKIPPED_NOT_EMPTY',
        warnings: [],
      });
      continue;
    }

    const urlMatch = sections.method.body.match(/^\s*url:\s*(\S+)/m);
    if (!urlMatch) {
      results.push({
        filePath: file,
        relativePath: relPath,
        status: 'SKIPPED_NO_BODY',
        warnings: ['no url in method block'],
      });
      continue;
    }
    const url = urlMatch[1];
    const matched = matchOperation(loaded.doc, sections.method.verb, url);
    if (!matched.operation) {
      results.push({
        filePath: file,
        relativePath: relPath,
        status: 'NO_MATCH',
        warnings: matched.reason ? [matched.reason] : [],
      });
      continue;
    }

    const generated = generatePayload(matched.operation, loaded.doc, sections.docs ?? '');
    if (generated.value === null) {
      results.push({
        filePath: file,
        relativePath: relPath,
        status: 'NO_REQUEST_BODY',
        warnings: generated.warnings,
      });
      continue;
    }

    const newText = replaceBodyJsonBlock(text, generated.value);
    if (opts.apply) {
      writeFileSync(file, newText, 'utf8');
    }
    results.push({
      filePath: file,
      relativePath: relPath,
      status: 'UPDATED',
      warnings: generated.warnings,
      before: text,
      after: newText,
    });
  }

  return {
    results,
    staleOpenapi: loaded.stale,
    dryRun: !opts.apply,
  };
}

interface CliFlags {
  apply: boolean;
  verbose: boolean;
}

function parseArgs(argv: string[]): CliFlags {
  return {
    apply: argv.includes('--apply'),
    verbose: argv.includes('--verbose'),
  };
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const report = await runPayloadSync({
    brunoRoot: BRUNO_ROOT,
    swaggerPath: SWAGGER_PATH,
    gatewaySrcDir: GATEWAY_SRC,
    apply: flags.apply,
    verbose: flags.verbose,
  });
  console.log(formatReport(report, flags.verbose));
}

if (import.meta.main) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
```

- [ ] **Step 5: Run integration test to verify it passes**

Run: `cd scripts/bruno-sync && bun test __tests__/payload-sync/integration/ 2>&1 | tail -15`

Expected: 5 pass.

- [ ] **Step 6: Run full payload-sync test suite**

Run: `cd scripts/bruno-sync && bun test __tests__/payload-sync/ 2>&1 | tail -10`

Expected: all unit + integration tests pass.

- [ ] **Step 7: Commit**

```bash
git add scripts/bruno-sync/payloads.ts \
        scripts/bruno-sync/__tests__/payload-sync/integration/full-pipeline.test.ts \
        scripts/bruno-sync/__tests__/payload-sync/fixtures/
git commit -m "$(cat <<'EOF'
feat(bruno-sync): add payloads CLI entry-point and integration tests

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: Add npm scripts and run dry-run on real collection

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add scripts to root `package.json`**

Open `package.json` (root). Find the `"scripts"` block (look for the existing `bruno:sync` and `bruno:sync:dry` lines). Add two lines next to them:

```jsonc
"bruno:sync:payloads": "bun run scripts/bruno-sync/payloads.ts --apply",
"bruno:sync:payloads:dry": "bun run scripts/bruno-sync/payloads.ts",
```

Final ordering should keep all four `bruno:*` keys grouped.

- [ ] **Step 2: Verify the scripts are callable**

Run: `bun run bruno:sync:payloads:dry --verbose 2>&1 | head -40`

Expected: prints `Bruno Payload Sync — DRY RUN`, summary counts, and either Updated/Warnings/No match sections. Exit code 0.

If the script errors, debug before continuing.

- [ ] **Step 3: Commit `package.json` change**

```bash
git add package.json
git commit -m "$(cat <<'EOF'
chore(bruno-sync): add npm scripts for payload sync

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: Spot-check generated payloads, fix issues, then apply

**Files:** none modified directly in this task — only `.bru` files via the apply step.

- [ ] **Step 1: Re-run dry-run and inspect output across all domains**

Run: `bun run bruno:sync:payloads:dry --verbose 2>&1 | tee /tmp/payload-sync-dryrun.log`

Inspect `/tmp/payload-sync-dryrun.log`:
- Confirm `Updated:` count > 0 (expect dozens)
- `No match:` should be empty or only legitimately orphan files (not real endpoints)
- `Warnings:` should be reviewable — read each one

- [ ] **Step 2: Pick one updated file per domain and verify the rendered body**

For each of: `auth`, `config`, `inventory`, `master-data`, `procurement`, `platform`, `user-management`, `documents-and-reports`, `my-pending`:

a. Find one updated path in the log under that domain.
b. View the diff: `bun run bruno:sync:payloads:dry --verbose 2>&1 | grep -A 20 '<file path>'` is not enough — instead run apply later and use `git diff <file>` to inspect.

Defer full inspection to step 4 after applying.

- [ ] **Step 3: Apply changes**

Run: `bun run bruno:sync:payloads --verbose 2>&1 | tail -30`

Expected: `(wrote)` instead of `(would write)`. Same counts as dry-run.

- [ ] **Step 4: Inspect git diff per domain**

For each domain, view a sampled diff:

```bash
git diff -- 'apps/bruno/carmen-inventory/auth/*.bru' | head -60
git diff -- 'apps/bruno/carmen-inventory/config/credit-term/*.bru' | head -60
git diff -- 'apps/bruno/carmen-inventory/config/currencies/*.bru' | head -60
git diff -- 'apps/bruno/carmen-inventory/config/products/*.bru' | head -60
git diff -- 'apps/bruno/carmen-inventory/master-data/**/*.bru' | head -60
git diff -- 'apps/bruno/carmen-inventory/procurement/**/*.bru' | head -60
git diff -- 'apps/bruno/carmen-inventory/inventory/**/*.bru' | head -60
git diff -- 'apps/bruno/carmen-inventory/platform/**/*.bru' | head -60
git diff -- 'apps/bruno/carmen-inventory/user-management/**/*.bru' | head -60
```

For each diff, verify:
- Only the `body:json { ... }` block changed; no other lines moved
- Field names match the DTO
- Nested `details.<x>.add` arrays contain exactly one populated element
- Date-time fields use `2026-04-29T00:00:00.000Z`
- Email fields use `user@example.com`

- [ ] **Step 5: Run idempotency check**

Run: `bun run bruno:sync:payloads:dry 2>&1 | grep '^Updated:'`

Expected: `Updated: 0 files (would write)` — confirms (b) overwrite-only-when-empty rule + idempotency.

- [ ] **Step 6: Commit applied changes**

```bash
git add apps/bruno/carmen-inventory/
git commit -m "$(cat <<'EOF'
chore(bruno): sync sample payloads from OpenAPI spec

Generated by bun run bruno:sync:payloads. Fills empty body:json blocks
across all domains using examples from apps/backend-gateway/swagger.json.
Non-empty bodies are preserved.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 13: Manual smoke test against running gateway (optional but recommended)

**Files:** none modified.

- [ ] **Step 1: Start the gateway**

Run (in a separate terminal): `cd apps/backend-gateway && bun run dev`

Wait for `Application is running on: http://[::1]:4000`.

- [ ] **Step 2: Open Bruno, load `localhost-4000` environment, log in via auth/01 - Login**

Verify `access_token` env var is set after the login response.

- [ ] **Step 3: Pick one updated POST/PATCH per domain and Send**

For each of the 9 domains, open one freshly-populated `.bru` file:
- Confirm Bruno parses the body block (no syntax error indicator).
- Click Send.
- Expect: HTTP 2xx (success) OR 4xx (validation error) with a JSON body. Anything else = bug.

If any file errors with 5xx due to malformed JSON → re-open the file, find the issue, and either:
- File a follow-up bug for the payload-generator
- Edit the file by hand (it's now non-empty so further `bruno:sync:payloads` runs leave it alone)

---

## Task 14: Update documentation

**Files:**
- Modify: `scripts/bruno-sync/README.md`
- Modify: `CLAUDE.md` (root)

- [ ] **Step 1: Update `scripts/bruno-sync/README.md`**

Open `scripts/bruno-sync/README.md`. Replace the content with:

```markdown
# bruno-sync

Reconciles `apps/bruno/carmen-inventory/` with gateway controllers.

## Reconciliation (add / update / archive .bru files)

```bash
bun run bruno:sync           # apply changes
bun run bruno:sync:dry       # preview only
bun run scripts/bruno-sync/index.ts --verbose
```

See `docs/superpowers/specs/2026-04-22-bruno-sync-design.md` for design.

## Payload sync (fill body:json from Swagger)

Reads `apps/backend-gateway/swagger.json` and fills empty `body:json { {} }` blocks
in `.bru` files with sample payloads. Non-empty bodies are preserved.

```bash
bun run bruno:sync:payloads:dry     # preview
bun run bruno:sync:payloads         # apply
bun run scripts/bruno-sync/payloads.ts --apply --verbose
```

Workflow:
1. Edit a DTO in `apps/backend-gateway/src/`.
2. Restart gateway dev to regenerate `swagger.json`.
3. Run `bun run bruno:sync:payloads:dry` to preview, then `bun run bruno:sync:payloads`.
4. Commit `.bru` changes alongside the DTO change.

If `swagger.json` is older than gateway src, the tool prints a warning but still runs.

See `docs/superpowers/specs/2026-04-29-bruno-payload-sync-design.md` for design.
```

- [ ] **Step 2: Update root `CLAUDE.md` Bruno API Collections section**

Open `CLAUDE.md`. Find the `### Syncing with gateway` subsection under `## Bruno API Collections`. After the existing paragraph, append:

```markdown

To sync sample request bodies from Swagger into `.bru` files, run `bun run bruno:sync:payloads`. This fills empty `body:json` blocks from `apps/backend-gateway/swagger.json`; non-empty bodies are preserved. Use `bun run bruno:sync:payloads:dry` to preview. See `scripts/bruno-sync/README.md` for details.
```

- [ ] **Step 3: Commit docs updates**

```bash
git add scripts/bruno-sync/README.md CLAUDE.md
git commit -m "$(cat <<'EOF'
docs(bruno-sync): document payload sync command and workflow

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 15: Final verification

- [ ] **Step 1: Run full bruno-sync test suite**

Run: `cd scripts/bruno-sync && bun test 2>&1 | tail -15`

Expected: all original `bruno-sync` tests + all new `payload-sync` tests pass.

- [ ] **Step 2: Idempotency final check**

Run: `bun run bruno:sync:payloads:dry 2>&1 | grep -E '(Updated|Warnings):'`

Expected: `Updated: 0 files (would write)` — proves the apply did not leave anything inconsistent.

- [ ] **Step 3: Lint and type-check (if configured)**

Run: `bun run lint 2>&1 | tail -10` and `bun run check-types 2>&1 | tail -10` if those scripts exist for the bruno-sync directory's tsconfig scope.

If they error on new files, fix and amend the most recent commit.

- [ ] **Step 4: Push and open PR**

```bash
git log --oneline -16
```

Verify all 15 commits are present (one per task above, ~15 commits including this task's lint/typecheck fixes if any).

Open a PR titled `feat(bruno-sync): sync sample payloads from OpenAPI spec` with body that links to:
- `docs/superpowers/specs/2026-04-29-bruno-payload-sync-design.md`
- `docs/superpowers/plans/2026-04-29-bruno-payload-sync.md`

---

## Self-Review Checklist (verified during plan writing)

**Spec coverage:** Every section of the spec maps to tasks:
- §4 Architecture → Tasks 10, 11
- §5 Components → Tasks 2–9 (one task per module)
- §6 Data Flow + Path Normalisation + Empty Body Detection + Priority Chain → Tasks 2, 3, 6
- §7 Edge Cases (details.add, oneOf, allOf, circular, format defaults, idempotency) → Tasks 4, 5, 6, 10
- §8 Error Handling → Tasks 8 (loader), 9 (reporter)
- §9 Reporter Output → Task 9
- §10 Testing → all TDD tasks
- §12 Rollout → Tasks 11, 12, 13, 14
- §13 Open Questions → none

**Placeholder scan:** No "TBD", "TODO", "implement later". Every step contains executable code or a concrete command.

**Type consistency:** Names cross-checked: `runPayloadSync`, `loadOpenApi`, `matchOperation`, `resolveSchema`, `extractFromSchema`, `formatDefault`, `parseSampleBodyFromDocs`, `lookupInDocsValue`, `isEmptyBody`, `replaceBodyJsonBlock`, `formatReport`, `generatePayload`, `formatPayload`. All exports used in later tasks match definitions in earlier tasks.
