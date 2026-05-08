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
