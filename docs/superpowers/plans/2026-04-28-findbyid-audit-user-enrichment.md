# FindById Audit User Enrichment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert raw `created_at / created_by_id / updated_at / updated_by_id / deleted_at / deleted_by_id` fields on opt-in `findById` responses in `backend-gateway` into a unified `audit` object containing nested `created_by / updated_by / deleted_by` user objects (`{ id, name }`), with names resolved from `tb_user` (+ `tb_user_profile`) via a new TCP endpoint at `micro-cluster`.

**Architecture:** Method decorator `@EnrichAuditUsers({ paths? })` stashes options into `AsyncLocalStorage` via a context interceptor. `BaseHttpController.respond()` (made async) calls a singleton `EnrichmentService` that reads ALS, batch-resolves user names through an in-memory LRU+TTL cache backed by a TCP message `{ cmd: 'user.resolveByIds', service: 'user' }` against `CLUSTER_SERVICE`, then mutates targets in place. Pilot: `config_departments.findOne`.

**Tech Stack:** NestJS 11, TypeScript, RxJS, Jest 29, `@nestjs/microservices` TCP, Prisma (`@repo/prisma-shared-schema-platform`), Zod, Bruno.

**Spec:** `docs/superpowers/specs/2026-04-28-findbyid-audit-user-enrichment-design.md`

---

## File Structure

### New files (gateway)

| Path | Responsibility |
|---|---|
| `apps/backend-gateway/src/common/decorators/enrich-audit-users.decorator.ts` | `@EnrichAuditUsers({ paths? })` + `ENRICH_AUDIT_USERS_KEY` + types |
| `apps/backend-gateway/src/common/context/enrich-audit-users.context.ts` | `enrichAuditUsersStorage` ALS instance |
| `apps/backend-gateway/src/common/interceptors/enrich-audit-users-context.interceptor.ts` | Reads decorator metadata → puts options into ALS for the request |
| `apps/backend-gateway/src/common/interceptors/enrich-audit-users-context.interceptor.spec.ts` | Tests the above |
| `apps/backend-gateway/src/common/enrichment/audit-shape.ts` | Pure helpers: `AUDIT_FIELDS`, `collectTargetsByPaths`, `uniqueAuditUserIds`, `mutateToAuditShape` |
| `apps/backend-gateway/src/common/enrichment/audit-shape.spec.ts` | Tests for above |
| `apps/backend-gateway/src/common/enrichment/user-name-cache.service.ts` | LRU+TTL cache for resolved names |
| `apps/backend-gateway/src/common/enrichment/user-name-cache.service.spec.ts` | Tests |
| `apps/backend-gateway/src/common/enrichment/user-name-resolver.service.ts` | Cache-first batch resolver; calls TCP `user.resolveByIds` on misses |
| `apps/backend-gateway/src/common/enrichment/user-name-resolver.service.spec.ts` | Tests |
| `apps/backend-gateway/src/common/enrichment/enrichment.service.ts` | Reads ALS, runs collect→resolve→mutate pipeline |
| `apps/backend-gateway/src/common/enrichment/enrichment.service.spec.ts` | Tests |
| `apps/backend-gateway/src/common/enrichment/enrichment.module.ts` | `@Global()` module providing the three services |
| `apps/backend-gateway/src/common/dto/audit/audit.dto.ts` | Swagger `AuditUserDto` / `AuditDto` + `AuditSchema` (Zod) |
| `apps/backend-gateway/src/common/http/base-http-controller.spec.ts` | Tests for the modified `respond()` |

### Modified files (gateway)

| Path | Change |
|---|---|
| `apps/backend-gateway/src/common/http/base-http-controller.ts` | Add static `enrichmentService` locator; make `respond()` async; call `enrichIfRequested(stdResponse.data)` on ok results |
| `apps/backend-gateway/src/app.module.ts` | Import `EnrichmentModule`; register `EnrichAuditUsersContextInterceptor`; in `onApplicationBootstrap`, set `BaseHttpController.enrichmentService` |
| `apps/backend-gateway/src/common/index.ts` | Re-export `EnrichAuditUsers`, `AuditUserDto`, `AuditDto`, `AuditSchema` |
| `apps/backend-gateway/src/common/dto/department/department.serializer.ts` | Replace explicit `created_at`/`updated_at` with `audit: AuditSchema.optional()` on `DepartmentDetailResponseSchema` |
| `apps/backend-gateway/src/config/config_departments/config_departments.controller.ts` | Add `@EnrichAuditUsers()` to `findOne` |

### New files (micro-cluster)

| Path | Responsibility |
|---|---|
| `apps/micro-cluster/src/cluster/user/format-user-name.ts` | Pure helper: `formatUserName(user)` priority chain |
| `apps/micro-cluster/src/cluster/user/format-user-name.spec.ts` | Tests |

### Modified files (micro-cluster)

| Path | Change |
|---|---|
| `apps/micro-cluster/src/cluster/user/user.service.ts` | Add `resolveByIds(ids: string[])` |
| `apps/micro-cluster/src/cluster/user/user.controller.ts` | Add `@MessagePattern({ cmd: 'user.resolveByIds', service: 'user' })` handler |
| `apps/micro-cluster/src/cluster/user/user.service.spec.ts` | Add tests for `resolveByIds` |
| `apps/micro-cluster/src/cluster/user/user.controller.spec.ts` | Add test for the new pattern handler |

### Modified files (Bruno)

| Path | Change |
|---|---|
| `apps/bruno/carmen-inventory/config/departments/02 - Get Department.bru` | Update example response to use the `audit` shape |

---

## Phase 1 — micro-cluster TCP endpoint

Build the data source first so the gateway can consume it.

### Task 1: `formatUserName` pure helper (TDD)

**Files:**
- Create: `apps/micro-cluster/src/cluster/user/format-user-name.ts`
- Test: `apps/micro-cluster/src/cluster/user/format-user-name.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/micro-cluster/src/cluster/user/format-user-name.spec.ts
import { formatUserName } from './format-user-name';

describe('formatUserName', () => {
  const baseProfile = { firstname: '', middlename: null, lastname: '' };

  it('uses profile firstname + lastname when present', () => {
    expect(
      formatUserName({
        username: 'jdoe',
        email: 'jdoe@example.com',
        alias_name: 'JD',
        profile: { firstname: 'John', middlename: null, lastname: 'Doe' },
      }),
    ).toBe('John Doe');
  });

  it('includes middlename when present', () => {
    expect(
      formatUserName({
        username: 'x',
        email: 'x@x',
        alias_name: null,
        profile: { firstname: 'Jane', middlename: 'B', lastname: 'Roe' },
      }),
    ).toBe('Jane B Roe');
  });

  it('falls back to alias_name when profile is empty', () => {
    expect(
      formatUserName({
        username: 'x',
        email: 'x@x',
        alias_name: 'JD',
        profile: baseProfile,
      }),
    ).toBe('JD');
  });

  it('falls back to alias_name when profile is missing', () => {
    expect(
      formatUserName({
        username: 'x',
        email: 'x@x',
        alias_name: 'JD',
        profile: null,
      }),
    ).toBe('JD');
  });

  it('falls back to username when alias_name is empty/null', () => {
    expect(
      formatUserName({
        username: 'jdoe',
        email: 'x@x',
        alias_name: null,
        profile: baseProfile,
      }),
    ).toBe('jdoe');
  });

  it('falls back to email as last resort', () => {
    expect(
      formatUserName({
        username: '',
        email: 'jdoe@example.com',
        alias_name: null,
        profile: baseProfile,
      }),
    ).toBe('jdoe@example.com');
  });

  it('treats whitespace-only profile fields as empty', () => {
    expect(
      formatUserName({
        username: 'jdoe',
        email: 'x@x',
        alias_name: null,
        profile: { firstname: '   ', middlename: '', lastname: '\t' },
      }),
    ).toBe('jdoe');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/micro-cluster && bun run test -- format-user-name`
Expected: FAIL with `Cannot find module './format-user-name'`.

- [ ] **Step 3: Write the implementation**

