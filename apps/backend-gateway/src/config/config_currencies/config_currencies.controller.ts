import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { Config_CurrenciesService } from './config_currencies.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  BaseHttpController,
  CurrenciesCreateDto,
  CurrenciesUpdateDto,
  IUpdateCurrencies,
  Serialize,
  ZodSerializerInterceptor,
  CurrencyResponseSchema,
} from '@/common';
import { IPaginateQuery, PaginateQuery } from 'src/shared-dto/paginate.dto';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { TenantHeaderGuard } from 'src/common/guard/tenant-header.guard';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';

@Controller('api/config/:bu_code/currencies')
@ApiTags('Config - Currencies')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard, TenantHeaderGuard)
@ApiBearerAuth()
export class Config_CurrenciesController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_CurrenciesController.name,
  );

  constructor(private readonly currenciesService: Config_CurrenciesService) {
    super();
  }

  @Get(':id')
  @UseGuards(new AppIdGuard('currencies.findOne'))
  @Serialize(CurrencyResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a currency by ID',
    description: 'Retrieve a currency by its unique identifier',
    operationId: 'findOneCurrency',
    tags: ['config-currencies', '[Method] Get - Config'],
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
        description: 'The unique identifier of the currency',
        schema: {
          type: 'string',
          format: 'uuid',
        },
      },
    ],
    responses: {
      200: {
        description: 'Currency retrieved successfully',
      },
      404: {
        description: 'Currency not found',
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
      Config_CurrenciesController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.currenciesService.findOne(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Get()
  @UseGuards(new AppIdGuard('currencies.findAll'))
  @Serialize(CurrencyResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all currencies',
    description: 'Retrieve all currencies',
    operationId: 'findAllCurrencies',
    tags: ['config-currencies', '[Method] Get - Config'],
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
        description: 'Currencies retrieved successfully',
      },
      404: {
        description: 'Currencies not found',
      },
    },
  })
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
      Config_CurrenciesController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query) as any;
    const result = await this.currenciesService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  @Post()
  @UseGuards(new AppIdGuard('currencies.create'))
  @Serialize(CurrencyResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new currency',
    description: 'Create a new currency',
    operationId: 'createCurrency',
    tags: ['config-currencies', '[Method] Post - Config'],
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
        description: 'Currency created successfully',
      },
    },
  })
  async create(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Body() createDto: CurrenciesCreateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      Config_CurrenciesController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.currenciesService.create(
      createDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Put(':id')
  @UseGuards(new AppIdGuard('currencies.update'))
  @Serialize(CurrencyResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a currency',
    description: 'Update a currency',
    operationId: 'updateCurrency',
    tags: ['config-currencies', '[Method] Put - Config'],
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
        description: 'The unique identifier of the currency',
        schema: {
          type: 'string',
          format: 'uuid',
        },
      },
    ],
    responses: {
      200: {
        description: 'Currency updated successfully',
      },
      404: {
        description: 'Currency not found',
      },
    },
  })
  async update(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: CurrenciesUpdateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateDto,
        version,
      },
      Config_CurrenciesController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const data: IUpdateCurrencies = {
      ...updateDto,
      id,
    };
    const result = await this.currenciesService.update(
      data,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Patch(':id')
  @UseGuards(new AppIdGuard('currencies.patch'))
  @Serialize(CurrencyResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a currency',
    description: 'Update a currency',
    operationId: 'updateCurrency',
    tags: ['config-currencies', '[Method] Patch - Config'],
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
        description: 'The unique identifier of the currency',
        schema: {
          type: 'string',
          format: 'uuid',
        },
      },
    ],
    responses: {
      200: {
        description: 'Currency updated successfully',
      },
      404: {
        description: 'Currency not found',
      },
    },
  })
  async patch(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: CurrenciesUpdateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'patch',
        id,
        updateDto,
        version,
      },
      Config_CurrenciesController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const data: IUpdateCurrencies = {
      ...updateDto,
      id,
    };
    const result = await this.currenciesService.patch(
      data,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Delete(':id')
  @UseGuards(new AppIdGuard('currencies.delete'))
  @Serialize(CurrencyResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a currency',
    description: 'Delete a currency',
    operationId: 'deleteCurrency',
    tags: ['config-currencies', '[Method] Delete - Config'],
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
        description: 'Currency deleted successfully',
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
      Config_CurrenciesController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.currenciesService.delete(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }
}
