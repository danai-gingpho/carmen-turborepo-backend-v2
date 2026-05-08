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
        { msg: 'user.resolveByIds failed; treating ids as unknown', err, count: missing.length },
        UserNameResolverService.name,
      );
      for (const id of missing) result.set(id, null);
    }
    return result;
  }
}
