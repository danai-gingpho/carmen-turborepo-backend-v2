# FindById Audit User Enrichment

**Status:** Approved (design)
**Date:** 2026-04-28
**Owner:** Carmen Backend
**Scope:** `apps/backend-gateway` (config, application, platform) findById endpoints

## Goal

Enrich `findById` responses across all `backend-gateway` domains so that each
entity returns a unified `audit` object containing `created_at / updated_at /
deleted_at` plus `created_by / updated_by / deleted_by` objects with both `id`
and resolved human-readable `name`. Names are resolved from the platform
schema's `tb_user` table.

## Non-goals

- Enriching `findAll` / list / create / update / delete endpoints (decorator
  is reusable for them, but not applied in this iteration).
- Tenant-schema endpoints under `apps/micro-business/src/tenant/*`.
- Persistent caching (Redis) — in-memory cache only.
- Wildcard path syntax (`items.*.children`).

## Decisions (from brainstorming)

| Question | Decision |
|---|---|
| Scope | All findById in `backend-gateway` (config + application + platform) |
| Name source | Join `tb_user` (+ `tb_user_profile`) on platform schema; priority: `"firstname [middlename] lastname"` (from profile, when at least one part is non-empty) → `alias_name` → `username` → `email` |
| Mechanism | New TCP endpoint at `micro-cluster` (owns `tb_user`) + gateway interceptor + in-memory LRU+TTL cache |
| Output shape | Group into `audit` object with nested `created_by`, `updated_by`, `deleted_by` |
| Activation | Opt-in via `@EnrichAuditUsers({ paths? })` decorator on controller methods |
| Unknown user (id present, user not found) | `{ id, name: "Unknown" }` |
| `*_by_id = null` (system action) | `audit.*_by = null` |
| Depth | Opt-in `paths` in decorator (e.g. `['', 'items']`) |

## Architecture

```
Client → backend-gateway → micro-cluster → Platform DB (tb_user)
              ↑
              ├── EnrichAuditUsersContextInterceptor (global; reads decorator metadata, stashes options into AsyncLocalStorage)
              └── BaseHttpController.respond()
                    └── EnrichmentService.enrichIfRequested()
                          ├── UserNameCacheService (in-memory LRU + TTL)
                          └── UserNameResolverService (TCP → micro-cluster via CLUSTER_SERVICE)
```

**Why not a response interceptor:** Controllers use `@Res()` + `response.send(stdResponse)` for manual response handling, so handler return values are `undefined`. NestJS response interceptors (e.g. `ZodSerializerInterceptor`) skip these responses — see the comment at `apps/backend-gateway/src/common/decorators/zod-serializer.interceptor.ts:44`. We instead enrich inside `BaseHttpController.respond()` (which sees the actual `stdResponse`), driven by metadata stashed into AsyncLocalStorage by a small interceptor.

### Components

**`micro-cluster` (TCP server side — owns `tb_user`)**

- `UserService.resolveByIds(ids: string[])` (added to existing
  `apps/micro-cluster/src/cluster/user/user.service.ts`) — uses
  `PrismaClient_SYSTEM` from `@repo/prisma-shared-schema-platform` to query
  `tb_user` selecting only `id, alias_name, username, email` and including
  the related `tb_user_profile_tb_user_profile_user_idTotb_user` (selecting
  `firstname, middlename, lastname`). Includes users where
  `deleted_at != null` (so historical references still resolve to a name).
- `UserController` (existing) registers a new
  `@MessagePattern({ cmd: 'user.resolveByIds', service: 'user' })`.
- Returns `MicroserviceResponse` whose `data` is
  `{ users: Array<{ id: string; name: string }> }`. The name is computed by
  the helper `formatUserName(user)`:
  1. If profile exists and any of `firstname/middlename/lastname` is
     non-empty after trim, return `[firstname, middlename, lastname].filter(Boolean).join(' ').trim()`.
  2. Else if `alias_name` is non-empty, return it.
  3. Else if `username` is non-empty, return it.
  4. Else return `email`.
  Ids that do not exist in `tb_user` are simply absent from the result array;
  the gateway treats absence as "unknown".

**`backend-gateway` (HTTP server side)**

- `@EnrichAuditUsers({ paths?: string[] })` — method decorator that stores
  metadata via `SetMetadata`. Default `paths = ['']` (root only).
