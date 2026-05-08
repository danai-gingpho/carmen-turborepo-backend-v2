# Bruno Sync Tool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a repeatable TypeScript/Bun tool at `scripts/bruno-sync/` that reconciles `apps/bruno/carmen-inventory/` with gateway controllers — generating, updating, and archiving `.bru` files based on controller AST parsing, while preserving environments, auth, and user scripts.

**Architecture:** Three layers — **parser** (ts-morph → endpoint metadata), **reconciler** (diff gateway × existing Bruno → plan of NEW/UPDATE/ORPHAN), **generator** (metadata + existing sections → `.bru` file content). CLI orchestrates with `--dry-run` and `--verbose` flags. Orphans move to `_archived/<date>/` instead of being deleted. Business-domain folder taxonomy (`procurement/`, `inventory/`, etc.) is preserved by discovering each module's existing location before writing.

**Tech Stack:** TypeScript, Bun runtime, `ts-morph` for AST, `bun:test` for tests, custom `.bru` parser/writer (plain-text format).

**Reference spec:** `docs/superpowers/specs/2026-04-22-bruno-sync-design.md`

---

## File Structure

```
scripts/bruno-sync/
├── index.ts                      # CLI entry
├── config.ts                     # paths, preserved dirs, mapping rules
├── types.ts                      # shared TypeScript types
├── parser/
│   ├── controller.ts             # controller AST → endpoint metadata
│   ├── dto.ts                    # DTO class → body schema
│   └── global-prefix.ts          # read main.ts → prefix (currently none)
├── generator/
│   ├── bru-writer.ts             # endpoint → .bru text
│   ├── bru-parser.ts             # existing .bru → section map
│   └── folder-mapper.ts          # module → Bruno folder (domain-aware)
├── reconciler/
│   ├── diff.ts                   # gateway × Bruno → NEW/UPDATE/ORPHAN
│   ├── merger.ts                 # preserve vars/scripts/tests on UPDATE
│   └── archiver.ts               # move orphans → _archived/
├── __tests__/
│   ├── controller-parser.test.ts
│   ├── dto-parser.test.ts
│   ├── bru-parser.test.ts
│   ├── bru-writer.test.ts
│   ├── folder-mapper.test.ts
│   ├── merger.test.ts
│   └── diff.test.ts
└── README.md                     # tool usage

Also:
- Root `package.json`: add `bruno:sync` and `bruno:sync:dry` scripts.
- Delete `scripts/generate-bruno.py` (superseded).
- Update `CLAUDE.md`: add tool to "Agent-specific commands".
```

---

### Task 1: Project scaffold & dependencies

**Files:**
- Create: `scripts/bruno-sync/types.ts`
- Create: `scripts/bruno-sync/config.ts`
- Create: `scripts/bruno-sync/README.md`
- Modify: `package.json` (add `ts-morph` devDep + scripts)

- [ ] **Step 1: Add ts-morph to root devDependencies**

Run:
```bash
bun add -d ts-morph@^24.0.0
```

Expected: `package.json` updated, `bun.lock` updated. If `ts-morph` v24 is not available, use the latest minor released as of plan date.

- [ ] **Step 2: Add npm scripts**

Edit `package.json`, inside `"scripts"` object:

```json
"bruno:sync": "bun run scripts/bruno-sync/index.ts",
"bruno:sync:dry": "bun run scripts/bruno-sync/index.ts --dry-run"
```

Insert alphabetically near existing `build` / `clear`.

- [ ] **Step 3: Create shared types**

Create `scripts/bruno-sync/types.ts`:

```ts
export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface EndpointMeta {
  module: string;          // e.g. "application/good-received-note"
  moduleSlug: string;      // e.g. "good-received-note" (used for folder resolution)
  controllerPath: string;
  method: HttpMethod;
  methodPath: string;
  fullPath: string;        // normalized: "/api/good-received-note/:id"
  methodName: string;      // e.g. "findOne"
  pathParams: string[];
  queryParams: string[];
  bodyDto?: string;
  isPublic: boolean;
  sourceFile: string;      // absolute path of .controller.ts
}

export interface BodySchema {
  kind: 'class' | 'zod' | 'unknown';
  dtoName: string;
  skeleton: Record<string, unknown> | unknown[];
  warnings: string[];
}

export interface BruSections {
  meta?: Record<string, string>;
  method?: { verb: string; body: string };
  headers?: string;
  auth?: Record<string, string>;
  query?: string;
  body_json?: string;
  vars_pre_request?: string;
  vars_post_response?: string;
  script_pre_request?: string;
  script_post_response?: string;
  tests?: string;
  docs?: string;
  unknown: Record<string, string>; // preserve unrecognized sections
}

export interface BruFile {
  path: string;            // absolute
  relativePath: string;    // relative to Bruno collection root
  sections: BruSections;
}

export interface DiffResult {
  created: { endpoint: EndpointMeta; targetPath: string }[];
  updated: { endpoint: EndpointMeta; bru: BruFile }[];
  orphaned: BruFile[];
  warnings: string[];
}

export interface SyncReport {
  addedCount: number;
  updatedCount: number;
  archivedCount: number;
  warnings: string[];
  parseErrors: string[];
  dryRun: boolean;
}
```

- [ ] **Step 4: Create config constants**

Create `scripts/bruno-sync/config.ts`:

```ts
import { join } from 'node:path';

export const REPO_ROOT = process.cwd();
export const GATEWAY_SRC = join(REPO_ROOT, 'apps/backend-gateway/src');
export const GATEWAY_MAIN = join(GATEWAY_SRC, 'main.ts');
export const GATEWAY_SCAN_DIRS = ['application', 'config', 'platform'] as const;

export const BRUNO_ROOT = join(REPO_ROOT, 'apps/bruno/carmen-inventory');
export const BRUNO_ARCHIVE_DIR = join(BRUNO_ROOT, '_archived');
export const BRUNO_UNCATEGORIZED_DIR = join(BRUNO_ROOT, '_uncategorized');

export const BRUNO_PRESERVED_DIRS = [
  'environments',
  'auth',
  '_archived',
] as const;

export const BRUNO_PRESERVED_FILES = ['bruno.json'] as const;

export const DTO_MAX_DEPTH = 3;
```

- [ ] **Step 5: Add README**

Create `scripts/bruno-sync/README.md`:

````markdown
# bruno-sync

Reconciles `apps/bruno/carmen-inventory/` with gateway controllers.

## Usage

```bash
bun run bruno:sync           # apply changes
bun run bruno:sync:dry       # preview only
bun run scripts/bruno-sync/index.ts --verbose
```

See `docs/superpowers/specs/2026-04-22-bruno-sync-design.md` for design.
````

- [ ] **Step 6: Verify**

Run:
```bash
bun install && grep -q "ts-morph" package.json && grep -q "bruno:sync" package.json && echo OK
```

Expected: `OK`.

- [ ] **Step 7: Commit**

```bash
git add package.json bun.lock scripts/bruno-sync/types.ts scripts/bruno-sync/config.ts scripts/bruno-sync/README.md
git commit -m "chore(bruno-sync): scaffold project with ts-morph and shared types"
```

---

### Task 2: Global-prefix parser (with test)

**Files:**
- Create: `scripts/bruno-sync/parser/global-prefix.ts`
- Create: `scripts/bruno-sync/__tests__/global-prefix.test.ts`

- [ ] **Step 1: Write failing test**

Create `scripts/bruno-sync/__tests__/global-prefix.test.ts`:

```ts
import { describe, it, expect } from 'bun:test';
import { extractGlobalPrefixFromSource } from '../parser/global-prefix';

describe('extractGlobalPrefixFromSource', () => {
  it('returns empty string when no setGlobalPrefix call exists', () => {
    const source = `
      import { NestFactory } from '@nestjs/core';
      const app = await NestFactory.create(AppModule);
      await app.listen(3000);
    `;
    expect(extractGlobalPrefixFromSource(source)).toBe('');
  });

  it('returns the literal prefix when setGlobalPrefix uses a string literal', () => {
    const source = `
      const app = await NestFactory.create(AppModule);
      app.setGlobalPrefix('api');
    `;
    expect(extractGlobalPrefixFromSource(source)).toBe('api');
  });

  it('strips leading and trailing slashes from prefix', () => {
    const source = `app.setGlobalPrefix('/api/v1/');`;
    expect(extractGlobalPrefixFromSource(source)).toBe('api/v1');
  });

  it('returns empty string for non-literal argument (flagged as unsupported)', () => {
    const source = `app.setGlobalPrefix(process.env.PREFIX);`;
    expect(extractGlobalPrefixFromSource(source)).toBe('');
  });
});
```

- [ ] **Step 2: Run test — expect fail**

Run: `bun test scripts/bruno-sync/__tests__/global-prefix.test.ts`

Expected: module not found / function not exported.

- [ ] **Step 3: Implement parser**

Create `scripts/bruno-sync/parser/global-prefix.ts`:

```ts
import { Project, SyntaxKind } from 'ts-morph';

export function extractGlobalPrefixFromSource(sourceText: string): string {
  const project = new Project({ useInMemoryFileSystem: true });
  const sf = project.createSourceFile('main.ts', sourceText, { overwrite: true });
  const calls = sf.getDescendantsOfKind(SyntaxKind.CallExpression);
  for (const call of calls) {
    const expr = call.getExpression().getText();
    if (!expr.endsWith('.setGlobalPrefix')) continue;
    const [arg] = call.getArguments();
    if (!arg) return '';
    if (arg.getKind() !== SyntaxKind.StringLiteral) return '';
    const raw = arg.getText().slice(1, -1);
    return raw.replace(/^\/+|\/+$/g, '');
  }
  return '';
}

export async function readGlobalPrefix(mainTsPath: string): Promise<string> {
  const file = Bun.file(mainTsPath);
  if (!(await file.exists())) return '';
  const source = await file.text();
  return extractGlobalPrefixFromSource(source);
}
```

