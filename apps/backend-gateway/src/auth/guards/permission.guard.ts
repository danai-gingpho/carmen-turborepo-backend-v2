import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY, PermissionRequirement } from '../decorators/permission.decorator';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AuthenticatedUser } from '../interfaces/auth.interface';
import { PermissionService, UserPermissions } from '../services/permission.service';

export interface BuData {
  bu_id: string;
  bu_code: string;
  role: string;
  permissions: UserPermissions;
}

@Injectable()
export class PermissionGuard implements CanActivate {
  private readonly logger = new BackendLogger(PermissionGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly permissionService: PermissionService,
  ) { }

  canActivate(context: ExecutionContext): boolean {
    // Get required permissions from the decorator
    const requiredPermissions = this.reflector.getAllAndOverride<PermissionRequirement>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no @Permission decorator is present, allow access
    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;
    const headers = request.headers;

    // Parse x-bu-datas header (set by KeycloakGuard, always an array even for single BU)
    let buDatas: BuData[] = [];
    const xBuDatasHeader = headers['x-bu-datas'];

    if (xBuDatasHeader) {
      try {
        buDatas = typeof xBuDatasHeader === 'string'
          ? JSON.parse(xBuDatasHeader)
          : xBuDatasHeader;
      } catch (error) {
        this.logger.warn('Failed to parse x-bu-datas header');
      }
    }

    if (buDatas.length === 0) {
      this.logger.warn('Permission check failed: No BU data found');
      throw new UnauthorizedException('Permission denied: User not authenticated');
    }

    this.logger.debug({
      userId: user.user_id,
      requiredPermissions,
      buCount: buDatas.length,
    }, 'Checking permissions');

    const failedBus: string[] = [];

    for (const buData of buDatas) {
      if (!buData.permissions || Object.keys(buData.permissions).length === 0) {
        failedBus.push(buData.bu_code);
        continue;
      }

      const hasPermission = this.permissionService.hasAllPermissions(
        buData.permissions,
        requiredPermissions,
      );

      if (!hasPermission) {
        failedBus.push(buData.bu_code);
      }
    }

    if (failedBus.length > 0) {
      this.logger.warn({
        userId: user.user_id,
        requiredPermissions,
        failedBus,
      }, 'Permission denied: User lacks required permissions for some BUs');

      throw new UnauthorizedException(
        `Permission denied: You do not have the required permissions for BU(s): ${failedBus.join(', ')}`,
      );
    }

    this.logger.debug({ userId: user.user_id }, 'Permission check passed');
    return true;
  }
}
