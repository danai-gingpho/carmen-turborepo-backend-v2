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
      const nameMap = ids.length > 0
        ? await this.resolver.resolveMany(ids)
        : new Map<string, string | null>();

      for (const target of targets) {
        mutateToAuditShape(target, nameMap);
      }
      return payload;
    } catch (err) {
      this.logger.warn(
        { msg: 'audit user enrichment failed; returning original payload', err },
        EnrichmentService.name,
      );
      return payload;
    }
  }
}
