import {
  Controller,
  Get,
  ConsoleLogger,
  Param,
  Post,
  Body,
  Put,
  Delete,
  UseGuards,
  UseInterceptors,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { Config_UnitsService } from './config_units.service';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  BaseHttpController,
  UnitsCreateDto,
  UnitsUpdateDto,
  IUpdateUnits,
  Serialize,
  ZodSerializerInterceptor,
  UnitDetailResponseSchema,
  UnitListItemResponseSchema,
  UnitMutationResponseSchema,
} from '@/common';
import { TenantHeaderGuard } from 'src/common/guard/tenant-header.guard';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { PaginateQuery } from 'src/shared-dto/paginate.dto';
import { IPaginateQuery } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';

@Controller('api/config/:bu_code/units')
@ApiTags('Config - Units')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard, TenantHeaderGuard)
@ApiBearerAuth()
export class Config_UnitsController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_UnitsController.name,
  );

  constructor(private readonly config_unitsService: Config_UnitsService) {
    super();
  }

  @Get(':id')
  @UseGuards(new AppIdGuard('unit.findOne'))
  @Serialize(UnitDetailResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        version,
      },
      Config_UnitsController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_unitsService.findOne(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Get()
  @UseGuards(new AppIdGuard('unit.findAll'))
  @Serialize(UnitListItemResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiUserFilterQueries()
  async findAll(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query() query?: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAll',
        query,
        version,
      },
      Config_UnitsController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.config_unitsService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  @Post()
  @UseGuards(new AppIdGuard('unit.create'))
  @Serialize(UnitMutationResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Body() createDto: UnitsCreateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      Config_UnitsController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_unitsService.create(
      createDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Put(':id')
  @UseGuards(new AppIdGuard('unit.update'))
  @Serialize(UnitMutationResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  async update(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: UnitsUpdateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateDto,
        version,
      },
      Config_UnitsController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const data: IUpdateUnits = {
      ...updateDto,
      id,
    };
    const result = await this.config_unitsService.update(data, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Delete(':id')
  @UseGuards(new AppIdGuard('unit.delete'))
  @Serialize(UnitMutationResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  async delete(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'delete',
        id,
        version,
      },
      Config_UnitsController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_unitsService.delete(id, user_id, bu_code, version);
    this.respond(res, result);
  }
}
