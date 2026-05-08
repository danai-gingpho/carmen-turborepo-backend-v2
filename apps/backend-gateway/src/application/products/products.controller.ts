import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ProductsService } from './products.service';
import { PaginateQuery } from 'src/shared-dto/paginate.dto';
import { IPaginateQuery } from 'src/shared-dto/paginate.dto';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  LastPurchaseResponseDto,
  OnHandResponseDto,
  OnOrderResponseDto,
} from 'src/config/config_products/swagger/response';
import { ProductCostResponseDto } from './swagger/response';
import { ProductCostRequestSwaggerDto } from './swagger/request';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import {
  BaseHttpController,
  Serialize,
  ProductLocationListItemResponseSchema,
  ProductCostRequestDto,
} from '@/common';

@Controller('api')
@ApiTags('Config: Products')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class ProductsController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    ProductsController.name,
  );

  constructor(private readonly productService: ProductsService) {
    super();
  }

  /**
   * List locations that have any inventory movement
   * ดึงสถานที่ทั้งหมดที่มีการเคลื่อนไหวสต็อก
   */
  @Get(':bu_code/products/movement/locations')
  @UseGuards(new AppIdGuard('product.list-locations-with-any-movement'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'List locations that have any inventory movement',
    description:
      'Returns distinct locations that appear in tb_inventory_transaction_cost_layer. Useful for filtering location pickers to only those with real stock activity.',
    operationId: 'listLocationsWithAnyMovement',
    responses: {
      200: { description: 'Locations with movement retrieved successfully' },
    },
    'x-description-th': 'ดึงสถานที่ที่เคยมีการเคลื่อนไหวสต็อกจริง',
  } as any)
  @ApiResponse({ status: 200, description: 'Locations with movement retrieved successfully' })
  async listLocationsWithAnyMovement(
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'listLocationsWithAnyMovement', bu_code, version },
      ProductsController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.productService.listLocationsWithAnyMovement(
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * List products that have movement at a given location
   * ดึงสินค้าที่มีการเคลื่อนไหวสต็อกที่สถานที่ที่ระบุ
   */
  @Get(':bu_code/products/movement/locations/:location_id/products')
  @UseGuards(new AppIdGuard('product.list-products-with-movement-at-location'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'List products with movement at a location',
    description:
      'Returns distinct products that have at least one inventory movement (cost-layer entry) at the given location.',
    operationId: 'listProductsWithMovementAtLocation',
    parameters: [
      { name: 'location_id', in: 'path', required: true, description: 'Location UUID' },
    ],
    responses: {
      200: { description: 'Products with movement retrieved successfully' },
    },
    'x-description-th': 'ดึงสินค้าที่มีการเคลื่อนไหวสต็อกในสถานที่ที่ระบุ',
  } as any)
  @ApiResponse({ status: 200, description: 'Products with movement retrieved successfully' })
  async listProductsWithMovementAtLocation(
    @Param('location_id', new ParseUUIDPipe({ version: '4' })) location_id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'listProductsWithMovementAtLocation', location_id, bu_code, version },
      ProductsController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.productService.listProductsWithMovementAtLocation(
      location_id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * List products that have at least one inventory movement
   * ดึงรายการสินค้าที่เคยมีการเคลื่อนไหวสต็อก
   */
  @Get(':bu_code/products/with-movement')
  @UseGuards(new AppIdGuard('product.list-with-movement'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'List products that have inventory movements',
    description:
      'Returns distinct products that appear in tb_inventory_transaction_cost_layer (i.e. products with at least one real inventory movement). Useful for filtering pickers to products that will return non-empty stock-card data.',
    operationId: 'listProductsWithMovement',
    responses: {
      200: { description: 'Products with movement retrieved successfully' },
    },
    'x-description-th': 'ดึงสินค้าที่เคยมีการเคลื่อนไหวสต็อกจริง',
  } as any)
  @ApiResponse({ status: 200, description: 'Products with movement retrieved successfully' })
  async listProductsWithMovement(
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'listProductsWithMovement', bu_code, version },
      ProductsController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.productService.listProductsWithMovement(
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * List locations that have inventory movement for a given product
   * ดึงสถานที่ที่มีการเคลื่อนไหวสต็อกสำหรับสินค้าที่ระบุ
   */
  @Get(':bu_code/products/:product_id/locations-with-movement')
  @UseGuards(new AppIdGuard('product.list-locations-with-movement'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'List locations with movement for a product',
    description:
      'Returns distinct locations where the given product has at least one inventory movement (cost-layer entry). Useful for filtering location pickers tied to a selected product.',
    operationId: 'listLocationsWithMovementByProduct',
    parameters: [
      { name: 'product_id', in: 'path', required: true, description: 'Product UUID' },
    ],
    responses: {
      200: { description: 'Locations with movement retrieved successfully' },
      404: { description: 'Product not found' },
    },
    'x-description-th': 'ดึงสถานที่ที่มีการเคลื่อนไหวสต็อกของสินค้าที่ระบุ',
  } as any)
  @ApiResponse({ status: 200, description: 'Locations with movement retrieved successfully' })
  async listLocationsWithMovement(
    @Param('product_id', new ParseUUIDPipe({ version: '4' })) product_id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'listLocationsWithMovement', product_id, bu_code, version },
      ProductsController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.productService.listLocationsWithMovement(
      product_id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Get last purchase by product ID and date
   * ค้นหาการซื้อล่าสุดตาม ID สินค้าและวันที่
   */
  @Get(':bu_code/products/:product_id/last-purchase/:date')
  @UseGuards(new AppIdGuard('product.last-purchase'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get last purchase by product and date',
    description:
      'Retrieves the last committed good received note detail for a product on or before the specified date. Used to check the most recent purchase price and receiving information.',
    operationId: 'getLastPurchaseByProduct',
    parameters: [
      {
        name: 'product_id',
        in: 'path',
        required: true,
        description: 'Product UUID',
      },
      {
        name: 'date',
        in: 'path',
        required: true,
        description: 'Receiving date (YYYY-MM-DD)',
      },
    ],
    responses: {
      200: { description: 'Last purchase retrieved successfully' },
      404: { description: 'No purchase found for this product' },
    },
    'x-description-th': 'ดึงข้อมูลการซื้อล่าสุดของสินค้าตามวันที่ที่กำหนด',
  } as any)
  @ApiResponse({
    status: 200,
    description: 'Last purchase retrieved successfully',
    type: LastPurchaseResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'No purchase found for this product',
  })
  async getLastPurchase(
    @Param('product_id', new ParseUUIDPipe({ version: '4' })) product_id: string,
    @Param('date') date: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'getLastPurchase', product_id, date, version },
      ProductsController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.productService.getLastPurchase(
      product_id,
      date,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Get on-hand quantity for a product
   * ดึงจำนวนสินค้าคงเหลือ
   */
  @Get(':bu_code/products/:product_id/on-hand')
  @UseGuards(new AppIdGuard('product.on-hand'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get on-hand quantity by product',
    description:
      'Retrieves the on-hand inventory balance for a product across all locations, or filtered by a specific location. Returns quantity, average cost, and total value.',
    operationId: 'getOnHandByProduct',
    parameters: [
      {
        name: 'product_id',
        in: 'path',
        required: true,
        description: 'Product UUID',
      },
      {
        name: 'location_id',
        in: 'query',
        required: false,
        description: 'Optional location UUID to filter',
      },
    ],
    responses: {
      200: { description: 'On-hand balance retrieved successfully' },
    },
    'x-description-th': 'ดึงจำนวนสินค้าคงเหลือของสินค้า',
  } as any)
  @ApiResponse({
    status: 200,
    description: 'On-hand balance retrieved successfully',
    type: OnHandResponseDto,
  })
  async getOnHand(
    @Param('product_id', new ParseUUIDPipe({ version: '4' })) product_id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
    @Query('location_id') location_id?: string,
  ): Promise<void> {
    this.logger.debug(
      { function: 'getOnHand', product_id, location_id, version },
      ProductsController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.productService.getOnHand(
      product_id,
      user_id,
      bu_code,
      version,
      location_id,
    );
    this.respond(res, result);
  }

  /**
   * Get inventory movement (stock card) for a product
   * ดึงรายการเคลื่อนไหวสินค้าตามช่วงวันที่
   */
  @Get(':bu_code/products/:product_id/inventory-movement')
  @UseGuards(new AppIdGuard('product.inventory-movement'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get inventory movement by product and date range',
    description:
      'Returns the stock-card movement history for a product over [start_at, end_at]. Each row is one cost-layer event with running on-hand qty/value. cost_average is suffixed with "*" when the BU uses FIFO costing to indicate the value shifts as different lots are consumed.',
    operationId: 'getInventoryMovementByProduct',
    parameters: [
      { name: 'product_id', in: 'path', required: true, description: 'Product UUID' },
      { name: 'start_at', in: 'query', required: true, description: 'Start date (YYYY-MM-DD or ISO)' },
      { name: 'end_at', in: 'query', required: true, description: 'End date (YYYY-MM-DD or ISO)' },
      { name: 'location_id', in: 'query', required: false, description: 'Optional location UUID to filter' },
    ],
    responses: {
      200: { description: 'Inventory movement retrieved successfully' },
      404: { description: 'Product not found' },
    },
    'x-description-th': 'ดึงรายการเคลื่อนไหวสินค้า (สมุดสต็อก) ในช่วงวันที่ที่กำหนด',
  } as any)
  @ApiResponse({ status: 200, description: 'Inventory movement retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getInventoryMovement(
    @Param('product_id', new ParseUUIDPipe({ version: '4' })) product_id: string,
    @Param('bu_code') bu_code: string,
    @Query('start_at') start_at: string,
    @Query('end_at') end_at: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
    @Query('location_id') location_id?: string,
  ): Promise<void> {
    this.logger.debug(
      { function: 'getInventoryMovement', product_id, start_at, end_at, location_id, version },
      ProductsController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.productService.getInventoryMovement(
      product_id,
      start_at,
      end_at,
      user_id,
      bu_code,
      version,
      location_id,
    );
    this.respond(res, result);
  }

  /**
   * Get on-order quantity for a product
   * ดึงจำนวนสินค้าที่สั่งซื้อแล้วแต่ยังไม่ได้รับครบ
   */
  @Get(':bu_code/products/:product_id/on-order')
  @UseGuards(new AppIdGuard('product.on-order'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get on-order quantity by product',
    description: 'Retrieves the on-order quantity for a product from active purchase orders (in_progress, sent, partial). Shows pending quantity per PO.',
    operationId: 'getOnOrderByProduct',
    parameters: [
      { name: 'product_id', in: 'path', required: true, description: 'Product UUID' },
    ],
    responses: {
      200: { description: 'On-order balance retrieved successfully' },
      404: { description: 'Product not found' },
    },
    'x-description-th': 'ดึงจำนวนสินค้าที่สั่งซื้อแล้วแต่ยังไม่ได้รับครบ',
  } as any)
  @ApiResponse({ status: 200, description: 'On-order balance retrieved successfully', type: OnOrderResponseDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getOnOrder(
    @Param('product_id', new ParseUUIDPipe({ version: '4' })) product_id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'getOnOrder', product_id, version },
      ProductsController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.productService.getOnOrder(
      product_id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Get product cost by location
   * ดึงต้นทุนสินค้าตามสถานที่
   */
  @Post(':bu_code/products/cost')
  @UseGuards(new AppIdGuard('product.cost'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get product cost by location',
    description:
      'Retrieves the cost breakdown for a product at a specific location based on inventory transaction cost layers (FIFO). Returns total cost, cost per unit per lot, and lot numbers.',
    operationId: 'getProductCost',
    responses: {
      200: { description: 'Product cost retrieved successfully' },
      404: { description: 'Product or location not found' },
    },
    'x-description-th': 'ดึงต้นทุนสินค้าตามสถานที่จากธุรกรรมสต็อก',
  } as any)
  @ApiBody({ type: ProductCostRequestSwaggerDto })
  @ApiResponse({ status: 200, description: 'Product cost retrieved successfully', type: ProductCostResponseDto })
  @ApiResponse({ status: 404, description: 'Product or location not found' })
  async getProductCost(
    @Param('bu_code') bu_code: string,
    @Body() body: ProductCostRequestDto,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'getProductCost', body, version },
      ProductsController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.productService.getProductCost(
      body.product_id,
      body.location_id,
      body.quantity,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Get all products by location ID
   * ค้นหารายการสินค้าทั้งหมดตามรหัสสถานที่
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param query - Pagination query parameters / พารามิเตอร์การแบ่งหน้า
   * @param id - Location ID / รหัสสถานที่
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated list of products at the location / รายการสินค้าที่สถานที่แบบแบ่งหน้า
   */
  @Get(':bu_code/products/locations/:id')
  @UseGuards(new AppIdGuard('products.getByLocation'))
  @Serialize(ProductLocationListItemResponseSchema)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all products by location id',
    description:
      'Retrieves all products assigned to a specific storage location or warehouse, used for inventory operations such as stock-in, physical counts, and requisition fulfillment.',
    operationId: 'findAllProductsByLocationId',
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
        description: 'The products were successfully retrieved',
      },
      404: {
        description: 'The products were not found',
      },
    },
    'x-description-th': 'ดึงรายการสินค้าทั้งหมดตามรหัสสถานที่',
  } as any)
  @HttpCode(HttpStatus.OK)
  async GetByLocation(
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: IPaginateQuery,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'GetByLocation',
        id,
        version,
      },
      ProductsController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.productService.getByLocation(
      user_id,
      bu_code,
      id,
      paginate,
      version,
    );
    this.respond(res, result);
  }
}
