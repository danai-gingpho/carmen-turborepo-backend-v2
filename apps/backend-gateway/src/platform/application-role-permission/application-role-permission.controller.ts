import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApplicationRolePermissionService } from './application-role-permission.service';
import {
  AssignPermissionsToRoleDto,
  RemovePermissionsFromRoleDto,
  AssignPermissionToRoleDto,
  RemovePermissionFromRoleDto,
} from './dto/application-role-permission.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { ApiVersionMinRequest } from 'src/common/decorator/userfilter.decorator';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';

@Controller('api-system/role-permission')
@ApiTags('Platform: Role ↔ Permission')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class ApplicationRolePermissionController {
  private readonly logger: BackendLogger = new BackendLogger(
    ApplicationRolePermissionController.name,
  );

  constructor(
    private readonly applicationRolePermissionService: ApplicationRolePermissionService,
  ) {}

  /**
   * Get all permissions assigned to a role
   * ค้นหารายการสิทธิ์การเข้าถึงทั้งหมดที่กำหนดให้บทบาท
   * @param roleId - Role ID / รหัสบทบาท
   * @param version - API version / เวอร์ชัน API
   * @returns Permissions for the role / สิทธิ์การเข้าถึงของบทบาท
   */
  @Get('role/:roleId/permissions')
  @UseGuards(new AppIdGuard('application-role-permission.getPermissionsByRole'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiParam({
    name: 'roleId',
    description: 'Role ID',
    type: 'string',
  })
  @ApiOperation({
    summary: 'Get all permissions for a role',
    description: 'Lists all feature permissions currently assigned to a specific role, showing exactly what actions (e.g., create PO, approve PR) users with this role are authorized to perform in the ERP system.',
    'x-description-th': 'ดึงรายการสิทธิ์ตามบทบาททั้งหมดที่กำหนดให้บทบาทที่ระบุ',
    operationId: 'platformRolePermission_getPermissionsByRole',
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: 'roleId',
        in: 'path',
        required: true,
        description: 'Role ID',
      },
      {
        name: 'version',
        in: 'query',
        required: false,
        description: 'API version',
      },
    ],
    responses: {
      200: {
        description: 'Permissions retrieved successfully',
      },
      401: {
        description: 'Unauthorized',
      },
      404: {
        description: 'Role not found',
      },
    },
  } as any)
  async getPermissionsByRole(
    @Param('roleId') roleId: string,
    @Query('version') version: string = 'latest',
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'getPermissionsByRole',
        roleId,
        version,
      },
      ApplicationRolePermissionController.name,
    );

    return this.applicationRolePermissionService.getPermissionsByRole(
      roleId,
      version,
    );
  }

  /**
   * Get all roles that have a specific permission
   * ค้นหารายการบทบาททั้งหมดที่มีสิทธิ์การเข้าถึงที่ระบุ
   * @param permissionId - Permission ID / รหัสสิทธิ์การเข้าถึง
   * @param version - API version / เวอร์ชัน API
   * @returns Roles with the permission / บทบาทที่มีสิทธิ์การเข้าถึงนี้
   */
  @Get('permission/:permissionId/roles')
  @UseGuards(new AppIdGuard('application-role-permission.getRolesByPermission'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiParam({
    name: 'permissionId',
    description: 'Permission ID',
    type: 'string',
  })
  @ApiOperation({
    summary: 'Get all roles that have a permission',
    description: 'Finds all application roles that include a specific permission, enabling administrators to audit which roles grant a particular capability such as inventory adjustments or purchase approvals.',
    'x-description-th': 'ดึงรายการบทบาททั้งหมดที่มีสิทธิ์ตามบทบาทที่ระบุ',
    operationId: 'platformRolePermission_getRolesByPermission',
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: 'permissionId',
        in: 'path',
        required: true,
        description: 'Permission ID',
      },
      {
        name: 'version',
        in: 'query',
        required: false,
        description: 'API version',
      },
    ],
    responses: {
      200: {
        description: 'Roles retrieved successfully',
      },
      401: {
        description: 'Unauthorized',
      },
      404: {
        description: 'Permission not found',
      },
    },
  } as any)
  async getRolesByPermission(
    @Param('permissionId') permissionId: string,
    @Query('version') version: string = 'latest',
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'getRolesByPermission',
        permissionId,
        version,
      },
      ApplicationRolePermissionController.name,
    );

    return this.applicationRolePermissionService.getRolesByPermission(
      permissionId,
      version,
    );
  }

  /**
   * Assign multiple permissions to a role in bulk
   * กำหนดสิทธิ์การเข้าถึงหลายรายการให้บทบาทพร้อมกัน
   * @param assignPermissionsDto - Bulk assignment data / ข้อมูลการกำหนดสิทธิ์แบบกลุ่ม
   * @param version - API version / เวอร์ชัน API
   * @returns Assignment result / ผลลัพธ์การกำหนดสิทธิ์
   */
  @Post('assign-permissions')
  @UseGuards(new AppIdGuard('application-role-permission.assignPermissionsToRole'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiBody({
    type: AssignPermissionsToRoleDto,
    description: 'Assign permissions to role data',
  })
  @ApiOperation({
    summary: 'Assign multiple permissions to a role',
    description: 'Grants multiple feature permissions to an application role in a single operation, enabling bulk configuration of role capabilities such as giving a Purchaser role access to create POs, view vendors, and manage stock-in records.',
    'x-description-th': 'กำหนดสิทธิ์ตามบทบาทหลายรายการให้บทบาทพร้อมกัน',
    operationId: 'platformRolePermission_assignPermissions',
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
        description: 'API version',
      },
    ],
    responses: {
      200: {
        description: 'Permissions assigned successfully',
      },
      400: {
        description: 'Bad request',
      },
      401: {
        description: 'Unauthorized',
      },
    },
  } as any)
  async assignPermissionsToRole(
    @Body() assignPermissionsDto: AssignPermissionsToRoleDto,
    @Query('version') version: string = 'latest',
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'assignPermissionsToRole',
        assignPermissionsDto,
        version,
      },
      ApplicationRolePermissionController.name,
    );

    return this.applicationRolePermissionService.assignPermissionsToRole(
      assignPermissionsDto,
      version,
    );
  }

  /**
   * Assign a single permission to a role
   * กำหนดสิทธิ์การเข้าถึงรายการเดียวให้บทบาท
   * @param assignPermissionDto - Assignment data / ข้อมูลการกำหนดสิทธิ์
   * @param version - API version / เวอร์ชัน API
   * @returns Assignment result / ผลลัพธ์การกำหนดสิทธิ์
   */
  @Post('assign-permission')
  @UseGuards(new AppIdGuard('application-role-permission.assignPermissionToRole'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiBody({
    type: AssignPermissionToRoleDto,
    description: 'Assign permission to role data',
  })
  @ApiOperation({
    summary: 'Assign a single permission to a role',
    description: 'Grants a single feature permission to an application role, allowing fine-grained incremental updates to role capabilities without replacing the entire permission set.',
    'x-description-th': 'กำหนดสิทธิ์ตามบทบาทรายการเดียวให้บทบาท',
    operationId: 'platformRolePermission_assignPermission',
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
        description: 'API version',
      },
    ],
    responses: {
      200: {
        description: 'Permission assigned successfully',
      },
      400: {
        description: 'Bad request',
      },
      401: {
        description: 'Unauthorized',
      },
    },
  } as any)
  async assignPermissionToRole(
    @Body() assignPermissionDto: AssignPermissionToRoleDto,
    @Query('version') version: string = 'latest',
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'assignPermissionToRole',
        assignPermissionDto,
        version,
      },
      ApplicationRolePermissionController.name,
    );

    return this.applicationRolePermissionService.assignPermissionToRole(
      assignPermissionDto,
      version,
    );
  }

  /**
   * Remove multiple permissions from a role in bulk
   * ถอนสิทธิ์การเข้าถึงหลายรายการจากบทบาทพร้อมกัน
   * @param removePermissionsDto - Bulk removal data / ข้อมูลการถอนสิทธิ์แบบกลุ่ม
   * @param version - API version / เวอร์ชัน API
   * @returns Removal result / ผลลัพธ์การถอนสิทธิ์
   */
  @Delete('remove-permissions')
  @UseGuards(new AppIdGuard('application-role-permission.removePermissionsFromRole'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiBody({
    type: RemovePermissionsFromRoleDto,
    description: 'Remove permissions from role data',
  })
  @ApiOperation({
    summary: 'Remove multiple permissions from a role',
    description: 'Revokes multiple feature permissions from an application role in a single operation, useful when restructuring role access or restricting capabilities across procurement and inventory modules.',
    'x-description-th': 'ถอนสิทธิ์ตามบทบาทหลายรายการจากบทบาทพร้อมกัน',
    operationId: 'platformRolePermission_removePermissions',
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
        description: 'API version',
      },
    ],
    responses: {
      200: {
        description: 'Permissions removed successfully',
      },
      400: {
        description: 'Bad request',
      },
      401: {
        description: 'Unauthorized',
      },
    },
  } as any)
  async removePermissionsFromRole(
    @Body() removePermissionsDto: RemovePermissionsFromRoleDto,
    @Query('version') version: string = 'latest',
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'removePermissionsFromRole',
        removePermissionsDto,
        version,
      },
      ApplicationRolePermissionController.name,
    );

    return this.applicationRolePermissionService.removePermissionsFromRole(
      removePermissionsDto,
      version,
    );
  }

  /**
   * Remove a single permission from a role
   * ถอนสิทธิ์การเข้าถึงรายการเดียวจากบทบาท
   * @param removePermissionDto - Removal data / ข้อมูลการถอนสิทธิ์
   * @param version - API version / เวอร์ชัน API
   * @returns Removal result / ผลลัพธ์การถอนสิทธิ์
   */
  @Delete('remove-permission')
  @UseGuards(new AppIdGuard('application-role-permission.removePermissionFromRole'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiBody({
    type: RemovePermissionFromRoleDto,
    description: 'Remove permission from role data',
  })
  @ApiOperation({
    summary: 'Remove a single permission from a role',
    description: 'Revokes a single feature permission from an application role, allowing precise removal of a specific capability without affecting other permissions assigned to the role.',
    'x-description-th': 'ถอนสิทธิ์ตามบทบาทรายการเดียวจากบทบาท',
    operationId: 'platformRolePermission_removePermission',
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
        description: 'API version',
      },
    ],
    responses: {
      200: {
        description: 'Permission removed successfully',
      },
      400: {
        description: 'Bad request',
      },
      401: {
        description: 'Unauthorized',
      },
    },
  } as any)
  async removePermissionFromRole(
    @Body() removePermissionDto: RemovePermissionFromRoleDto,
    @Query('version') version: string = 'latest',
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'removePermissionFromRole',
        removePermissionDto,
        version,
      },
      ApplicationRolePermissionController.name,
    );

    return this.applicationRolePermissionService.removePermissionFromRole(
      removePermissionDto,
      version,
    );
  }
}
