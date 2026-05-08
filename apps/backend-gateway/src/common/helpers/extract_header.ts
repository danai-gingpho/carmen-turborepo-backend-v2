import { BackendLogger } from './backend.logger';

/**
 * Extract tenant ID, user ID, and access token from request headers
 * ดึงข้อมูล tenant ID, user ID และ access token จาก request headers
 * @param req - HTTP request object / อ็อบเจกต์ HTTP request
 * @returns Extracted header values / ค่าที่ดึงออกมาจาก header
 */
export function ExtractRequestHeader(
  req: { user?: { user_id?: string } } & Record<string, any>,
): {
  tenant_id: string | null;
  user_id: string | null;
  accessToken: string | null;
} {
  const tenant_id = null;
  const user_id = req?.['user']?.user_id ?? '';
  const accessToken = req?.headers?.authorization?.replace('Bearer ', '') ?? '';

  const logger = new BackendLogger(ExtractRequestHeader.name);

  logger.debug(
    {
      function: 'ExtractRequestHeader',
      tenant_id,
      user_id,
    },
    'ExtractRequestHeader',
  );

  return { user_id, tenant_id, accessToken };
}