```ts
// apps/micro-cluster/src/cluster/user/format-user-name.ts
export interface FormatUserNameInput {
  username: string;
  email: string;
  alias_name?: string | null;
  profile?: {
    firstname?: string | null;
    middlename?: string | null;
    lastname?: string | null;
  } | null;
}

export function formatUserName(user: FormatUserNameInput): string {
  const parts = [user.profile?.firstname, user.profile?.middlename, user.profile?.lastname]
    .map((p) => (p ?? '').trim())
    .filter((p) => p.length > 0);
  if (parts.length > 0) return parts.join(' ');

  const alias = (user.alias_name ?? '').trim();
  if (alias.length > 0) return alias;

  const username = (user.username ?? '').trim();
  if (username.length > 0) return username;

  return user.email;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/micro-cluster && bun run test -- format-user-name`
Expected: PASS, all 7 cases green.

- [ ] **Step 5: Commit**

```bash
git add apps/micro-cluster/src/cluster/user/format-user-name.ts apps/micro-cluster/src/cluster/user/format-user-name.spec.ts
git commit -m "feat(micro-cluster): add formatUserName helper for audit name resolution"
```

### Task 2: `UserService.resolveByIds` (TDD)

**Files:**
- Modify: `apps/micro-cluster/src/cluster/user/user.service.ts`
- Modify: `apps/micro-cluster/src/cluster/user/user.service.spec.ts`

- [ ] **Step 1: Add the failing test**

Open `apps/micro-cluster/src/cluster/user/user.service.spec.ts`. Replace the file contents (the current file only checks `service.toBeDefined()`):

```ts
// apps/micro-cluster/src/cluster/user/user.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  const mockPrisma = {
    tb_user: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    mockPrisma.tb_user.findMany.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: 'KEYCLOAK_SERVICE', useValue: { send: jest.fn() } },
        { provide: 'PRISMA_SYSTEM', useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('resolveByIds', () => {
    it('returns empty array when ids is empty (skips DB call)', async () => {
      const result = await service.resolveByIds([]);
      expect(result).toEqual({ users: [] });
      expect(mockPrisma.tb_user.findMany).not.toHaveBeenCalled();
    });

    it('queries with select + profile include and maps to { id, name }', async () => {
      mockPrisma.tb_user.findMany.mockResolvedValue([
        {
          id: 'u1',
          username: 'jdoe',
          email: 'jdoe@example.com',
          alias_name: 'JD',
          tb_user_profile_tb_user_profile_user_idTotb_user: [
            { firstname: 'John', middlename: null, lastname: 'Doe' },
          ],
        },
        {
          id: 'u2',
          username: 'system',
          email: 'system@example.com',
          alias_name: null,
          tb_user_profile_tb_user_profile_user_idTotb_user: [],
        },
      ]);

      const result = await service.resolveByIds(['u1', 'u2', 'u3']);

      expect(mockPrisma.tb_user.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['u1', 'u2', 'u3'] } },
        select: {
          id: true,
          username: true,
          email: true,
          alias_name: true,
          tb_user_profile_tb_user_profile_user_idTotb_user: {
            select: { firstname: true, middlename: true, lastname: true },
          },
        },
      });
      expect(result).toEqual({
        users: [
          { id: 'u1', name: 'John Doe' },
          { id: 'u2', name: 'system' },
        ],
      });
    });

    it('omits ids that are not found (no Unknown placeholder server-side)', async () => {
      mockPrisma.tb_user.findMany.mockResolvedValue([]);
      const result = await service.resolveByIds(['ghost']);
      expect(result).toEqual({ users: [] });
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/micro-cluster && bun run test -- user.service`
Expected: FAIL with `service.resolveByIds is not a function`.

- [ ] **Step 3: Implement `resolveByIds` in `UserService`**

Open `apps/micro-cluster/src/cluster/user/user.service.ts`. Add the import and method (place the method after `hardDeleteUser`, before the closing brace of the class):

