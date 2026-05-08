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
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { StockInService } from './stock-in.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  CreateStockInSwaggerDto,
  UpdateStockInSwaggerDto,
  CreateStockInDetailSwaggerDto,
  UpdateStockInDetailSwaggerDto,
} from './swagger/request';
import {
  BaseHttpController,
  EnrichAuditUsers,
  Serialize,
  StockInDetailResponseSchema,
  StockInListItemResponseSchema,
  StockInMutationResponseSchema,
  StockInCreateDto,
  StockInUpdateDto,
  StockInDetailCreateDto,
  StockInDetailUpdateDto,
  IStockInUpdate,
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

@Controller('api/:bu_code/stock-in')
@ApiTags('Inventory: Stock In')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class StockInController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(StockInController.name);

  constructor(private readonly stockInService: StockInService) {
    super();
  }

  /**
   * Retrieve a stock-in record by ID with full line item details.
   * ค้นหารายการรับสินค้าเข้าคลังเดียวตาม ID พร้อมรายละเอียดทั้งหมด
   * @param id - Stock in record ID / รหัสรายการรับสินค้าเข้าคลัง
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Stock in record with details / รายการรับสินค้าเข้าคลังพร้อมรายละเอียด
   */
  @Get(':id')
  @UseGuards(new AppIdGuard('stockIn.findOne'))
  @Serialize(StockInDetailResponseSchema)
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get a Stock In by ID',
    description: 'Retrieves the full details of a stock-in transaction including all items added to inventory, their quantities, costs, and the reason for the addition (e.g., GRN receipt, return, or manual adjustment).',
    operationId: 'findOneStockIn',
    'x-description-th': 'ดึงรายละเอียดทั้งหมดของรายการรับสินค้าเข้าคลังตาม ID รวมถึงรายการสินค้า จำนวน ต้นทุน และเหตุผลในการรับสินค้า',
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Stock In ID' },
    ],
    responses: {
      200: { description: 'The Stock In was successfully retrieved' },
      404: { description: 'The Stock In was not found' },
    },
  } as any)
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug({ function: 'findOne', id, version }, StockInController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.stockInService.findOne(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * List all stock-in records with pagination.
   * ค้นหารายการรับสินค้าเข้าคลังทั้งหมดพร้อมการแบ่งหน้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param query - Pagination and filter parameters / พารามิเตอร์การแบ่งหน้าและตัวกรอง
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated list of stock-in records / รายการรับสินค้าเข้าคลังพร้อมการแบ่งหน้า
   */
  @Get()
  @UseGuards(new AppIdGuard('stockIn.findAll'))
  @Serialize(StockInListItemResponseSchema)
  @EnrichAuditUsers()
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiOperation({
    summary: 'Get all Stock In records',
    description: 'Lists all inventory addition records for the business unit with pagination and filtering. Used by inventory managers to track all stock additions from goods receiving, returns, and manual adjustments.',
    operationId: 'findAllStockIn',
    'x-description-th': 'ดึงรายการรับสินค้าเข้าคลังทั้งหมดของหน่วยธุรกิจ พร้อมการแบ่งหน้าและตัวกรอง ใช้สำหรับผู้จัดการคลังสินค้าในการติดตามการรับสินค้าเข้าคลังทั้งหมด',
    responses: {
      200: { description: 'Stock In records retrieved successfully' },
      404: { description: 'No Stock In records found' },
    },
  } as any)
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query() query: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug({ function: 'findAll', query, version }, StockInController.name);

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.stockInService.findAll(user_id, bu_code, paginate, version);
    this.respond(res, result);
  }

  /**
   * Create a new stock-in record for adding items to inventory.
   * สร้างรายการรับสินค้าเข้าคลังใหม่สำหรับเพิ่มสินค้าในสินค้าคงคลัง
   * @param createDto - Stock in creation data / ข้อมูลสำหรับสร้างรายการรับสินค้าเข้าคลัง
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Created stock-in record / รายการรับสินค้าเข้าคลังที่สร้างแล้ว
   */
  @Post()
  @UseGuards(new AppIdGuard('stockIn.create'))
  @Serialize(StockInMutationResponseSchema)
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Create a Stock In',
    description: 'Records an inventory addition to increase stock levels. Used for manual adjustments such as recording returned items, correcting inventory discrepancies found during physical counts, or adding opening stock balances.',
    operationId: 'createStockIn',
    'x-description-th': 'สร้างรายการรับสินค้าเข้าคลังใหม่เพื่อเพิ่มจำนวนสินค้าคงคลัง ใช้สำหรับการปรับปรุงด้วยตนเอง เช่น บันทึกสินค้าคืน แก้ไขความคลาดเคลื่อนจากการนับสต็อก หรือเพิ่มยอดเปิดต้น',
    responses: {
      201: { description: 'The Stock In was successfully created' },
      400: { description: 'Invalid request body' },
    },
  } as any)
  @ApiBody({ type: CreateStockInSwaggerDto })
  async create(
    @Body() createDto: StockInCreateDto,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug({ function: 'create', createDto, version }, StockInController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.stockInService.create(createDto, user_id, bu_code, version);
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Update an existing stock-in record while in draft status.
   * อัปเดตรายการรับสินค้าเข้าคลังที่มีอยู่ขณะอยู่ในสถานะร่าง
   * @param id - Stock in record ID / รหัสรายการรับสินค้าเข้าคลัง
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param updateDto - Stock in update data / ข้อมูลสำหรับอัปเดตรายการรับสินค้าเข้าคลัง
   * @param version - API version / เวอร์ชัน API
   * @returns Updated stock-in record / รายการรับสินค้าเข้าคลังที่อัปเดตแล้ว
   */
  @Patch(':id')
  @UseGuards(new AppIdGuard('stockIn.update'))
  @Serialize(StockInMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Update a Stock In',
    description: 'Modifies an existing stock-in record to correct quantities, costs, or item details before the transaction is finalized. Used when receiving staff need to amend an inventory addition.',
    operationId: 'updateStockIn',
    'x-description-th': 'แก้ไขรายการรับสินค้าเข้าคลังที่มีอยู่เพื่อปรับจำนวน ต้นทุน หรือรายละเอียดสินค้าก่อนที่รายการจะถูกยืนยัน',
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Stock In ID' },
    ],
    responses: {
      200: { description: 'The Stock In was successfully updated' },
      404: { description: 'The Stock In was not found' },
    },
  } as any)
  @ApiBody({ type: UpdateStockInSwaggerDto })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: StockInUpdateDto,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug({ function: 'update', id, updateDto, version }, StockInController.name);

    const { user_id } = ExtractRequestHeader(req);
    const data: IStockInUpdate = { ...updateDto, id };
    const result = await this.stockInService.update(data, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Delete a draft stock-in record.
   * ลบรายการรับสินค้าเข้าคลังที่เป็นร่าง
   * @param id - Stock in record ID / รหัสรายการรับสินค้าเข้าคลัง
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @Delete(':id')
  @UseGuards(new AppIdGuard('stockIn.delete'))
  @Serialize(StockInMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Delete a Stock In',
    description: 'Removes a stock-in record that was created in error. Only applicable to draft transactions that have not yet been committed to inventory.',
    operationId: 'deleteStockIn',
    'x-description-th': 'ลบรายการรับสินค้าเข้าคลังที่สร้างผิดพลาด ใช้ได้เฉพาะรายการที่ยังเป็นร่างและยังไม่ถูกยืนยันเข้าคลังสินค้า',
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Stock In ID' },
    ],
    responses: {
      200: { description: 'The Stock In was successfully deleted' },
      404: { description: 'The Stock In was not found' },
    },
  } as any)
  async delete(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug({ function: 'delete', id, version }, StockInController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.stockInService.delete(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Delete(':id/void')
  @UseGuards(new AppIdGuard('stockIn.delete'))
  @Serialize(StockInMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Void a Stock In',
    description: 'Voids a completed stock-in record by creating a reverse adjustment-out transaction. Checks that sufficient on-hand quantity exists before voiding.',
    operationId: 'voidStockIn',
    'x-description-th': 'ยกเลิกรายการรับสินค้าเข้าคลัง โดยสร้างรายการปรับลดออก ตรวจสอบว่ามีสินค้าคงเหลือเพียงพอก่อนยกเลิก',
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Stock In ID' },
    ],
    responses: {
      200: { description: 'Stock In voided successfully' },
      400: { description: 'Cannot void — insufficient on-hand quantity' },
      404: { description: 'Stock In not found' },
    },
  } as any)
  async voidStockIn(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Body() data: Record<string, unknown>,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug({ function: 'voidStockIn', id, version }, StockInController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.stockInService.voidStockIn(id, data, user_id, bu_code, version);
    this.respond(res, result);
  }

  // ==================== Stock In Detail CRUD ====================

  /**
   * List all line items for a specific stock-in record.
   * ค้นหารายการย่อยทั้งหมดของรายการรับสินค้าเข้าคลังที่ระบุ
   * @param id - Stock in record ID / รหัสรายการรับสินค้าเข้าคลัง
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns List of stock-in detail items / รายการย่อยของรายการรับสินค้าเข้าคลัง
   */
  @Get(':id/details')
  @UseGuards(new AppIdGuard('stockIn.findOne'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get all details for a Stock In',
    description: 'Lists all individual items being added to inventory in this stock-in transaction, including product details, quantities, unit costs, and storage locations.',
    operationId: 'findAllStockInDetails',
    'x-description-th': 'ดึงรายการย่อยทั้งหมดของรายการรับสินค้าเข้าคลัง รวมถึงรายละเอียดสินค้า จำนวน ต้นทุนต่อหน่วย และสถานที่จัดเก็บ',
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Stock In ID' },
    ],
    responses: {
      200: { description: 'Stock In details retrieved successfully' },
      404: { description: 'Stock In not found' },
    },
  } as any)
  @HttpCode(HttpStatus.OK)
  async findDetailsByStockInId(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug({ function: 'findDetailsByStockInId', id, version }, StockInController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.stockInService.findDetailsByStockInId(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Retrieve a single stock-in line item by detail ID.
   * ค้นหารายการย่อยของรายการรับสินค้าเข้าคลังเดียวตาม ID
   * @param id - Stock in record ID / รหัสรายการรับสินค้าเข้าคลัง
   * @param detailId - Stock in detail ID / รหัสรายการย่อยรับสินค้าเข้าคลัง
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Stock-in detail item / รายการย่อยของรายการรับสินค้าเข้าคลัง
   */
  @Get(':id/details/:detail_id')
  @UseGuards(new AppIdGuard('stockIn.findOne'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get a specific Stock In detail by ID',
    description: 'Retrieves a specific item line from a stock-in transaction with full product, quantity, and cost details. Used to inspect or verify a particular inventory addition.',
    operationId: 'findStockInDetailById',
    'x-description-th': 'ดึงรายการย่อยเฉพาะรายการจากรายการรับสินค้าเข้าคลัง พร้อมรายละเอียดสินค้า จำนวน และต้นทุนทั้งหมด',
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Stock In ID' },
      { name: 'detail_id', in: 'path', required: true, description: 'Stock In Detail ID' },
    ],
    responses: {
      200: { description: 'Stock In detail retrieved successfully' },
      404: { description: 'Stock In detail not found' },
    },
  } as any)
  @HttpCode(HttpStatus.OK)
  async findDetailById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('detail_id', new ParseUUIDPipe({ version: '4' })) detailId: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug({ function: 'findDetailById', id, detailId, version }, StockInController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.stockInService.findDetailById(detailId, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Create a new line item for a draft stock-in record.
   * สร้างรายการย่อยใหม่สำหรับรายการรับสินค้าเข้าคลังที่เป็นร่าง
   * @param id - Stock in record ID / รหัสรายการรับสินค้าเข้าคลัง
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param data - Detail creation data / ข้อมูลสำหรับสร้างรายการย่อย
   * @param version - API version / เวอร์ชัน API
   * @returns Created stock-in detail / รายการย่อยรับสินค้าเข้าคลังที่สร้างแล้ว
   */
  @Post(':id/details')
  @UseGuards(new AppIdGuard('stockIn.update'))
  @Serialize(StockInMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Create a new Stock In detail',
    description: 'Adds a new item line to a draft stock-in transaction, specifying the product, quantity, and cost to be added to inventory.',
    operationId: 'createStockInDetail',
    'x-description-th': 'เพิ่มรายการสินค้าใหม่ในรายการรับสินค้าเข้าคลังที่เป็นร่าง โดยระบุสินค้า จำนวน และต้นทุนที่จะเพิ่มเข้าคลังสินค้า',
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Stock In ID' },
    ],
    responses: {
      201: { description: 'Stock In detail created successfully' },
      400: { description: 'Cannot add detail to non-draft Stock In' },
      404: { description: 'Stock In not found' },
    },
  } as any)
  @ApiBody({ type: CreateStockInDetailSwaggerDto })
  @HttpCode(HttpStatus.CREATED)
  async createDetail(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Body() data: StockInDetailCreateDto,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug({ function: 'createDetail', id, data, version }, StockInController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.stockInService.createDetail(id, data, user_id, bu_code, version);
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Update an existing stock-in line item in a draft record.
   * อัปเดตรายการย่อยของรายการรับสินค้าเข้าคลังที่เป็นร่าง
   * @param id - Stock in record ID / รหัสรายการรับสินค้าเข้าคลัง
   * @param detailId - Stock in detail ID / รหัสรายการย่อยรับสินค้าเข้าคลัง
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param data - Detail update data / ข้อมูลสำหรับอัปเดตรายการย่อย
   * @param version - API version / เวอร์ชัน API
   * @returns Updated stock-in detail / รายการย่อยรับสินค้าเข้าคลังที่อัปเดตแล้ว
   */
  @Put(':id/details/:detail_id')
  @UseGuards(new AppIdGuard('stockIn.update'))
  @Serialize(StockInMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Update a Stock In detail',
    description: 'Modifies an item line on a draft stock-in transaction to correct the product, quantity, or cost details before the transaction is committed to inventory.',
    operationId: 'updateStockInDetail',
    'x-description-th': 'แก้ไขรายการย่อยของรายการรับสินค้าเข้าคลังที่เป็นร่าง เพื่อปรับสินค้า จำนวน หรือรายละเอียดต้นทุนก่อนที่รายการจะถูกยืนยันเข้าคลัง',
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Stock In ID' },
      { name: 'detail_id', in: 'path', required: true, description: 'Stock In Detail ID' },
    ],
    responses: {
      200: { description: 'Stock In detail updated successfully' },
      400: { description: 'Cannot update detail of non-draft Stock In' },
      404: { description: 'Stock In detail not found' },
    },
  } as any)
  @ApiBody({ type: UpdateStockInDetailSwaggerDto })
  @HttpCode(HttpStatus.OK)
  async updateDetail(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('detail_id', new ParseUUIDPipe({ version: '4' })) detailId: string,
    @Param('bu_code') bu_code: string,
    @Body() data: StockInDetailUpdateDto,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug({ function: 'updateDetail', id, detailId, data, version }, StockInController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.stockInService.updateDetail(detailId, data, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Delete a line item from a draft stock-in record.
   * ลบรายการย่อยจากรายการรับสินค้าเข้าคลังที่เป็นร่าง
   * @param id - Stock in record ID / รหัสรายการรับสินค้าเข้าคลัง
   * @param detailId - Stock in detail ID / รหัสรายการย่อยรับสินค้าเข้าคลัง
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @Delete(':id/details/:detail_id')
  @UseGuards(new AppIdGuard('stockIn.update'))
  @Serialize(StockInMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Delete a Stock In detail',
    description: 'Removes an item line from a draft stock-in transaction when the item was added in error or is no longer needed in this inventory addition.',
    operationId: 'deleteStockInDetail',
    'x-description-th': 'ลบรายการย่อยจากรายการรับสินค้าเข้าคลังที่เป็นร่าง เมื่อรายการถูกเพิ่มผิดพลาดหรือไม่ต้องการอีกต่อไป',
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Stock In ID' },
      { name: 'detail_id', in: 'path', required: true, description: 'Stock In Detail ID' },
    ],
    responses: {
      200: { description: 'Stock In detail deleted successfully' },
      400: { description: 'Cannot delete detail of non-draft Stock In' },
      404: { description: 'Stock In detail not found' },
    },
  } as any)
  @HttpCode(HttpStatus.OK)
  async deleteDetail(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('detail_id', new ParseUUIDPipe({ version: '4' })) detailId: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug({ function: 'deleteDetail', id, detailId, version }, StockInController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.stockInService.deleteDetail(detailId, user_id, bu_code, version);
    this.respond(res, result);
  }
}
