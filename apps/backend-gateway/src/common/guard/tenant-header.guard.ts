import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { validate as uuidValidate } from 'uuid';
import { BackendLogger } from '../helpers/backend.logger';

const CheckTenantIdIsExistsAndAllow = (
  user_id: string,
  tenantId: string,
): boolean => {
  const logger = new BackendLogger(CheckTenantIdIsExistsAndAllow.name);
  logger.debug(
    {
      function: 'CheckTenantIdIsExistsAndAllow',
      user_id,
      tenantId,
      result: true,
    },
    'CheckTenantIdIsExistsAndAllow',
  );

  // TODO: Implement actual tenant validation logic

  return true;
};

const CheckTenantIdIsUUID = (tenantId: string): boolean => {
  const logger = new BackendLogger(CheckTenantIdIsUUID.name);

  logger.debug(
    {
      function: 'CheckTenantIdIsUUID',
      tenantId,
    },
    'CheckTenantIdIsUUID',
  );

  return uuidValidate(tenantId);
};

@Injectable()
export class TenantHeaderGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return true
    const request = context.switchToHttp().getRequest();
    const tenantId = request.headers['x-tenant-id']

    const logger = new BackendLogger(TenantHeaderGuard.name);

    logger.debug(
      {
        function: 'TenantHeaderGuard',
        tenantId,
      },
      'TenantHeaderGuard',
    );

    if (!tenantId || tenantId.trim() === '') {
      logger.error(
        {
          function: 'TenantHeaderGuard',
          tenantId,
          error: 'x-tenant-id header is required',
        },
        'TenantHeaderGuard',
      );

      throw new BadRequestException('x-tenant-id header is required');
    }

    if (!CheckTenantIdIsUUID(tenantId)) {
      logger.error(
        {
          function: 'TenantHeaderGuard',
          tenantId,
          error: 'x-tenant-id header is not a valid UUID [' + tenantId + ']',
        },
        'TenantHeaderGuard',
      );

      throw new BadRequestException(
        'x-tenant-id header is not a valid UUID [' + tenantId + ']',
      );
    }

    if (!request.user) {
      logger.error(
        {
          function: 'TenantHeaderGuard',
          tenantId,
          error: 'User not found',
        },
        'TenantHeaderGuard',
      );

      throw new UnauthorizedException('User not found');
    }

    const user_id = request.user.user_id;

    if (!CheckTenantIdIsExistsAndAllow(user_id, tenantId)) {
      logger.error(
        {
          function: 'TenantHeaderGuard',
          tenantId,
          error: 'Tenant not found or not allowed',
        },
        'TenantHeaderGuard',
      );

      throw new UnauthorizedException('Tenant not found or not allowed');
    }

    return true;
  }
}