```ts
// add near the top of the file, alongside other imports:
import { formatUserName } from './format-user-name';

// inside the UserService class, append after hardDeleteUser:
  /**
   * Resolve a batch of user ids to display names. Used by the gateway's
   * audit-user enrichment. Returns only ids that exist (callers treat
   * absence as "unknown"). Includes soft-deleted users (no deleted_at filter).
   */
  async resolveByIds(ids: string[]): Promise<{ users: Array<{ id: string; name: string }> }> {
    this.logger.debug({ function: 'resolveByIds', count: ids.length }, UserService.name);

    if (ids.length === 0) {
      return { users: [] };
    }

    const rows = await this.prismaSystem.tb_user.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        username: true,
        email: true,
        alias_name: true,
        tb_user_profile_tb_user_profile_user_idTotb_user: {
          select: { firstname: true, middlename: true, lastname: true },
        },
      },
    });

    const users = rows.map((r) => ({
      id: r.id,
      name: formatUserName({
        username: r.username,
        email: r.email,
        alias_name: r.alias_name,
        profile: r.tb_user_profile_tb_user_profile_user_idTotb_user?.[0] ?? null,
      }),
    }));

    return { users };
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/micro-cluster && bun run test -- user.service`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/micro-cluster/src/cluster/user/user.service.ts apps/micro-cluster/src/cluster/user/user.service.spec.ts
git commit -m "feat(micro-cluster): UserService.resolveByIds for audit name resolution"
```

### Task 3: TCP `MessagePattern` handler `user.resolveByIds` (TDD)

**Files:**
- Modify: `apps/micro-cluster/src/cluster/user/user.controller.ts`
- Modify: `apps/micro-cluster/src/cluster/user/user.controller.spec.ts`

- [ ] **Step 1: Add the failing test**

Open `apps/micro-cluster/src/cluster/user/user.controller.spec.ts`. The current file likely just checks `controller.toBeDefined()`. Replace with:

```ts
// apps/micro-cluster/src/cluster/user/user.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;
  const mockUserService = {
    resolveByIds: jest.fn(),
  };

  beforeEach(async () => {
    mockUserService.resolveByIds.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: mockUserService }],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('resolveByIds', () => {
    it('forwards ids to UserService.resolveByIds and wraps as MicroserviceResponse OK', async () => {
      mockUserService.resolveByIds.mockResolvedValue({
        users: [{ id: 'u1', name: 'John Doe' }],
      });

      const res = await controller.resolveByIds({ ids: ['u1', 'u2'] } as any);

      expect(mockUserService.resolveByIds).toHaveBeenCalledWith(['u1', 'u2']);
      expect(res.response.status).toBe(200);
      expect(res.data).toEqual({ users: [{ id: 'u1', name: 'John Doe' }] });
    });

    it('treats missing ids array as empty', async () => {
      mockUserService.resolveByIds.mockResolvedValue({ users: [] });
      const res = await controller.resolveByIds({} as any);
      expect(mockUserService.resolveByIds).toHaveBeenCalledWith([]);
      expect(res.response.status).toBe(200);
      expect(res.data).toEqual({ users: [] });
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/micro-cluster && bun run test -- user.controller`
Expected: FAIL with `controller.resolveByIds is not a function`.

- [ ] **Step 3: Implement the handler**

Open `apps/micro-cluster/src/cluster/user/user.controller.ts`. Add the new method just before the closing brace of the class:

```ts
  @MessagePattern({ cmd: 'user.resolveByIds', service: 'user' })
  async resolveByIds(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'resolveByIds', count: (payload?.ids ?? []).length },
      UserController.name,
    );
    const ids = Array.isArray(payload?.ids) ? (payload.ids as string[]) : [];
    const data = await this.userService.resolveByIds(ids);
    return {
      response: { status: 200, message: 'OK' } as any,
      data,
    } as MicroserviceResponse;
  }
```

If `MicroservicePayload`'s shape does not include `ids`, treat it as `Record<string, unknown>` at this call site (existing handlers in this file already do similar destructuring).

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/micro-cluster && bun run test -- user.controller`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/micro-cluster/src/cluster/user/user.controller.ts apps/micro-cluster/src/cluster/user/user.controller.spec.ts
git commit -m "feat(micro-cluster): TCP user.resolveByIds handler for audit name resolution"
```

---

## Phase 2 — gateway primitives (no controller wiring yet)

Each component is independently testable; nothing in this phase changes existing endpoint behavior.

### Task 4: `enrichAuditUsersStorage` ALS context

**Files:**
- Create: `apps/backend-gateway/src/common/context/enrich-audit-users.context.ts`

- [ ] **Step 1: Write the file**

```ts
// apps/backend-gateway/src/common/context/enrich-audit-users.context.ts
import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Resolved options for audit-user enrichment, stashed by
 * EnrichAuditUsersContextInterceptor for the duration of an HTTP request.
 * Single source of truth — decorator + interceptor + EnrichmentService all
 * use this type.
 */
export interface EnrichAuditUsersOptions {
  paths: string[];
}

export const enrichAuditUsersStorage =
  new AsyncLocalStorage<EnrichAuditUsersOptions | null>();
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd apps/backend-gateway && bun run check-types 2>/dev/null || bun run build:gateway --noEmit 2>/dev/null || npx tsc --noEmit -p tsconfig.json`
Expected: no errors related to the new file. (If the project lacks `check-types`, use the build command above with `--noEmit`.)

- [ ] **Step 3: Commit**

```bash
git add apps/backend-gateway/src/common/context/enrich-audit-users.context.ts
git commit -m "feat(gateway): add enrichAuditUsersStorage AsyncLocalStorage"
```

### Task 5: `@EnrichAuditUsers` decorator

**Files:**
- Create: `apps/backend-gateway/src/common/decorators/enrich-audit-users.decorator.ts`

- [ ] **Step 1: Write the file**

```ts
// apps/backend-gateway/src/common/decorators/enrich-audit-users.decorator.ts
import { SetMetadata } from '@nestjs/common';
import type { EnrichAuditUsersOptions } from '../context/enrich-audit-users.context';

export const ENRICH_AUDIT_USERS_KEY = 'enrich_audit_users';

export interface EnrichAuditUsersDecoratorOptions {
  /**
   * Paths inside the response.data payload to enrich.
   *  - ''                 → root payload (object) or each element of root array
   *  - 'items'            → each element of payload.items[] (array) or payload.items (object)
   *  - 'items.attachments'→ each payload.items[*].attachments[]
   * Default: [''] (root only). No wildcards or array indices.
   */
  paths?: string[];
}

export const EnrichAuditUsers = (options: EnrichAuditUsersDecoratorOptions = {}) =>
  SetMetadata<string, EnrichAuditUsersOptions>(
    ENRICH_AUDIT_USERS_KEY,
    { paths: options.paths ?? [''] },
  );
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd apps/backend-gateway && npx tsc --noEmit -p tsconfig.json`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/backend-gateway/src/common/decorators/enrich-audit-users.decorator.ts
git commit -m "feat(gateway): add @EnrichAuditUsers decorator"
```

### Task 6: Audit-shape pure helpers (TDD)

**Files:**
- Create: `apps/backend-gateway/src/common/enrichment/audit-shape.ts`
- Test: `apps/backend-gateway/src/common/enrichment/audit-shape.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/backend-gateway/src/common/enrichment/audit-shape.spec.ts
import {
  AUDIT_AT_FIELDS,
  AUDIT_BY_ID_FIELDS,
  collectTargetsByPaths,
  uniqueAuditUserIds,
  mutateToAuditShape,
} from './audit-shape';

describe('audit-shape', () => {
  describe('collectTargetsByPaths', () => {
    it("returns the root object for paths=['']", () => {
      const root = { id: 'a' };
      expect(collectTargetsByPaths(root, [''])).toEqual([root]);
    });

    it("returns array elements when root is array and paths=['']", () => {
      const arr = [{ id: 'a' }, { id: 'b' }];
      expect(collectTargetsByPaths(arr, [''])).toEqual([arr[0], arr[1]]);
    });

    it('descends into named array field', () => {
      const root = { items: [{ id: 'i1' }, { id: 'i2' }] };
      expect(collectTargetsByPaths(root, ['items'])).toEqual([
        root.items[0],
        root.items[1],
      ]);
    });

    it('descends into nested array of arrays', () => {
      const root = {
        items: [{ attachments: [{ id: 'a1' }, { id: 'a2' }] }, { attachments: [{ id: 'a3' }] }],
      };
      expect(collectTargetsByPaths(root, ['items.attachments'])).toEqual([
        root.items[0].attachments[0],
        root.items[0].attachments[1],
        root.items[1].attachments[0],
      ]);
    });

    it('handles a single object at a named field', () => {
      const root = { meta: { id: 'm1' } };
      expect(collectTargetsByPaths(root, ['meta'])).toEqual([root.meta]);
    });

    it('skips missing or null paths silently', () => {
      const root = { id: 'a' };
      expect(collectTargetsByPaths(root, ['items', 'nope.x'])).toEqual([]);
    });

    it('combines multiple paths', () => {
      const root = { items: [{ id: 'i1' }] };
      const out = collectTargetsByPaths(root, ['', 'items']);
      expect(out).toEqual([root, root.items[0]]);
    });

    it('returns empty array for null/undefined payload', () => {
      expect(collectTargetsByPaths(null, [''])).toEqual([]);
      expect(collectTargetsByPaths(undefined, [''])).toEqual([]);
    });
  });

  describe('uniqueAuditUserIds', () => {
    it('collects and dedupes ids across the six audit-by fields', () => {
      const targets = [
        { created_by_id: 'u1', updated_by_id: 'u2', deleted_by_id: null },
        { created_by_id: 'u1', updated_by_id: 'u3' }, // u1 dup
        { other: 'unrelated' },
      ];
      expect(uniqueAuditUserIds(targets).sort()).toEqual(['u1', 'u2', 'u3']);
    });

    it('ignores non-string and empty values', () => {
      const targets = [
        { created_by_id: '', updated_by_id: 0, deleted_by_id: null },
        { created_by_id: undefined },
      ];
      expect(uniqueAuditUserIds(targets)).toEqual([]);
    });
  });

  describe('mutateToAuditShape', () => {
    const map = new Map<string, string | null>([
      ['u1', 'John Doe'],
      ['u2', null], // resolved to "Unknown"
    ]);

    it('moves *_at and converts *_by_id into nested audit object', () => {
      const t: Record<string, unknown> = {
        id: 'x',
        name: 'thing',
        created_at: '2026-04-01T00:00:00Z',
        created_by_id: 'u1',
        updated_at: '2026-04-15T00:00:00Z',
        updated_by_id: 'u2',
        deleted_at: null,
        deleted_by_id: null,
      };
      mutateToAuditShape(t, map);
      expect(t).toEqual({
        id: 'x',
        name: 'thing',
        audit: {
          created_at: '2026-04-01T00:00:00Z',
          created_by: { id: 'u1', name: 'John Doe' },
          updated_at: '2026-04-15T00:00:00Z',
          updated_by: { id: 'u2', name: 'Unknown' },
          deleted_at: null,
          deleted_by: null,
        },
      });
    });

    it('uses Unknown when id is present but resolver returned no entry', () => {
      const t: Record<string, unknown> = { created_by_id: 'ghost', created_at: '2026-04-01T00:00:00Z' };
      mutateToAuditShape(t, new Map());
      expect(t).toEqual({
        audit: {
          created_at: '2026-04-01T00:00:00Z',
          created_by: { id: 'ghost', name: 'Unknown' },
          updated_at: null,
          updated_by: null,
          deleted_at: null,
          deleted_by: null,
        },
      });
    });

    it('does not add audit field when target has none of the six fields', () => {
      const t: Record<string, unknown> = { id: 'x', name: 'thing' };
      mutateToAuditShape(t, map);
      expect(t).toEqual({ id: 'x', name: 'thing' });
    });

    it('handles partial fields (only created_*) — fills others as null', () => {
      const t: Record<string, unknown> = {
        id: 'x',
        created_at: '2026-04-01T00:00:00Z',
        created_by_id: 'u1',
      };
      mutateToAuditShape(t, map);
      expect(t).toEqual({
        id: 'x',
        audit: {
          created_at: '2026-04-01T00:00:00Z',
          created_by: { id: 'u1', name: 'John Doe' },
          updated_at: null,
          updated_by: null,
          deleted_at: null,
          deleted_by: null,
        },
      });
    });

    it('keeps audit.*_at = null when *_by_id present but *_at absent', () => {
      const t: Record<string, unknown> = { created_by_id: 'u1' };
      mutateToAuditShape(t, map);
      expect(t).toEqual({
        audit: {
          created_at: null,
          created_by: { id: 'u1', name: 'John Doe' },
          updated_at: null,
          updated_by: null,
          deleted_at: null,
          deleted_by: null,
        },
      });
    });

    it('is a no-op when target is not a plain object', () => {
      expect(() => mutateToAuditShape(null as any, map)).not.toThrow();
      expect(() => mutateToAuditShape('x' as any, map)).not.toThrow();
    });
  });

  describe('AUDIT_*_FIELDS exports', () => {
    it('exposes the canonical field name lists', () => {
      expect(AUDIT_AT_FIELDS).toEqual(['created_at', 'updated_at', 'deleted_at']);
      expect(AUDIT_BY_ID_FIELDS).toEqual(['created_by_id', 'updated_by_id', 'deleted_by_id']);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/backend-gateway && bun run test -- audit-shape`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the helpers**

```ts
// apps/backend-gateway/src/common/enrichment/audit-shape.ts
export const AUDIT_AT_FIELDS = ['created_at', 'updated_at', 'deleted_at'] as const;
export const AUDIT_BY_ID_FIELDS = ['created_by_id', 'updated_by_id', 'deleted_by_id'] as const;

const KIND_MAP = [
  { at: 'created_at', byId: 'created_by_id', by: 'created_by' },
  { at: 'updated_at', byId: 'updated_by_id', by: 'updated_by' },
  { at: 'deleted_at', byId: 'deleted_by_id', by: 'deleted_by' },
] as const;

export type EnrichmentTarget = Record<string, unknown>;

function isPlainObject(value: unknown): value is EnrichmentTarget {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function collectTargetsByPaths(
  payload: unknown,
  paths: string[],
): EnrichmentTarget[] {
  if (payload == null) return [];
  const out: EnrichmentTarget[] = [];
  for (const path of paths) {
    collectAt(payload, path === '' ? [] : path.split('.'), 0, out);
  }
  return out;
}

function collectAt(node: unknown, parts: string[], idx: number, out: EnrichmentTarget[]): void {
  if (node == null) return;

  if (idx === parts.length) {
    if (Array.isArray(node)) {
      for (const el of node) {
        if (isPlainObject(el)) out.push(el);
      }
    } else if (isPlainObject(node)) {
      out.push(node);
    }
    return;
  }

  if (Array.isArray(node)) {
    for (const el of node) collectAt(el, parts, idx, out);
    return;
  }

  if (!isPlainObject(node)) return;
  const next = node[parts[idx]];
  if (next == null) return;
  collectAt(next, parts, idx + 1, out);
}

export function uniqueAuditUserIds(targets: EnrichmentTarget[]): string[] {
  const set = new Set<string>();
  for (const t of targets) {
    if (!isPlainObject(t)) continue;
    for (const f of AUDIT_BY_ID_FIELDS) {
      const v = t[f];
      if (typeof v === 'string' && v.length > 0) set.add(v);
    }
  }
  return Array.from(set);
}

export function mutateToAuditShape(
  target: EnrichmentTarget,
  nameMap: Map<string, string | null>,
): void {
  if (!isPlainObject(target)) return;

  const hasAny = KIND_MAP.some(({ at, byId }) => at in target || byId in target);
  if (!hasAny) return;

  const audit: Record<string, unknown> = {};
  for (const { at, byId, by } of KIND_MAP) {
    const atVal = at in target ? target[at] : null;
    const byIdVal = target[byId];
    audit[at] = atVal ?? null;

    if (typeof byIdVal === 'string' && byIdVal.length > 0) {
      const resolved = nameMap.get(byIdVal);
      audit[by] = { id: byIdVal, name: resolved ?? 'Unknown' };
    } else {
      audit[by] = null;
    }

    delete target[at];
    delete target[byId];
  }
  target.audit = audit;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/backend-gateway && bun run test -- audit-shape`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/backend-gateway/src/common/enrichment/audit-shape.ts apps/backend-gateway/src/common/enrichment/audit-shape.spec.ts
git commit -m "feat(gateway): add audit-shape helpers for findById enrichment"
```

### Task 7: `UserNameCacheService` (TDD)

**Files:**
- Create: `apps/backend-gateway/src/common/enrichment/user-name-cache.service.ts`
- Test: `apps/backend-gateway/src/common/enrichment/user-name-cache.service.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/backend-gateway/src/common/enrichment/user-name-cache.service.spec.ts
import { UserNameCacheService } from './user-name-cache.service';

describe('UserNameCacheService', () => {
  let cache: UserNameCacheService;
  let now = 0;

  beforeEach(() => {
    now = 1_000_000;
    jest.spyOn(Date, 'now').mockImplementation(() => now);
    cache = new UserNameCacheService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns undefined for missing keys', () => {
    expect(cache.get('u1')).toBeUndefined();
  });

  it('returns the stored value before TTL expires', () => {
    cache.set('u1', 'John');
    now += 30_000;
    expect(cache.get('u1')).toBe('John');
  });

  it('returns undefined and evicts after TTL expires', () => {
    cache.set('u1', 'John');
    now += 60_001;
    expect(cache.get('u1')).toBeUndefined();
    // re-set should work after eviction
    cache.set('u1', 'John2');
    expect(cache.get('u1')).toBe('John2');
  });

  it('caches null (unknown) like any other value', () => {
    cache.set('u1', null);
    expect(cache.get('u1')).toBeNull();
  });

  it('LRU evicts the oldest entry when over maxEntries', () => {
    const c = new UserNameCacheService({ maxEntries: 3 });
    c.set('a', 'A');
    c.set('b', 'B');
    c.set('c', 'C');
    c.get('a'); // touch -> a is now most recent (b is oldest)
    c.set('d', 'D'); // should evict b
    expect(c.get('a')).toBe('A');
    expect(c.get('b')).toBeUndefined();
    expect(c.get('c')).toBe('C');
    expect(c.get('d')).toBe('D');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/backend-gateway && bun run test -- user-name-cache`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the service**

```ts
// apps/backend-gateway/src/common/enrichment/user-name-cache.service.ts
import { Injectable } from '@nestjs/common';

export interface UserNameCacheConfig {
  ttlMs?: number;
  maxEntries?: number;
}

interface Entry {
  value: string | null;
  expiresAt: number;
}

@Injectable()
export class UserNameCacheService {
  private readonly ttlMs: number;
  private readonly maxEntries: number;
  private readonly store = new Map<string, Entry>();

  constructor(config: UserNameCacheConfig = {}) {
    this.ttlMs = config.ttlMs ?? 60_000;
    this.maxEntries = config.maxEntries ?? 10_000;
  }

  get(id: string): string | null | undefined {
    const e = this.store.get(id);
    if (!e) return undefined;
    if (e.expiresAt < Date.now()) {
      this.store.delete(id);
      return undefined;
    }
    this.store.delete(id);
    this.store.set(id, e); // LRU touch
    return e.value;
  }

  set(id: string, value: string | null): void {
    if (this.store.size >= this.maxEntries) {
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) this.store.delete(oldest);
    }
    this.store.set(id, { value, expiresAt: Date.now() + this.ttlMs });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/backend-gateway && bun run test -- user-name-cache`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/backend-gateway/src/common/enrichment/user-name-cache.service.ts apps/backend-gateway/src/common/enrichment/user-name-cache.service.spec.ts
git commit -m "feat(gateway): UserNameCacheService LRU+TTL for audit name resolution"
```

### Task 8: `UserNameResolverService` (TDD)

**Files:**
- Create: `apps/backend-gateway/src/common/enrichment/user-name-resolver.service.ts`
- Test: `apps/backend-gateway/src/common/enrichment/user-name-resolver.service.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/backend-gateway/src/common/enrichment/user-name-resolver.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { UserNameResolverService } from './user-name-resolver.service';
import { UserNameCacheService } from './user-name-cache.service';

describe('UserNameResolverService', () => {
  let service: UserNameResolverService;
  let cache: UserNameCacheService;
  const mockClient = { send: jest.fn() };

  beforeEach(async () => {
    mockClient.send.mockReset();
    cache = new UserNameCacheService();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserNameResolverService,
        { provide: UserNameCacheService, useValue: cache },
        { provide: 'CLUSTER_SERVICE', useValue: mockClient },
      ],
    }).compile();
    service = module.get<UserNameResolverService>(UserNameResolverService);
  });

  it('returns empty map for empty ids without TCP call', async () => {
    const out = await service.resolveMany([]);
    expect(out.size).toBe(0);
    expect(mockClient.send).not.toHaveBeenCalled();
  });

  it('cache hit: returns cached values, no TCP call', async () => {
    cache.set('u1', 'John');
    cache.set('u2', null);
    const out = await service.resolveMany(['u1', 'u2']);
    expect(out.get('u1')).toBe('John');
    expect(out.get('u2')).toBeNull();
    expect(mockClient.send).not.toHaveBeenCalled();
  });

  it('cache miss: fetches and caches found + unknown ids', async () => {
    mockClient.send.mockReturnValue(
      of({
        response: { status: 200, message: 'OK' },
        data: { users: [{ id: 'u1', name: 'John' }] },
      }),
    );
    const out = await service.resolveMany(['u1', 'u2']);
    expect(mockClient.send).toHaveBeenCalledWith(
      { cmd: 'user.resolveByIds', service: 'user' },
      expect.objectContaining({ ids: ['u1', 'u2'] }),
    );
    expect(out.get('u1')).toBe('John');
    expect(out.get('u2')).toBeNull();
    // cached for next call
    mockClient.send.mockClear();
    await service.resolveMany(['u1', 'u2']);
    expect(mockClient.send).not.toHaveBeenCalled();
  });

  it('partial hit: only sends missing ids', async () => {
    cache.set('u1', 'John');
    mockClient.send.mockReturnValue(
      of({ response: { status: 200, message: 'OK' }, data: { users: [{ id: 'u2', name: 'Jane' }] } }),
    );
    const out = await service.resolveMany(['u1', 'u2']);
    expect(mockClient.send).toHaveBeenCalledWith(
      { cmd: 'user.resolveByIds', service: 'user' },
      expect.objectContaining({ ids: ['u2'] }),
    );
    expect(out.get('u1')).toBe('John');
    expect(out.get('u2')).toBe('Jane');
  });

  it('TCP error: marks all missing as null and does not throw', async () => {
    mockClient.send.mockReturnValue(throwError(() => new Error('TCP timeout')));
    const out = await service.resolveMany(['u1']);
    expect(out.get('u1')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/backend-gateway && bun run test -- user-name-resolver`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the service**

```ts
// apps/backend-gateway/src/common/enrichment/user-name-resolver.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
import { UserNameCacheService } from './user-name-cache.service';

interface ResolveByIdsResponse {
  response: { status: number; message: string };
  data: { users: Array<{ id: string; name: string }> };
}

@Injectable()
export class UserNameResolverService {
  private readonly logger = new BackendLogger(UserNameResolverService.name);

  constructor(
    @Inject('CLUSTER_SERVICE') private readonly client: ClientProxy,
    private readonly cache: UserNameCacheService,
  ) {}

  async resolveMany(ids: string[]): Promise<Map<string, string | null>> {
    const result = new Map<string, string | null>();
    if (ids.length === 0) return result;

    const missing: string[] = [];
    for (const id of ids) {
      const cached = this.cache.get(id);
      if (cached !== undefined) {
        result.set(id, cached);
      } else {
        missing.push(id);
      }
    }

    if (missing.length === 0) return result;

    try {
      const resp = await firstValueFrom(
        this.client.send<ResolveByIdsResponse>(
          { cmd: 'user.resolveByIds', service: 'user' },
          { ids: missing, ...getGatewayRequestContext() },
        ),
      );
      const users = resp?.data?.users ?? [];
      const found = new Set<string>();
      for (const u of users) {
        this.cache.set(u.id, u.name);
        result.set(u.id, u.name);
        found.add(u.id);
      }
      for (const id of missing) {
        if (!found.has(id)) {
          this.cache.set(id, null);
          result.set(id, null);
        }
      }
    } catch (err) {
      this.logger.warn(
        { err, count: missing.length },
        'user.resolveByIds failed; treating ids as unknown',
      );
      for (const id of missing) result.set(id, null);
    }
    return result;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/backend-gateway && bun run test -- user-name-resolver`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/backend-gateway/src/common/enrichment/user-name-resolver.service.ts apps/backend-gateway/src/common/enrichment/user-name-resolver.service.spec.ts
git commit -m "feat(gateway): UserNameResolverService with cache + TCP CLUSTER_SERVICE"
```

### Task 9: `EnrichAuditUsersContextInterceptor` (TDD)

**Files:**
- Create: `apps/backend-gateway/src/common/interceptors/enrich-audit-users-context.interceptor.ts`
- Test: `apps/backend-gateway/src/common/interceptors/enrich-audit-users-context.interceptor.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/backend-gateway/src/common/interceptors/enrich-audit-users-context.interceptor.spec.ts
import { Reflector } from '@nestjs/core';
import { firstValueFrom, of } from 'rxjs';
import { EnrichAuditUsersContextInterceptor } from './enrich-audit-users-context.interceptor';
import { ENRICH_AUDIT_USERS_KEY } from '../decorators/enrich-audit-users.decorator';
import { enrichAuditUsersStorage } from '../context/enrich-audit-users.context';

function makeCtx(handlerMeta: unknown, type: 'http' | 'rpc' = 'http'): any {
  const handler = () => undefined;
  Reflect.defineMetadata(ENRICH_AUDIT_USERS_KEY, handlerMeta, handler);
  return {
    getType: () => type,
    getHandler: () => handler,
  };
}

describe('EnrichAuditUsersContextInterceptor', () => {
  let interceptor: EnrichAuditUsersContextInterceptor;

  beforeEach(() => {
    interceptor = new EnrichAuditUsersContextInterceptor(new Reflector());
  });

  it('passes through and sets ALS = null when handler has no decorator', async () => {
    const ctx = makeCtx(undefined);
    let observedAls: unknown = 'unset';
    const next = {
      handle: () => of(null).pipe(),
    };
    // observe ALS during downstream subscription
    const probe = {
      handle: () => {
        observedAls = enrichAuditUsersStorage.getStore() ?? null;
        return of('value');
      },
    };
    await firstValueFrom(interceptor.intercept(ctx, probe as any));
    expect(observedAls).toBeNull();
  });

  it('sets ALS to options when handler has decorator', async () => {
    const ctx = makeCtx({ paths: ['', 'items'] });
    let observed: unknown = null;
    const probe = {
      handle: () => {
        observed = enrichAuditUsersStorage.getStore();
        return of('ok');
      },
    };
    await firstValueFrom(interceptor.intercept(ctx, probe as any));
    expect(observed).toEqual({ paths: ['', 'items'] });
  });

  it('is a pass-through for non-http context (e.g. rpc)', async () => {
    const ctx = makeCtx({ paths: [''] }, 'rpc');
    let observed: unknown = 'unset';
    const probe = {
      handle: () => {
        observed = enrichAuditUsersStorage.getStore();
        return of('ok');
      },
    };
    const out = await firstValueFrom(interceptor.intercept(ctx, probe as any));
    expect(out).toBe('ok');
    expect(observed).toBe('unset'); // ALS not entered
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/backend-gateway && bun run test -- enrich-audit-users-context.interceptor`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the interceptor**

```ts
// apps/backend-gateway/src/common/interceptors/enrich-audit-users-context.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, from } from 'rxjs';
import { ENRICH_AUDIT_USERS_KEY } from '../decorators/enrich-audit-users.decorator';
import {
  enrichAuditUsersStorage,
  EnrichAuditUsersOptions,
} from '../context/enrich-audit-users.context';

@Injectable()
export class EnrichAuditUsersContextInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const meta =
      this.reflector.get<EnrichAuditUsersOptions | undefined>(
        ENRICH_AUDIT_USERS_KEY,
        context.getHandler(),
      ) ?? null;

    return from(
      enrichAuditUsersStorage.run(meta, () => {
        return new Promise<unknown>((resolve, reject) => {
          next.handle().subscribe({
            next: (value) => resolve(value),
            error: (err) => reject(err),
            complete: () => {},
          });
        });
      }),
    );
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/backend-gateway && bun run test -- enrich-audit-users-context.interceptor`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/backend-gateway/src/common/interceptors/enrich-audit-users-context.interceptor.ts apps/backend-gateway/src/common/interceptors/enrich-audit-users-context.interceptor.spec.ts
git commit -m "feat(gateway): EnrichAuditUsersContextInterceptor stashes options into ALS"
```

### Task 10: `EnrichmentService` (TDD)

**Files:**
- Create: `apps/backend-gateway/src/common/enrichment/enrichment.service.ts`
- Test: `apps/backend-gateway/src/common/enrichment/enrichment.service.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/backend-gateway/src/common/enrichment/enrichment.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { EnrichmentService } from './enrichment.service';
import { UserNameResolverService } from './user-name-resolver.service';
import { enrichAuditUsersStorage } from '../context/enrich-audit-users.context';

describe('EnrichmentService', () => {
  let service: EnrichmentService;
  const resolver = { resolveMany: jest.fn() };

  beforeEach(async () => {
    resolver.resolveMany.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnrichmentService,
        { provide: UserNameResolverService, useValue: resolver },
      ],
    }).compile();
    service = module.get<EnrichmentService>(EnrichmentService);
  });

  it('no ALS context: returns payload unchanged', async () => {
    const payload = { id: 'a', created_by_id: 'u1' };
    const out = await service.enrichIfRequested(payload);
    expect(out).toBe(payload);
    expect(resolver.resolveMany).not.toHaveBeenCalled();
  });

  it('null payload: returns null', async () => {
    const out = await enrichAuditUsersStorage.run({ paths: [''] }, () =>
      service.enrichIfRequested(null),
    );
    expect(out).toBeNull();
    expect(resolver.resolveMany).not.toHaveBeenCalled();
  });

  it('ALS present + targets present: enriches and returns the same payload', async () => {
    resolver.resolveMany.mockResolvedValue(new Map([['u1', 'John']]));
    const payload = {
      id: 'x',
      created_by_id: 'u1',
      created_at: '2026-04-01T00:00:00Z',
    };
    const out = await enrichAuditUsersStorage.run({ paths: [''] }, () =>
      service.enrichIfRequested(payload),
    );
    expect(out).toBe(payload);
    expect((payload as any).audit.created_by).toEqual({ id: 'u1', name: 'John' });
    expect((payload as any).created_by_id).toBeUndefined();
    expect(resolver.resolveMany).toHaveBeenCalledWith(['u1']);
  });

  it('targets empty: returns payload, does not call resolver', async () => {
    const payload = { id: 'x', name: 'no audit fields here' };
    const out = await enrichAuditUsersStorage.run({ paths: [''] }, () =>
      service.enrichIfRequested(payload),
    );
    expect(out).toBe(payload);
    expect(resolver.resolveMany).not.toHaveBeenCalled();
    expect((payload as any).audit).toBeUndefined();
  });

  it('resolver throws: returns original payload (does not propagate)', async () => {
    resolver.resolveMany.mockRejectedValue(new Error('boom'));
    const payload = { id: 'x', created_by_id: 'u1', created_at: 't' };
    const out = await enrichAuditUsersStorage.run({ paths: [''] }, () =>
      service.enrichIfRequested(payload),
    );
    expect(out).toBe(payload);
    // payload not mutated because mutation step never ran
    expect((payload as any).audit).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/backend-gateway && bun run test -- enrichment.service`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the service**

```ts
// apps/backend-gateway/src/common/enrichment/enrichment.service.ts
import { Injectable } from '@nestjs/common';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { enrichAuditUsersStorage } from '../context/enrich-audit-users.context';
import {
  collectTargetsByPaths,
  uniqueAuditUserIds,
  mutateToAuditShape,
} from './audit-shape';
import { UserNameResolverService } from './user-name-resolver.service';

@Injectable()
export class EnrichmentService {
  private readonly logger = new BackendLogger(EnrichmentService.name);

  constructor(private readonly resolver: UserNameResolverService) {}

  async enrichIfRequested(payload: unknown): Promise<unknown> {
    const options = enrichAuditUsersStorage.getStore();
    if (!options || payload == null) return payload;

    try {
      const targets = collectTargetsByPaths(payload, options.paths ?? ['']);
      if (targets.length === 0) return payload;

      const ids = uniqueAuditUserIds(targets);
      const nameMap = await this.resolver.resolveMany(ids);

      for (const target of targets) {
        mutateToAuditShape(target, nameMap);
      }
      return payload;
    } catch (err) {
      this.logger.warn(
        { err },
        'audit user enrichment failed; returning original payload',
      );
      return payload;
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/backend-gateway && bun run test -- enrichment.service`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/backend-gateway/src/common/enrichment/enrichment.service.ts apps/backend-gateway/src/common/enrichment/enrichment.service.spec.ts
git commit -m "feat(gateway): EnrichmentService driving findById audit enrichment"
```

### Task 11: `EnrichmentModule` (DI wiring, no test)

**Files:**
- Create: `apps/backend-gateway/src/common/enrichment/enrichment.module.ts`

- [ ] **Step 1: Write the file**

```ts
// apps/backend-gateway/src/common/enrichment/enrichment.module.ts
import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envConfig } from 'src/libs/config.env';
import { UserNameCacheService } from './user-name-cache.service';
import { UserNameResolverService } from './user-name-resolver.service';
import { EnrichmentService } from './enrichment.service';

@Global()
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'CLUSTER_SERVICE',
        transport: Transport.TCP,
        options: {
          host: envConfig.CLUSTER_SERVICE_HOST,
          port: Number(envConfig.CLUSTER_SERVICE_TCP_PORT),
        },
      },
    ]),
  ],
  providers: [UserNameCacheService, UserNameResolverService, EnrichmentService],
  exports: [EnrichmentService],
})
export class EnrichmentModule {}
```

- [ ] **Step 2: Verify build**

Run: `cd apps/backend-gateway && npx tsc --noEmit -p tsconfig.json`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/backend-gateway/src/common/enrichment/enrichment.module.ts
git commit -m "feat(gateway): EnrichmentModule wiring CLUSTER_SERVICE TCP client"
```

---

## Phase 3 — base controller integration & wiring

### Task 12: Modify `BaseHttpController.respond()` (TDD)

**Files:**
- Modify: `apps/backend-gateway/src/common/http/base-http-controller.ts`
- Create: `apps/backend-gateway/src/common/http/base-http-controller.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/backend-gateway/src/common/http/base-http-controller.spec.ts
import { HttpStatus } from '@nestjs/common';
import { BaseHttpController } from './base-http-controller';
import { Result } from '../result/result';

class DummyController extends BaseHttpController {
  callRespond(...args: Parameters<BaseHttpController['respond']>) {
    return (this as any).respond(...args);
  }
}

function mockRes() {
  const res: any = {};
  res.status = jest.fn(() => res);
  res.send = jest.fn(() => res);
  return res;
}

describe('BaseHttpController.respond', () => {
  let ctrl: DummyController;

  beforeEach(() => {
    ctrl = new DummyController();
    BaseHttpController.enrichmentService = null;
  });

  it('sends ok Result without enrichment when locator is null', async () => {
    const res = mockRes();
    const ok = Result.ok({ id: 'x' });
    await ctrl.callRespond(res, ok);
    expect(res.status).toHaveBeenCalled();
    expect(res.send).toHaveBeenCalledTimes(1);
    const sent = res.send.mock.calls[0][0];
    expect(sent.data).toEqual({ id: 'x' });
  });

  it('calls enrichmentService.enrichIfRequested on ok Result data', async () => {
    const enrich = jest.fn().mockResolvedValue({ id: 'x', audit: { fake: true } });
    BaseHttpController.enrichmentService = { enrichIfRequested: enrich };

    const res = mockRes();
    const ok = Result.ok({ id: 'x' });
    await ctrl.callRespond(res, ok);

    expect(enrich).toHaveBeenCalledWith({ id: 'x' });
    const sent = res.send.mock.calls[0][0];
    expect(sent.data).toEqual({ id: 'x', audit: { fake: true } });
  });

  it('does not call enrich on error Result', async () => {
    const enrich = jest.fn().mockResolvedValue(undefined);
    BaseHttpController.enrichmentService = { enrichIfRequested: enrich };

    const res = mockRes();
    const err = Result.error('nope', 0 as any);
    await ctrl.callRespond(res, err);

    expect(enrich).not.toHaveBeenCalled();
  });

  it('passes through a non-Result body untouched', async () => {
    const enrich = jest.fn().mockResolvedValue({ touched: true });
    BaseHttpController.enrichmentService = { enrichIfRequested: enrich };

    const res = mockRes();
    await ctrl.callRespond(res, { foo: 'bar' });
    expect(enrich).not.toHaveBeenCalled();
    expect(res.send).toHaveBeenCalledWith({ foo: 'bar' });
  });

  it('respects customStatus override on ok results', async () => {
    const res = mockRes();
    await ctrl.callRespond(res, Result.ok({}), HttpStatus.CREATED);
    expect(res.status).toHaveBeenCalledWith(HttpStatus.CREATED);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/backend-gateway && bun run test -- base-http-controller`
Expected: FAIL — `BaseHttpController.enrichmentService` is undefined / `respond` is not async / second test fails because enrich is not called.

- [ ] **Step 3: Modify `base-http-controller.ts`**

Replace the file contents:

```ts
// apps/backend-gateway/src/common/http/base-http-controller.ts
import { Response } from 'express';
import { Result } from '../result/result';
import { HttpStatus } from '@nestjs/common/enums/http-status.enum';
import { StdResponse } from '../std-response/std-response';

export interface AuditEnrichmentService {
  enrichIfRequested(payload: unknown): Promise<unknown>;
}

/**
 * Base HTTP controller with standardized response handling.
 * คอนโทรลเลอร์ HTTP พื้นฐานพร้อมการจัดการการตอบกลับมาตรฐาน
 *
 * Audit-user enrichment: when a handler is decorated with @EnrichAuditUsers,
 * the EnrichAuditUsersContextInterceptor stashes options into AsyncLocalStorage.
 * If `BaseHttpController.enrichmentService` is set (wired in app bootstrap),
 * `respond()` will call it on the ok-result `data` before sending.
 */
export abstract class BaseHttpController {
  /** Set during AppModule.onApplicationBootstrap. Null in narrow unit tests. */
  static enrichmentService: AuditEnrichmentService | null = null;

  protected async respond(
    response: Response,
    result: Result<unknown> | unknown,
    customStatus?: HttpStatus,
  ): Promise<void> {
    if (
      result &&
      typeof result === 'object' &&
      'isOk' in result &&
      typeof (result as any).isOk === 'function'
    ) {
      const typedResult = result as Result<unknown, unknown>;
      const stdResponse = StdResponse.fromResult<unknown, unknown>(typedResult);

      if (typedResult.isOk() && BaseHttpController.enrichmentService) {
        const enriched = await BaseHttpController.enrichmentService.enrichIfRequested(
          (stdResponse as { data: unknown }).data,
        );
        (stdResponse as { data: unknown }).data = enriched;
      }

      const status = typedResult.isOk()
        ? (customStatus ?? stdResponse.status)
        : stdResponse.status;
      response.status(status).send(stdResponse);
    } else {
      const status = customStatus ?? (result as any)?.status ?? HttpStatus.OK;
      response.status(status).send(result);
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/backend-gateway && bun run test -- base-http-controller`
Expected: PASS.

Run the full gateway test suite once to confirm no regression in existing controllers:

`cd apps/backend-gateway && bun run test`

Expected: all existing tests still pass. Existing call sites already do not await `respond()` and rely on it being fire-and-forget; that behavior is preserved (the function still resolves to `void`).

- [ ] **Step 5: Commit**

```bash
git add apps/backend-gateway/src/common/http/base-http-controller.ts apps/backend-gateway/src/common/http/base-http-controller.spec.ts
git commit -m "feat(gateway): respond() awaits audit-user enrichment via static locator"
```

### Task 13: Wire `EnrichmentModule`, interceptor, and bootstrap locator

**Files:**
- Modify: `apps/backend-gateway/src/app.module.ts`
- Modify: `apps/backend-gateway/src/common/index.ts`

- [ ] **Step 1: Re-export decorator + types from `common/index.ts`**

Open `apps/backend-gateway/src/common/index.ts` and append:

```ts
export * from './decorators/enrich-audit-users.decorator';
export * from './context/enrich-audit-users.context';
```

- [ ] **Step 2: Edit `app.module.ts`**

Apply these changes:

1. Add imports near the existing imports:
```ts
import { ModuleRef } from '@nestjs/core';
import { OnApplicationBootstrap } from '@nestjs/common';
import { EnrichmentModule } from './common/enrichment/enrichment.module';
import { EnrichmentService } from './common/enrichment/enrichment.service';
import { EnrichAuditUsersContextInterceptor } from './common/interceptors/enrich-audit-users-context.interceptor';
import { BaseHttpController } from './common/http/base-http-controller';
```

2. Add `EnrichmentModule` to the `imports` array (right after `DatabaseModule`, before `ClientsModule.register`).

3. Add a new global interceptor entry to `providers`:
```ts
{
  provide: APP_INTERCEPTOR,
  useClass: EnrichAuditUsersContextInterceptor,
},
```
Place it **after** `GatewayRequestContextInterceptor` and `ZodSerializerInterceptor` (so it is the last APP_INTERCEPTOR entry).

4. Convert `AppModule` to implement `OnApplicationBootstrap` and inject `ModuleRef`:
```ts
export class AppModule implements OnApplicationBootstrap {
  constructor(private readonly moduleRef: ModuleRef) {}

  onApplicationBootstrap(): void {
    // Wire EnrichmentService into BaseHttpController via static locator so that
    // any controller extending it can opt-in via @EnrichAuditUsers without
    // forcing every constructor to inject the service.
    BaseHttpController.enrichmentService = this.moduleRef.get(
      EnrichmentService,
      { strict: false },
    );
  }
}
```

- [ ] **Step 3: Verify build & smoke-start**

```bash
cd apps/backend-gateway && bun run build
```
Expected: build passes.

Optional smoke (only if a `.env` is configured):
```bash
cd apps/backend-gateway && bun run dev
```
Expected: `Nest application successfully started` with no errors mentioning `EnrichmentService` or `EnrichAuditUsersContextInterceptor`. Stop with Ctrl-C.

- [ ] **Step 4: Run all gateway tests**

```bash
cd apps/backend-gateway && bun run test
```
Expected: all existing tests still pass.

- [ ] **Step 5: Commit**

```bash
git add apps/backend-gateway/src/app.module.ts apps/backend-gateway/src/common/index.ts
git commit -m "feat(gateway): register EnrichmentModule, interceptor, and bootstrap locator"
```

---

## Phase 4 — pilot integration: `config_departments.findOne`

End-to-end opt-in for one endpoint, including DTO + Bruno + manual smoke.

### Task 14: `AuditUserDto` / `AuditDto` + `AuditSchema` (Zod)

**Files:**
- Create: `apps/backend-gateway/src/common/dto/audit/audit.dto.ts`
- Modify: `apps/backend-gateway/src/common/dto/index.ts` (re-export)

- [ ] **Step 1: Write the file**

```ts
// apps/backend-gateway/src/common/dto/audit/audit.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export class AuditUserDto {
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000000' }) id!: string;
  @ApiProperty({ example: 'John Doe' }) name!: string;
}

export class AuditDto {
  @ApiProperty({ type: String, format: 'date-time', nullable: true, example: '2026-04-01T10:00:00Z' })
  created_at!: string | null;
  @ApiProperty({ type: AuditUserDto, nullable: true })
  created_by!: AuditUserDto | null;
  @ApiProperty({ type: String, format: 'date-time', nullable: true, example: '2026-04-15T08:30:00Z' })
  updated_at!: string | null;
  @ApiProperty({ type: AuditUserDto, nullable: true })
  updated_by!: AuditUserDto | null;
  @ApiProperty({ type: String, format: 'date-time', nullable: true, example: null })
  deleted_at!: string | null;
  @ApiProperty({ type: AuditUserDto, nullable: true })
  deleted_by!: AuditUserDto | null;
}

const AuditUserSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const AuditSchema = z.object({
  created_at: z.union([z.string(), z.date()]).nullable(),
  created_by: AuditUserSchema.nullable(),
  updated_at: z.union([z.string(), z.date()]).nullable(),
  updated_by: AuditUserSchema.nullable(),
  deleted_at: z.union([z.string(), z.date()]).nullable(),
  deleted_by: AuditUserSchema.nullable(),
});

export type Audit = z.infer<typeof AuditSchema>;
```

- [ ] **Step 2: Re-export from `apps/backend-gateway/src/common/dto/index.ts`**

If the file already has wildcard exports per subfolder, add:
```ts
export * from './audit/audit.dto';
```
If it lists modules explicitly, append the same line at the bottom.

- [ ] **Step 3: Verify build**

Run: `cd apps/backend-gateway && npx tsc --noEmit -p tsconfig.json`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/backend-gateway/src/common/dto/audit/audit.dto.ts apps/backend-gateway/src/common/dto/index.ts
git commit -m "feat(gateway): AuditUserDto / AuditDto / AuditSchema for findById enrichment"
```

### Task 15: Update `DepartmentDetailResponseSchema` to accept `audit`

**Files:**
- Modify: `apps/backend-gateway/src/common/dto/department/department.serializer.ts`

- [ ] **Step 1: Edit the schema**

Replace the existing `DepartmentDetailResponseSchema` with:

```ts
import { AuditSchema } from '../audit/audit.dto';

// Department detail response schema (for findOne with users)
export const DepartmentDetailResponseSchema = z.object({
  id: z.string(),
  code: z.string().nullable().optional(),
  name: z.string(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
  department_users: z.array(DepartmentUserEmbeddedSchema).optional(),
  hod_users: z.array(DepartmentUserEmbeddedSchema).optional(),
  info: z.any().nullable().optional(),
  dimension: z.any().nullable().optional(),
  audit: AuditSchema.optional(),
});
```

(Remove the previous `created_at` / `updated_at` lines.)

- [ ] **Step 2: Verify TypeScript**

Run: `cd apps/backend-gateway && npx tsc --noEmit -p tsconfig.json`
Expected: no errors. (The embedded `DepartmentUserEmbeddedSchema` is unchanged because it is not the enriched root.)

- [ ] **Step 3: Commit**

```bash
git add apps/backend-gateway/src/common/dto/department/department.serializer.ts
git commit -m "feat(gateway): DepartmentDetailResponseSchema accepts audit object"
```

### Task 16: Apply `@EnrichAuditUsers()` to `config_departments.findOne`

**Files:**
- Modify: `apps/backend-gateway/src/config/config_departments/config_departments.controller.ts`

- [ ] **Step 1: Edit the controller**

1. Add to the imports from `@/common`:
```ts
import {
  // ...existing imports kept...
  EnrichAuditUsers,
} from '@/common';
```

2. Decorate `findOne`. Insert `@EnrichAuditUsers()` between `@Serialize(...)` and `@HttpCode(...)`:

```ts
  @Get(':id')
  @UseGuards(new AppIdGuard('department.findOne'))
  @Serialize(DepartmentDetailResponseSchema)
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  // ...rest unchanged...
```

- [ ] **Step 2: Verify build**

Run: `cd apps/backend-gateway && bun run build`
Expected: build passes.

- [ ] **Step 3: Run gateway tests**

Run: `cd apps/backend-gateway && bun run test`
Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add apps/backend-gateway/src/config/config_departments/config_departments.controller.ts
git commit -m "feat(gateway): enable @EnrichAuditUsers on config_departments.findOne"
```

### Task 17: Manual end-to-end smoke test

**Files:** none (interactive verification)

- [ ] **Step 1: Start the stack**

In separate terminals (or with your usual orchestration):
```bash
cd apps/micro-cluster && bun run dev
cd apps/micro-business && bun run dev
cd apps/backend-gateway && bun run dev
```

Expected: all three start and report `successfully started`.

- [ ] **Step 2: Hit the pilot endpoint**

Pick a real department id from the test environment and run:

```bash
curl -sS \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "x-app-id: $X_APP_ID" \
  "http://localhost:4000/api/config/$BU_CODE/departments/$DEPT_ID" | jq '.data'
```

Expected `.data` shape:

```json
{
  "id": "...",
  "name": "...",
  "audit": {
    "created_at": "...",
    "created_by": { "id": "...", "name": "..." },
    "updated_at": "...",
    "updated_by": { "id": "...", "name": "..." },
    "deleted_at": null,
    "deleted_by": null
  }
}
```

The response must NOT contain top-level `created_at`, `created_by_id`, `updated_at`, `updated_by_id`, `deleted_at`, or `deleted_by_id`.

If `created_by_id` referenced a user that does not exist, the corresponding `created_by` should be `{ id: "<that uuid>", name: "Unknown" }`. If the source `*_by_id` was `null`, the corresponding `*_by` should be `null`.

- [ ] **Step 3: Hit a non-decorated endpoint to confirm no impact**

```bash
curl -sS \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "x-app-id: $X_APP_ID" \
  "http://localhost:4000/api/config/$BU_CODE/departments" | jq '.data[0]'
```

Expected: same shape as before (no `audit` field; existing `created_at`/`updated_at` keys present if previously returned). The list endpoint is intentionally unchanged.

- [ ] **Step 4: Stop services and record findings**

If anything is off, capture the diff and either fix forward or note it for the next step.

### Task 18: Update Bruno example response for `Get Department`

**Files:**
- Modify: `apps/bruno/carmen-inventory/config/departments/02 - Get Department.bru`

- [ ] **Step 1: Update the example response section**

Find the `docs:` or example response block and update so the example payload reflects the `audit` shape:

```json
{
  "data": {
    "id": "00000000-0000-0000-0000-000000000000",
    "code": "FNB",
    "name": "Food & Beverage",
    "description": "...",
    "is_active": true,
    "audit": {
      "created_at": "2026-04-01T10:00:00Z",
      "created_by": { "id": "11111111-1111-1111-1111-111111111111", "name": "John Doe" },
      "updated_at": "2026-04-15T08:30:00Z",
      "updated_by": { "id": "22222222-2222-2222-2222-222222222222", "name": "Jane Smith" },
      "deleted_at": null,
      "deleted_by": null
    }
  },
  "status": 200,
  "success": true,
  "message": "OK",
  "timestamp": "2026-04-28T00:00:00Z"
}
```

(Replace the previous example content; preserve the request URL, headers, query, and any `script:*` / `tests` / `docs` sections per Bruno-sync rules in CLAUDE.md.)

- [ ] **Step 2: Run the Bruno-sync dry run**

Run: `bun run bruno:sync:dry`

Expected: the file shows as a content edit (not archived, not deleted). No new orphans introduced.

- [ ] **Step 3: Commit**

```bash
git add "apps/bruno/carmen-inventory/config/departments/02 - Get Department.bru"
git commit -m "docs(bruno): show audit shape in Get Department example response"
```

---

## Final verification

- [ ] **Step 1: Run all relevant test suites**

```bash
cd apps/backend-gateway && bun run test
cd apps/micro-cluster && bun run test
```

Expected: green across the board.

- [ ] **Step 2: Type-check both apps**

```bash
cd apps/backend-gateway && bun run build
cd apps/micro-cluster && bun run build
```

Expected: clean builds.

- [ ] **Step 3: Lint**

```bash
cd apps/backend-gateway && bun run lint
cd apps/micro-cluster && bun run lint
```

Expected: no errors.

- [ ] **Step 4: Commit any lint fixes**

If lint made auto-fixes, commit them with `chore: lint`.

---

## Out of scope (do NOT implement here)

- Applying `@EnrichAuditUsers()` to other controllers — that is sprint 2+ rollout work, one or two PRs per group.
- Persistent (Redis) cache for resolved names.
- Changing `findAll` / `create` / `update` / `delete` response shapes.
- Tenant-schema endpoints under `apps/micro-business/src/tenant/*`.
- Wildcard path syntax in the decorator.