- [ ] **Step 4: Run test — expect pass**

Run: `bun test scripts/bruno-sync/__tests__/global-prefix.test.ts`

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/bruno-sync/parser/global-prefix.ts scripts/bruno-sync/__tests__/global-prefix.test.ts
git commit -m "feat(bruno-sync): extract global prefix from gateway main.ts"
```

---

### Task 3: Controller AST parser — basic HTTP methods

**Files:**
- Create: `scripts/bruno-sync/parser/controller.ts`
- Create: `scripts/bruno-sync/__tests__/controller-parser.test.ts`

- [ ] **Step 1: Write failing test for simple controller**

Create `scripts/bruno-sync/__tests__/controller-parser.test.ts`:

```ts
import { describe, it, expect } from 'bun:test';
import { parseControllerSource } from '../parser/controller';

const simpleController = `
import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';

@Controller('good-received-note')
export class GoodReceivedNoteController {
  @Get()
  findAll(@Query('limit') limit: string) { return []; }

  @Get(':id')
  findOne(@Param('id') id: string) { return {}; }

  @Post()
  createOne(@Body() dto: CreateGrnDto) { return {}; }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGrnDto) { return {}; }

  @Delete(':id')
  remove(@Param('id') id: string) { return {}; }
}
`;

describe('parseControllerSource', () => {
  it('extracts all HTTP method endpoints', () => {
    const endpoints = parseControllerSource(simpleController, '/fake/grn.controller.ts', '');
    expect(endpoints).toHaveLength(5);
    expect(endpoints.map((e) => e.method).sort()).toEqual(['DELETE', 'GET', 'GET', 'PATCH', 'POST']);
  });

  it('joins controller prefix with method path', () => {
    const endpoints = parseControllerSource(simpleController, '/fake/grn.controller.ts', '');
    const findOne = endpoints.find((e) => e.methodName === 'findOne')!;
    expect(findOne.fullPath).toBe('/good-received-note/:id');
  });

  it('prepends global prefix when provided', () => {
    const endpoints = parseControllerSource(simpleController, '/fake/grn.controller.ts', 'api');
    const findAll = endpoints.find((e) => e.methodName === 'findAll')!;
    expect(findAll.fullPath).toBe('/api/good-received-note');
  });

  it('collects path params from @Param decorators', () => {
    const endpoints = parseControllerSource(simpleController, '/fake/grn.controller.ts', '');
    const findOne = endpoints.find((e) => e.methodName === 'findOne')!;
    expect(findOne.pathParams).toEqual(['id']);
  });

  it('collects query params from @Query decorators', () => {
    const endpoints = parseControllerSource(simpleController, '/fake/grn.controller.ts', '');
    const findAll = endpoints.find((e) => e.methodName === 'findAll')!;
    expect(findAll.queryParams).toEqual(['limit']);
  });

  it('captures body DTO class name', () => {
    const endpoints = parseControllerSource(simpleController, '/fake/grn.controller.ts', '');
    const createOne = endpoints.find((e) => e.methodName === 'createOne')!;
    expect(createOne.bodyDto).toBe('CreateGrnDto');
  });

  it('marks method as non-public when no @Public decorator', () => {
    const endpoints = parseControllerSource(simpleController, '/fake/grn.controller.ts', '');
    expect(endpoints.every((e) => e.isPublic === false)).toBe(true);
  });
});
```

- [ ] **Step 2: Run — expect fail**

Run: `bun test scripts/bruno-sync/__tests__/controller-parser.test.ts`

Expected: module not found.

- [ ] **Step 3: Implement parser**

Create `scripts/bruno-sync/parser/controller.ts`:

```ts
import { Project, SyntaxKind, type ClassDeclaration, type MethodDeclaration } from 'ts-morph';
import type { EndpointMeta, HttpMethod } from '../types';

const HTTP_DECORATORS: Record<string, HttpMethod> = {
  Get: 'GET',
  Post: 'POST',
  Patch: 'PATCH',
  Put: 'PUT',
  Delete: 'DELETE',
};

function getDecoratorStringArg(decoratorText: string, callArgs: string[]): string {
  if (callArgs.length === 0) return '';
  const first = callArgs[0].trim();
  if (first.startsWith("'") || first.startsWith('"') || first.startsWith('`')) {
    return first.slice(1, -1);
  }
  return '';
}

function joinPaths(...parts: string[]): string {
  const joined = parts
    .map((p) => p.replace(/^\/+|\/+$/g, ''))
    .filter((p) => p.length > 0)
    .join('/');
  return '/' + joined;
}

function moduleFromPath(filePath: string): { module: string; moduleSlug: string } {
  const idx = filePath.indexOf('apps/backend-gateway/src/');
  if (idx < 0) return { module: filePath, moduleSlug: '' };
  const rel = filePath.slice(idx + 'apps/backend-gateway/src/'.length);
  const parts = rel.split('/');
  const module = parts.slice(0, 2).join('/');
  const moduleSlug = parts[1] ?? '';
  return { module, moduleSlug };
}

function extractDecoratorArgs(decoratorText: string): string[] {
  const match = decoratorText.match(/^@[A-Za-z0-9_]+\((.*)\)$/s);
  if (!match) return [];
  return splitTopLevelArgs(match[1]);
}

function splitTopLevelArgs(argsText: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of argsText) {
    if (ch === '(' || ch === '[' || ch === '{') depth++;
    else if (ch === ')' || ch === ']' || ch === '}') depth--;
    else if (ch === ',' && depth === 0) {
      out.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim()) out.push(current);
  return out;
}

function parseMethod(
  cls: ClassDeclaration,
  method: MethodDeclaration,
  controllerPath: string,
  filePath: string,
  globalPrefix: string,
): EndpointMeta | null {
  let httpMethod: HttpMethod | null = null;
  let methodPath = '';
  let isPublic = false;

  for (const dec of method.getDecorators()) {
    const name = dec.getName();
    if (name in HTTP_DECORATORS) {
      httpMethod = HTTP_DECORATORS[name];
      const args = extractDecoratorArgs(dec.getText());
      methodPath = getDecoratorStringArg(dec.getText(), args);
    } else if (name === 'Public') {
      isPublic = true;
    }
  }
  if (!httpMethod) return null;

  const pathParams: string[] = [];
  const queryParams: string[] = [];
  let bodyDto: string | undefined;

  for (const param of method.getParameters()) {
    for (const dec of param.getDecorators()) {
      const name = dec.getName();
      const args = extractDecoratorArgs(dec.getText());
      const key = getDecoratorStringArg(dec.getText(), args);
      if (name === 'Param' && key) pathParams.push(key);
      else if (name === 'Query' && key) queryParams.push(key);
      else if (name === 'Body') {
        const typeNode = param.getTypeNode();
        if (typeNode) {
          bodyDto = typeNode.getText().replace(/\[\]$/, '');
        }
      }
    }
  }

  const { module, moduleSlug } = moduleFromPath(filePath);

  return {
    module,
    moduleSlug,
    controllerPath,
    method: httpMethod,
    methodPath,
    fullPath: joinPaths(globalPrefix, controllerPath, methodPath),
    methodName: method.getName(),
    pathParams,
    queryParams,
    bodyDto,
    isPublic,
    sourceFile: filePath,
  };
}

export function parseControllerSource(
  sourceText: string,
  filePath: string,
  globalPrefix: string,
): EndpointMeta[] {
  const project = new Project({ useInMemoryFileSystem: true });
  const sf = project.createSourceFile(filePath, sourceText, { overwrite: true });
  const endpoints: EndpointMeta[] = [];
  for (const cls of sf.getClasses()) {
    const controllerDec = cls.getDecorator('Controller');
    if (!controllerDec) continue;
    const args = extractDecoratorArgs(controllerDec.getText());
    const controllerPath = getDecoratorStringArg(controllerDec.getText(), args);
    for (const method of cls.getMethods()) {
      const ep = parseMethod(cls, method, controllerPath, filePath, globalPrefix);
      if (ep) endpoints.push(ep);
    }
  }
  return endpoints;
}

export async function parseControllerFile(
  filePath: string,
  globalPrefix: string,
): Promise<EndpointMeta[]> {
  const text = await Bun.file(filePath).text();
  return parseControllerSource(text, filePath, globalPrefix);
}
```

- [ ] **Step 4: Run — expect pass**

Run: `bun test scripts/bruno-sync/__tests__/controller-parser.test.ts`

Expected: 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/bruno-sync/parser/controller.ts scripts/bruno-sync/__tests__/controller-parser.test.ts
git commit -m "feat(bruno-sync): parse controller HTTP endpoints via ts-morph"
```

---

### Task 4: Controller parser edge cases

**Files:**
- Modify: `scripts/bruno-sync/__tests__/controller-parser.test.ts`
- Modify: `scripts/bruno-sync/parser/controller.ts`

- [ ] **Step 1: Add failing tests for edge cases**

Append to `scripts/bruno-sync/__tests__/controller-parser.test.ts`:

