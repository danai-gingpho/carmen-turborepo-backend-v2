import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Body,
  Delete,
  UseGuards,
  Req,
  Res,
  Query,
  HttpStatus,
  HttpCode,
  Patch,
} from '@nestjs/common';
import { Response } from 'express';
import { GoodReceivedNoteService } from './good-received-note.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  CreateGoodReceivedNoteSwaggerDto,
  UpdateGoodReceivedNoteSwaggerDto,
  RejectGoodReceivedNoteSwaggerDto,
  CommitGoodReceivedNoteSwaggerDto,
} from './swagger/request';
import {
  BaseHttpController,
  Serialize,
  GoodReceivedNoteDetailResponseSchema,
  GoodReceivedNoteListItemResponseSchema,
  GoodReceivedNoteMutationResponseSchema,
  GrnProductListItemSchema,
  GrnLocationListItemSchema,
} from '@/common';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { IPaginateQuery, PaginateQuery } from 'src/shared-dto/paginate.dto';
import {
  GoodReceivedNoteCreateDto,
  GoodReceivedNoteUpdateDto,
  IGoodReceivedNoteUpdate,
} from '@/common';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';

@Controller('api')
@ApiTags('Procurement: Good Received Notes')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class GoodReceivedNoteController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    GoodReceivedNoteController.name,
  );

  constructor(
    private readonly goodReceivedNoteService: GoodReceivedNoteService,
  ) {
    super();
  }

  /**
   * Get pending Good Received Notes count for the current user
   * ค้นหาจำนวนใบรับสินค้าที่รอดำเนินการของผู้ใช้ปัจจุบัน
   * @param version - API version / เวอร์ชัน API
   * @returns Pending GRN count / จำนวนใบรับสินค้าที่รอดำเนินการ
   */
  @Get('good-received-note/pending')
  @UseGuards(new AppIdGuard('goodReceivedNote.findAllPending.count'))
  @Serialize(GoodReceivedNoteListItemResponseSchema)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiOperation({
    summary: 'Get pending Good Received Notes count',
    description:
      'Returns the number of goods deliveries awaiting receiving action by the current user. Used on dashboards to alert receiving staff about pending vendor deliveries that need to be inspected and recorded.',
    operationId: 'findAllPendingGoodReceivedNoteCount',
    responses: {
      200: { description: 'Pending GRN count retrieved successfully' },
    },
    'x-description-th': 'แสดงจำนวนใบรับสินค้าที่รอดำเนินการของผู้ใช้ปัจจุบัน ใช้บนแดชบอร์ดเพื่อแจ้งเตือนเจ้าหน้าที่รับสินค้าเกี่ยวกับการส่งมอบจากผู้ขายที่รอการตรวจรับ',
  } as any)
  @HttpCode(HttpStatus.OK)
  async findAllPendingGoodReceivedNoteCount(
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAllPendingGoodReceivedNoteCount',
        version,
      },
      GoodReceivedNoteController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result =
      await this.goodReceivedNoteService.findAllPendingGoodReceivedNoteCount(
        user_id,
        version,
      );
    this.respond(res, result);
  }

  /**
   * Retrieve a Good Received Note by ID with full details
   * ค้นหารายการเดียวตาม ID ของใบรับสินค้าพร้อมรายละเอียดทั้งหมด
   * @param id - Good Received Note ID / รหัสใบรับสินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Good Received Note details / รายละเอียดใบรับสินค้า
   */
  @Get(':bu_code/good-received-note/:id')
  @UseGuards(new AppIdGuard('goodReceivedNote.findOne'))
  @Serialize(GoodReceivedNoteDetailResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get a Good Received Note by ID',
    description:
      'Retrieves the full details of a goods receiving record including received items, quantities, quality notes, and the associated purchase order. Used to verify what was delivered against what was ordered.',
    operationId: 'findOneGoodReceivedNote',
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        description: 'Good Received Note ID',
      },
      {
        name: 'bu_code',
        in: 'path',
        required: true,
        description: 'Business Unit Code',
      },
    ],
    responses: {
      200: { description: 'The Good Received Note was successfully retrieved' },
      404: { description: 'The Good Received Note was not found' },
    },
    'x-description-th': 'ดึงรายละเอียดทั้งหมดของใบรับสินค้า รวมถึงรายการสินค้าที่รับ จำนวน บันทึกคุณภาพ และใบสั่งซื้อที่เกี่ยวข้อง ใช้สำหรับตรวจสอบว่าสินค้าที่ส่งมาตรงกับที่สั่งซื้อหรือไม่',
  } as any)
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
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
      GoodReceivedNoteController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.goodReceivedNoteService.findOne(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * List all Good Received Notes with pagination and filtering
   * ค้นหารายการทั้งหมดของใบรับสินค้าพร้อมการแบ่งหน้าและตัวกรอง
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param query - Pagination and filter parameters / พารามิเตอร์การแบ่งหน้าและตัวกรอง
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated list of Good Received Notes / รายการใบรับสินค้าแบบแบ่งหน้า
   */
  @Get(':bu_code/good-received-note/')
  @UseGuards(new AppIdGuard('goodReceivedNote.findAll'))
  @Serialize(GoodReceivedNoteListItemResponseSchema)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiOperation({
    summary: 'Get all Good Received Notes',
    description:
      'Lists all goods receiving records for the business unit with pagination and filtering. Used by receiving staff and inventory managers to track vendor deliveries, monitor receiving status, and reconcile with purchase orders.',
    operationId: 'findAllGoodReceivedNotes',
    responses: {
      200: { description: 'Good Received Notes retrieved successfully' },
      404: { description: 'No Good Received Notes found' },
    },
    'x-description-th': 'แสดงรายการใบรับสินค้าทั้งหมดของหน่วยธุรกิจพร้อมการแบ่งหน้าและตัวกรอง ใช้สำหรับเจ้าหน้าที่รับสินค้าและผู้จัดการคลังสินค้าในการติดตามการส่งมอบจากผู้ขาย',
  } as any)
  @HttpCode(HttpStatus.OK)
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
      GoodReceivedNoteController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.goodReceivedNoteService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  @Get(':bu_code/good-received-note/vendor/:vendor_id')
  @UseGuards(new AppIdGuard('goodReceivedNote.findByVendorId'))
  @Serialize(GoodReceivedNoteListItemResponseSchema)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiOperation({
    summary: 'Get Good Received Notes by vendor ID',
    description:
      'Lists all goods receiving records for a specific vendor with pagination and filtering.',
    operationId: 'findGoodReceivedNotesByVendorId',
    'x-description-th': 'แสดงรายการใบรับสินค้าทั้งหมดของผู้ขายรายหนึ่งพร้อมการแบ่งหน้าและตัวกรอง',
  } as any)
  @HttpCode(HttpStatus.OK)
  async findByVendorId(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Param('vendor_id', new ParseUUIDPipe({ version: '4' })) vendor_id: string,
    @Query() query: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.goodReceivedNoteService.findByVendorId(
      vendor_id,
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  /**
   * List Good Received Notes for a vendor filtered for Credit Note selection
   * แสดงรายการใบรับสินค้าของผู้ขายสำหรับเลือกตอนสร้างใบลดหนี้
   * @param req - Request object / ออบเจกต์คำขอ
   * @param res - Response object / ออบเจกต์การตอบกลับ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param vendor_id - Vendor ID / รหัสผู้ขาย
   * @param query - Pagination/search/filter/sort query / คำสั่ง pagination/search/filter/sort
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated list of GRNs with doc_status in (saved, committed) / รายการใบรับสินค้าที่สถานะเป็น saved หรือ committed แบบแบ่งหน้า
   */
  @Get(':bu_code/good-received-note/vendor/:vendor_id/cn')
  @UseGuards(new AppIdGuard('goodReceivedNote.findByVendorIdForCn'))
  @Serialize(GoodReceivedNoteListItemResponseSchema)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiOperation({
    summary: 'Get Good Received Notes by vendor ID for Credit Note selection',
    description:
      'Lists goods receiving records for a specific vendor filtered to doc_status "saved" or "committed" only. Used as the selectable list when creating a Credit Note against a vendor — draft and voided GRNs are excluded.',
    operationId: 'findGoodReceivedNotesByVendorIdForCn',
    'x-description-th': 'แสดงรายการใบรับสินค้าของผู้ขายรายหนึ่งเฉพาะสถานะ saved หรือ committed สำหรับใช้เลือกตอนสร้างใบลดหนี้ (Credit Note) โดยไม่รวม draft และ voided',
  } as any)
  @HttpCode(HttpStatus.OK)
  async findByVendorIdForCn(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Param('vendor_id', new ParseUUIDPipe({ version: '4' })) vendor_id: string,
    @Query() query: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.goodReceivedNoteService.findByVendorIdForCn(
      vendor_id,
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Scan a PO QR code to start the goods receiving process
   * สแกน QR code ของใบสั่งซื้อเพื่อเริ่มกระบวนการรับสินค้า
   * @param qr_code - QR code value / ค่า QR code
   * @param version - API version / เวอร์ชัน API
   * @returns Good Received Note data / ข้อมูลใบรับสินค้า
   */
  @Get(':bu_code/good-received-note/scan-po/:qr_code')
  @Serialize(GoodReceivedNoteDetailResponseSchema)
  @ApiVersionMinRequest()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Scan PO',
    description:
      'Looks up a purchase order by scanning its QR code to begin the goods receiving process. Used by receiving staff at the loading dock to quickly pull up PO details when a delivery arrives.',
    operationId: 'scanPO',
    deprecated: false,
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
      },
    ],
    responses: {
      200: {
        description: 'The good received note was successfully retrieved',
      },
      404: {
        description: 'The good received note was not found',
      },
    },
    'x-description-th': 'สแกน QR code ของใบสั่งซื้อเพื่อเริ่มกระบวนการรับสินค้า ใช้โดยเจ้าหน้าที่รับสินค้าที่จุดรับสินค้าเพื่อดึงรายละเอียดใบสั่งซื้ออย่างรวดเร็ว',
  } as any)
  async scanPO(
    @Req() req: Request,
    @Res() res: Response,
    @Param('qr_code') qr_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'scanPO',
        qr_code,
        version,
      },
      GoodReceivedNoteController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const { bu_code, po_id } = this.ExtractPO_QRCode(qr_code);
    const result = await this.goodReceivedNoteService.findOne(
      po_id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  private ExtractPO_QRCode(qr_code: string): {
    bu_code: string;
    po_id: string;
  } {
    const [bu_code, po_id] = qr_code.split('|');
    return { bu_code, po_id };
  }

  /**
   * Create a new Good Received Note for a vendor delivery
   * สร้างใบรับสินค้าใหม่สำหรับการส่งมอบจากผู้ขาย
   * @param createDto - GRN creation data / ข้อมูลสำหรับสร้างใบรับสินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Created Good Received Note / ใบรับสินค้าที่สร้างแล้ว
   */
  @Post(':bu_code/good-received-note')
  @UseGuards(new AppIdGuard('goodReceivedNote.create'))
  @Serialize(GoodReceivedNoteMutationResponseSchema)
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Create a Good Received Note',
    description:
      'Records a new goods delivery from a vendor against a purchase order. Captures received quantities, quality inspection results, and any discrepancies between ordered and delivered items. This is the first step in updating inventory levels from vendor deliveries.',
    operationId: 'createGoodReceivedNote',
    responses: {
      201: { description: 'The Good Received Note was successfully created' },
      400: { description: 'Invalid request body' },
    },
    'x-description-th': 'บันทึกการส่งมอบสินค้าใหม่จากผู้ขายตามใบสั่งซื้อ โดยบันทึกจำนวนที่รับ ผลการตรวจสอบคุณภาพ และความแตกต่างระหว่างสินค้าที่สั่งกับที่ส่งมา',
  } as any)
  @ApiBody({
    type: CreateGoodReceivedNoteSwaggerDto,
    examples: {
      'Create from PO': {
        summary: 'GRN from Purchase Order',
        value: {
          doc_type: 'purchase_order',
          grn_date: '2026-03-25T00:00:00.000Z',
          invoice_no: 'INV-2026-0100',
          invoice_date: '2026-03-25T00:00:00.000Z',
          description: 'Goods received from vendor',
          received_by_id: '1df476e2-3d99-766b-d94a-931f697ef98b',
          received_at: '2026-03-25T00:00:00.000Z',
          credit_term_id: '42a89581-5ce4-4fc1-8d1e-1825481ebd6c',
          vendor_id: 'e0363f5a-3637-4d27-a421-8693550aa816',
          currency_id: '93dabe25-1668-4c5b-bceb-3e0b83b78002',
          exchange_rate: 1,
          good_received_note_detail: {
            add: [
              {
                purchase_order_detail_id: '0a7b59a2-c041-446d-a82e-aae2640ceee9',
                product_id: 'bb96415b-dff0-40ec-aa2f-2b4099418314',
                location_id: '30053105-d69d-4389-9426-d82b7b87b7fc',
                received_qty: 10,
                received_unit_id: 'c03abcb6-8a3a-4576-85f0-0e2df8d34bf5',
                received_unit_conversion_factor: 1,
                received_base_qty: 10,
              },
            ],
          },
        },
      },
      'Create Manual (no PO)': {
        summary: 'Manual GRN without Purchase Order',
        value: {
          doc_type: 'manual',
          grn_date: '2026-03-25T00:00:00.000Z',
          invoice_no: 'INV-2026-0200',
          invoice_date: '2026-03-25T00:00:00.000Z',
          description: 'Manual goods receipt - walk-in vendor',
          received_by_id: '1df476e2-3d99-766b-d94a-931f697ef98b',
          received_at: '2026-03-25T00:00:00.000Z',
          vendor_id: 'e0363f5a-3637-4d27-a421-8693550aa816',
          currency_id: '93dabe25-1668-4c5b-bceb-3e0b83b78002',
          exchange_rate: 1,
          good_received_note_detail: {
            add: [
              {
                product_id: '014d9777-d7c4-45ea-8a2e-d14e0f7e8951',
                location_id: '0731acf1-e04d-4648-b64d-cfbd34fa5d08',
                received_qty: 5,
                received_unit_id: 'ab5d4de6-95bd-4330-a263-b4578540c517',
                received_unit_conversion_factor: 1,
                received_base_qty: 5,
                tax_profile_id: 'b52f12af-8a49-4b96-a03d-41691d53a38e',
                tax_rate: 7,
                tax_amount: 105,
                total_amount: 1605,
              },
            ],
          },
        },
      },
    },
  })
  async create(
    @Body() createDto: GoodReceivedNoteCreateDto,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      GoodReceivedNoteController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.goodReceivedNoteService.create(
      createDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Update a Good Received Note before approval
   * อัปเดตใบรับสินค้าก่อนการอนุมัติ
   * @param id - Good Received Note ID / รหัสใบรับสินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param updateDto - Updated GRN data / ข้อมูลใบรับสินค้าที่อัปเดต
   * @param version - API version / เวอร์ชัน API
   * @returns Updated Good Received Note / ใบรับสินค้าที่อัปเดตแล้ว
   */
  @Patch(':bu_code/good-received-note/:id')
  @UseGuards(new AppIdGuard('goodReceivedNote.update'))
  @Serialize(GoodReceivedNoteMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Update a Good Received Note',
    description:
      'Modifies a goods receiving record to correct quantities, update quality notes, or adjust line items before the GRN is approved. Used when receiving staff need to amend details after the initial entry.',
    operationId: 'updateGoodReceivedNote',
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        description: 'Good Received Note ID',
      },
    ],
    responses: {
      200: { description: 'The Good Received Note was successfully updated' },
      404: { description: 'The Good Received Note was not found' },
    },
    'x-description-th': 'แก้ไขใบรับสินค้าเพื่อปรับจำนวน อัปเดตบันทึกคุณภาพ หรือแก้ไขรายการสินค้าก่อนการอนุมัติ',
  } as any)
  @ApiBody({
    type: UpdateGoodReceivedNoteSwaggerDto,
    examples: {
      'update-grn-header': {
        summary: 'Update GRN header fields only',
        value: {
          invoice_no: 'INV-2026-0100',
          invoice_f: '2026-03-17T00:00:00.000Z',
          description: 'Updated description',
          note: 'Verified all items',
          is_cash: false,
        },
      },
      'update-grn-with-details': {
        summary: 'Update GRN with add/update/remove details',
        description:
          'Add new detail items, update existing ones, and remove by ID.',
        value: {
          good_received_note_detail: {
            add: [
              {
                product_id: '<product_uuid>',
                location_id: '<location_uuid>',
                tax_profile_id: '<tax_profile_uuid>',
                tax_profile_name: 'VAT 7%',
                tax_rate: 7,
                tax_amount: 70,
                base_tax_amount: 70,
                total_amount: 1070,
              },
            ],
            update: [
              {
                id: '<existing_detail_uuid>',
                good_received_note_id: '<grn_uuid>',
                product_id: '<product_uuid>',
                location_id: '<location_uuid>',
                tax_profile_id: '<tax_profile_uuid>',
                tax_profile_name: 'VAT 7%',
                tax_rate: 7,
                tax_amount: 70,
                base_tax_amount: 70,
                total_amount: 1070,
              },
            ],
            remove: [{ id: '<detail_uuid_to_remove>' }],
          },
        },
      },
    },
  })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: GoodReceivedNoteUpdateDto,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateDto,
        version,
      },
      GoodReceivedNoteController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const data: IGoodReceivedNoteUpdate = {
      ...updateDto,
      id,
    };
    const result = await this.goodReceivedNoteService.update(
      data,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Delete a Good Received Note created in error
   * ลบใบรับสินค้าที่สร้างผิดพลาด
   * @param id - Good Received Note ID / รหัสใบรับสินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @Delete(':bu_code/good-received-note/:id')
  @UseGuards(new AppIdGuard('goodReceivedNote.delete'))
  @Serialize(GoodReceivedNoteMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Delete a Good Received Note',
    description:
      'Removes a goods receiving record that was created in error or is no longer valid. Only applicable to GRNs that have not been approved, as approved GRNs have already updated inventory levels.',
    operationId: 'deleteGoodReceivedNote',
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        description: 'Good Received Note ID',
      },
    ],
    responses: {
      200: { description: 'The Good Received Note was successfully deleted' },
      404: { description: 'The Good Received Note was not found' },
    },
    'x-description-th': 'ลบใบรับสินค้าที่สร้างผิดพลาดหรือไม่ถูกต้อง ใช้ได้เฉพาะกับใบรับสินค้าที่ยังไม่ได้อนุมัติ',
  } as any)
  async delete(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'delete',
        id,
        version,
      },
      GoodReceivedNoteController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.goodReceivedNoteService.delete(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Void a Good Received Note
   * ยกเลิกใบรับสินค้า
   * @param id - Good Received Note ID / รหัสใบรับสินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Voided GRN / ใบรับสินค้าที่ยกเลิกแล้ว
   */
  @Delete(':bu_code/good-received-note/:id/void')
  @UseGuards(new AppIdGuard('goodReceivedNote.delete'))
  @Serialize(GoodReceivedNoteMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Void a Good Received Note',
    description:
      'Voids a goods receiving record, setting its status to voided. This prevents the GRN from being committed to inventory. Used when a delivery is rejected or the GRN was created with incorrect information.',
    operationId: 'voidGoodReceivedNote',
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        description: 'Good Received Note ID',
      },
    ],
    responses: {
      200: { description: 'The Good Received Note was successfully voided' },
      400: { description: 'The Good Received Note cannot be voided' },
      404: { description: 'The Good Received Note was not found' },
    },
    'x-description-th': 'ยกเลิกใบรับสินค้าโดยเปลี่ยนสถานะเป็นยกเลิก ป้องกันไม่ให้บันทึกเข้าคลังสินค้า ใช้เมื่อการส่งมอบถูกปฏิเสธหรือบันทึกผิดพลาด',
  } as any)
  async voidGrn(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'voidGrn', id, version },
      GoodReceivedNoteController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.goodReceivedNoteService.voidGrn(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Export a Good Received Note to an Excel spreadsheet
   * ส่งออกใบรับสินค้าเป็นไฟล์ Excel
   * @param id - Good Received Note ID / รหัสใบรับสินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Excel file buffer and filename / บัฟเฟอร์ไฟล์ Excel และชื่อไฟล์
   */
  @Get(':bu_code/good-received-note/:id/export')
  @UseGuards(new AppIdGuard('goodReceivedNote.export'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Export a Good Received Note to Excel',
    description:
      'Exports a goods receiving record to Excel with all received items, quantities, and vendor details. Used for record-keeping, sharing with accounts payable for invoice matching, or vendor dispute resolution.',
    operationId: 'exportGoodReceivedNote',
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
        description: 'Good Received Note ID',
      },
    ],
    responses: {
      200: {
        description: 'Excel file download',
        content: {
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
            schema: {
              type: 'string',
              format: 'binary',
            },
          },
        },
      },
      404: {
        description: 'The Good Received Note was not found',
      },
    },
    'x-description-th': 'ส่งออกใบรับสินค้าเป็นไฟล์ Excel พร้อมรายการสินค้าที่รับทั้งหมด จำนวน และรายละเอียดผู้ขาย',
  } as any)
  @HttpCode(HttpStatus.OK)
  async exportToExcel(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'exportToExcel',
        id,
        version,
      },
      GoodReceivedNoteController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.goodReceivedNoteService.exportToExcel(
      id,
      user_id,
      bu_code,
      version,
    );

    if (!result.isOk()) {
      this.respond(res, result);
      return;
    }

    const { buffer, filename } = result.value;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  }

  /**
   * Reject a Good Received Note due to quality or delivery issues
   * ปฏิเสธใบรับสินค้าเนื่องจากปัญหาคุณภาพหรือการจัดส่ง
   * @param id - Good Received Note ID / รหัสใบรับสินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param body - Rejection reason / เหตุผลในการปฏิเสธ
   * @param version - API version / เวอร์ชัน API
   * @returns Rejected Good Received Note / ใบรับสินค้าที่ถูกปฏิเสธ
   */
  @Post(':bu_code/good-received-note/:id/reject')
  @UseGuards(new AppIdGuard('goodReceivedNote.reject'))
  @Serialize(GoodReceivedNoteMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Reject a Good Received Note',
    description:
      'Rejects a goods receiving record when the delivery does not meet quality standards or the received goods are incorrect. Voids the GRN so it does not affect inventory levels, and the delivery can be handled through the vendor returns process.',
    operationId: 'rejectGoodReceivedNote',
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
        description: 'The Good Received Note was successfully rejected',
      },
      400: {
        description:
          'The Good Received Note cannot be rejected due to invalid status',
      },
      404: {
        description: 'The Good Received Note was not found',
      },
    },
    'x-description-th': 'ปฏิเสธใบรับสินค้าเมื่อการส่งมอบไม่ผ่านมาตรฐานคุณภาพหรือสินค้าที่ได้รับไม่ถูกต้อง ใบรับสินค้าจะถูกยกเลิกและไม่มีผลต่อสินค้าคงคลัง',
  } as any)
  @ApiBody({ type: RejectGoodReceivedNoteSwaggerDto })
  @HttpCode(HttpStatus.OK)
  async reject(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Body() body: { reason?: string },
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'reject',
        id,
        reason: body.reason,
        version,
      },
      GoodReceivedNoteController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.goodReceivedNoteService.reject(
      id,
      body.reason || '',
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Approve a Good Received Note and commit to inventory
   * อนุมัติใบรับสินค้าและบันทึกเข้าคลังสินค้า
   * @param id - Good Received Note ID / รหัสใบรับสินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Approved Good Received Note / ใบรับสินค้าที่อนุมัติแล้ว
   */
  @Post(':bu_code/good-received-note/:id/approve')
  @UseGuards(new AppIdGuard('goodReceivedNote.approve'))
  @Serialize(GoodReceivedNoteMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Approve a Good Received Note',
    description:
      'Approves a goods receiving record, committing the received quantities into inventory. This creates inventory transactions and establishes FIFO cost layers for the received items, updating stock levels and enabling the items for use by departments.',
    operationId: 'approveGoodReceivedNote',
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
        description: 'The Good Received Note was successfully approved',
      },
      400: {
        description:
          'The Good Received Note cannot be approved due to invalid status or missing details',
      },
      404: {
        description: 'The Good Received Note was not found',
      },
    },
    'x-description-th': 'อนุมัติใบรับสินค้าและบันทึกจำนวนที่รับเข้าคลังสินค้า สร้างรายการเคลื่อนไหวสินค้าคงคลังและกำหนดต้นทุนแบบ FIFO',
  } as any)
  @HttpCode(HttpStatus.OK)
  async approve(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'approve',
        id,
        version,
      },
      GoodReceivedNoteController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.goodReceivedNoteService.approve(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  // ==================== Good Received Note Detail CRUD ====================

  /**
   * List all detail line items on a Good Received Note
   * ค้นหารายการทั้งหมดของรายละเอียดใบรับสินค้า
   * @param id - Good Received Note ID / รหัสใบรับสินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns List of GRN details / รายการรายละเอียดใบรับสินค้า
   */
  @Get(':bu_code/good-received-note/:id/details')
  @UseGuards(new AppIdGuard('goodReceivedNote.findOne'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get all details for a Good Received Note',
    description:
      'Lists all received items on a GRN including product details, ordered vs. received quantities, and inspection notes. Used to review what was actually delivered and compare against the purchase order.',
    operationId: 'findAllGRNDetails',
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        description: 'Good Received Note ID',
      },
    ],
    responses: {
      200: { description: 'GRN details retrieved successfully' },
      404: { description: 'Good Received Note not found' },
    },
    'x-description-th': 'แสดงรายการสินค้าที่รับทั้งหมดในใบรับสินค้า รวมถึงรายละเอียดสินค้า จำนวนที่สั่งเทียบกับจำนวนที่รับ และบันทึกการตรวจสอบ',
  } as any)
  @HttpCode(HttpStatus.OK)
  async findDetailsByGrnId(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'findDetailsByGrnId', id, version },
      GoodReceivedNoteController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.goodReceivedNoteService.findDetailsByGrnId(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Retrieve a single GRN detail line item by ID
   * ค้นหารายการเดียวตาม ID ของรายละเอียดใบรับสินค้า
   * @param id - Good Received Note ID / รหัสใบรับสินค้า
   * @param detailId - GRN detail ID / รหัสรายละเอียดใบรับสินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns GRN detail data / ข้อมูลรายละเอียดใบรับสินค้า
   */
  @Get(':bu_code/good-received-note/:id/details/:detail_id')
  @UseGuards(new AppIdGuard('goodReceivedNote.findOne'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get a specific GRN detail by ID',
    description:
      'Retrieves a single received item line from a GRN with full quantity, pricing, and quality details. Used to inspect a specific delivery item when resolving quantity or quality discrepancies.',
    operationId: 'findGRNDetailById',
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        description: 'Good Received Note ID',
      },
      {
        name: 'detail_id',
        in: 'path',
        required: true,
        description: 'GRN Detail ID',
      },
    ],
    responses: {
      200: { description: 'GRN detail retrieved successfully' },
      404: { description: 'GRN detail not found' },
    },
    'x-description-th': 'ดึงรายละเอียดรายการสินค้าที่รับรายการเดียวจากใบรับสินค้า พร้อมข้อมูลจำนวน ราคา และคุณภาพ',
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
    this.logger.debug(
      { function: 'findDetailById', id, detailId, version },
      GoodReceivedNoteController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.goodReceivedNoteService.findDetailById(
      detailId,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Remove a line item from a draft Good Received Note
   * ลบรายการจากใบรับสินค้าฉบับร่าง
   * @param id - Good Received Note ID / รหัสใบรับสินค้า
   * @param detailId - GRN detail ID / รหัสรายละเอียดใบรับสินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @Delete(':bu_code/good-received-note/:id/details/:detail_id')
  @UseGuards(new AppIdGuard('goodReceivedNote.update'))
  @Serialize(GoodReceivedNoteMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Delete a GRN detail',
    description:
      'Removes a line item from a draft GRN when an item was recorded in error or was not actually part of the delivery. Only applicable before the GRN is approved.',
    operationId: 'deleteGRNDetail',
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        description: 'Good Received Note ID',
      },
      {
        name: 'detail_id',
        in: 'path',
        required: true,
        description: 'GRN Detail ID',
      },
    ],
    responses: {
      200: { description: 'GRN detail deleted successfully' },
      400: { description: 'Cannot delete detail of non-draft GRN' },
      404: { description: 'GRN detail not found' },
    },
    'x-description-th': 'ลบรายการสินค้าจากใบรับสินค้าฉบับร่าง ใช้เมื่อรายการถูกบันทึกผิดพลาดหรือไม่ได้เป็นส่วนหนึ่งของการส่งมอบจริง',
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
    this.logger.debug(
      { function: 'deleteDetail', id, detailId, version },
      GoodReceivedNoteController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.goodReceivedNoteService.deleteDetail(
      detailId,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  // ==================== Mobile-specific endpoints ====================

  /**
   * Look up a purchase order by document number for goods receiving
   * ค้นหาใบสั่งซื้อตามเลขที่เอกสารเพื่อรับสินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param po_no - Purchase order number / เลขที่ใบสั่งซื้อ
   * @param version - API version / เวอร์ชัน API
   * @returns Good Received Note data / ข้อมูลใบรับสินค้า
   */
  @Get(':bu_code/good-received-note/manual-po/:po_no')
  @Serialize(GoodReceivedNoteDetailResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Manual check PO (return new GRN)',
    description:
      'Looks up a purchase order by its document number to start the goods receiving process. Used when receiving staff need to manually enter a PO number (instead of scanning a QR code) to begin recording a delivery.',
    operationId: 'manualCheckPO',
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'bu_code',
        in: 'path',
        required: true,
        description: 'Business Unit Code',
      },
      {
        name: 'po_no',
        in: 'path',
        required: true,
        description: 'Purchase Order Number',
      },
    ],
    responses: {
      200: { description: 'GRN retrieved successfully' },
      404: { description: 'Purchase Order not found' },
    },
    'x-description-th': 'ค้นหาใบสั่งซื้อตามเลขที่เอกสารเพื่อเริ่มกระบวนการรับสินค้า ใช้เมื่อเจ้าหน้าที่กรอกเลขที่ใบสั่งซื้อด้วยตนเองแทนการสแกน QR code',
  } as any)
  @HttpCode(HttpStatus.OK)
  async manualCheckPO(
    @Param('bu_code') bu_code: string,
    @Param('po_no') po_no: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'manualCheckPO', bu_code, po_no, version },
      GoodReceivedNoteController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.goodReceivedNoteService.findByManualPO(
      po_no,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Save a Good Received Note — creates inventory transactions and updates PO receiving
   * บันทึกใบรับสินค้า — สร้าง inventory transactions และอัปเดตจำนวนรับใน PO
   */
  @Patch(':bu_code/good-received-note/:id/save')
  @UseGuards(new AppIdGuard('goodReceivedNote.commit'))
  @Serialize(GoodReceivedNoteMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Save a Good Received Note',
    description:
      'Saves the goods receiving record, creating inventory transactions (FIFO/Average cost layers) and updating PO received quantities. Changes status from draft to saved.',
    operationId: 'saveGoodReceivedNote',
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Good Received Note ID' },
      { name: 'bu_code', in: 'path', required: true, description: 'Business Unit Code' },
    ],
    responses: {
      200: { description: 'GRN saved successfully' },
      400: { description: 'GRN cannot be saved' },
      404: { description: 'GRN not found' },
    },
    'x-description-th': 'บันทึกใบรับสินค้า สร้าง inventory transactions และอัปเดตจำนวนรับใน PO เปลี่ยนสถานะจาก draft เป็น saved',
  } as any)
  @ApiBody({ type: CommitGoodReceivedNoteSwaggerDto })
  @HttpCode(HttpStatus.OK)
  async saveGrn(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Body() data: Record<string, unknown>,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'save', id, data, version },
      GoodReceivedNoteController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.goodReceivedNoteService.save(
      id,
      data,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Commit a Good Received Note — changes status from saved to committed
   * ยืนยันใบรับสินค้า — เปลี่ยนสถานะจาก saved เป็น committed
   */
  @Patch(':bu_code/good-received-note/:id/commit')
  @UseGuards(new AppIdGuard('goodReceivedNote.commit'))
  @Serialize(GoodReceivedNoteMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Commit a Good Received Note',
    description:
      'Commits a saved goods receiving record, changing its status from saved to committed.',
    operationId: 'commitGoodReceivedNote',
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Good Received Note ID' },
      { name: 'bu_code', in: 'path', required: true, description: 'Business Unit Code' },
    ],
    responses: {
      200: { description: 'GRN committed successfully' },
      400: { description: 'GRN cannot be committed (must be saved first)' },
      404: { description: 'GRN not found' },
    },
    'x-description-th': 'ยืนยันใบรับสินค้า เปลี่ยนสถานะจาก saved เป็น committed',
  } as any)
  @ApiBody({ type: CommitGoodReceivedNoteSwaggerDto })
  @HttpCode(HttpStatus.OK)
  async commit(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Body() data: Record<string, unknown>,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'commit', id, data, version },
      GoodReceivedNoteController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.goodReceivedNoteService.commit(
      id,
      data,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  // ==================== Sub-resource list endpoints (products/locations in a GRN) ====================

  /**
   * List distinct products on a GRN
   * แสดงรายการสินค้าแบบไม่ซ้ำในใบรับสินค้า
   */
  @Get(':bu_code/good-received-note/:grn_id/product')
  @UseGuards(new AppIdGuard('goodReceivedNote.findOne'))
  @Serialize(GrnProductListItemSchema)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiOperation({
    summary: 'List products on a Good Received Note',
    description:
      'Lists all distinct products received on a GRN with pagination and filtering. Used by frontend to show a summary of what products were received and to power product-based drill-down views.',
    operationId: 'findProductsByGrnId',
    parameters: [
      { name: 'grn_id', in: 'path', required: true, description: 'Good Received Note ID' },
      { name: 'bu_code', in: 'path', required: true, description: 'Business Unit Code' },
    ],
    responses: {
      200: { description: 'Products retrieved successfully' },
      404: { description: 'Good Received Note not found' },
    },
    'x-description-th': 'แสดงรายการสินค้าแบบไม่ซ้ำที่รับในใบรับสินค้าพร้อมการแบ่งหน้าและตัวกรอง',
  } as any)
  @HttpCode(HttpStatus.OK)
  async findProductsByGrnId(
    @Param('grn_id', new ParseUUIDPipe({ version: '4' })) grnId: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'findProductsByGrnId', grnId, version },
      GoodReceivedNoteController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.goodReceivedNoteService.findProductsByGrnId(
      grnId,
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  /**
   * List locations for a specific product on a GRN
   * แสดงรายการตำแหน่งจัดเก็บของสินค้าหนึ่งในใบรับสินค้า
   */
  @Get(':bu_code/good-received-note/:grn_id/product/:product_id/location')
  @UseGuards(new AppIdGuard('goodReceivedNote.findOne'))
  @Serialize(GrnLocationListItemSchema)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiOperation({
    summary: 'List locations for a product on a GRN',
    description:
      'Lists distinct locations where a given product was received on a GRN with pagination and filtering. Used to drill down from a product summary to see where each product was placed.',
    operationId: 'findLocationsByGrnIdAndProductId',
    parameters: [
      { name: 'grn_id', in: 'path', required: true, description: 'Good Received Note ID' },
      { name: 'product_id', in: 'path', required: true, description: 'Product ID' },
      { name: 'bu_code', in: 'path', required: true, description: 'Business Unit Code' },
    ],
    responses: {
      200: { description: 'Locations retrieved successfully' },
      404: { description: 'Good Received Note not found' },
    },
    'x-description-th': 'แสดงรายการตำแหน่งจัดเก็บแบบไม่ซ้ำของสินค้าหนึ่งในใบรับสินค้าพร้อมการแบ่งหน้าและตัวกรอง',
  } as any)
  @HttpCode(HttpStatus.OK)
  async findLocationsByGrnIdAndProductId(
    @Param('grn_id', new ParseUUIDPipe({ version: '4' })) grnId: string,
    @Param('product_id', new ParseUUIDPipe({ version: '4' })) productId: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'findLocationsByGrnIdAndProductId', grnId, productId, version },
      GoodReceivedNoteController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.goodReceivedNoteService.findLocationsByGrnIdAndProductId(
      grnId,
      productId,
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  /**
   * List distinct locations on a GRN
   * แสดงรายการตำแหน่งจัดเก็บแบบไม่ซ้ำในใบรับสินค้า
   */
  @Get(':bu_code/good-received-note/:grn_id/location')
  @UseGuards(new AppIdGuard('goodReceivedNote.findOne'))
  @Serialize(GrnLocationListItemSchema)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiOperation({
    summary: 'List locations on a Good Received Note',
    description:
      'Lists all distinct locations where items were received on a GRN with pagination and filtering. Used by frontend to show a summary of receiving locations and to power location-based drill-down views.',
    operationId: 'findLocationsByGrnId',
    parameters: [
      { name: 'grn_id', in: 'path', required: true, description: 'Good Received Note ID' },
      { name: 'bu_code', in: 'path', required: true, description: 'Business Unit Code' },
    ],
    responses: {
      200: { description: 'Locations retrieved successfully' },
      404: { description: 'Good Received Note not found' },
    },
    'x-description-th': 'แสดงรายการตำแหน่งจัดเก็บแบบไม่ซ้ำที่มีการรับสินค้าในใบรับสินค้าพร้อมการแบ่งหน้าและตัวกรอง',
  } as any)
  @HttpCode(HttpStatus.OK)
  async findLocationsByGrnId(
    @Param('grn_id', new ParseUUIDPipe({ version: '4' })) grnId: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'findLocationsByGrnId', grnId, version },
      GoodReceivedNoteController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.goodReceivedNoteService.findLocationsByGrnId(
      grnId,
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  /**
   * List products at a specific location on a GRN
   * แสดงรายการสินค้าที่อยู่ในตำแหน่งจัดเก็บหนึ่งในใบรับสินค้า
   */
  @Get(':bu_code/good-received-note/:grn_id/location/:location_id/product')
  @UseGuards(new AppIdGuard('goodReceivedNote.findOne'))
  @Serialize(GrnProductListItemSchema)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiOperation({
    summary: 'List products at a location on a GRN',
    description:
      'Lists distinct products received at a given location on a GRN with pagination and filtering. Used to drill down from a location summary to see what products arrived at each location.',
    operationId: 'findProductsByGrnIdAndLocationId',
    parameters: [
      { name: 'grn_id', in: 'path', required: true, description: 'Good Received Note ID' },
      { name: 'location_id', in: 'path', required: true, description: 'Location ID' },
      { name: 'bu_code', in: 'path', required: true, description: 'Business Unit Code' },
    ],
    responses: {
      200: { description: 'Products retrieved successfully' },
      404: { description: 'Good Received Note not found' },
    },
    'x-description-th': 'แสดงรายการสินค้าแบบไม่ซ้ำที่รับในตำแหน่งจัดเก็บหนึ่งของใบรับสินค้าพร้อมการแบ่งหน้าและตัวกรอง',
  } as any)
  @HttpCode(HttpStatus.OK)
  async findProductsByGrnIdAndLocationId(
    @Param('grn_id', new ParseUUIDPipe({ version: '4' })) grnId: string,
    @Param('location_id', new ParseUUIDPipe({ version: '4' })) locationId: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'findProductsByGrnIdAndLocationId', grnId, locationId, version },
      GoodReceivedNoteController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.goodReceivedNoteService.findProductsByGrnIdAndLocationId(
      grnId,
      locationId,
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Regenerate denormalized amount totals on tb_good_received_note from detail items
   * Recompute one GRN by id, or all non-deleted GRNs in the business unit if id is omitted
   */
  @Post(':bu_code/good-received-note/regenerate-totals')
  @ApiOperation({
    summary: 'Regenerate GRN amount totals (all)',
    description:
      'Recomputes net_amount, base_net_amount, total_amount, base_total_amount on every non-deleted Good Received Note in the business unit by aggregating from detail items. Use after manual DB edits or schema migrations to repair drift.',
    operationId: 'regenerateAllGoodReceivedNoteTotals',
  } as any)
  @HttpCode(HttpStatus.OK)
  async regenerateAllTotals(
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.debug({ function: 'regenerateAllTotals', bu_code }, GoodReceivedNoteController.name);
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.goodReceivedNoteService.regenerateTotals(user_id, bu_code);
    this.respond(res, result);
  }

  @Post(':bu_code/good-received-note/:id/regenerate-totals')
  @ApiOperation({
    summary: 'Regenerate GRN amount totals (single)',
    description:
      'Recomputes net_amount, base_net_amount, total_amount, base_total_amount on a single Good Received Note by aggregating from detail items.',
    operationId: 'regenerateGoodReceivedNoteTotals',
  } as any)
  @HttpCode(HttpStatus.OK)
  async regenerateTotalsById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.debug({ function: 'regenerateTotalsById', id, bu_code }, GoodReceivedNoteController.name);
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.goodReceivedNoteService.regenerateTotals(user_id, bu_code, id);
    this.respond(res, result);
  }

  /**
   * Print a goods received note via FastReport viewer (micro-report)
   * พิมพ์ใบรับสินค้าผ่าน FastReport viewer (micro-report)
   */
  @Get(':bu_code/good-received-note/:id/print-viewer')
  @UseGuards(new AppIdGuard('goodReceivedNote.print'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Print goods received note via FastReport viewer',
    description:
      'Sends GRN data + signature config to micro-report which generates FastReport XML and returns a viewer URL.',
    operationId: 'printGoodReceivedNoteViewer',
    'x-description-th': 'ส่งข้อมูล GRN + signature ไป micro-report เพื่อสร้าง FastReport XML แล้วคืน viewer URL',
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
      GoodReceivedNoteController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.goodReceivedNoteService.printToReport(id, user_id, bu_code);
    this.respond(res, result);
  }
}
