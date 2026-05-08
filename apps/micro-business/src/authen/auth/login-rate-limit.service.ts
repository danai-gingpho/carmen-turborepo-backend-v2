import { Injectable } from '@nestjs/common';

interface AttemptRecord {
  count: number;
  lockedUntil: number | null;
}

export interface CheckLockResult {
  locked: boolean;
  retryAfterSeconds: number;
}

export interface RecordFailureResult {
  triggeredLock: boolean;
  retryAfterSeconds: number;
}

@Injectable()
export class LoginRateLimitService {
  private readonly MAX_ATTEMPTS = 3;
  private readonly LOCKOUT_MS = 3 * 60 * 1000;
  private readonly attempts = new Map<string, AttemptRecord>();

  private buildKey(email: string, ip: string): string {
    return `${email.toLowerCase()}::${ip}`;
  }

  private secondsRemaining(lockedUntil: number): number {
    return Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
  }

  checkLock(email: string, ip: string): CheckLockResult {
    const key = this.buildKey(email, ip);
    const record = this.attempts.get(key);
    if (!record || record.lockedUntil === null) {
      return { locked: false, retryAfterSeconds: 0 };
    }
    if (record.lockedUntil <= Date.now()) {
      this.attempts.delete(key);
      return { locked: false, retryAfterSeconds: 0 };
    }
    return {
      locked: true,
      retryAfterSeconds: this.secondsRemaining(record.lockedUntil),
    };
  }

  recordFailure(email: string, ip: string): RecordFailureResult {
    const key = this.buildKey(email, ip);
    const record = this.attempts.get(key) ?? { count: 0, lockedUntil: null };
    record.count += 1;
    let triggeredLock = false;
    if (record.count >= this.MAX_ATTEMPTS) {
      record.lockedUntil = Date.now() + this.LOCKOUT_MS;
      triggeredLock = true;
    }
    this.attempts.set(key, record);
    return {
      triggeredLock,
      retryAfterSeconds: record.lockedUntil
        ? this.secondsRemaining(record.lockedUntil)
        : 0,
    };
  }

  recordSuccess(email: string, ip: string): void {
    this.attempts.delete(this.buildKey(email, ip));
  }
}