```ts
describe('controller edge cases', () => {
  it('handles empty @Controller() with no argument', () => {
    const src = `
      import { Controller, Get } from '@nestjs/common';
      @Controller()
      export class RootController {
        @Get('health') health() { return 'ok'; }
      }
    `;
    const endpoints = parseControllerSource(src, '/fake/root.controller.ts', '');
    expect(endpoints).toHaveLength(1);
    expect(endpoints[0].fullPath).toBe('/health');
  });

  it('handles multi-segment controller path with params', () => {
    const src = `
      @Controller('bu/:bu_code/grn')
      export class BuGrnController {
        @Get(':id') findOne(@Param('bu_code') bu: string, @Param('id') id: string) {}
      }
    `;
    const endpoints = parseControllerSource(src, '/fake/bu-grn.controller.ts', '');
    expect(endpoints[0].fullPath).toBe('/bu/:bu_code/grn/:id');
    expect(endpoints[0].pathParams.sort()).toEqual(['bu_code', 'id']);
  });

  it('detects @Public() decorator', () => {
    const src = `
      @Controller('auth')
      export class AuthController {
        @Public()
        @Post('login') login() {}
      }
    `;
    const endpoints = parseControllerSource(src, '/fake/auth.controller.ts', '');
    expect(endpoints[0].isPublic).toBe(true);
  });

  it('captures array body DTO without brackets', () => {
    const src = `
      @Controller('batch')
      export class BatchController {
        @Post() bulk(@Body() dtos: CreateXDto[]) {}
      }
    `;
    const endpoints = parseControllerSource(src, '/fake/batch.controller.ts', '');
    expect(endpoints[0].bodyDto).toBe('CreateXDto');
  });

  it('ignores non-HTTP methods on controller class', () => {
    const src = `
      @Controller('x')
      export class XController {
        private helperFn() {}
        @Get() list() {}
      }
    `;
    const endpoints = parseControllerSource(src, '/fake/x.controller.ts', '');
    expect(endpoints).toHaveLength(1);
    expect(endpoints[0].methodName).toBe('list');
  });

  it('extracts moduleSlug from file path under application/', () => {
    const src = `
      @Controller('grn') export class X { @Get() list() {} }
    `;
    const path = '/repo/apps/backend-gateway/src/application/good-received-note/grn.controller.ts';
    const endpoints = parseControllerSource(src, path, '');
    expect(endpoints[0].module).toBe('application/good-received-note');
    expect(endpoints[0].moduleSlug).toBe('good-received-note');
  });
});
```

- [ ] **Step 2: Run — some should fail**

Run: `bun test scripts/bruno-sync/__tests__/controller-parser.test.ts`

Expected: most pass from Task 3 impl; array-body test may fail if `[]` not stripped (already stripped in impl — verify). Multi-segment and empty controller should pass. If any fail, fix inline by adjusting `parseControllerSource`.

- [ ] **Step 3: Fix any failures**

If `pathParams.sort()` returns different order than expected, ensure method-param order is preserved; sort only in the test for stability. Adjust impl only if truly broken.

- [ ] **Step 4: Run — all pass**

Run: `bun test scripts/bruno-sync/__tests__/controller-parser.test.ts`

Expected: 13 tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/bruno-sync/__tests__/controller-parser.test.ts scripts/bruno-sync/parser/controller.ts
git commit -m "test(bruno-sync): cover controller parser edge cases"
```

---

### Task 5: DTO skeleton generator

**Files:**
- Create: `scripts/bruno-sync/parser/dto.ts`
- Create: `scripts/bruno-sync/__tests__/dto-parser.test.ts`

- [ ] **Step 1: Write failing test**

Create `scripts/bruno-sync/__tests__/dto-parser.test.ts`:

```ts
import { describe, it, expect } from 'bun:test';
import { buildBodySkeletonFromSource } from '../parser/dto';

describe('buildBodySkeletonFromSource', () => {
  it('returns {} with warning when DTO class not found', () => {
    const result = buildBodySkeletonFromSource('', 'CreateXDto');
    expect(result.kind).toBe('unknown');
    expect(result.skeleton).toEqual({});
    expect(result.warnings[0]).toContain('CreateXDto');
  });

  it('generates skeleton for simple class DTO with primitive props', () => {
    const src = `
      export class CreateXDto {
        name!: string;
        count!: number;
        active!: boolean;
      }
    `;
    const result = buildBodySkeletonFromSource(src, 'CreateXDto');
    expect(result.kind).toBe('class');
    expect(result.skeleton).toEqual({ name: '', count: 0, active: false });
  });

  it('handles optional properties same as required (skeleton purposes)', () => {
    const src = `
      export class CreateXDto {
        required!: string;
        optional?: string;
      }
    `;
    const result = buildBodySkeletonFromSource(src, 'CreateXDto');
    expect(result.skeleton).toEqual({ required: '', optional: '' });
  });

  it('generates array placeholder for array typed props', () => {
    const src = `
      export class CreateXDto {
        tags!: string[];
      }
    `;
    const result = buildBodySkeletonFromSource(src, 'CreateXDto');
    expect(result.skeleton).toEqual({ tags: [] });
  });

  it('detects createZodDto pattern and returns zod kind with warning', () => {
    const src = `
      import { createZodDto } from 'nestjs-zod';
      export class CreateXDto extends createZodDto(someSchema) {}
    `;
    const result = buildBodySkeletonFromSource(src, 'CreateXDto');
    expect(result.kind).toBe('zod');
    expect(result.warnings.some((w) => w.includes('zod'))).toBe(true);
  });
});
```

- [ ] **Step 2: Run — fail**

Run: `bun test scripts/bruno-sync/__tests__/dto-parser.test.ts`

Expected: module not found.

- [ ] **Step 3: Implement DTO parser**

Create `scripts/bruno-sync/parser/dto.ts`:

```ts
import { Project, SyntaxKind, type ClassDeclaration } from 'ts-morph';
import type { BodySchema } from '../types';
import { DTO_MAX_DEPTH } from '../config';

function primitiveFor(typeText: string): unknown {
  const t = typeText.replace(/\s+/g, '');
  if (t.endsWith('[]') || t.startsWith('Array<')) return [];
  if (t === 'string' || t === 'String') return '';
  if (t === 'number' || t === 'Number') return 0;
  if (t === 'boolean' || t === 'Boolean') return false;
  if (t === 'Date') return '';
  if (t.startsWith('Record<') || t === 'object' || t === 'Object') return {};
  return '';
}

function isZodDto(cls: ClassDeclaration): boolean {
  const ext = cls.getExtends();
  if (!ext) return false;
  const text = ext.getText();
  return text.includes('createZodDto');
}

function classToSkeleton(cls: ClassDeclaration, depth: number): Record<string, unknown> {
  if (depth > DTO_MAX_DEPTH) return {};
  const out: Record<string, unknown> = {};
  for (const prop of cls.getProperties()) {
    const name = prop.getName();
    const typeNode = prop.getTypeNode();
    const typeText = typeNode ? typeNode.getText() : 'any';
    out[name] = primitiveFor(typeText);
  }
  return out;
}

export function buildBodySkeletonFromSource(
  sourceText: string,
  dtoName: string,
): BodySchema {
  const warnings: string[] = [];
  const project = new Project({ useInMemoryFileSystem: true });
  const sf = project.createSourceFile('dto.ts', sourceText, { overwrite: true });
  const cls = sf.getClass(dtoName);
  if (!cls) {
    warnings.push(`DTO class '${dtoName}' not found in source`);
    return { kind: 'unknown', dtoName, skeleton: {}, warnings };
  }
  if (isZodDto(cls)) {
    warnings.push(`DTO '${dtoName}' uses zod schema; skeleton left empty`);
    return { kind: 'zod', dtoName, skeleton: {}, warnings };
  }
  const skeleton = classToSkeleton(cls, 0);
  return { kind: 'class', dtoName, skeleton, warnings };
}
```

- [ ] **Step 4: Run — pass**

Run: `bun test scripts/bruno-sync/__tests__/dto-parser.test.ts`

Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/bruno-sync/parser/dto.ts scripts/bruno-sync/__tests__/dto-parser.test.ts
git commit -m "feat(bruno-sync): generate DTO body skeleton from class properties"
```

---

### Task 6: `.bru` file parser

**Files:**
- Create: `scripts/bruno-sync/generator/bru-parser.ts`
- Create: `scripts/bruno-sync/__tests__/bru-parser.test.ts`

- [ ] **Step 1: Write failing test**

Create `scripts/bruno-sync/__tests__/bru-parser.test.ts`:

```ts
import { describe, it, expect } from 'bun:test';
import { parseBruText } from '../generator/bru-parser';

const sample = `meta {
  name: List GRNs
  type: http
  seq: 3
}

get {
  url: {{base_url}}/api/good-received-note
  body: none
  auth: bearer
}

headers {
  x-app-id: {{x_app_id}}
}

auth:bearer {
  token: {{access_token}}
}

body:json {
  {
    "foo": "bar"
  }
}

script:post-response {
  bru.setVar('last_id', res.body.data.id);
}

docs {
  list GRNs
}
`;

describe('parseBruText', () => {
  it('parses meta block into key-value map', () => {
    const s = parseBruText(sample);
    expect(s.meta?.name).toBe('List GRNs');
    expect(s.meta?.seq).toBe('3');
  });

  it('captures HTTP verb section and body', () => {
    const s = parseBruText(sample);
    expect(s.method?.verb).toBe('get');
    expect(s.method?.body).toContain('{{base_url}}/api/good-received-note');
  });

  it('preserves script:post-response block verbatim', () => {
    const s = parseBruText(sample);
    expect(s.script_post_response).toContain("bru.setVar('last_id'");
  });

  it('captures body:json block content', () => {
    const s = parseBruText(sample);
    expect(s.body_json).toContain('"foo": "bar"');
  });

  it('captures docs block', () => {
    const s = parseBruText(sample);
    expect(s.docs).toContain('list GRNs');
  });
});
```

