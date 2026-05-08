import {
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
import { InventoryTransactionService } from './inventory-transaction.service';
import {
  ApiBearerAuth,
  ApiExcludeEndpoint,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  BaseHttpController,
} from '@/common';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import { IPaginateQuery, PaginateQuery } from 'src/shared-dto/paginate.dto';
import { ApiUserFilterQueries, ApiVersionMinRequest } from 'src/common/decorator/userfilter.decorator';

@Controller('api/:bu_code/inventory-transaction')
@ApiTags('Inventory: Transactions')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class InventoryTransactionController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    InventoryTransactionController.name,
  );

  constructor(
    private readonly inventoryTransactionService: InventoryTransactionService,
  ) {
    super();
  }

  // ==================== Query Endpoints ====================

  /**
   * GET /api/:bu_code/inventory-transaction
   * List all inventory transactions with pagination.
   * ดึงรายการเคลื่อนไหวสินค้าคงคลังทั้งหมดพร้อมการแบ่งหน้า
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiOperation({
    summary: 'List all inventory transactions',
    description: 'Lists all inventory transactions with type, location, product, qty, cost details.',
    operationId: 'findAllInventoryTransactions',
    'x-description-th': 'ดึงรายการเคลื่อนไหวสินค้าคงคลังทั้งหมดพร้อมประเภท สถานที่ สินค้า จำนวน และต้นทุน',
  } as any)
  async findAll(
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug({ function: 'findAll', query, version }, InventoryTransactionController.name);
    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.inventoryTransactionService.findAll(user_id, bu_code, paginate, version);
    this.respond(res, result);
  }

  /**
   * GET /api/:bu_code/inventory-transaction/cost-layers?product_id=xxx&location_id=xxx
   */
  @Get('cost-layers')
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiOperation({
    summary: 'View cost layers for a product',
    operationId: 'getCostLayers',
    'x-description-th': 'ดูชั้นต้นทุนของสินค้า แสดงรายการต้นทุนแต่ละชั้นตามสถานที่และสินค้าที่กำหนด',
  } as any)
  @ApiQuery({ name: 'product_id', required: false, type: String })
  @ApiQuery({ name: 'location_id', required: false, type: String })
  async getCostLayers(
    @Param('bu_code') bu_code: string,
    @Query('product_id') product_id: string | undefined,
    @Query('location_id') location_id: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: IPaginateQuery,
  ): Promise<void> {
    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.inventoryTransactionService.getCostLayers(product_id, location_id, user_id, bu_code, paginate);
    this.respond(res, result);
  }

  /**
   * GET /api/:bu_code/inventory-transaction/stock-balance?product_id=xxx
   */
  @Get('stock-balance')
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiOperation({
    summary: 'View aggregated stock balance per product/location',
    operationId: 'getStockBalance',
    'x-description-th': 'ดูยอดคงเหลือสินค้ารวมตามสินค้าและสถานที่ แสดงจำนวนคงเหลือปัจจุบันของสินค้าในแต่ละคลัง',
  } as any)
  @ApiQuery({ name: 'product_id', required: false, type: String })
  async getStockBalance(
    @Param('bu_code') bu_code: string,
    @Query('product_id') product_id: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: IPaginateQuery,
  ): Promise<void> {
    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.inventoryTransactionService.getStockBalance(product_id, user_id, bu_code, paginate);
    this.respond(res, result);
  }

  /**
   * GET /api/:bu_code/inventory-transaction/locations
   */
  @Get('locations')
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiOperation({
    summary: 'List active locations',
    operationId: 'getLocations',
    'x-description-th': 'ดึงรายการสถานที่/คลังสินค้าที่ใช้งานอยู่ทั้งหมดของหน่วยธุรกิจ',
  } as any)
  async getLocations(
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: IPaginateQuery,
  ): Promise<void> {
    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.inventoryTransactionService.getLocations(user_id, bu_code, paginate);
    this.respond(res, result);
  }

  /**
   * GET /api/:bu_code/inventory-transaction/products
   */
  @Get('products')
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiOperation({
    summary: 'List all products',
    operationId: 'getProducts',
    'x-description-th': 'ดึงรายการสินค้าทั้งหมดของหน่วยธุรกิจ',
  } as any)
  async getProducts(
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: IPaginateQuery,
  ): Promise<void> {
    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.inventoryTransactionService.getProducts(user_id, bu_code, paginate);
    this.respond(res, result);
  }

  /**
   * GET /api/:bu_code/inventory-transaction/locations/:location_id/products
   */
  @Get('locations/:location_id/products')
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiOperation({
    summary: 'List products at a location',
    operationId: 'getProductsByLocation',
    'x-description-th': 'ดึงรายการสินค้าที่จัดเก็บในสถานที่/คลังสินค้าที่กำหนด',
  } as any)
  async getProductsByLocation(
    @Param('bu_code') bu_code: string,
    @Param('location_id', new ParseUUIDPipe({ version: '4' })) location_id: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: IPaginateQuery,
  ): Promise<void> {
    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.inventoryTransactionService.getProductsByLocation(location_id, user_id, bu_code, paginate);
    this.respond(res, result);
  }

  /**
   * GET /api/:bu_code/inventory-transaction/calculation-method
   */
  @Get('calculation-method')
  @ApiOperation({
    summary: 'Get calculation method (fifo/average) for this BU',
    operationId: 'getCalculationMethod',
    'x-description-th': 'ดึงวิธีการคำนวณต้นทุนสินค้า (FIFO/ค่าเฉลี่ย) ที่ตั้งค่าไว้สำหรับหน่วยธุรกิจนี้',
  } as any)
  async getCalculationMethod(
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.inventoryTransactionService.getCalculationMethod(user_id, bu_code);
    this.respond(res, result);
  }

  /**
   * POST /api/:bu_code/inventory-transaction/admin/backfill/zero-cost-layers
   * Dev-only: insert missing tb_inventory_transaction_cost_layer rows for
   * stranded inbound details (created before the zero-cost guard fix).
   * Idempotent. Not published in Swagger.
   */
  @Post('admin/backfill/zero-cost-layers')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint(true)
  async backfillZeroCostLayers(
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.inventoryTransactionService.backfillZeroCostLayers(user_id, bu_code);
    this.respond(res, result);
  }
}
