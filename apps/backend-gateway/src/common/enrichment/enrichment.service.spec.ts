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
    expect((payload as any).audit).toEqual({
      created: { at: '2026-04-01T00:00:00Z', id: 'u1', name: 'John' },
    });
    expect((payload as any).created_by_id).toBeUndefined();
    expect((payload as any).created_at).toBeUndefined();
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

  it('targets with only *_at (no *_by_id): wraps into audit shape with { at } only and omits null kinds', async () => {
    const payload = {
      id: 'x',
      created_at: '2026-04-01T00:00:00Z',
      updated_at: null,
    };
    const out = await enrichAuditUsersStorage.run({ paths: [''] }, () =>
      service.enrichIfRequested(payload),
    );
    expect(out).toBe(payload);
    expect(resolver.resolveMany).not.toHaveBeenCalled();
    expect((payload as any).audit).toEqual({
      created: { at: '2026-04-01T00:00:00Z' },
    });
    expect((payload as any).created_at).toBeUndefined();
    expect((payload as any).updated_at).toBeUndefined();
  });
});