- [ ] **Step 2: Run — fail**

Run: `bun test scripts/bruno-sync/__tests__/bru-parser.test.ts`

Expected: module not found.

- [ ] **Step 3: Implement parser**

Create `scripts/bruno-sync/generator/bru-parser.ts`:

```ts
import type { BruSections } from '../types';

const SECTION_HEADER_RE = /^([a-z][a-z0-9_:-]*)\s*\{\s*$/i;

function splitSections(text: string): { name: string; body: string }[] {
  const lines = text.split('\n');
  const sections: { name: string; body: string }[] = [];
  let current: { name: string; body: string[] } | null = null;
  let depth = 0;
  for (const line of lines) {
    if (!current) {
      const m = line.match(SECTION_HEADER_RE);
      if (m) {
        current = { name: m[1], body: [] };
        depth = 1;
      }
      continue;
    }
    const opens = (line.match(/\{/g) ?? []).length;
    const closes = (line.match(/\}/g) ?? []).length;
    const netBefore = depth;
    depth += opens - closes;
    if (depth <= 0) {
      // closing line of the section
      sections.push({ name: current.name, body: current.body.join('\n') });
      current = null;
      depth = 0;
      continue;
    }
    current.body.push(line);
  }
  if (current) sections.push({ name: current.name, body: current.body.join('\n') });
  return sections;
}

function parseKeyValueBlock(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const raw of body.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const idx = line.indexOf(':');
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    out[key] = value;
  }
  return out;
}

const HTTP_VERBS = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options']);

export function parseBruText(text: string): BruSections {
  const out: BruSections = { unknown: {} };
  const sections = splitSections(text);
  for (const { name, body } of sections) {
    const key = name.toLowerCase();
    if (key === 'meta') out.meta = parseKeyValueBlock(body);
    else if (HTTP_VERBS.has(key)) out.method = { verb: key, body };
    else if (key === 'headers') out.headers = body;
    else if (key === 'auth:bearer' || key === 'auth:basic' || key === 'auth:apikey') {
      out.auth = { scheme: key, ...parseKeyValueBlock(body) };
    } else if (key === 'query') out.query = body;
    else if (key === 'body:json' || key === 'body:text' || key === 'body:form-urlencoded') out.body_json = body;
    else if (key === 'vars:pre-request') out.vars_pre_request = body;
    else if (key === 'vars:post-response') out.vars_post_response = body;
    else if (key === 'script:pre-request') out.script_pre_request = body;
    else if (key === 'script:post-response') out.script_post_response = body;
    else if (key === 'tests') out.tests = body;
    else if (key === 'docs') out.docs = body;
    else out.unknown[name] = body;
  }
  return out;
}

export async function parseBruFile(path: string): Promise<BruSections> {
  const text = await Bun.file(path).text();
  return parseBruText(text);
}
```

- [ ] **Step 4: Run — pass**

Run: `bun test scripts/bruno-sync/__tests__/bru-parser.test.ts`

Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/bruno-sync/generator/bru-parser.ts scripts/bruno-sync/__tests__/bru-parser.test.ts
git commit -m "feat(bruno-sync): parse .bru text into section map"
```

---

### Task 7: `.bru` writer from endpoint metadata

**Files:**
- Create: `scripts/bruno-sync/generator/bru-writer.ts`
- Create: `scripts/bruno-sync/__tests__/bru-writer.test.ts`

- [ ] **Step 1: Write failing test**

Create `scripts/bruno-sync/__tests__/bru-writer.test.ts`:

```ts
import { describe, it, expect } from 'bun:test';
import { writeBruText, fileNameForEndpoint } from '../generator/bru-writer';
import type { EndpointMeta } from '../types';

const baseEndpoint: EndpointMeta = {
  module: 'application/good-received-note',
  moduleSlug: 'good-received-note',
  controllerPath: 'good-received-note',
  method: 'GET',
  methodPath: '',
  fullPath: '/good-received-note',
  methodName: 'findAll',
  pathParams: [],
  queryParams: ['limit'],
  isPublic: false,
  sourceFile: '/x/grn.controller.ts',
};

describe('fileNameForEndpoint', () => {
  it('maps findAll to GET-list.bru', () => {
    expect(fileNameForEndpoint({ ...baseEndpoint, methodName: 'findAll', method: 'GET' })).toBe('GET-list.bru');
  });
  it('maps findOne to GET-by-id.bru', () => {
    expect(fileNameForEndpoint({ ...baseEndpoint, methodName: 'findOne', method: 'GET' })).toBe('GET-by-id.bru');
  });
  it('maps createOne to POST-create.bru', () => {
    expect(fileNameForEndpoint({ ...baseEndpoint, methodName: 'createOne', method: 'POST' })).toBe('POST-create.bru');
  });
  it('maps update to PATCH-update.bru', () => {
    expect(fileNameForEndpoint({ ...baseEndpoint, methodName: 'update', method: 'PATCH' })).toBe('PATCH-update.bru');
  });
  it('maps remove to DELETE-remove.bru', () => {
    expect(fileNameForEndpoint({ ...baseEndpoint, methodName: 'remove', method: 'DELETE' })).toBe('DELETE-remove.bru');
  });
  it('falls back to method-name kebab for unknown verbs', () => {
    expect(fileNameForEndpoint({ ...baseEndpoint, methodName: 'approveBatch', method: 'POST' })).toBe('POST-approve-batch.bru');
  });
});

describe('writeBruText', () => {
  it('emits meta, verb, headers, auth blocks for authenticated GET', () => {
    const text = writeBruText({
      endpoint: baseEndpoint,
      seq: 1,
      bodySkeleton: {},
    });
    expect(text).toContain('meta {');
    expect(text).toContain('name: List good-received-note');
    expect(text).toContain('seq: 1');
    expect(text).toContain('get {');
    expect(text).toContain('url: {{base_url}}/good-received-note');
    expect(text).toContain('auth:bearer');
    expect(text).toContain('{{access_token}}');
    expect(text).toContain('x-app-id: {{x_app_id}}');
  });

  it('emits body:json block for POST with DTO skeleton', () => {
    const ep: EndpointMeta = { ...baseEndpoint, method: 'POST', methodName: 'createOne', methodPath: '', bodyDto: 'CreateGrnDto' };
    const text = writeBruText({ endpoint: ep, seq: 2, bodySkeleton: { name: '', items: [] } });
    expect(text).toContain('post {');
    expect(text).toContain('body: json');
    expect(text).toContain('"name": ""');
    expect(text).toContain('"items": []');
  });

  it('omits auth block for @Public endpoints', () => {
    const ep: EndpointMeta = { ...baseEndpoint, isPublic: true };
    const text = writeBruText({ endpoint: ep, seq: 1, bodySkeleton: {} });
    expect(text).not.toContain('auth:bearer');
    expect(text).toContain('auth: none');
  });

  it('substitutes :id path params with {{id}}', () => {
    const ep: EndpointMeta = {
      ...baseEndpoint,
      method: 'GET',
      methodName: 'findOne',
      fullPath: '/good-received-note/:id',
      pathParams: ['id'],
    };
    const text = writeBruText({ endpoint: ep, seq: 1, bodySkeleton: {} });
    expect(text).toContain('{{id}}');
    expect(text).not.toContain(':id');
  });

  it('keeps :bu_code mapped to {{bu_code}} (env var)', () => {
    const ep: EndpointMeta = {
      ...baseEndpoint,
      fullPath: '/bu/:bu_code/good-received-note',
      pathParams: ['bu_code'],
    };
    const text = writeBruText({ endpoint: ep, seq: 1, bodySkeleton: {} });
    expect(text).toContain('{{bu_code}}');
  });
});
```

- [ ] **Step 2: Run — fail**

Run: `bun test scripts/bruno-sync/__tests__/bru-writer.test.ts`

Expected: module not found.

- [ ] **Step 3: Implement writer**

Create `scripts/bruno-sync/generator/bru-writer.ts`:

```ts
import type { EndpointMeta, HttpMethod } from '../types';

