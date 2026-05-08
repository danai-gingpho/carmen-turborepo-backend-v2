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
import { InventoryAdjustmentService, AdjustmentType } from './inventory-adjustment.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { BaseHttpController, EnrichAuditUsers } from '@/common';
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

@Controller('api/:bu_code/inventory-adjustment')
@ApiTags('Inventory: Adjustments')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class InventoryAdjustmentController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(InventoryAdjustmentController.name);

  constructor(private readonly inventoryAdjustmentService: InventoryAdjustmentService) {
    super();
  }

  /**
   * List all inventory adjustments with optional type filtering.
   * ค้นหารายการปรับปรุงสินค้าคงคลังทั้งหมดพร้อมตัวกรองประเภท
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param query - Pagination and filter parameters / พารามิเตอร์การแบ่งหน้าและตัวกรอง
   * @param version - API version / เวอร์ชัน API
   * @param type - Adjustment type filter (stock-in/stock-out) / ตัวกรองประเภท (รับเข้า/จ่ายออก)
   * @returns Paginated list of inventory adjustments / รายการปรับปรุงสินค้าคงคลังพร้อมการแบ่งหน้า
   */
  @Get()
  @UseGuards(new AppIdGuard('inventoryAdjustment.findAll'))
  @EnrichAuditUsers()
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['stock-in', 'stock-out'],
    description: 'Filter by adjustment type (stock-in or stock-out). If not specified, returns both.',
  })
  @ApiOperation({
    summary: 'Get all inventory adjustments',
    description: 'Lists all manual inventory corrections (stock-in additions and stock-out deductions) for the business unit, enabling managers to review adjustments made to resolve discrepancies from physical counts, spoilage, or other non-standard inventory movements.',
    operationId: 'findAllInventoryAdjustments',
    'x-description-th': 'ดึงรายการปรับปรุงสินค้าคงคลังทั้งหมด (ทั้งรับเข้าและจ่ายออก) ของหน่วยธุรกิจ ช่วยให้ผู้จัดการตรวจสอบการปรับปรุงที่ทำขึ้นเพื่อแก้ไขความคลาดเคลื่อนจากการตรวจนับ สินค้าเสียหาย หรือการเคลื่อนไหวสินค้าที่ไม่เป็นมาตรฐาน',
    deprecated: false,
    security: [{ bearerAuth: [] }],
    responses: {
      200: { description: 'Inventory adjustments retrieved successfully' },
    },
  } as any)
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query() query: IPaginateQuery,
    @Query('version') version: string = 'latest',
    @Query('type') type?: AdjustmentType,
  ): Promise<void> {
    this.logger.debug({ function: 'findAll', query, version, type }, InventoryAdjustmentController.name);

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);

    // Support type from filter param (e.g. filter=type|string:stock-in)
    let resolvedType = type;
    if (!resolvedType && paginate.filter) {
      const filterType = paginate.filter['type'] || paginate.filter['type|string'];
      if (filterType === 'stock-in' || filterType === 'stock-out') {
        resolvedType = filterType as AdjustmentType;
      }
      delete paginate.filter['type'];
      delete paginate.filter['type|string'];
    }

    const result = await this.inventoryAdjustmentService.findAll(user_id, bu_code, paginate, version, resolvedType);
    this.respond(res, result);
  }

  /**
   * Retrieve a single inventory adjustment by ID and type.
   * ค้นหารายการปรับปรุงสินค้าคงคลังเดียวตาม ID และประเภท
   * @param id - Adjustment record ID / รหัสรายการปรับปรุง
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @param type - Adjustment type (stock-in/stock-out) / ประเภทการปรับปรุง (รับเข้า/จ่ายออก)
   * @returns Inventory adjustment record / รายการปรับปรุงสินค้าคงคลัง
   */
  @Get(':id')
  @UseGuards(new AppIdGuard('inventoryAdjustment.findOne'))
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiQuery({
    name: 'type',
    required: true,
    enum: ['stock-in', 'stock-out'],
    description: 'The type of adjustment record to retrieve',
  })
  @ApiOperation({
    summary: 'Get a specific inventory adjustment',
    description: 'Retrieves the full details of a specific inventory adjustment (stock-in or stock-out), including affected products, quantities, and the reason for the correction, for audit review and verification.',
    operationId: 'findOneInventoryAdjustment',
    'x-description-th': 'ดึงรายละเอียดทั้งหมดของรายการปรับปรุงสินค้าคงคลังเฉพาะรายการ (รับเข้าหรือจ่ายออก) รวมถึงสินค้าที่ได้รับผลกระทบ จำนวน และสาเหตุของการแก้ไข สำหรับการตรวจสอบและยืนยัน',
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Adjustment record ID' },
      { name: 'type', in: 'query', required: true, description: 'Type of adjustment (stock-in or stock-out)' },
    ],
    responses: {
      200: { description: 'Inventory adjustment retrieved successfully' },
      400: { description: 'Type query parameter is required' },
      404: { description: 'Inventory adjustment not found' },
    },
  } as any)
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
    @Query('type') type: AdjustmentType,
  ): Promise<void> {
    this.logger.debug({ function: 'findOne', id, type, version }, InventoryAdjustmentController.name);

    if (!type || !['stock-in', 'stock-out'].includes(type)) {
      this.respond(res, {
        isSuccess: false,
        error: {
          message: 'Type query parameter is required and must be either "stock-in" or "stock-out"',
          code: 'BAD_REQUEST',
        },
      }, HttpStatus.BAD_REQUEST);
      return;
    }

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.inventoryAdjustmentService.findOne(id, type, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Print an inventory adjustment via FastReport viewer (micro-report)
   * พิมพ์ใบปรับปรุงสินค้าคงคลังผ่าน FastReport viewer (micro-report)
   */
  @Get(':id/print-viewer')
  @UseGuards(new AppIdGuard('inventoryAdjustment.print'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Print inventory adjustment via FastReport viewer',
    description:
      'Sends IA data + signature config to micro-report which generates FastReport XML and returns a viewer URL.',
    operationId: 'printInventoryAdjustmentViewer',
    'x-description-th': 'ส่งข้อมูล IA + signature ไป micro-report เพื่อสร้าง FastReport XML แล้วคืน viewer URL',
  } as any)
  @HttpCode(HttpStatus.OK)
  async printToReport(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.debug(
      { function: 'printToReport', id, bu_code },
      InventoryAdjustmentController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.inventoryAdjustmentService.printToReport(id, user_id, bu_code);
    this.respond(res, result);
  }
}
