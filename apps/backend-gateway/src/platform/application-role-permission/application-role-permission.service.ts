import {
  Inject,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import {
  AssignPermissionsToRoleDto,
  RemovePermissionsFromRoleDto,
  AssignPermissionToRoleDto,
  RemovePermissionFromRoleDto,
} from './dto/application-role-permission.dto';
import { Result } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';

@Injectable()
export class ApplicationRolePermissionService {
  private readonly logger: BackendLogger = new BackendLogger(
    ApplicationRolePermissionService.name,
  );

  constructor(
    @Inject('AUTH_SERVICE') private readonly authService: ClientProxy,
  ) {}

  /**
   * Get all permissions for a role
   * @param roleId
   * @param version
   * @returns
   */
  async getPermissionsByRole(roleId: string, version: string): Promise<any> {
    this.logger.debug(
      {
        function: 'getPermissionsByRole',
        roleId,
        version,
      },
      ApplicationRolePermissionService.name,
    );

    const res: Observable<any> = this.authService.send(
      { cmd: 'get-permissions-by-role', service: 'auth' },
      { roleId, version },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  /**
   * Get all roles that have a specific permission
   * @param permissionId
   * @param version
   * @returns
   */
  async getRolesByPermission(
    permissionId: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'getRolesByPermission',
        permissionId,
        version,
      },
      ApplicationRolePermissionService.name,
    );

    const res: Observable<any> = this.authService.send(
      { cmd: 'get-roles-by-permission', service: 'auth' },
      { permissionId, version },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  /**
   * Assign permissions to a role
   * @param assignPermissionsDto
   * @param version
   * @returns
   */
  async assignPermissionsToRole(
    assignPermissionsDto: AssignPermissionsToRoleDto,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'assignPermissionsToRole',
        assignPermissionsDto,
        version,
      },
      ApplicationRolePermissionService.name,
    );

    const res: Observable<any> = this.authService.send(
      { cmd: 'assign-permissions-to-role', service: 'auth' },
      { data: assignPermissionsDto, version },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK && response.response.status !== HttpStatus.CREATED) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  /**
   * Remove permissions from a role
   * @param removePermissionsDto
   * @param version
   * @returns
   */
  async removePermissionsFromRole(
    removePermissionsDto: RemovePermissionsFromRoleDto,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'removePermissionsFromRole',
        removePermissionsDto,
        version,
      },
      ApplicationRolePermissionService.name,
    );

    const res: Observable<any> = this.authService.send(
      { cmd: 'remove-permissions-from-role', service: 'auth' },
      { data: removePermissionsDto, version },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  /**
   * Assign a single permission to a role
   * @param assignPermissionDto
   * @param version
   * @returns
   */
  async assignPermissionToRole(
    assignPermissionDto: AssignPermissionToRoleDto,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'assignPermissionToRole',
        assignPermissionDto,
        version,
      },
      ApplicationRolePermissionService.name,
    );

    const res: Observable<any> = this.authService.send(
      { cmd: 'assign-permission-to-role', service: 'auth' },
      { data: assignPermissionDto, version },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK && response.response.status !== HttpStatus.CREATED) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  /**
   * Remove a single permission from a role
   * @param removePermissionDto
   * @param version
   * @returns
   */
  async removePermissionFromRole(
    removePermissionDto: RemovePermissionFromRoleDto,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'removePermissionFromRole',
        removePermissionDto,
        version,
      },
      ApplicationRolePermissionService.name,
    );

    const res: Observable<any> = this.authService.send(
      { cmd: 'remove-permission-from-role', service: 'auth' },
      { data: removePermissionDto, version },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }
}
