import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, Res, UseGuards, UseInterceptors, HttpCode, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { KeycloakGuard } from 'src/auth';
import { TenantHeaderGuard } from 'src/common/guard/tenant-header.guard';
import { ConfigUserApplicationRoleService } from './config_user_application_role.service';
import { ZodSerializerInterceptor, BaseHttpController } from '@/common';
import { AssignUserApplicationRoleDto, RemoveUserApplicationRoleDto, UpdateUserApplicationRoleDto } from './dto/user_application_role.dto';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { ApiTags } from '@nestjs/swagger';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';

@Controller('api/config/:bu_code/user-application-roles')
@ApiTags('Config - User Application Roles')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard, TenantHeaderGuard)
export class ConfigUserApplicationRoleController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    ConfigUserApplicationRoleController.name,
  );

  constructor(
    private readonly configUserApplicationRoleService: ConfigUserApplicationRoleService,
  ) {
    super();
  }

  @Get(':user_id')
  @HttpCode(HttpStatus.OK)
  async findByUser(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Param('user_id') targetUserId: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findByUser',
        user_id: ExtractRequestHeader(req).user_id,
        targetUserId,
        bu_code,
        version,
      },
      ConfigUserApplicationRoleController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.configUserApplicationRoleService.findByUser(targetUserId, bu_code, version);
    this.respond(res, result);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async assign(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Body() assignDto: AssignUserApplicationRoleDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'assign',
        user_id: ExtractRequestHeader(req).user_id,
        assignDto,
        bu_code,
        version,
      },
      ConfigUserApplicationRoleController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.configUserApplicationRoleService.assign(assignDto, user_id, bu_code, version);
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Patch()
  @HttpCode(HttpStatus.OK)
  async update(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: UpdateUserApplicationRoleDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        user_id: ExtractRequestHeader(req).user_id,
        updateDto,
        bu_code,
        version,
      },
      ConfigUserApplicationRoleController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.configUserApplicationRoleService.update(updateDto, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  async remove(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Body() removeDto: RemoveUserApplicationRoleDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'remove',
        user_id: ExtractRequestHeader(req).user_id,
        removeDto,
        bu_code,
        version,
      },
      ConfigUserApplicationRoleController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.configUserApplicationRoleService.remove(removeDto, user_id, bu_code, version);
    this.respond(res, result);
  }
}
