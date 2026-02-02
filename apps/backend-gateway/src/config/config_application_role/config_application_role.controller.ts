import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, Res, UseGuards, UseInterceptors, HttpCode, HttpStatus } from '@nestjs/common'
import { Response } from 'express';
import { KeycloakGuard } from 'src/auth'
import { TenantHeaderGuard } from 'src/common/guard/tenant-header.guard'
import { ConfigApplicationRoleService } from './config_application_role.service'
import { ZodSerializerInterceptor, BaseHttpController } from '@/common'
import { CreateConfigApplicationRoleDto, UpdateConfigApplicationRoleDto } from './dto/application_role.dto'
import { IPaginateQuery, PaginateQuery } from 'src/shared-dto/paginate.dto'
import { ExtractRequestHeader } from 'src/common/helpers/extract_header'
import { BackendLogger } from 'src/common/helpers/backend.logger'
import { ApiTags } from '@nestjs/swagger'
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator'

@Controller('api/config/:bu_code/application-roles')
@ApiTags('Config - Application Roles')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard, TenantHeaderGuard)
export class ConfigApplicationRoleController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    ConfigApplicationRoleController.name,
  );
  constructor(
    private readonly configApplicationRoleService: ConfigApplicationRoleService,
  ) {
    super();
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query() query: IPaginateQuery,
    @Query('version') version: string = 'latest'
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAll',
        user_id: ExtractRequestHeader(req).user_id,
        bu_code,
        query,
        version,
      },
      ConfigApplicationRoleController.name,
    )
    const { user_id } = ExtractRequestHeader(req)
    const paginate = PaginateQuery(query)

    const result = await this.configApplicationRoleService.findAll(paginate, user_id, bu_code, version)
    this.respond(res, result);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest'
  ): Promise<void> {
    const { user_id } = ExtractRequestHeader(req)

    const result = await this.configApplicationRoleService.findOne(id, user_id, bu_code, version)
    this.respond(res, result);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Body() createConfigApplicationRoleDto: CreateConfigApplicationRoleDto,
    @Query('version') version: string = 'latest'
  ): Promise<void> {
    const { user_id } = ExtractRequestHeader(req);

    const result = await this.configApplicationRoleService.create(createConfigApplicationRoleDto, user_id, bu_code, version)
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Body() updateConfigApplicationRoleDto: UpdateConfigApplicationRoleDto,
    @Query('version') version: string = 'latest'
  ): Promise<void> {
    const { user_id } = ExtractRequestHeader(req);

    const result = await this.configApplicationRoleService.update({ id, ...updateConfigApplicationRoleDto }, user_id, bu_code, version)
    this.respond(res, result);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest'
  ): Promise<void> {
    const { user_id } = ExtractRequestHeader(req);

    const result = await this.configApplicationRoleService.remove(id, user_id, bu_code, version)
    this.respond(res, result);
  }


}