function toKebab(s: string): string {
  return s
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

const METHOD_NAME_MAP: Record<string, string> = {
  findAll: 'list',
  findOne: 'by-id',
  createOne: 'create',
  create: 'create',
  update: 'update',
  remove: 'remove',
  delete: 'remove',
};

export function fileNameForEndpoint(ep: EndpointMeta): string {
  const slug = METHOD_NAME_MAP[ep.methodName] ?? toKebab(ep.methodName);
  return `${ep.method}-${slug}.bru`;
}

function humanName(ep: EndpointMeta): string {
  const action = METHOD_NAME_MAP[ep.methodName] ?? toKebab(ep.methodName);
  const capAction = action.charAt(0).toUpperCase() + action.slice(1).replace(/-/g, ' ');
  return `${capAction} ${ep.moduleSlug || ep.controllerPath}`;
}

function substituteParams(path: string): string {
  return path.replace(/:([a-zA-Z0-9_]+)/g, (_m, name) => `{{${name}}}`);
}

function methodVerbLower(m: HttpMethod): string {
  return m.toLowerCase();
}

function formatBody(body: Record<string, unknown> | unknown[]): string {
  return JSON.stringify(body, null, 2).replace(/^/gm, '  ');
}

export interface WriteBruInput {
  endpoint: EndpointMeta;
  seq: number;
  bodySkeleton: Record<string, unknown> | unknown[];
}

export function writeBruText(input: WriteBruInput): string {
  const { endpoint: ep, seq, bodySkeleton } = input;
  const needsBody = ep.method === 'POST' || ep.method === 'PUT' || ep.method === 'PATCH';
  const verb = methodVerbLower(ep.method);
  const url = `{{base_url}}${substituteParams(ep.fullPath)}`;

  const lines: string[] = [];
  lines.push('meta {');
  lines.push(`  name: ${humanName(ep)}`);
  lines.push('  type: http');
  lines.push(`  seq: ${seq}`);
  lines.push('}');
  lines.push('');

  lines.push(`${verb} {`);
  lines.push(`  url: ${url}`);
  lines.push(`  body: ${needsBody ? 'json' : 'none'}`);
  lines.push(`  auth: ${ep.isPublic ? 'none' : 'bearer'}`);
  lines.push('}');
  lines.push('');

  lines.push('headers {');
  lines.push('  x-app-id: {{x_app_id}}');
  if (needsBody) lines.push('  Content-Type: application/json');
  lines.push('}');
  lines.push('');

  if (!ep.isPublic) {
    lines.push('auth:bearer {');
    lines.push('  token: {{access_token}}');
    lines.push('}');
    lines.push('');
  }

  if (ep.queryParams.length > 0) {
    lines.push('query {');
    for (const q of ep.queryParams) lines.push(`  ~${q}: `);
    lines.push('}');
    lines.push('');
  }

  if (needsBody) {
    lines.push('body:json {');
    const body = formatBody(bodySkeleton);
    lines.push(body);
    lines.push('}');
    lines.push('');
  }

  return lines.join('\n').trimEnd() + '\n';
}
```

- [ ] **Step 4: Run — pass**

Run: `bun test scripts/bruno-sync/__tests__/bru-writer.test.ts`

Expected: 11 tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/bruno-sync/generator/bru-writer.ts scripts/bruno-sync/__tests__/bru-writer.test.ts
git commit -m "feat(bruno-sync): emit .bru text from endpoint metadata"
```

---

### Task 8: Folder mapper (domain-aware)

**Files:**
- Create: `scripts/bruno-sync/generator/folder-mapper.ts`
- Create: `scripts/bruno-sync/__tests__/folder-mapper.test.ts`

- [ ] **Step 1: Write failing test**

Create `scripts/bruno-sync/__tests__/folder-mapper.test.ts`:

```ts
import { describe, it, expect } from 'bun:test';
import { resolveTargetFolder, buildModuleLocationIndex } from '../generator/folder-mapper';
import type { EndpointMeta, BruFile } from '../types';

const ep = (overrides: Partial<EndpointMeta> = {}): EndpointMeta => ({
  module: 'application/good-received-note',
  moduleSlug: 'good-received-note',
  controllerPath: 'good-received-note',
  method: 'GET',
  methodPath: '',
  fullPath: '/good-received-note',
  methodName: 'findAll',
  pathParams: [],
  queryParams: [],
  isPublic: false,
  sourceFile: '',
  ...overrides,
});

const bru = (relativePath: string, urlPath: string): BruFile => ({
  path: `/abs/${relativePath}`,
  relativePath,
  sections: {
    unknown: {},
    method: { verb: 'get', body: `  url: {{base_url}}${urlPath}\n  body: none` },
  },
});

describe('buildModuleLocationIndex', () => {
  it('maps moduleSlug from first path segment of URL', () => {
    const files = [
      bru('procurement/good-received-note/GET-list.bru', '/good-received-note'),
      bru('procurement/good-received-note/POST-create.bru', '/good-received-note'),
    ];
    const idx = buildModuleLocationIndex(files);
    expect(idx['good-received-note']).toBe('procurement/good-received-note');
  });

  it('chooses folder with most files when slug appears in multiple', () => {
    const files = [
      bru('procurement/good-received-note/GET-list.bru', '/good-received-note'),
      bru('procurement/good-received-note/POST-create.bru', '/good-received-note'),
      bru('old/good-received-note/GET-list.bru', '/good-received-note'),
    ];
    const idx = buildModuleLocationIndex(files);
    expect(idx['good-received-note']).toBe('procurement/good-received-note');
  });

  it('strips /api/ prefix when mapping slug', () => {
    const files = [bru('procurement/grn/GET-list.bru', '/api/grn')];
    const idx = buildModuleLocationIndex(files);
    expect(idx['grn']).toBe('procurement/grn');
  });
});

describe('resolveTargetFolder', () => {
  it('uses existing folder from location index when slug matches', () => {
    const index = { 'good-received-note': 'procurement/good-received-note' };
    expect(resolveTargetFolder(ep(), index)).toBe('procurement/good-received-note');
  });

  it('maps config_<name> to config/<name> when no existing location', () => {
    const index = {};
    expect(
      resolveTargetFolder(
        ep({
          module: 'config/config_products',
          moduleSlug: 'config_products',
        }),
        index,
      ),
    ).toBe('config/products');
  });

  it('maps platform_<name> to platform/<name>', () => {
    const index = {};
    expect(
      resolveTargetFolder(
        ep({
          module: 'platform/platform_cluster',
          moduleSlug: 'platform_cluster',
        }),
        index,
      ),
    ).toBe('platform/cluster');
  });

  it('maps plain config/<name> (no prefix) to config/<name>', () => {
    const index = {};
    expect(
      resolveTargetFolder(
        ep({ module: 'config/recipe', moduleSlug: 'recipe' }),
        index,
      ),
    ).toBe('config/recipe');
  });

  it('falls back to _uncategorized/<slug> for application modules with no existing location', () => {
    const index = {};
    expect(resolveTargetFolder(ep(), index)).toBe('_uncategorized/good-received-note');
  });
});
```

- [ ] **Step 2: Run — fail**

Run: `bun test scripts/bruno-sync/__tests__/folder-mapper.test.ts`

Expected: module not found.

- [ ] **Step 3: Implement**

Create `scripts/bruno-sync/generator/folder-mapper.ts`:

```ts
import type { EndpointMeta, BruFile } from '../types';

function extractUrlFromVerbBody(body: string): string {
  const m = body.match(/url:\s*(\S+)/);
  return m ? m[1] : '';
}

function urlToSlug(url: string): string {
  const stripped = url.replace(/^\{\{base_url\}\}/, '').replace(/^\/+/, '');
  const segments = stripped.split('/').filter((s) => s && !s.startsWith('{{') && !s.startsWith(':'));
  if (segments[0] === 'api') return segments[1] ?? '';
  return segments[0] ?? '';
}

export function buildModuleLocationIndex(files: BruFile[]): Record<string, string> {
  const counts: Record<string, Record<string, number>> = {};
  for (const file of files) {
    if (!file.sections.method) continue;
    const url = extractUrlFromVerbBody(file.sections.method.body);
    const slug = urlToSlug(url);
    if (!slug) continue;
    const folder = file.relativePath.split('/').slice(0, -1).join('/');
    if (!folder) continue;
    counts[slug] ??= {};
    counts[slug][folder] = (counts[slug][folder] ?? 0) + 1;
  }
  const index: Record<string, string> = {};
  for (const [slug, folderMap] of Object.entries(counts)) {
    const winner = Object.entries(folderMap).sort((a, b) => b[1] - a[1])[0];
    if (winner) index[slug] = winner[0];
  }
  return index;
}

function stripPrefix(slug: string, prefix: string): string {
  return slug.startsWith(prefix) ? slug.slice(prefix.length) : slug;
}

export function resolveTargetFolder(
  ep: EndpointMeta,
  locationIndex: Record<string, string>,
): string {
  if (locationIndex[ep.moduleSlug]) return locationIndex[ep.moduleSlug];

  if (ep.module.startsWith('config/')) {
    const name = stripPrefix(ep.moduleSlug, 'config_');
    return `config/${name}`;
  }
  if (ep.module.startsWith('platform/')) {
    const name = stripPrefix(ep.moduleSlug, 'platform_');
    return `platform/${name}`;
  }
  return `_uncategorized/${ep.moduleSlug}`;
}
```

- [ ] **Step 4: Run — pass**

Run: `bun test scripts/bruno-sync/__tests__/folder-mapper.test.ts`

Expected: 8 tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/bruno-sync/generator/folder-mapper.ts scripts/bruno-sync/__tests__/folder-mapper.test.ts
git commit -m "feat(bruno-sync): domain-aware folder resolution from existing files"
```

---

### Task 9: Merger — preserve user sections on update

**Files:**
- Create: `scripts/bruno-sync/reconciler/merger.ts`
- Create: `scripts/bruno-sync/__tests__/merger.test.ts`

- [ ] **Step 1: Write failing test**

Create `scripts/bruno-sync/__tests__/merger.test.ts`:

```ts
import { describe, it, expect } from 'bun:test';
import { mergeGeneratedWithExisting } from '../reconciler/merger';
import { parseBruText } from '../generator/bru-parser';

const existingWithScript = `meta {
  name: Old Name
  type: http
  seq: 7
}

get {
  url: {{base_url}}/wrong/path
  body: none
  auth: bearer
}

headers {
  x-app-id: {{x_app_id}}
}

auth:bearer {
  token: {{access_token}}
}

script:post-response {
  bru.setVar('grn_id', res.body.data.id);
}

tests {
  test('status 200', () => expect(res.status).to.equal(200));
}

docs {
  manually written docs
}
`;

const generatedFresh = `meta {
  name: List good-received-note
  type: http
  seq: 1
}

get {
  url: {{base_url}}/good-received-note
  body: none
  auth: bearer
}

headers {
  x-app-id: {{x_app_id}}
}

auth:bearer {
  token: {{access_token}}
}
`;

describe('mergeGeneratedWithExisting', () => {
  it('keeps existing seq from meta', () => {
    const out = mergeGeneratedWithExisting(generatedFresh, existingWithScript);
    const parsed = parseBruText(out);
    expect(parsed.meta?.seq).toBe('7');
  });

  it('overwrites url with generated path', () => {
    const out = mergeGeneratedWithExisting(generatedFresh, existingWithScript);
    expect(out).toContain('{{base_url}}/good-received-note');
    expect(out).not.toContain('/wrong/path');
  });

  it('preserves script:post-response block', () => {
    const out = mergeGeneratedWithExisting(generatedFresh, existingWithScript);
    expect(out).toContain("bru.setVar('grn_id'");
  });

  it('preserves tests block', () => {
    const out = mergeGeneratedWithExisting(generatedFresh, existingWithScript);
    expect(out).toContain("test('status 200'");
  });

  it('preserves existing docs block', () => {
    const out = mergeGeneratedWithExisting(generatedFresh, existingWithScript);
    expect(out).toContain('manually written docs');
  });

  it('uses generated name even if existing name differed', () => {
    const out = mergeGeneratedWithExisting(generatedFresh, existingWithScript);
    const parsed = parseBruText(out);
    expect(parsed.meta?.name).toBe('List good-received-note');
  });
});
```

- [ ] **Step 2: Run — fail**

Run: `bun test scripts/bruno-sync/__tests__/merger.test.ts`

Expected: module not found.

- [ ] **Step 3: Implement merger**

Create `scripts/bruno-sync/reconciler/merger.ts`:

```ts
import { parseBruText } from '../generator/bru-parser';
import type { BruSections } from '../types';

function renderKV(name: string, kv: Record<string, string>, order?: string[]): string {
  const lines: string[] = [`${name} {`];
  const keys = order ?? Object.keys(kv);
  for (const k of keys) {
    if (kv[k] !== undefined) lines.push(`  ${k}: ${kv[k]}`);
  }
  lines.push('}');
  return lines.join('\n');
}

function renderRaw(name: string, body: string): string {
  return `${name} {\n${body}\n}`;
}

export function mergeGeneratedWithExisting(generatedText: string, existingText: string): string {
  const gen = parseBruText(generatedText);
  const ex = parseBruText(existingText);

  const meta = { ...(gen.meta ?? {}) };
  if (ex.meta?.seq) meta.seq = ex.meta.seq;

  const blocks: string[] = [];
  blocks.push(renderKV('meta', meta, ['name', 'type', 'seq']));
  if (gen.method) blocks.push(renderRaw(gen.method.verb, gen.method.body));
  if (gen.headers !== undefined) blocks.push(renderRaw('headers', gen.headers));
  if (gen.auth) {
    const { scheme, ...rest } = gen.auth as Record<string, string>;
    blocks.push(renderKV(scheme, rest, Object.keys(rest)));
  }
  if (gen.query !== undefined) blocks.push(renderRaw('query', gen.query));
  if (gen.body_json !== undefined) blocks.push(renderRaw('body:json', gen.body_json));

  if (ex.vars_pre_request !== undefined) blocks.push(renderRaw('vars:pre-request', ex.vars_pre_request));
  if (ex.vars_post_response !== undefined) blocks.push(renderRaw('vars:post-response', ex.vars_post_response));
  if (ex.script_pre_request !== undefined) blocks.push(renderRaw('script:pre-request', ex.script_pre_request));
  if (ex.script_post_response !== undefined) blocks.push(renderRaw('script:post-response', ex.script_post_response));
  if (ex.tests !== undefined) blocks.push(renderRaw('tests', ex.tests));
  if (ex.docs !== undefined) blocks.push(renderRaw('docs', ex.docs));
  for (const [name, body] of Object.entries(ex.unknown)) {
    blocks.push(renderRaw(name, body));
  }

  return blocks.join('\n\n') + '\n';
}
```

- [ ] **Step 4: Run — pass**

Run: `bun test scripts/bruno-sync/__tests__/merger.test.ts`

Expected: 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/bruno-sync/reconciler/merger.ts scripts/bruno-sync/__tests__/merger.test.ts
git commit -m "feat(bruno-sync): merge generated .bru with existing user scripts/tests"
```

---

### Task 10: Diff — NEW / UPDATE / ORPHAN

**Files:**
- Create: `scripts/bruno-sync/reconciler/diff.ts`
- Create: `scripts/bruno-sync/__tests__/diff.test.ts`

- [ ] **Step 1: Write failing test**

Create `scripts/bruno-sync/__tests__/diff.test.ts`:

```ts
import { describe, it, expect } from 'bun:test';
import { diffEndpoints } from '../reconciler/diff';
import type { EndpointMeta, BruFile } from '../types';

const ep = (o: Partial<EndpointMeta> = {}): EndpointMeta => ({
  module: 'application/grn',
  moduleSlug: 'grn',
  controllerPath: 'grn',
  method: 'GET',
  methodPath: '',
  fullPath: '/grn',
  methodName: 'findAll',
  pathParams: [],
  queryParams: [],
  isPublic: false,
  sourceFile: '',
  ...o,
});

const bru = (relativePath: string, url: string, verb = 'get'): BruFile => ({
  path: `/abs/${relativePath}`,
  relativePath,
  sections: {
    unknown: {},
    method: { verb, body: `  url: {{base_url}}${url}\n  body: none` },
  },
});

describe('diffEndpoints', () => {
  it('classifies an endpoint with no matching .bru as NEW', () => {
    const result = diffEndpoints({
      endpoints: [ep({ fullPath: '/grn', method: 'GET' })],
      bruFiles: [],
      locationIndex: {},
    });
    expect(result.created).toHaveLength(1);
    expect(result.updated).toHaveLength(0);
    expect(result.orphaned).toHaveLength(0);
  });

  it('classifies a matching endpoint + .bru as UPDATE', () => {
    const result = diffEndpoints({
      endpoints: [ep({ fullPath: '/grn', method: 'GET' })],
      bruFiles: [bru('procurement/grn/GET-list.bru', '/grn', 'get')],
      locationIndex: { grn: 'procurement/grn' },
    });
    expect(result.updated).toHaveLength(1);
    expect(result.created).toHaveLength(0);
    expect(result.orphaned).toHaveLength(0);
  });

  it('classifies a .bru with no matching endpoint as ORPHAN', () => {
    const result = diffEndpoints({
      endpoints: [],
      bruFiles: [bru('old/obsolete/GET-list.bru', '/obsolete', 'get')],
      locationIndex: {},
    });
    expect(result.orphaned).toHaveLength(1);
    expect(result.created).toHaveLength(0);
    expect(result.updated).toHaveLength(0);
  });

  it('matches by normalized path + method (ignoring trailing slash)', () => {
    const result = diffEndpoints({
      endpoints: [ep({ fullPath: '/grn', method: 'GET' })],
      bruFiles: [bru('procurement/grn/GET-list.bru', '/grn/', 'get')],
      locationIndex: { grn: 'procurement/grn' },
    });
    expect(result.updated).toHaveLength(1);
  });

  it('two endpoints same path but different method are distinct', () => {
    const result = diffEndpoints({
      endpoints: [
        ep({ fullPath: '/grn', method: 'GET', methodName: 'findAll' }),
        ep({ fullPath: '/grn', method: 'POST', methodName: 'createOne' }),
      ],
      bruFiles: [bru('procurement/grn/GET-list.bru', '/grn', 'get')],
      locationIndex: { grn: 'procurement/grn' },
    });
    expect(result.updated).toHaveLength(1);
    expect(result.created).toHaveLength(1);
    expect(result.created[0].endpoint.method).toBe('POST');
  });
});
```

- [ ] **Step 2: Run — fail**

Run: `bun test scripts/bruno-sync/__tests__/diff.test.ts`

Expected: module not found.

- [ ] **Step 3: Implement diff**

Create `scripts/bruno-sync/reconciler/diff.ts`:

```ts
import type { EndpointMeta, BruFile, DiffResult } from '../types';
import { resolveTargetFolder } from '../generator/folder-mapper';
import { fileNameForEndpoint } from '../generator/bru-writer';
import { join } from 'node:path';

function normalizePath(p: string): string {
  return '/' + p.replace(/^\/+|\/+$/g, '');
}

function extractUrlPath(verbBody: string): string {
  const m = verbBody.match(/url:\s*(\S+)/);
  if (!m) return '';
  const raw = m[1].replace(/^\{\{base_url\}\}/, '');
  return normalizePath(raw);
}

function bruKey(relPath: string, method: string, urlPath: string): string {
  return `${method.toUpperCase()}::${normalizePath(urlPath)}`;
}

export interface DiffInput {
  endpoints: EndpointMeta[];
  bruFiles: BruFile[];
  locationIndex: Record<string, string>;
}

export function diffEndpoints(input: DiffInput): DiffResult {
  const { endpoints, bruFiles, locationIndex } = input;
  const warnings: string[] = [];

  const bruIndex = new Map<string, BruFile>();
  for (const b of bruFiles) {
    if (!b.sections.method) continue;
    const url = extractUrlPath(b.sections.method.body);
    if (!url) continue;
    const key = bruKey(b.relativePath, b.sections.method.verb, url);
    bruIndex.set(key, b);
  }

  const created: DiffResult['created'] = [];
  const updated: DiffResult['updated'] = [];
  const matchedKeys = new Set<string>();

  for (const ep of endpoints) {
    const key = bruKey('', ep.method, ep.fullPath);
    const match = bruIndex.get(key);
    if (match) {
      matchedKeys.add(key);
      updated.push({ endpoint: ep, bru: match });
    } else {
      const folder = resolveTargetFolder(ep, locationIndex);
      const fileName = fileNameForEndpoint(ep);
      created.push({ endpoint: ep, targetPath: join(folder, fileName) });
    }
  }

  const orphaned: BruFile[] = [];
  for (const [key, bru] of bruIndex) {
    if (matchedKeys.has(key)) continue;
    orphaned.push(bru);
  }

  return { created, updated, orphaned, warnings };
}
```

- [ ] **Step 4: Run — pass**

Run: `bun test scripts/bruno-sync/__tests__/diff.test.ts`

Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/bruno-sync/reconciler/diff.ts scripts/bruno-sync/__tests__/diff.test.ts
git commit -m "feat(bruno-sync): diff gateway endpoints against existing .bru files"
```

---

### Task 11: Archiver

**Files:**
- Create: `scripts/bruno-sync/reconciler/archiver.ts`

(no test — integration-tested in Task 13)

- [ ] **Step 1: Implement archiver**

Create `scripts/bruno-sync/reconciler/archiver.ts`:

```ts
import { join, dirname } from 'node:path';
import { mkdir, rename, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type { BruFile } from '../types';
import { BRUNO_ARCHIVE_DIR, BRUNO_ROOT } from '../config';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function archiveOrphans(
  orphans: BruFile[],
  dryRun: boolean,
): Promise<{ moved: string[]; note: string }> {
  const date = todayIso();
  const baseDir = join(BRUNO_ARCHIVE_DIR, date);
  const moved: string[] = [];
  if (dryRun) {
    return {
      moved: orphans.map((o) => o.relativePath),
      note: `would move ${orphans.length} file(s) to ${baseDir}`,
    };
  }
  if (orphans.length === 0) return { moved: [], note: 'no orphans' };
  await mkdir(baseDir, { recursive: true });
  const readmeLines: string[] = [];
  readmeLines.push(`## ${date}`);
  for (const o of orphans) {
    const target = join(baseDir, o.relativePath);
    await mkdir(dirname(target), { recursive: true });
    await rename(o.path, target);
    moved.push(o.relativePath);
    readmeLines.push(`- \`${o.relativePath}\` — endpoint not found in gateway controllers`);
  }
  const readmePath = join(BRUNO_ROOT, '_archived', 'README.md');
  const header = `# Archived Bruno Requests\n\nFiles moved by bruno-sync when the corresponding gateway endpoint could not be found. Review periodically and delete when confirmed obsolete.\n\n`;
  const prev = existsSync(readmePath) ? await readFile(readmePath, 'utf8') : header;
  await writeFile(readmePath, prev + readmeLines.join('\n') + '\n\n');
  return { moved, note: `moved ${moved.length} file(s) to ${baseDir}` };
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/bruno-sync/reconciler/archiver.ts
git commit -m "feat(bruno-sync): archive orphan .bru files under dated _archived/ folder"
```

---

### Task 12: Bruno collection scanner

**Files:**
- Create: `scripts/bruno-sync/generator/bru-scanner.ts`

- [ ] **Step 1: Implement scanner**

Create `scripts/bruno-sync/generator/bru-scanner.ts`:

```ts
import { readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { parseBruFile } from './bru-parser';
import type { BruFile } from '../types';
import { BRUNO_ROOT, BRUNO_PRESERVED_DIRS } from '../config';

async function walk(dir: string, out: string[] = []): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      const rel = relative(BRUNO_ROOT, full);
      if (BRUNO_PRESERVED_DIRS.some((p) => rel === p || rel.startsWith(p + '/'))) continue;
      await walk(full, out);
    } else if (entry.isFile() && entry.name.endsWith('.bru') && entry.name !== 'folder.bru') {
      out.push(full);
    }
  }
  return out;
}

export async function scanBrunoFiles(): Promise<BruFile[]> {
  const paths = await walk(BRUNO_ROOT);
  const files: BruFile[] = [];
  for (const p of paths) {
    const sections = await parseBruFile(p);
    files.push({
      path: p,
      relativePath: relative(BRUNO_ROOT, p),
      sections,
    });
  }
  return files;
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/bruno-sync/generator/bru-scanner.ts
git commit -m "feat(bruno-sync): scan Bruno collection into parsed file list"
```

---

### Task 13: Gateway controller scanner

**Files:**
- Create: `scripts/bruno-sync/parser/gateway-scanner.ts`

- [ ] **Step 1: Implement**

Create `scripts/bruno-sync/parser/gateway-scanner.ts`:

```ts
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { parseControllerFile } from './controller';
import { readGlobalPrefix } from './global-prefix';
import { GATEWAY_SRC, GATEWAY_MAIN, GATEWAY_SCAN_DIRS } from '../config';
import type { EndpointMeta } from '../types';

async function walkControllers(dir: string, out: string[] = []): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkControllers(full, out);
    } else if (entry.isFile() && entry.name.endsWith('.controller.ts') && !entry.name.endsWith('.spec.ts')) {
      out.push(full);
    }
  }
  return out;
}

