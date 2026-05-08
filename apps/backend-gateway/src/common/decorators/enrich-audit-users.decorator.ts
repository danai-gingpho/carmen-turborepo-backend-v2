import { SetMetadata } from '@nestjs/common';
import type { EnrichAuditUsersOptions } from '../context/enrich-audit-users.context';

export const ENRICH_AUDIT_USERS_KEY = 'enrich_audit_users';

export interface EnrichAuditUsersDecoratorOptions {
  /**
   * Paths inside the response.data payload to enrich.
   *  - ''                 → root payload (object) or each element of root array
   *  - 'items'            → each element of payload.items[] (array) or payload.items (object)
   *  - 'items.attachments'→ each payload.items[*].attachments[]
   * Default: [''] (root only). No wildcards or array indices.
   */
  paths?: string[];
}

export const EnrichAuditUsers = (options: EnrichAuditUsersDecoratorOptions = {}) =>
  SetMetadata<string, EnrichAuditUsersOptions>(
    ENRICH_AUDIT_USERS_KEY,
    { paths: options.paths ?? [''] },
  );
