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
