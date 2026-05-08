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
