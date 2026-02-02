import { BackendLogger } from './backend.logger';

export function ExtractRequestHeader(req: Request): {
  tenant_id: string | null;
  user_id: string | null;
} {
  const tenant_id = req?.headers['x-tenant-id'] ?? '';
  const user_id = req['user'].user_id ?? '';

  const logger = new BackendLogger(ExtractRequestHeader.name);

  logger.debug(
    {
      function: 'ExtractRequestHeader',
      tenant_id,
      user_id,
    },
    'ExtractRequestHeader',
  );

  return { user_id, tenant_id };
}