- `EnrichAuditUsersContextInterceptor` — registered as a global
  `APP_INTERCEPTOR`. Reads the handler's `EnrichAuditUsersOptions` metadata
  and stashes it into the `enrichAuditUsersStorage` AsyncLocalStorage for the
  duration of the request. No response transformation here.
- `enrichAuditUsersStorage` — `AsyncLocalStorage<EnrichAuditUsersOptions | null>`,
  defined in `apps/backend-gateway/src/common/context/enrich-audit-users.context.ts`.
- `EnrichmentService` — exposes
  `enrichIfRequested(payload: unknown): Promise<unknown>`. Reads options from
  ALS; if absent, returns the payload unchanged; if present, runs the
  collect-resolve-mutate pipeline.
- `BaseHttpController.respond()` — becomes `async`; calls
  `enrichmentService.enrichIfRequested(stdResponse.data)` (or the legacy
  `result` body) before `response.send`. Existing call sites
  (`this.respond(res, result)`) do not need to await — the response is
  fire-and-forget today and remains so.
- `UserNameResolverService` — owns the TCP call; checks cache first; caches
  unknown ids as `null` to avoid repeated lookups.
- `UserNameCacheService` — `Map<string, { value: string|null; expiresAt }>`,
  TTL 60s, max 10,000 entries, simple LRU on overflow.

## Contracts

### Decorator

```ts
// apps/backend-gateway/src/common/decorators/enrich-audit-users.decorator.ts
export const ENRICH_AUDIT_USERS_KEY = 'enrich_audit_users';

export interface EnrichAuditUsersOptions {
  paths?: string[]; // ['', 'items', 'items.attachments'], default ['']
}

export const EnrichAuditUsers = (options: EnrichAuditUsersOptions = {}) =>
  SetMetadata(ENRICH_AUDIT_USERS_KEY, { paths: options.paths ?? [''] });
```

**Path syntax**

- `''` — root payload (object) or each element of root array
- `'items'` — each element of `payload.items[]` (array field) or `payload.items` (object field)
- `'items.attachments'` — each `payload.items[*].attachments[]`
- No wildcards or array indices.

**Usage**

```ts
@Get(':id')
@EnrichAuditUsers()                          // root only
async findById(...) { ... }

@Get(':id')
@EnrichAuditUsers({ paths: ['', 'items'] })  // root + each item
async findByIdWithItems(...) { ... }
```

### TCP message pattern

```ts
// pattern (matches existing { cmd, service } convention used across the codebase)
{ cmd: 'user.resolveByIds', service: 'user' }

// payload (gateway includes ...getGatewayRequestContext() like other calls)
{ ids: string[] }

// response (wrapped in MicroserviceResponse: { response: { status }, data })
data = {
  users: Array<{
    id: string;
    name: string;       // formatUserName(): profile name → alias_name → username → email
  }>;
}
```

The gateway client uses the existing `'CLUSTER_SERVICE'` `ClientProxy` token
already registered in `apps/backend-gateway/src/app.module.ts`.

### Output shape

**Input from `micro-business`:**

```json
{
  "id": "dept-1",
  "name": "Front Office",
  "created_at": "2026-04-01T10:00:00Z",
  "created_by_id": "u1",
  "updated_at": "2026-04-15T08:30:00Z",
  "updated_by_id": "u2",
  "deleted_at": null,
  "deleted_by_id": null
}
```

**After enrichment:**

```json
{
  "id": "dept-1",
  "name": "Front Office",
  "audit": {
    "created_at": "2026-04-01T10:00:00Z",
    "created_by": { "id": "u1", "name": "John Doe" },
    "updated_at": "2026-04-15T08:30:00Z",
    "updated_by": { "id": "u2", "name": "Jane Smith" },
    "deleted_at": null,
    "deleted_by": null
  }
}
```

**Transformation rules**

| Source | Result |
|---|---|
| `created_at`, `updated_at`, `deleted_at` | move into `audit.*_at` |
| `*_by_id = "uuid"` resolved | `audit.*_by = { id, name }` |
| `*_by_id = "uuid"` not resolved | `audit.*_by = { id, name: "Unknown" }` |
| `*_by_id = null` (system action) | `audit.*_by = null` |
| `*_at = null` but `*_by_id != null` | `audit.*_at = null`, `audit.*_by = { id, name }` |
| Both `null` | `audit.*_at = null`, `audit.*_by = null` |
| Original `created_by_id, updated_by_id, deleted_by_id, created_at, updated_at, deleted_at` fields | removed from output |
| Object has none of the six audit fields | no `audit` field added (do not pollute payload) |

