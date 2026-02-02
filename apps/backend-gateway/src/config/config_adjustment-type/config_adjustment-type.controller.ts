import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  Delete,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { Config_AdjustmentTypeService } from './config_adjustment-type.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { BaseHttpController } from '@/common';
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
import {
  AdjustmentTypeCreateDto,
  AdjustmentTypeUpdateDto,
  IUpdateAdjustmentType,
} from './dto/adjustment-type.dto';

@Controller('api/config/:bu_code/adjustment-type')
@ApiTags('Config - Adjustment Type')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard, TenantHeaderGuard)
@ApiBearerAuth()
export class Config_AdjustmentTypeController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_AdjustmentTypeController.name,
  );

  constructor(
    private readonly config_adjustmentTypeService: Config_AdjustmentTypeService,
  ) {
    super();
  }

  @Get(':id')
  @UseGuards(new AppIdGuard('adjustment-type.findOne'))
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
      Config_AdjustmentTypeController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_adjustmentTypeService.findOne(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Get()
  @UseGuards(new AppIdGuard('adjustment-type.findAll'))
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
      Config_AdjustmentTypeController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.config_adjustmentTypeService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  @Post()
  @UseGuards(new AppIdGuard('adjustment-type.create'))
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Body() createDto: AdjustmentTypeCreateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      Config_AdjustmentTypeController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_adjustmentTypeService.create(
      createDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Put(':id')
  @UseGuards(new AppIdGuard('adjustment-type.update'))
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  async update(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: AdjustmentTypeUpdateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateDto,
        version,
      },
      Config_AdjustmentTypeController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const data: IUpdateAdjustmentType = {
      ...updateDto,
      id,
    };
    const result = await this.config_adjustmentTypeService.update(
      data,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Delete(':id')
  @UseGuards(new AppIdGuard('adjustment-type.delete'))
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
      Config_AdjustmentTypeController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_adjustmentTypeService.delete(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }
}
