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
import { StockOutDetailService } from './stock-out-detail.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  StockOutDetailCreateRequestDto,
  StockOutDetailUpdateRequestDto,
} from './swagger/request';
import {
  BaseHttpController,
  EnrichAuditUsers,
  Serialize,
  StockOutMutationResponseSchema,
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
import { StockOutDetailCreateDto, StockOutDetailUpdateDto } from 'src/common/dto/stock-out/stock-out.dto';

@Controller('api/:bu_code/stock-out-detail')
@ApiTags('Inventory: Stock Out')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class StockOutDetailController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(StockOutDetailController.name);

  constructor(private readonly stockOutDetailService: StockOutDetailService) {
    super();
  }

  /**
   * List all stock-out detail records with pagination.
   * ค้นหารายการย่อยจ่ายสินค้าออกคลังทั้งหมดพร้อมการแบ่งหน้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param query - Pagination and filter parameters / พารามิเตอร์การแบ่งหน้าและตัวกรอง
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated list of stock-out details / รายการย่อยจ่ายสินค้าออกคลังพร้อมการแบ่งหน้า
   */
  @Get()
  @UseGuards(new AppIdGuard('stockOutDetail.findAll'))
  @EnrichAuditUsers()
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all Stock Out Details with pagination',
    description: 'Lists all line items across stock-out transactions, showing individual products and quantities issued from inventory to hotel departments or operational areas.',
    operationId: 'findAllStockOutDetails',
    responses: {
      200: { description: 'Stock Out Details retrieved successfully' },
    },
  })
  async findAll(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query() query: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug({ function: 'findAll', query, version }, StockOutDetailController.name);

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.stockOutDetailService.findAll(user_id, bu_code, paginate, version);
    this.respond(res, result);
  }

  /**
   * Retrieve a stock-out detail record by ID.
   * ค้นหารายการย่อยจ่ายสินค้าออกคลังเดียวตาม ID
   * @param id - Stock out detail ID / รหัสรายการย่อยจ่ายสินค้าออกคลัง
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Stock-out detail record / รายการย่อยจ่ายสินค้าออกคลัง
   */
  @Get(':id')
  @UseGuards(new AppIdGuard('stockOutDetail.findOne'))
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get a Stock Out Detail by ID',
    description: 'Retrieves a specific line item from a stock-out transaction, including the product, issued quantity, unit of measure, and the department or cost center consuming the inventory.',
    operationId: 'findOneStockOutDetail',
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Stock Out Detail ID' },
    ],
    responses: {
      200: { description: 'Stock Out Detail retrieved successfully' },
      404: { description: 'Stock Out Detail not found' },
    },
  })
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug({ function: 'findOne', id, version }, StockOutDetailController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.stockOutDetailService.findOne(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Create a new standalone stock-out detail record.
   * สร้างรายการย่อยจ่ายสินค้าออกคลังแบบแยกเดี่ยวใหม่
   * @param createDto - Detail creation data / ข้อมูลสำหรับสร้างรายการย่อย
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Created stock-out detail / รายการย่อยจ่ายสินค้าออกคลังที่สร้างแล้ว
   */
  @Post()
  @UseGuards(new AppIdGuard('stockOutDetail.create'))
  @Serialize(StockOutMutationResponseSchema)
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Create a new Stock Out Detail',
    description: 'Adds a new product line item to a draft stock-out transaction, specifying the product and quantity being issued from a storage location to a requesting department such as kitchen or housekeeping.',
    operationId: 'createStockOutDetail',
    responses: {
      201: { description: 'Stock Out Detail created successfully' },
      400: { description: 'Cannot add detail to non-draft Stock Out' },
      404: { description: 'Stock Out not found' },
    },
  })
  @ApiBody({ type: StockOutDetailCreateRequestDto })
  async create(
    @Body() createDto: StockOutDetailCreateDto,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug({ function: 'create', createDto, version }, StockOutDetailController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.stockOutDetailService.create({ ...createDto }, user_id, bu_code, version);
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Update an existing stock-out detail record.
   * อัปเดตรายการย่อยจ่ายสินค้าออกคลังที่มีอยู่
   * @param id - Stock out detail ID / รหัสรายการย่อยจ่ายสินค้าออกคลัง
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param updateDto - Detail update data / ข้อมูลสำหรับอัปเดตรายการย่อย
   * @param version - API version / เวอร์ชัน API
   * @returns Updated stock-out detail / รายการย่อยจ่ายสินค้าออกคลังที่อัปเดตแล้ว
   */
  @Patch(':id')
  @UseGuards(new AppIdGuard('stockOutDetail.update'))
  @Serialize(StockOutMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Update a Stock Out Detail',
    description: 'Modifies a product line item in a draft stock-out transaction, allowing corrections to issued quantities or units before the stock-out is finalized and inventory balances are deducted.',
    operationId: 'updateStockOutDetail',
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Stock Out Detail ID' },
    ],
    responses: {
      200: { description: 'Stock Out Detail updated successfully' },
      400: { description: 'Cannot update detail of non-draft Stock Out' },
      404: { description: 'Stock Out Detail not found' },
    },
  })
  @ApiBody({ type: StockOutDetailUpdateRequestDto })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: StockOutDetailUpdateDto,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug({ function: 'update', id, updateDto, version }, StockOutDetailController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.stockOutDetailService.update(id, { ...updateDto }, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Delete a stock-out detail record.
   * ลบรายการย่อยจ่ายสินค้าออกคลัง
   * @param id - Stock out detail ID / รหัสรายการย่อยจ่ายสินค้าออกคลัง
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @Delete(':id')
  @UseGuards(new AppIdGuard('stockOutDetail.delete'))
  @Serialize(StockOutMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Delete a Stock Out Detail',
    description: 'Removes a product line item from a draft stock-out transaction, used when an item was added in error or is no longer needed for the issuance.',
    operationId: 'deleteStockOutDetail',
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Stock Out Detail ID' },
    ],
    responses: {
      200: { description: 'Stock Out Detail deleted successfully' },
      400: { description: 'Cannot delete detail of non-draft Stock Out' },
      404: { description: 'Stock Out Detail not found' },
    },
  })
  async delete(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug({ function: 'delete', id, version }, StockOutDetailController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.stockOutDetailService.delete(id, user_id, bu_code, version);
    this.respond(res, result);
  }
}