## Implementation

### EnrichAuditUsersContextInterceptor

```ts
// apps/backend-gateway/src/common/interceptors/enrich-audit-users-context.interceptor.ts
@Injectable()
export class EnrichAuditUsersContextInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (ctx.getType() !== 'http') return next.handle();

    const options = this.reflector.get<EnrichAuditUsersOptions | undefined>(
      ENRICH_AUDIT_USERS_KEY,
      ctx.getHandler(),
    ) ?? null;

    return from(
      enrichAuditUsersStorage.run(options, () => {
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

**Wiring** in `apps/backend-gateway/src/app.module.ts`:

```ts
{ provide: APP_INTERCEPTOR, useClass: EnrichAuditUsersContextInterceptor }
```

Order of global interceptors:

1. `GatewayRequestContextInterceptor` (existing)
2. `ZodSerializerInterceptor` (existing)
3. `EnrichAuditUsersContextInterceptor` (new) — outermost; ALS lives for the whole request, including the `respond()` call.

### BaseHttpController.respond() (updated)

```ts
// apps/backend-gateway/src/common/http/base-http-controller.ts
export abstract class BaseHttpController {
  // Set during AppModule init by ServiceLocator (see below)
  protected static enrichmentService: EnrichmentService | null = null;

  protected async respond(
    response: Response,
    result: Result<unknown> | unknown,
    customStatus?: HttpStatus,
  ): Promise<void> {
    if (result && typeof result === 'object' && 'isOk' in result && typeof (result as any).isOk === 'function') {
      const typedResult = result as Result<unknown, unknown>;
      const stdResponse = StdResponse.fromResult<unknown, unknown>(typedResult);

      if (typedResult.isOk() && BaseHttpController.enrichmentService) {
        try {
          (stdResponse as { data: unknown }).data =
            await BaseHttpController.enrichmentService.enrichIfRequested(
              (stdResponse as { data: unknown }).data,
            );
        } catch {
          // EnrichmentService.enrichIfRequested catches internally and returns input on error.
          // This catch is purely defensive in case it ever throws.
        }
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

**Service locator**: `BaseHttpController.enrichmentService` is set once during
`AppModule.onApplicationBootstrap()` from the DI container. This avoids
forcing every subclass constructor to inject the service. If the locator is
not set (e.g. in narrow unit tests), enrichment is a no-op.

### EnrichmentService

```ts
// apps/backend-gateway/src/common/enrichment/enrichment.service.ts
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
      this.logger.warn({ err }, 'audit user enrichment failed; returning original payload');
      return payload;
    }
  }
}
```

### UserNameResolverService

```ts
@Injectable()
export class UserNameResolverService {
  constructor(
    @Inject('CLUSTER_SERVICE') private readonly client: ClientProxy,
    private readonly cache: UserNameCacheService,
  ) {}

  async resolveMany(ids: string[]): Promise<Map<string, string | null>> {
    const result = new Map<string, string | null>();
    const missing: string[] = [];

    for (const id of ids) {
      const cached = this.cache.get(id);
      if (cached !== undefined) {
        result.set(id, cached);
      } else {
        missing.push(id);
      }
    }

    if (missing.length > 0) {
      try {
        const resp = await firstValueFrom(
          this.client.send<MicroserviceResponse>(
            { cmd: 'user.resolveByIds', service: 'user' },
            { ids: missing, ...getGatewayRequestContext() },
          ),
        );

        const users = (resp?.data as { users?: Array<{ id: string; name: string }> })?.users ?? [];
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
        this.logger.warn({ err, count: missing.length }, 'user.resolveByIds failed; treating ids as unknown');
        for (const id of missing) result.set(id, null);
      }
    }
    return result;
  }
}
```

`mutateToAuditShape` converts `null` (unknown) into `{ id, name: "Unknown" }`
per the rules above.

### UserNameCacheService

```ts
@Injectable()
export class UserNameCacheService {
  private readonly ttlMs = 60_000;
  private readonly maxEntries = 10_000;
  private readonly store = new Map<string, { value: string | null; expiresAt: number }>();

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
      if (oldest) this.store.delete(oldest);
    }
    this.store.set(id, { value, expiresAt: Date.now() + this.ttlMs });
  }
}
```

### Path collection helper

`collectTargetsByPaths(payload, paths)` returns an array of object references
that should be enriched in-place:

- `''` → `payload` if object; each element if array
- `'items'` → each element of `payload.items[]` if array; `payload.items` if object
- `'items.attachments'` → each `payload.items[*].attachments[]`
- Missing paths are silently skipped.

## Edge cases

| Case | Behavior |
|---|---|
| Response is `null` / `undefined` | return as-is |
| Path missing on response | skip path |
| Object in path has no audit fields | do not add `audit` key |
| Some audit fields present | add `audit`, fill missing as `null` |
| Wrapper envelope `{ data, status, success, message, timestamp }` | enrichment runs on `stdResponse.data` only (envelope is owned by `BaseHttpController`) |
| Root is an array | iterate each element |
| User soft-deleted (`tb_user.deleted_at != null`) | still resolved (resolver does not filter on `deleted_at`) |
| Same `id` appears in multiple positions | dedupe before TCP call |
| `ids` empty after dedupe | skip TCP call |
| TCP timeout / connection error to `CLUSTER_SERVICE` | log warn, all become `{ id, name: "Unknown" }` |
| Resolver throws | catch, fallback as above |
| Helper crash (e.g. circular ref) | catch, return original response untouched |

**Principle:** enrichment must never fail the request — degrade gracefully.

## Swagger / DTO impact

Each controller using `@EnrichAuditUsers()` must update its response DTO.

```ts
// shared-dto: AuditUserDto / AuditDto
export class AuditUserDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
}

export class AuditDto {
  @ApiProperty({ type: String, format: 'date-time', nullable: true }) created_at: string | null;
  @ApiProperty({ type: AuditUserDto, nullable: true }) created_by: AuditUserDto | null;
  @ApiProperty({ type: String, format: 'date-time', nullable: true }) updated_at: string | null;
  @ApiProperty({ type: AuditUserDto, nullable: true }) updated_by: AuditUserDto | null;
  @ApiProperty({ type: String, format: 'date-time', nullable: true }) deleted_at: string | null;
  @ApiProperty({ type: AuditUserDto, nullable: true }) deleted_by: AuditUserDto | null;
}
```

Each entity DTO swaps:

```
created_at, created_by_id, updated_at, updated_by_id, deleted_at, deleted_by_id
```

for:

```
audit: AuditDto
```

Bruno example responses under `apps/bruno/carmen-inventory/` must be updated
per endpoint as part of each controller's rollout.

## Migration / rollout plan

This is a **breaking change** to response shapes for endpoints that opt-in.
Because the decorator is opt-in, rollout is incremental and reversible.

1. **Sprint 1** — Build infrastructure:
   - Add `resolveByIds` to existing `UserService` + `@MessagePattern` in `micro-cluster` (`apps/micro-cluster/src/cluster/user/`)
   - `@EnrichAuditUsers` decorator
   - `UserResolverInterceptor`, `UserNameResolverService`, `UserNameCacheService`
   - Unit + e2e tests
   - Apply to one pilot endpoint (e.g. `config_departments.findById`) and update its DTO + Bruno
2. **Sprint 2+** — Enable on `config/*` findById endpoints in groups; update DTOs + Bruno per group.
3. **Sprint 3+** — `application/*` and `platform/*` findById endpoints.

## Testing

**Unit tests (gateway)**

1. `UserNameCacheService` — get / set / expire / LRU eviction
2. `UserNameResolverService` — cache hit, cache miss, partial hit, unknown id, TCP error fallback
3. `collectTargetsByPaths` — root only, nested array, nested-of-nested, missing path, null safety
4. `mutateToAuditShape` — every transformation rule above (with/without by_id, with/without at, unknown user, system action, dedup)
5. `EnrichAuditUsersContextInterceptor` — sets ALS for HTTP only; ALS = null when no decorator; ALS isolated per request
6. `EnrichmentService.enrichIfRequested` — no ALS → no-op; ALS present + targets present → enriched in place; ALS present + targets empty → no-op; resolver error → returns original
7. `BaseHttpController.respond` — calls `enrichIfRequested` only on ok results; locator unset → behaves as today; legacy non-Result branch unchanged

**E2E (gateway)**

- mock `BUSINESS_SERVICE` TCP, hit a real HTTP findById that has the decorator, assert response shape matches the contract.

**Integration (micro-cluster)**

- `UserService.resolveByIds` against test DB: includes deleted users, omits non-existent ids, returns selected `name` priority.

## Out of scope (YAGNI)

- Persistent cache (Redis)
- list / findAll / create / update / delete enrichment
- Tenant-schema endpoints
- Wildcard path syntax
