import {
  Controller,
  Get,
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
  ConsoleLogger,
  Query,
  Patch,
} from '@nestjs/common';
import { Response } from 'express';
import { Config_ExtraCostTypeService } from './config_extra_cost_type.service';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  BaseHttpController,
  ExtraCostTypeCreateDto,
  ExtraCostTypeUpdateDto,
  IUpdateExtraCostType,
  Serialize,
  ZodSerializerInterceptor,
  ExtraCostTypeDetailResponseSchema,
  ExtraCostTypeListItemResponseSchema,
  ExtraCostTypeMutationResponseSchema,
} from '@/common';
import { TenantHeaderGuard } from 'src/common/guard/tenant-header.guard';
import {
  ApiVersionMinRequest,
  ApiUserFilterQueries,
} from 'src/common/decorator/userfilter.decorator';
import { PaginateQuery } from 'src/shared-dto/paginate.dto';
import { IPaginateQuery } from 'src/shared-dto/paginate.dto';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';

@ApiTags('Config - Extra Cost Type')
@ApiHeaderRequiredXAppId()
@Controller('api/config/:bu_code/extra-cost-type')
@UseGuards(KeycloakGuard, TenantHeaderGuard)
@ApiBearerAuth()
export class Config_ExtraCostTypeController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_ExtraCostTypeController.name,
  );

  constructor(
    private readonly configExtraCostTypeService: Config_ExtraCostTypeService,
  ) {
    super();
  }

  @Get(':id')
  @UseGuards(new AppIdGuard('extraCostType.findOne'))
  @Serialize(ExtraCostTypeDetailResponseSchema)
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
      Config_ExtraCostTypeController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.configExtraCostTypeService.findOne(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Get()
  @UseGuards(new AppIdGuard('extraCostType.findAll'))
  @Serialize(ExtraCostTypeListItemResponseSchema)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @HttpCode(HttpStatus.OK)
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
      Config_ExtraCostTypeController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.configExtraCostTypeService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  @Post()
  @UseGuards(new AppIdGuard('extraCostType.create'))
  @Serialize(ExtraCostTypeMutationResponseSchema)
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  async create(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Body() createDto: ExtraCostTypeCreateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      Config_ExtraCostTypeController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.configExtraCostTypeService.create(
      createDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Patch(':id')
  @UseGuards(new AppIdGuard('extraCostType.update'))
  @Serialize(ExtraCostTypeMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async update(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: ExtraCostTypeUpdateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateDto,
        version,
      },
      Config_ExtraCostTypeController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const data: IUpdateExtraCostType = {
      ...updateDto,
      id,
    };
    const result = await this.configExtraCostTypeService.update(
      data,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Delete(':id')
  @UseGuards(new AppIdGuard('extraCostType.delete'))
  @Serialize(ExtraCostTypeMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
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
      Config_ExtraCostTypeController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.configExtraCostTypeService.delete(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }
}
