import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { StockInDetailService } from './stock-in-detail.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  StockInDetailCreateRequestDto,
  StockInDetailUpdateRequestDto,
} from './swagger/request';
import {
  BaseHttpController,
  EnrichAuditUsers,
  Serialize,
  StockInMutationResponseSchema,
} from '@/common';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { IPaginateQuery, PaginateQuery } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import { StockInDetailCreateDto, StockInDetailUpdateDto } from 'src/common/dto/stock-in/stock-in.dto';

@Controller('api/:bu_code/stock-in-detail')
@ApiTags('Inventory: Stock In')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class StockInDetailController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(StockInDetailController.name);

  constructor(private readonly stockInDetailService: StockInDetailService) {
    super();
  }

  /**
   * List all stock-in detail records with pagination.
   * ค้นหารายการย่อยรับสินค้าเข้าคลังทั้งหมดพร้อมการแบ่งหน้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param query - Pagination and filter parameters / พารามิเตอร์การแบ่งหน้าและตัวกรอง
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated list of stock-in details / รายการย่อยรับสินค้าเข้าคลังพร้อมการแบ่งหน้า
   */
  @Get()
  @UseGuards(new AppIdGuard('stockInDetail.findAll'))
  @EnrichAuditUsers()
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all Stock In Details with pagination',
    description: 'Lists all line items across stock-in transactions, showing individual products and quantities received into inventory from vendors or inter-location transfers.',
    operationId: 'findAllStockInDetails',
    responses: {
      200: { description: 'Stock In Details retrieved successfully' },
    },
  })
  async findAll(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query() query: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug({ function: 'findAll', query, version }, StockInDetailController.name);

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.stockInDetailService.findAll(user_id, bu_code, paginate, version);
    this.respond(res, result);
  }

  /**
   * Retrieve a stock-in detail record by ID.
   * ค้นหารายการย่อยรับสินค้าเข้าคลังเดียวตาม ID
   * @param id - Stock in detail ID / รหัสรายการย่อยรับสินค้าเข้าคลัง
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Stock-in detail record / รายการย่อยรับสินค้าเข้าคลัง
   */
  @Get(':id')
  @UseGuards(new AppIdGuard('stockInDetail.findOne'))
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get a Stock In Detail by ID',
    description: 'Retrieves a specific line item from a stock-in transaction, including the product, received quantity, unit of measure, and cost details for inventory valuation.',
    operationId: 'findOneStockInDetail',
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Stock In Detail ID' },
    ],
    responses: {
      200: { description: 'Stock In Detail retrieved successfully' },
      404: { description: 'Stock In Detail not found' },
    },
  })
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug({ function: 'findOne', id, version }, StockInDetailController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.stockInDetailService.findOne(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Create a new standalone stock-in detail record.
   * สร้างรายการย่อยรับสินค้าเข้าคลังแบบแยกเดี่ยวใหม่
   * @param createDto - Detail creation data / ข้อมูลสำหรับสร้างรายการย่อย
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Created stock-in detail / รายการย่อยรับสินค้าเข้าคลังที่สร้างแล้ว
   */
  @Post()
  @UseGuards(new AppIdGuard('stockInDetail.create'))
  @Serialize(StockInMutationResponseSchema)
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Create a new Stock In Detail',
    description: 'Adds a new product line item to a draft stock-in transaction, specifying the product, quantity received, and unit of measure for goods being received into a storage location.',
    operationId: 'createStockInDetail',
    responses: {
      201: { description: 'Stock In Detail created successfully' },
      400: { description: 'Cannot add detail to non-draft Stock In' },
      404: { description: 'Stock In not found' },
    },
  })
  @ApiBody({ type: StockInDetailCreateRequestDto })
  async create(
    @Body() createDto: StockInDetailCreateDto,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug({ function: 'create', createDto, version }, StockInDetailController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.stockInDetailService.create({ ...createDto }, user_id, bu_code, version);
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Update an existing stock-in detail record.
   * อัปเดตรายการย่อยรับสินค้าเข้าคลังที่มีอยู่
   * @param id - Stock in detail ID / รหัสรายการย่อยรับสินค้าเข้าคลัง
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param updateDto - Detail update data / ข้อมูลสำหรับอัปเดตรายการย่อย
   * @param version - API version / เวอร์ชัน API
   * @returns Updated stock-in detail / รายการย่อยรับสินค้าเข้าคลังที่อัปเดตแล้ว
   */
  @Patch(':id')
  @UseGuards(new AppIdGuard('stockInDetail.update'))
  @Serialize(StockInMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Update a Stock In Detail',
    description: 'Modifies a product line item in a draft stock-in transaction, allowing corrections to received quantities, units, or cost before the stock-in is finalized and inventory balances are updated.',
    operationId: 'updateStockInDetail',
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Stock In Detail ID' },
    ],
    responses: {
      200: { description: 'Stock In Detail updated successfully' },
      400: { description: 'Cannot update detail of non-draft Stock In' },
      404: { description: 'Stock In Detail not found' },
    },
  })
  @ApiBody({ type: StockInDetailUpdateRequestDto })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: StockInDetailUpdateDto,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug({ function: 'update', id, updateDto, version }, StockInDetailController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.stockInDetailService.update(id, { ...updateDto }, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Delete a stock-in detail record.
   * ลบรายการย่อยรับสินค้าเข้าคลัง
   * @param id - Stock in detail ID / รหัสรายการย่อยรับสินค้าเข้าคลัง
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @Delete(':id')
  @UseGuards(new AppIdGuard('stockInDetail.delete'))
  @Serialize(StockInMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Delete a Stock In Detail',
    description: 'Removes a product line item from a draft stock-in transaction, used when an item was added in error or is no longer part of the goods being received.',
    operationId: 'deleteStockInDetail',
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Stock In Detail ID' },
    ],
    responses: {
      200: { description: 'Stock In Detail deleted successfully' },
      400: { description: 'Cannot delete detail of non-draft Stock In' },
      404: { description: 'Stock In Detail not found' },
    },
  })
  async delete(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug({ function: 'delete', id, version }, StockInDetailController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.stockInDetailService.delete(id, user_id, bu_code, version);
    this.respond(res, result);
  }
}
