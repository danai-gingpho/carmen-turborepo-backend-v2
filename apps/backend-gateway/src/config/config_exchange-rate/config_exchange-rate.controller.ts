import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  ConsoleLogger,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { Config_ExchangeRateService } from './config_exchange-rate.service';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  BaseHttpController,
  ExchangeRateCreateDto,
  ExchangeRateUpdateDto,
  IUpdateExchangeRate,
  Serialize,
  ZodSerializerInterceptor,
  ExchangeRateDetailResponseSchema,
  ExchangeRateListItemResponseSchema,
  ExchangeRateMutationResponseSchema,
} from '@/common';
import { TenantHeaderGuard } from 'src/common/guard/tenant-header.guard';
import {
  ApiVersionMinRequest,
  ApiUserFilterQueries,
} from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { IPaginateQuery } from 'src/shared-dto/paginate.dto';
import { PaginateQuery } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';

@Controller('api/config/:bu_code/exchange-rate')
@ApiTags('Config - Exchange Rate')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard, TenantHeaderGuard)
@ApiBearerAuth()
export class Config_ExchangeRateController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_ExchangeRateController.name,
  );

  constructor(
    private readonly config_exchangeRateService: Config_ExchangeRateService,
  ) {
    super();
  }

  @Get(':id')
  @UseGuards(new AppIdGuard('exchangeRate.findOne'))
  @Serialize(ExchangeRateDetailResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get a exchange rate by ID',
    description: 'Get a exchange rate by ID',
    operationId: 'findOneExchangeRate',
    tags: ['config-exchange-rate', '[Method] Get - Config'],
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
      },
    ],
    responses: {
      200: {
        description: 'Exchange rate retrieved successfully',
      },
    },
  })
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
      Config_ExchangeRateController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_exchangeRateService.findOne(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Get()
  @UseGuards(new AppIdGuard('exchangeRate.findAll'))
  @Serialize(ExchangeRateListItemResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiOperation({
    summary: 'Get all exchange rates',
    description: 'Get all exchange rates',
    operationId: 'findAllExchangeRates',
    tags: ['config-exchange-rate', '[Method] Get - Config'],
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
      },
    ],
    responses: {
      200: {
        description: 'Exchange rates retrieved successfully',
      },
    },
  })
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
      Config_ExchangeRateController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.config_exchangeRateService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  @Post()
  @UseGuards(new AppIdGuard('exchangeRate.create'))
  @Serialize(ExchangeRateMutationResponseSchema)
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Create a new exchange rate',
    description: 'Create a new exchange rate',
    operationId: 'createExchangeRate',
    tags: ['config-exchange-rate', '[Method] Post - Config'],
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
      },
    ],
    responses: {
      201: {
        description: 'Exchange rate created successfully',
      },
    },
  })
  async create(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Body() createDto: ExchangeRateCreateDto | ExchangeRateCreateDto[],
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      Config_ExchangeRateController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_exchangeRateService.create(
      createDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Patch(':id')
  @UseGuards(new AppIdGuard('exchangeRate.update'))
  @Serialize(ExchangeRateMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Update a exchange rate',
    description: 'Update a exchange rate',
    operationId: 'updateExchangeRate',
    tags: ['config-exchange-rate', '[Method] Patch - Config'],
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
      },
    ],
    responses: {
      200: {
        description: 'Exchange rate updated successfully',
      },
    },
  })
  async update(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: ExchangeRateUpdateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateDto,
        version,
      },
      Config_ExchangeRateController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const data: IUpdateExchangeRate = {
      ...updateDto,
      id,
    };
    const result = await this.config_exchangeRateService.update(
      data,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Delete(':id')
  @UseGuards(new AppIdGuard('exchangeRate.delete'))
  @Serialize(ExchangeRateMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Delete a exchange rate',
    description: 'Delete a exchange rate',
    operationId: 'deleteExchangeRate',
    tags: ['config-exchange-rate', '[Method] Delete - Config'],
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
      },
    ],
    responses: {
      200: {
        description: 'Exchange rate deleted successfully',
      },
    },
  })
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
      Config_ExchangeRateController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_exchangeRateService.delete(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }
}
