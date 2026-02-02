import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { LocationsService } from './locations.service';
import {
  BaseHttpController,
  Serialize,
  ZodSerializerInterceptor,
  LocationDetailResponseSchema,
  LocationListItemResponseSchema,
} from '@/common';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { TenantHeaderGuard } from 'src/common/guard/tenant-header.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IPaginateQuery, PaginateDto } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import {
  ProductInventoryInfoDto,
  ProductInventoryInfoDtoSchema,
} from '@/common';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';

@Controller('api')
@ApiTags('Application - Location')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard, TenantHeaderGuard)
@ApiBearerAuth()
export class LocationsController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    LocationsController.name,
  );

  constructor(private readonly locationsService: LocationsService) {
    super();
  }

  @Get(':bu_code/locations')
  @UseGuards(new AppIdGuard('locations.findAll'))
  @Serialize(LocationListItemResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get locations by user ID',
    description:
      'Retrieves locations using user ID that acquired from JWT token and location must be active',
    operationId: 'findAllByUserId',
    tags: ['Application - Location'],
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
        description: 'locations was successfully retrieved',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  code: { type: 'string' },
                  name: { type: 'string' },
                  address: { type: 'string' },
                  is_active: { type: 'boolean' },
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
    @Query('version') version: string = 'latest',
    @Query() query?: IPaginateQuery,
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAll',
        version,
      },
      LocationsController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.locationsService.findByUserId(
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Get(':bu_code/locations/:id')
  @UseGuards(new AppIdGuard('locations.findOne'))
  @Serialize(LocationDetailResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get location by ID',
    description: 'Retrieves a location by ID',
  })
  async findOne(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Query('withUser') withUser: boolean = true,
    @Query('withProducts') withProducts: boolean = true,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        version,
        withUser,
        withProducts,
      },
      LocationsController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.locationsService.findOne(
      id,
      user_id,
      bu_code,
      withUser,
      withProducts,
      version,
    );
    this.respond(res, result);
  }

  @Get(':bu_code/locations/:location_id/product/:product_id/inventory')
  @UseGuards(new AppIdGuard('locations.getProductInventory'))
  @Serialize(LocationDetailResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get product inventory by location ID and product ID',
    description: 'Retrieves a product inventory by location ID and product ID',
    operationId: 'getProductInventory',
    tags: ['Application - Location'],
    deprecated: false,
    parameters: [
      {
        name: 'location_id',
        in: 'path',
        required: true,
        description: 'The ID of the location',
        example: '123',
      },
      {
        name: 'product_id',
        in: 'path',
        required: true,
        description: 'The ID of the product',
        example: '123',
      },
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
        description: 'Product inventory was successfully retrieved',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                on_hand_qty: { type: 'number' },
                on_order_qty: { type: 'number' },
                re_order_qty: { type: 'number' },
                re_stock_qty: { type: 'number' },
              },
            },
          },
        },
      },
    },
  })
  async getProductInventory(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Param('location_id') location_id: string,
    @Param('product_id') product_id: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'getProductInventory',
        location_id,
        product_id,
        version,
      },
      LocationsController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.locationsService.getProductInventory(
      location_id,
      product_id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }
}
