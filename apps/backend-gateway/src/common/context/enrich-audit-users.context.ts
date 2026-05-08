import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Resolved options for audit-user enrichment, stashed by
 * EnrichAuditUsersContextInterceptor for the duration of an HTTP request.
 * Single source of truth — decorator + interceptor + EnrichmentService all
 * use this type.
 */
export interface EnrichAuditUsersOptions {
  paths: string[];
}

export const enrichAuditUsersStorage =
  new AsyncLocalStorage<EnrichAuditUsersOptions | null>();
