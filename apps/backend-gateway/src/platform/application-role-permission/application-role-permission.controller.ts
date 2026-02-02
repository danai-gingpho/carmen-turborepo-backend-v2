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
@ApiTags('Application - Role Permission')
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
    description: 'Retrieve all permissions assigned to a specific role from micro_auth',
    operationId: 'getPermissionsByRole',
    tags: ['[Method] Get'],
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
  })
  async getPermissionsByRole(
    @Param('roleId') roleId: string,
    @Query('version') version: string = 'latest',
  ): Promise<any> {
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
    description: 'Retrieve all roles that have a specific permission from micro_auth',
    operationId: 'getRolesByPermission',
    tags: ['[Method] Get'],
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
  })
  async getRolesByPermission(
    @Param('permissionId') permissionId: string,
    @Query('version') version: string = 'latest',
  ): Promise<any> {
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
    description: 'Assign multiple permissions to a role in micro_auth',
    operationId: 'assignPermissionsToRole',
    tags: ['[Method] Post'],
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
  })
  async assignPermissionsToRole(
    @Body() assignPermissionsDto: AssignPermissionsToRoleDto,
    @Query('version') version: string = 'latest',
  ): Promise<any> {
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
    description: 'Assign a single permission to a role in micro_auth',
    operationId: 'assignPermissionToRole',
    tags: ['[Method] Post'],
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
  })
  async assignPermissionToRole(
    @Body() assignPermissionDto: AssignPermissionToRoleDto,
    @Query('version') version: string = 'latest',
  ): Promise<any> {
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
    description: 'Remove multiple permissions from a role in micro_auth',
    operationId: 'removePermissionsFromRole',
    tags: ['[Method] Delete'],
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
  })
  async removePermissionsFromRole(
    @Body() removePermissionsDto: RemovePermissionsFromRoleDto,
    @Query('version') version: string = 'latest',
  ): Promise<any> {
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
    description: 'Remove a single permission from a role in micro_auth',
    operationId: 'removePermissionFromRole',
    tags: ['[Method] Delete'],
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
  })
  async removePermissionFromRole(
    @Body() removePermissionDto: RemovePermissionFromRoleDto,
    @Query('version') version: string = 'latest',
  ): Promise<any> {
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
