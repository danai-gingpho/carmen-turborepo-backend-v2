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
    expect(observed).toBeUndefined(); // ALS was not entered (getStore() outside .run() returns undefined)
  });
});
