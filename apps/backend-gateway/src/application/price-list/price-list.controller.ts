import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Query,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { PriceListService } from './price-list.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TenantHeaderGuard } from 'src/common/guard/tenant-header.guard';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { IPaginate, IPaginateQuery } from 'src/shared-dto/paginate.dto';
import { PaginateQuery } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import {
  BaseHttpController,
  Serialize,
  ZodSerializerInterceptor,
  PriceListDetailResponseSchema,
  PriceListListItemResponseSchema,
  PriceListMutationResponseSchema,
  PriceListCreateDto,
  PriceListUpdateDto,
  isValidDate,
  toISOStringOrThrow,
} from '@/common';

@Controller('api/:bu_code/price-list')
@ApiTags('Application - Price List')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard, TenantHeaderGuard)
@ApiBearerAuth()
export class PriceListController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    PriceListController.name,
  );

  constructor(private readonly priceListService: PriceListService) {
    super();
    this.logger.debug('PriceListController initialized');
  }

  @Get('price-compare')
  @UseGuards(new AppIdGuard('priceList.priceCompare'))
  @Serialize(PriceListListItemResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiOperation({
    summary: 'Compare price list',
    description: 'Compares price list based on given criteria',
    operationId: 'priceCompare',
    tags: ['Application - Price List', '[Method] Get'],
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    responses: {
      200: {
        description: 'Price comparison was successfully retrieved',
      },
    },
  })
  async priceCompare(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query() query: any,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'priceCompare',
        query,
        version,
      },
      PriceListController.name,
    );

    const { product_id, at_date, unit_id, currency_id } = query

    if (!product_id || !at_date || !currency_id) {
      throw new Error('product_id, at_date, and currency_id are required');
    }

    if (!isValidDate(at_date)) {
      throw new Error('at_date is invalid date format');
    }
    const due_date = toISOStringOrThrow(at_date);
    const { user_id } = ExtractRequestHeader(req);
    const queryData = {
      product_id,
      due_date,
      unit_id: unit_id || null,
      currency_id,
    }

    const result = await this.priceListService.priceCompare(queryData, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Get(':id')
  @UseGuards(new AppIdGuard('priceList.findOne'))
  @Serialize(PriceListDetailResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get price list by ID',
    description: 'Retrieves price list by ID',
    operationId: 'findOnePriceList',
    tags: ['Application - Price List', '[Method] Get'],
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
        description: 'Price list was successfully retrieved',
      },
      404: {
        description: 'Price list was not found',
      },
    },
  })
  async findOne(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        version,
      },
      PriceListController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.priceListService.findOne(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Get()
  @UseGuards(new AppIdGuard('priceList.findAll'))
  @Serialize(PriceListListItemResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get price list by user ID',
    description:
      'Retrieves price list using user ID that acquired from JWT token and price list must be active',
    operationId: 'findAllByUserId',
    tags: ['Application - Price List'],
    deprecated: false,
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
        description: 'The version of the API',
        example: 'latest',
      },
    ],
    responses: {
      200: {
        description: 'Price list was successfully retrieved',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  vendor_id: { type: 'string' },
                  vendor_name: { type: 'string' },
                  product_id: { type: 'string' },
                  product_name: { type: 'string' },
                  price: { type: 'number' },
                  price_with_vat: { type: 'number' },
                  price_without_vat: { type: 'number' },
                  from_date: { type: 'string', format: 'date-time' },
                  to_date: { type: 'string', format: 'date-time' },
                  created_at: { type: 'string', format: 'date-time' },
                  updated_at: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
      },
    },
  })
  async findAll(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query() query: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAll',
        query,
        version,
      },
      PriceListController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate: IPaginate = PaginateQuery(query) as IPaginate;
    const result = await this.priceListService.findAll(user_id, bu_code, paginate, version);
    this.respond(res, result);
  }

  @Post()
  @UseGuards(new AppIdGuard('priceList.create'))
  @Serialize(PriceListMutationResponseSchema)
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Create a new price list',
    description: 'Creates a new price list',
    operationId: 'createPriceList',
    tags: ['Application - Price List', '[Method] Post'],
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    responses: {
      201: {
        description: 'Price list was successfully created',
      },
      400: {
        description: 'Bad request',
      },
    },
  })
  async create(
    @Body() data: PriceListCreateDto,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        data,
        version,
      },
      PriceListController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.priceListService.create(data, user_id, bu_code, version);
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Patch(':id')
  @UseGuards(new AppIdGuard('priceList.update'))
  @Serialize(PriceListMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Update a price list',
    description: 'Updates an existing price list',
    operationId: 'updatePriceList',
    tags: ['Application - Price List', '[Method] Patch'],
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
        description: 'Price list was successfully updated',
      },
      404: {
        description: 'Price list was not found',
      },
    },
  })
  async update(
    @Param('id') id: string,
    @Body() data: PriceListUpdateDto,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        data,
        version,
      },
      PriceListController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.priceListService.update({ ...data, id }, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Delete(':id')
  @UseGuards(new AppIdGuard('priceList.delete'))
  @Serialize(PriceListMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Delete a price list',
    description: 'Deletes an existing price list (soft delete)',
    operationId: 'deletePriceList',
    tags: ['Application - Price List', '[Method] Delete'],
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
        description: 'Price list was successfully deleted',
      },
      404: {
        description: 'Price list was not found',
      },
    },
  })
  async remove(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'remove',
        id,
        version,
      },
      PriceListController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.priceListService.remove(id, user_id, bu_code, version);
    this.respond(res, result);
  }
}
