import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { LocationsService } from './locations.service';
import {
  BaseHttpController,
  Serialize,
  LocationDetailResponseSchema,
  LocationListItemResponseSchema,
  LocationByUserResponseSchema,
} from '@/common';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProductInventoryInfoResponseDto } from './swagger/response';
import { IPaginate, IPaginateQuery, PaginateDto } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import {
  ProductInventoryInfoDtoSchema,
} from '@/common';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';

@Controller('api')
@ApiTags('Config: Locations')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class LocationsController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    LocationsController.name,
  );

  constructor(private readonly locationsService: LocationsService) {
    super();
  }

  /**
   * List all locations accessible to the current user
   * ค้นหารายการสถานที่ทั้งหมดที่ผู้ใช้ปัจจุบันเข้าถึงได้
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @param query - Pagination query parameters / พารามิเตอร์การแบ่งหน้า
   * @returns List of locations for the user / รายการสถานที่ของผู้ใช้
   */
  @Get(':bu_code/locations')
  @UseGuards(new AppIdGuard('locations.findAll'))
  @Serialize(LocationListItemResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get locations by user ID',
    description:
      'Lists all active storage locations and warehouses accessible to the current user, used to select destinations for stock-in, stock-out, transfers, and physical count operations.',
    operationId: 'findAllLocationsByUserId',
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
        description: 'Locations were successfully retrieved',
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
                  location_type: { type: 'string' },
                  physical_count_type: { type: 'string' },
                  description: { type: 'string' },
                  is_active: { type: 'boolean' },
                },
              },
            },
          },
        },
      },
    },
    'x-description-th': 'แสดงรายการสถานที่/คลังสินค้าทั้งหมดที่ผู้ใช้เข้าถึงได้',
  } as any)
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

  /**
   * Get all locations assigned to a specific product
   * ค้นหารายการสถานที่ทั้งหมดที่มอบหมายให้สินค้าที่ระบุ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param product_id - Product ID / รหัสสินค้า
   * @param version - API version / เวอร์ชัน API
   * @returns List of locations for the product / รายการสถานที่ของสินค้า
   */
  @Get(':bu_code/locations/product/:product_id')
  @UseGuards(new AppIdGuard('locations.findAllByProductId'))
  @Serialize(LocationByUserResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiOperation({
    summary: 'Get locations by product ID',
    description:
      'Lists all active storage locations assigned to a specific product, used to see where a product is stocked.',
    operationId: 'findAllLocationsByProductId',
    deprecated: false,
    parameters: [
      {
        name: 'product_id',
        in: 'path',
        required: true,
        description: 'The ID of the product (UUID)',
        example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
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
        description: 'Locations were successfully retrieved',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  code: { type: 'string' },
                  name: { type: 'string' },
                  location_type: { type: 'string' },
                  physical_count_type: { type: 'string', nullable: true },
                  description: { type: 'string', nullable: true },
                  is_active: { type: 'boolean' },
                  delivery_point: {
                    type: 'object',
                    nullable: true,
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      name: { type: 'string' },
                      is_active: { type: 'boolean' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      401: { description: 'Unauthorized — invalid or missing bearer token' },
      404: { description: 'Product not found' },
    },
    'x-description-th': 'ดึงรายการสถานที่ทั้งหมดที่มอบหมายให้สินค้าที่ระบุ',
  } as any)
  async findByProductId(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Param('product_id', new ParseUUIDPipe({ version: '4' })) product_id: string,
    @Query() query: PaginateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findByProductId',
        product_id,
        query,
        version,
      },
      LocationsController.name,
    );

    const { user_id } = ExtractRequestHeader(req);

    const paginate: IPaginate = {
      page: query.page,
      perpage: query.perpage,
      search: typeof query.search === 'string' ? query.search : '',
      searchfields: Array.isArray(query.searchfields) ? query.searchfields : [],
      sort: Array.isArray(query.sort) ? query.sort : [],
      filter:
        typeof query.filter === 'object' && !Array.isArray(query.filter)
          ? query.filter
          : {},
      advance: query.advance ?? null,
      bu_code: query.bu_code ?? [],
    };

    const result = await this.locationsService.findByProductId(
      product_id,
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Get a specific location by ID
   * ค้นหารายการสถานที่เดียวตาม ID
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Location ID / รหัสสถานที่
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param withUser - Include assigned users / รวมผู้ใช้ที่ผูกไว้
   * @param withProducts - Include stocked products / รวมสินค้าที่มีในสต็อก
   * @param version - API version / เวอร์ชัน API
   * @returns Location details / รายละเอียดสถานที่
   */
  @Get(':bu_code/locations/:id')
  @UseGuards(new AppIdGuard('locations.findOne'))
  @Serialize(LocationDetailResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get location by ID',
    description: 'Retrieves the full details of a storage location including its assigned users and stocked products, used for managing warehouse configuration and inventory assignments.',
    operationId: 'findOneLocation',
    'x-description-th': 'ดึงข้อมูลสถานที่/คลังสินค้ารายการเดียวตาม ID',
  } as any)
  async findOne(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
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

  /**
   * Get product inventory levels at a specific location
   * ดึงข้อมูลระดับสินค้าคงคลังของสินค้าที่สถานที่เฉพาะ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param location_id - Location ID / รหัสสถานที่
   * @param product_id - Product ID / รหัสสินค้า
   * @param version - API version / เวอร์ชัน API
   * @returns Product inventory info (on-hand, on-order, reorder, restock) / ข้อมูลสินค้าคงคลัง (คงเหลือ, สั่งซื้อ, สั่งเติม, เติมสต็อก)
   */
  @Get(':bu_code/locations/:location_id/product/:product_id/inventory')
  @UseGuards(new AppIdGuard('locations.getProductInventory'))
  @Serialize(ProductInventoryInfoDtoSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get product inventory by location ID and product ID',
    description: 'Retrieves real-time inventory levels for a specific product at a given storage location, including on-hand, on-order, reorder, and restock quantities for procurement and replenishment decisions.',
    operationId: 'getProductInventory',
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
      200: { description: 'Product inventory was successfully retrieved' },
    },
    'x-description-th': 'ดึงข้อมูลระดับสินค้าคงคลังของสินค้าที่สถานที่เฉพาะ',
  } as any)
  @ApiResponse({ status: 200, description: 'Product inventory was successfully retrieved', type: ProductInventoryInfoResponseDto })
  async getProductInventory(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Param('location_id', new ParseUUIDPipe({ version: '4' })) location_id: string,
    @Param('product_id', new ParseUUIDPipe({ version: '4' })) product_id: string,
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
