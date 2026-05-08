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
import { Result, MicroserviceResponse } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class ApplicationRolePermissionService {
  private readonly logger: BackendLogger = new BackendLogger(
    ApplicationRolePermissionService.name,
  );

  constructor(
    @Inject('BUSINESS_SERVICE') private readonly authService: ClientProxy,
  ) {}

  /**
   * Retrieve all permissions assigned to a specific role
   * ค้นหารายการสิทธิ์การเข้าถึงทั้งหมดที่กำหนดให้บทบาทที่ระบุ
   * @param roleId - Role ID / รหัสบทบาท
   * @param version - API version / เวอร์ชัน API
   * @returns Permissions for the role / สิทธิ์การเข้าถึงของบทบาท
   */
  async getPermissionsByRole(roleId: string, version: string): Promise<unknown> {
    this.logger.debug(
      {
        function: 'getPermissionsByRole',
        roleId,
        version,
      },
      ApplicationRolePermissionService.name,
    );

    const res: Observable<MicroserviceResponse> = this.authService.send(
      { cmd: 'get-permissions-by-role', service: 'auth' },
      { roleId, version, ...getGatewayRequestContext() },
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
   * Retrieve all roles that include a specific permission
   * ค้นหารายการบทบาททั้งหมดที่มีสิทธิ์การเข้าถึงที่ระบุ
   * @param permissionId - Permission ID / รหัสสิทธิ์การเข้าถึง
   * @param version - API version / เวอร์ชัน API
   * @returns Roles with the permission / บทบาทที่มีสิทธิ์การเข้าถึงนี้
   */
  async getRolesByPermission(
    permissionId: string,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'getRolesByPermission',
        permissionId,
        version,
      },
      ApplicationRolePermissionService.name,
    );

    const res: Observable<MicroserviceResponse> = this.authService.send(
      { cmd: 'get-roles-by-permission', service: 'auth' },
      { permissionId, version, ...getGatewayRequestContext() },
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
   * Assign multiple permissions to a role via microservice
   * กำหนดสิทธิ์การเข้าถึงหลายรายการให้บทบาทผ่านไมโครเซอร์วิส
   * @param assignPermissionsDto - Bulk assignment data / ข้อมูลการกำหนดสิทธิ์แบบกลุ่ม
   * @param version - API version / เวอร์ชัน API
   * @returns Assignment result / ผลลัพธ์การกำหนดสิทธิ์
   */
  async assignPermissionsToRole(
    assignPermissionsDto: AssignPermissionsToRoleDto,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'assignPermissionsToRole',
        assignPermissionsDto,
        version,
      },
      ApplicationRolePermissionService.name,
    );

    const res: Observable<MicroserviceResponse> = this.authService.send(
      { cmd: 'assign-permissions-to-role', service: 'auth' },
      { data: assignPermissionsDto, version, ...getGatewayRequestContext() },
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
   * Remove multiple permissions from a role via microservice
   * ถอนสิทธิ์การเข้าถึงหลายรายการจากบทบาทผ่านไมโครเซอร์วิส
   * @param removePermissionsDto - Bulk removal data / ข้อมูลการถอนสิทธิ์แบบกลุ่ม
   * @param version - API version / เวอร์ชัน API
   * @returns Removal result / ผลลัพธ์การถอนสิทธิ์
   */
  async removePermissionsFromRole(
    removePermissionsDto: RemovePermissionsFromRoleDto,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'removePermissionsFromRole',
        removePermissionsDto,
        version,
      },
      ApplicationRolePermissionService.name,
    );

    const res: Observable<MicroserviceResponse> = this.authService.send(
      { cmd: 'remove-permissions-from-role', service: 'auth' },
      { data: removePermissionsDto, version, ...getGatewayRequestContext() },
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
   * Assign a single permission to a role via microservice
   * กำหนดสิทธิ์การเข้าถึงรายการเดียวให้บทบาทผ่านไมโครเซอร์วิส
   * @param assignPermissionDto - Assignment data / ข้อมูลการกำหนดสิทธิ์
   * @param version - API version / เวอร์ชัน API
   * @returns Assignment result / ผลลัพธ์การกำหนดสิทธิ์
   */
  async assignPermissionToRole(
    assignPermissionDto: AssignPermissionToRoleDto,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'assignPermissionToRole',
        assignPermissionDto,
        version,
      },
      ApplicationRolePermissionService.name,
    );

    const res: Observable<MicroserviceResponse> = this.authService.send(
      { cmd: 'assign-permission-to-role', service: 'auth' },
      { data: assignPermissionDto, version, ...getGatewayRequestContext() },
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
   * Remove a single permission from a role via microservice
   * ถอนสิทธิ์การเข้าถึงรายการเดียวจากบทบาทผ่านไมโครเซอร์วิส
   * @param removePermissionDto - Removal data / ข้อมูลการถอนสิทธิ์
   * @param version - API version / เวอร์ชัน API
   * @returns Removal result / ผลลัพธ์การถอนสิทธิ์
   */
  async removePermissionFromRole(
    removePermissionDto: RemovePermissionFromRoleDto,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'removePermissionFromRole',
        removePermissionDto,
        version,
      },
      ApplicationRolePermissionService.name,
    );

    const res: Observable<MicroserviceResponse> = this.authService.send(
      { cmd: 'remove-permission-from-role', service: 'auth' },
      { data: removePermissionDto, version, ...getGatewayRequestContext() },
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