export async function scanGatewayEndpoints(): Promise<{
  endpoints: EndpointMeta[];
  parseErrors: string[];
}> {
  const prefix = await readGlobalPrefix(GATEWAY_MAIN);
  const endpoints: EndpointMeta[] = [];
  const parseErrors: string[] = [];

  for (const sub of GATEWAY_SCAN_DIRS) {
    const dir = join(GATEWAY_SRC, sub);
    const files = await walkControllers(dir).catch(() => [] as string[]);
    for (const file of files) {
      try {
        const parsed = await parseControllerFile(file, prefix);
        endpoints.push(...parsed);
      } catch (err) {
        parseErrors.push(`${file}: ${(err as Error).message}`);
      }
    }
  }

  return { endpoints, parseErrors };
}
```

- [ ] **Step 2: Smoke test (manual)**

Run:
```bash
bun run -e "import('./scripts/bruno-sync/parser/gateway-scanner').then(async (m) => { const r = await m.scanGatewayEndpoints(); console.log('endpoints:', r.endpoints.length, 'errors:', r.parseErrors.length); })"
```

Expected: prints a count > 200 (current gateway has many endpoints) and 0 or few errors.

- [ ] **Step 3: Commit**

```bash
git add scripts/bruno-sync/parser/gateway-scanner.ts
git commit -m "feat(bruno-sync): scan gateway controllers into endpoint list"
```

---

### Task 14: DTO source resolver (file-system aware)

**Files:**
- Create: `scripts/bruno-sync/parser/dto-resolver.ts`

- [ ] **Step 1: Implement**

Create `scripts/bruno-sync/parser/dto-resolver.ts`:

```ts
import { readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { buildBodySkeletonFromSource } from './dto';
import type { BodySchema } from '../types';

async function findDtoFile(startDir: string, dtoName: string, maxUp = 4): Promise<string | null> {
  let dir = startDir;
  for (let i = 0; i <= maxUp; i++) {
    const hits = await grepDir(dir, dtoName);
    if (hits.length > 0) return hits[0];
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

async function grepDir(dir: string, dtoName: string, results: string[] = []): Promise<string[]> {
  let entries: Awaited<ReturnType<typeof readdir>> = [];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.turbo' || entry.name === 'dist') continue;
      await grepDir(full, dtoName, results);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts'))) {
      const text = await Bun.file(full).text();
      if (text.includes(`class ${dtoName}`) || text.includes(`${dtoName} extends createZodDto`)) {
        results.push(full);
      }
    }
  }
  return results;
}

export async function resolveBodySkeleton(
  controllerFile: string,
  dtoName: string | undefined,
): Promise<BodySchema> {
  if (!dtoName) return { kind: 'unknown', dtoName: '', skeleton: {}, warnings: [] };
  const dir = dirname(controllerFile);
  const found = await findDtoFile(dir, dtoName);
  if (!found) {
    return {
      kind: 'unknown',
      dtoName,
      skeleton: {},
      warnings: [`DTO '${dtoName}' not found within 4 parent dirs of ${controllerFile}`],
    };
  }
  const source = await Bun.file(found).text();
  return buildBodySkeletonFromSource(source, dtoName);
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/bruno-sync/parser/dto-resolver.ts
git commit -m "feat(bruno-sync): locate DTO class files relative to controller"
```

---

### Task 15: Writer orchestrator — create + update files

**Files:**
- Create: `scripts/bruno-sync/reconciler/apply.ts`

- [ ] **Step 1: Implement**

Create `scripts/bruno-sync/reconciler/apply.ts`:

```ts
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';
import { writeBruText } from '../generator/bru-writer';
import { mergeGeneratedWithExisting } from './merger';
import { resolveBodySkeleton } from '../parser/dto-resolver';
import { BRUNO_ROOT } from '../config';
import type { DiffResult } from '../types';

async function nextSeq(folderAbs: string): Promise<number> {
  if (!existsSync(folderAbs)) return 1;
  const entries = await readdir(folderAbs).catch(() => [] as string[]);
  let max = 0;
  for (const name of entries) {
    if (!name.endsWith('.bru')) continue;
    const path = join(folderAbs, name);
    const text = await Bun.file(path).text();
    const m = text.match(/seq:\s*(\d+)/);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max + 1;
}

export async function applyCreatesAndUpdates(
  diff: DiffResult,
  dryRun: boolean,
): Promise<{ added: string[]; updated: string[]; warnings: string[] }> {
  const added: string[] = [];
  const updatedPaths: string[] = [];
  const warnings: string[] = [];

  for (const item of diff.created) {
    const targetAbs = join(BRUNO_ROOT, item.targetPath);
    const folderAbs = dirname(targetAbs);
    const seq = await nextSeq(folderAbs);
    const body = await resolveBodySkeleton(item.endpoint.sourceFile, item.endpoint.bodyDto);
    for (const w of body.warnings) warnings.push(`${item.targetPath}: ${w}`);
    const text = writeBruText({ endpoint: item.endpoint, seq, bodySkeleton: body.skeleton });
    added.push(item.targetPath);
    if (!dryRun) {
      await mkdir(folderAbs, { recursive: true });
      await writeFile(targetAbs, text);
    }
  }

  for (const item of diff.updated) {
    const existingText = await Bun.file(item.bru.path).text();
    const body = await resolveBodySkeleton(item.endpoint.sourceFile, item.endpoint.bodyDto);
    for (const w of body.warnings) warnings.push(`${item.bru.relativePath}: ${w}`);
    const seq = Number(item.bru.sections.meta?.seq ?? '1');
    const generated = writeBruText({ endpoint: item.endpoint, seq, bodySkeleton: body.skeleton });
    const merged = mergeGeneratedWithExisting(generated, existingText);
    if (merged !== existingText) {
      updatedPaths.push(item.bru.relativePath);
      if (!dryRun) await writeFile(item.bru.path, merged);
    }
  }

  return { added, updated: updatedPaths, warnings };
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/bruno-sync/reconciler/apply.ts
git commit -m "feat(bruno-sync): orchestrate create and update .bru file writes"
```

---

### Task 16: CLI entry

**Files:**
- Create: `scripts/bruno-sync/index.ts`

- [ ] **Step 1: Implement**

Create `scripts/bruno-sync/index.ts`:

```ts
#!/usr/bin/env bun
import { scanGatewayEndpoints } from './parser/gateway-scanner';
import { scanBrunoFiles } from './generator/bru-scanner';
import { buildModuleLocationIndex } from './generator/folder-mapper';
import { diffEndpoints } from './reconciler/diff';
import { applyCreatesAndUpdates } from './reconciler/apply';
import { archiveOrphans } from './reconciler/archiver';

interface CliFlags {
  dryRun: boolean;
  verbose: boolean;
}

function parseArgs(argv: string[]): CliFlags {
  return {
    dryRun: argv.includes('--dry-run'),
    verbose: argv.includes('--verbose'),
  };
}

function formatSection(title: string, items: string[]): string {
  if (items.length === 0) return `${title}: none`;
  return `${title} (${items.length}):\n  - ${items.join('\n  - ')}`;
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  console.log(`bruno-sync ${flags.dryRun ? '(DRY RUN)' : ''}`);

  const { endpoints, parseErrors } = await scanGatewayEndpoints();
  const bruFiles = await scanBrunoFiles();
  const locationIndex = buildModuleLocationIndex(bruFiles);
  const diff = diffEndpoints({ endpoints, bruFiles, locationIndex });

  console.log(`Scanned: ${endpoints.length} gateway endpoints, ${bruFiles.length} existing .bru files`);
  if (parseErrors.length) {
    console.log(`Parse errors: ${parseErrors.length}`);
    if (flags.verbose) for (const e of parseErrors) console.log(`  ${e}`);
  }

  const applyResult = await applyCreatesAndUpdates(diff, flags.dryRun);
  const archiveResult = await archiveOrphans(diff.orphaned, flags.dryRun);

  console.log('');
  console.log(formatSection('Added', applyResult.added));
  console.log('');
  console.log(formatSection('Updated', applyResult.updated));
  console.log('');
  console.log(formatSection('Archived', archiveResult.moved));
  console.log('');
  console.log(formatSection('Warnings', [...applyResult.warnings, ...diff.warnings]));
  console.log('');
  console.log(archiveResult.note);

  if (parseErrors.length > 0) process.exitCode = 0; // non-fatal
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Run dry mode**

Run: `bun run bruno:sync:dry`

Expected: Prints scan counts, NEW/UPDATED/ARCHIVED lists, no files modified. If it crashes, fix and re-run.

- [ ] **Step 3: Commit**

```bash
git add scripts/bruno-sync/index.ts
git commit -m "feat(bruno-sync): CLI entry with dry-run and verbose flags"
```

---

### Task 17: Delete superseded `generate-bruno.py`

**Files:**
- Delete: `scripts/generate-bruno.py`

- [ ] **Step 1: Confirm no references**

Run:
```bash
grep -rn "generate-bruno.py" --include="*.ts" --include="*.json" --include="*.md" --include="*.sh" . 2>/dev/null | grep -v node_modules | grep -v docs/superpowers
```

Expected: empty (or only matches in our new plan/spec docs). If there are real references in package.json or scripts, update them to use `bruno:sync` before deleting.

- [ ] **Step 2: Delete file**

```bash
rm scripts/generate-bruno.py
```

- [ ] **Step 3: Commit**

```bash
git add -u scripts/generate-bruno.py
git commit -m "chore: remove generate-bruno.py superseded by bruno-sync tool"
```

---

### Task 18: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Add entry under "Agent-specific commands"**

Edit `CLAUDE.md` — locate the first code block under `## Agent-specific commands` and append after the existing `bun run test:cov` line:

```bash

# Sync Bruno API collection with gateway endpoints
bun run bruno:sync:dry   # preview add/update/archive
bun run bruno:sync       # apply changes
```

Also add a line near the Bruno section (under `## Bruno API Collections`):

```markdown
When adding or renaming gateway endpoints, run `bun run bruno:sync` before opening a PR so the Bruno collection stays in sync. `_archived/` holds orphan files — review and delete periodically.
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: document bruno:sync command in agent commands"
```

---

### Task 19: End-to-end dry run & review

**Files:** none (validation only)

- [ ] **Step 1: Run dry mode on real gateway**

Run: `bun run bruno:sync:dry --verbose > /tmp/bruno-sync-dry.txt 2>&1 && head -200 /tmp/bruno-sync-dry.txt`

Expected: scan counts match reality (~200+ endpoints, ~876 existing .bru files). NEW, UPDATE, ARCHIVED sections populated. No crashes.

- [ ] **Step 2: Spot check three NEW paths**

From the output, pick 3 `Added` entries. For each, verify the corresponding controller has that route by grep:

```bash
grep -rn "good-received-note" apps/backend-gateway/src/application/good-received-note/*.controller.ts | head -5
```

Fix any mismatches by going back to parser or folder-mapper tasks.

- [ ] **Step 3: Spot check three UPDATED paths**

Pick 3 `Updated` entries. Open the existing `.bru` — confirm its URL is actually different from the controller's path (otherwise update shouldn't trigger). If false positives, tighten diff matching.

- [ ] **Step 4: Spot check three ORPHANED paths**

Pick 3 `Archived` entries. Confirm the URL in the `.bru` genuinely has no matching controller. If false positives, likely controller scan missed the file or path normalization differs.

- [ ] **Step 5: Apply live run**

Run: `bun run bruno:sync` (NO --dry-run)

Expected: files written under `apps/bruno/carmen-inventory/`, orphans moved to `_archived/<date>/`, README appended.

- [ ] **Step 6: Verify nothing preserved was touched**

```bash
git diff --name-only apps/bruno/carmen-inventory/environments/ apps/bruno/carmen-inventory/auth/ apps/bruno/carmen-inventory/bruno.json
```

Expected: empty (no modifications).

- [ ] **Step 7: Commit Bruno changes in a dedicated commit**

```bash
git add apps/bruno/carmen-inventory/
git commit -m "chore(bruno): sync collection with gateway endpoints via bruno-sync"
```

---

### Task 20: Run full test suite

**Files:** none

- [ ] **Step 1: Run every bruno-sync test**

Run: `bun test scripts/bruno-sync/__tests__/`

Expected: all tests pass. Count:
- global-prefix: 4
- controller-parser: 13
- dto-parser: 5
- bru-parser: 5
- bru-writer: 11
- folder-mapper: 8
- merger: 6
- diff: 5
- Total: 57

- [ ] **Step 2: Run repo-wide check**

Run: `bun run check-types`

Expected: pass (no new type errors).

- [ ] **Step 3: Commit if any minor fix-ups were needed**

If any type errors surfaced and required fixes, commit as `chore(bruno-sync): fix type errors from check-types`.

---

## Self-Review (author notes)

- **Spec coverage check:** Every section in the spec maps to a task — architecture (Tasks 1, 16), file structure (Task 1), parser (Tasks 2–5, 13–14), generator (Tasks 6–8, 12), reconciler (Tasks 9–11, 15), CLI (Task 16), rollout (Tasks 17–19), testing (Task 20).
- **Placeholder scan:** No "TBD", no "add error handling as appropriate", every step has concrete code or commands.
- **Type consistency:** `EndpointMeta`, `BruSections`, `BruFile`, `DiffResult` defined once in `types.ts` (Task 1) and reused; `fileNameForEndpoint` signature matches across Tasks 7 and 10.
- **Known limitation carried forward:** `@Version()` is not parsed — consistent with spec's documented limitation.
- **One deviation from spec:** spec mentioned `vars:pre-request` auto-population for path params; implementation (Task 7) uses `{{param}}` substitution in URL only and skips the vars block for simplicity. This is a reasonable simplification — revisit if users report missing vars.
