import {
  Controller,
  Get,
  ConsoleLogger,
  Post,
  Req,
  Res,
  UseGuards,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Put,
  Delete,
  Query,
  Patch,
} from '@nestjs/common';
import { Response } from 'express';
import { Platform_UserBusinessUnitService } from './platform_user-business-unit.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  IUserBusinessUnitUpdate,
  UserBusinessUnitDto,
  UserBusinessUnitUpdateDto,
} from './dto/platform_user-business-unit.dto';
import { ApiVersionMinRequest } from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { IPaginateQuery } from 'src/shared-dto/paginate.dto';
import { PaginateQuery } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { query } from 'winston';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import { BaseHttpController } from '@/common';

@Controller('api-system/user/business-unit')
@ApiTags('Platform - User Business Unit')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class Platform_UserBusinessUnitController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    Platform_UserBusinessUnitController.name,
  );

  constructor(
    private readonly platform_userBusinessUnitService: Platform_UserBusinessUnitService,
  ) {
    super();
  }

  @Get(':id')
  @UseGuards(new AppIdGuard('userBusinessUnit.findOne'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async findOne(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        version,
      },
      Platform_UserBusinessUnitController.name,
    );
    const { user_id, tenant_id } = ExtractRequestHeader(req);
    const result = await this.platform_userBusinessUnitService.findOne(id, user_id, version);
    this.respond(res, result);
  }

  @Get()
  @UseGuards(new AppIdGuard('userBusinessUnit.findAll'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async findAll(
    @Req() req: Request,
    @Res() res: Response,
    @Query() query?: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAll',
        query,
        version,
      },
      Platform_UserBusinessUnitController.name,
    );
    const { user_id, tenant_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.platform_userBusinessUnitService.findAll(
      user_id,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  @Post()
  @UseGuards(new AppIdGuard('userBusinessUnit.create'))
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  async create(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: UserBusinessUnitDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        body,
        version,
      },
      Platform_UserBusinessUnitController.name,
    );
    const { user_id, tenant_id } = ExtractRequestHeader(req);
    const result = await this.platform_userBusinessUnitService.create(body, user_id, version);
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Patch(':id')
  @UseGuards(new AppIdGuard('userBusinessUnit.update'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async update(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Body() body: UserBusinessUnitUpdateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        body,
        version,
      },
      Platform_UserBusinessUnitController.name,
    );
    const { user_id, tenant_id } = ExtractRequestHeader(req);
    const data: IUserBusinessUnitUpdate = {
      ...body,
      id,
    };
    const result = await this.platform_userBusinessUnitService.update(data, user_id, version);
    this.respond(res, result);
  }

  @Delete(':id')
  @UseGuards(new AppIdGuard('userBusinessUnit.delete'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async delete(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'delete',
        id,
        version,
      },
      Platform_UserBusinessUnitController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.platform_userBusinessUnitService.delete(id, user_id, version);
    this.respond(res, result);
  }

}
