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
