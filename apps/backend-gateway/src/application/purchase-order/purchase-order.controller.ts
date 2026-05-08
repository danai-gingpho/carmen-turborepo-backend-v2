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
import { PurchaseOrderService } from './purchase-order.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { ApiVersionMinRequest, ApiUserFilterQueries } from 'src/common/decorator/userfilter.decorator';
import { IPaginateQuery, PaginateQuery } from 'src/shared-dto/paginate.dto';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import {
  CreatePurchaseOrderSwaggerDto,
  UpdatePurchaseOrderSwaggerDto,
  SavePurchaseOrderSwaggerDto,
  SubmitPurchaseOrderSwaggerDto,
  ApprovePurchaseOrderSwaggerDto,
  RejectPurchaseOrderSwaggerDto,
  ReviewPurchaseOrderSwaggerDto,
  GroupPrForPoSwaggerDto,
  ConfirmPrToPoSwaggerDto,
} from './swagger/request';
import {
  PurchaseOrderDetailResponseDto,
  PurchaseOrderListResponseDto,
  PurchaseOrderMutationResponseDto,
  PurchaseOrderDetailItemResponseDto,
  PurchaseOrderPreviousStagesResponseDto,
  GroupPrForPoResponseDto,
  ConfirmPrToPoResponseDto,
} from './swagger/response';
import {
  SubmitPurchaseOrderDto,
  ApprovePurchaseOrderDto,
  SavePurchaseOrderDto,
  RejectPurchaseOrderDto,
  ReviewPurchaseOrderDto,
} from './dto/state-change.dto';
import {
  EXAMPLE_CREATE_PO,
  EXAMPLE_SAVE_PO,
  EXAMPLE_SAVE_PO_APPROVE,
  EXAMPLE_APPROVE_PO,
  EXAMPLE_REJECT_PO,
  EXAMPLE_REVIEW_PO,
  EXAMPLE_GROUP_PR_FOR_PO,
  EXAMPLE_CONFIRM_PR_TO_PO,
} from './example/purchase-order.example';
import { PermissionGuard } from 'src/auth';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import {
  BaseHttpController,
  EnrichAuditUsers,
  Serialize,
  PurchaseOrderDetailResponseSchema,
  PurchaseOrderListItemResponseSchema,
  PurchaseOrderMutationResponseSchema,
  PurchaseOrderUpdateDto,
} from '@/common';

@Controller('api/:bu_code/purchase-order')
@ApiTags('Procurement: Purchase Orders')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard, PermissionGuard)
@ApiBearerAuth()
export class PurchaseOrderController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    PurchaseOrderController.name,
  );

  constructor(private readonly purchaseOrderService: PurchaseOrderService) {
    super();
  }

  /**
   * List distinct vendors from POs with sent/partial status for GRN creation.
   * แสดงรายการผู้ขายที่มีใบสั่งซื้อสถานะ sent หรือ partial สำหรับ GRN
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param query - Pagination and filter parameters / พารามิเตอร์การแบ่งหน้าและตัวกรอง
   * @param version - API version / เวอร์ชัน API
   * @returns Distinct vendor list / รายการผู้ขายที่ไม่ซ้ำ
   */
  @Get('grn/vendor')
  @UseGuards(new AppIdGuard('purchaseOrder.findAll'))
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiOperation({
    summary: 'List vendors with POs for GRN',
    description: 'Lists distinct vendors that have purchase orders with sent or partial status, for GRN creation.',
    operationId: 'findVendorsForGrn',
    responses: {
      200: { description: 'Vendor list retrieved successfully' },
    },
    'x-description-th': 'แสดงรายการผู้ขายที่มีใบสั่งซื้อสถานะส่งแล้วหรือรับบางส่วน สำหรับใช้ในการสร้างใบรับสินค้า',
  } as any)
  @ApiResponse({ status: 200, description: 'Vendor list retrieved successfully' })
  @HttpCode(HttpStatus.OK)
  async findVendorsForGrn(
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'findVendorsForGrn', query, version },
      PurchaseOrderController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.purchaseOrderService.findVendorsForGrn(user_id, bu_code, paginate, version);
    this.respond(res, result);
  }

  /**
   * List purchase orders available for GRN creation, with location breakdown from PR details.
   * ค้นหาใบสั่งซื้อที่พร้อมสำหรับสร้างใบรับสินค้า พร้อมรายละเอียดตาม location จาก PR
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param query - Pagination and filter parameters / พารามิเตอร์การแบ่งหน้าและตัวกรอง
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated PO list with location-level detail breakdown / รายการ PO พร้อมรายละเอียดแยกตาม location
   */
  @Get('grn/vendor/:vendor_id')
  @UseGuards(new AppIdGuard('purchaseOrder.findAll'))
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiOperation({
    summary: 'List purchase orders for GRN by vendor',
    description: 'Lists purchase orders (sent/partial status) filtered by vendor ID, with detail lines broken down by delivery location. Used by GRN creation to list POs for a specific vendor.',
    operationId: 'findAllPurchaseOrdersForGrnByVendor',
    responses: {
      200: { description: 'PO list for vendor retrieved successfully' },
    },
    'x-description-th': 'แสดงรายการใบสั่งซื้อ (สถานะส่งแล้ว/รับบางส่วน) กรองตามผู้ขาย พร้อมรายละเอียดแยกตาม location สำหรับใช้ในการสร้างใบรับสินค้า',
  } as any)
  @ApiParam({ name: 'vendor_id', description: 'Vendor ID', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'PO list for vendor retrieved successfully', type: PurchaseOrderListResponseDto })
  @HttpCode(HttpStatus.OK)
  async findAllForGrnByVendor(
    @Param('bu_code') bu_code: string,
    @Param('vendor_id', new ParseUUIDPipe({ version: '4' })) vendor_id: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'findAllForGrnByVendor', vendor_id, query, version },
      PurchaseOrderController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.purchaseOrderService.findAllForGrnByVendorId(vendor_id, user_id, bu_code, paginate, version);
    this.respond(res, result);
  }

  @Get('grn')
  @UseGuards(new AppIdGuard('purchaseOrder.findAll'))
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiOperation({
    summary: 'List purchase orders for GRN creation',
    description: 'Lists purchase orders (sent/partial status) with detail lines broken down by delivery location from the linked purchase request details. Used by the GRN creation flow to select a PO and see which items go to which locations with remaining quantities.',
    operationId: 'findAllPurchaseOrdersForGrn',
    responses: {
      200: { description: 'PO list with location breakdown retrieved successfully' },
    },
    'x-description-th': 'แสดงรายการใบสั่งซื้อ (สถานะส่งแล้ว/รับบางส่วน) พร้อมรายละเอียดแยกตาม location จากใบขอซื้อ สำหรับใช้ในขั้นตอนการสร้างใบรับสินค้า',
  } as any)
  @ApiResponse({ status: 200, description: 'PO list with location breakdown retrieved successfully', type: PurchaseOrderListResponseDto })
  @HttpCode(HttpStatus.OK)
  async findAllForGrn(
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'findAllForGrn', query, version },
      PurchaseOrderController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.purchaseOrderService.findAllForGrn(user_id, bu_code, paginate, version);
    this.respond(res, result);
  }

  /**
   * Get all workflow stages for purchase orders in a business unit
   * แสดงขั้นตอนเวิร์กโฟลว์การอนุมัติสำหรับใบสั่งซื้อในหน่วยธุรกิจ
   */
  @Get('workflow-stages')
  @UseGuards(new AppIdGuard('purchaseOrder.findAll'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all workflow stages for purchase orders',
    description: 'Returns the configured approval workflow stages (e.g., HOD, Purchaser, FC, GM) for purchase orders in this business unit. Used to display workflow progress and filter by stage.',
    operationId: 'findAllWorkflowStagesByPo',
    'x-description-th': 'แสดงขั้นตอนเวิร์กโฟลว์การอนุมัติสำหรับใบสั่งซื้อในหน่วยธุรกิจ',
  } as any)
  @ApiResponse({ status: 200, description: 'Workflow stages retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Workflow stages not found' })
  async findAllWorkflowStagesByPo(
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'findAllWorkflowStagesByPo', version },
      PurchaseOrderController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseOrderService.findAllWorkflowStagesByPo(
      user_id, bu_code, version,
    );
    this.respond(res, result);
  }

  /**
   * Get previous workflow stages for a purchase order
   * ดึงขั้นตอนอนุมัติก่อนหน้า current_stage ของใบสั่งซื้อ
   * @param po_id - Purchase order ID / รหัสใบสั่งซื้อ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Previous workflow stages / ขั้นตอนการทำงานก่อนหน้า
   */
  @Get(':po_id/previous-stages')
  @UseGuards(new AppIdGuard('purchaseOrder.findOne'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get previous workflow stages by PO ID',
    description:
      'Retrieves all workflow stages before the current stage of a purchase order. Used to determine revert/return-to options in the approval chain.',
    operationId: 'getPreviousStagesByPoId',
    responses: {
      200: { description: 'Previous stages retrieved successfully' },
      404: { description: 'Purchase order not found or no workflow assigned' },
    },
    'x-description-th': 'ดึงขั้นตอนการทำงานก่อนหน้าขั้นตอนปัจจุบันของใบสั่งซื้อ ใช้สำหรับกำหนดตัวเลือกในการส่งกลับตรวจสอบ',
  } as any)
  @ApiResponse({ status: 200, description: 'Previous stages retrieved successfully', type: PurchaseOrderPreviousStagesResponseDto })
  @ApiResponse({ status: 404, description: 'Purchase order not found or no workflow assigned' })
  async getPreviousStagesByPoId(
    @Param('po_id', new ParseUUIDPipe({ version: '4' })) po_id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'getPreviousStagesByPoId', po_id, version },
      PurchaseOrderController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseOrderService.getPreviousStages(
      po_id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Retrieve full details of a specific purchase order
   * ค้นหารายการเดียวตาม ID ของใบสั่งซื้อพร้อมรายละเอียดทั้งหมด
   * @param id - Purchase order ID / รหัสใบสั่งซื้อ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Purchase order details / รายละเอียดใบสั่งซื้อ
   */
  @Get(':id')
  @UseGuards(new AppIdGuard('purchaseOrder.findOne'))
  @Serialize(PurchaseOrderDetailResponseSchema)
  @EnrichAuditUsers()
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get a purchase order by ID',
    description: 'Retrieves the full details of a specific purchase order including vendor information, line items, pricing, delivery dates, workflow status, and the authenticated user\'s role (create, approve, purchase, view_only, issue) for this PO.',
    operationId: 'findOnePurchaseOrder',
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
        description: 'The purchase order was successfully retrieved',
      },
      404: {
        description: 'The purchase order was not found',
      },
    },
    'x-description-th': 'ดึงรายละเอียดทั้งหมดของใบสั่งซื้อตาม ID รวมถึงข้อมูลผู้ขาย รายการสินค้า ราคา วันส่งมอบ สถานะขั้นตอนการทำงาน และบทบาทของผู้ใช้ที่เข้าสู่ระบบ',
  } as any)
  @ApiResponse({ status: 200, description: 'The purchase order was successfully retrieved', type: PurchaseOrderDetailResponseDto })
  @ApiResponse({ status: 404, description: 'The purchase order was not found' })
  @HttpCode(HttpStatus.OK)
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
      PurchaseOrderController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseOrderService.findOne(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * List all purchase orders with pagination and search
   * ค้นหารายการทั้งหมดของใบสั่งซื้อพร้อมการแบ่งหน้าและการค้นหา
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param query - Pagination and filter parameters / พารามิเตอร์การแบ่งหน้าและตัวกรอง
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated list of purchase orders / รายการใบสั่งซื้อแบบแบ่งหน้า
   */
  @Get()
  @UseGuards(new AppIdGuard('purchaseOrder.findAll'))
  @Serialize(PurchaseOrderListItemResponseSchema)
  @EnrichAuditUsers()
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiQuery({ name: 'vendor_id', description: 'Filter by Vendor ID', type: 'string', required: false })
  @ApiOperation({
    summary: 'Get all purchase orders',
    description: 'Lists all purchase orders for the business unit with pagination and search. Optionally filter by vendor_id. Used by purchasers and managers to track outstanding orders, monitor delivery status, and manage vendor commitments.',
    operationId: 'findAllPurchaseOrders',
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
        description: 'The purchase orders were successfully retrieved',
      },
      404: {
        description: 'The purchase orders were not found',
      },
    },
    'x-description-th': 'แสดงรายการใบสั่งซื้อทั้งหมดของหน่วยธุรกิจพร้อมการแบ่งหน้าและค้นหา สามารถกรองตาม vendor_id ได้',
  } as any)
  @ApiResponse({ status: 200, description: 'The purchase orders were successfully retrieved', type: PurchaseOrderListResponseDto })
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query() query: IPaginateQuery,
    @Query('vendor_id') vendor_id?: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAll',
        query,
        vendor_id,
        version,
      },
      PurchaseOrderController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);

    if (vendor_id) {
      paginate.filter['vendor_id'] = vendor_id;
    }

    const result = await this.purchaseOrderService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Create a new purchase order to formalize procurement from a vendor
   * สร้างใบสั่งซื้อใหม่เพื่อยืนยันการจัดซื้อจากผู้ขาย
   * @param createDto - Purchase order creation data / ข้อมูลสำหรับสร้างใบสั่งซื้อ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Created purchase order / ใบสั่งซื้อที่สร้างแล้ว
   */
  @Post()
  @UseGuards(new AppIdGuard('purchaseOrder.create'))
  @Serialize(PurchaseOrderMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Create a purchase order',
    description:
      'Creates a new purchase order to formalize procurement from a vendor. The PO groups approved PR line items by vendor, delivery date, and currency, establishing a binding order commitment that can be sent to the vendor.',
    operationId: 'createPurchaseOrder',
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
      201: {
        description: 'The purchase order was successfully created',
      },
      400: {
        description: 'Invalid request body',
      },
    },
    'x-description-th': 'สร้างใบสั่งซื้อใหม่เพื่อยืนยันการจัดซื้อจากผู้ขาย โดยจัดกลุ่มรายการจากใบขอซื้อที่อนุมัติแล้วตามผู้ขาย วันส่งมอบ และสกุลเงิน',
  } as any)
  @ApiBody({
    type: CreatePurchaseOrderSwaggerDto,
    examples: {
      create: {
        summary: 'Create PO with multiple line items',
        value: EXAMPLE_CREATE_PO,
      },
    },
  })
  @ApiResponse({ status: 201, description: 'The purchase order was successfully created', type: PurchaseOrderMutationResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createDto: CreatePurchaseOrderDto,
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
      PurchaseOrderController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseOrderService.create(
      { ...createDto },
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Update purchase order header and line item details
   * อัปเดตข้อมูลส่วนหัวและรายการของใบสั่งซื้อ
   * @param id - Purchase order ID / รหัสใบสั่งซื้อ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param updateDto - Updated purchase order data / ข้อมูลใบสั่งซื้อที่อัปเดต
   * @param version - API version / เวอร์ชัน API
   * @returns Updated purchase order / ใบสั่งซื้อที่อัปเดตแล้ว
   */
  @Put(':id')
  @UseGuards(new AppIdGuard('purchaseOrder.update'))
  @Serialize(PurchaseOrderMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Update a purchase order',
    description: 'Updates purchase order header and line item details such as quantities, pricing, delivery dates, or vendor terms. Only applicable to POs that have not yet been fully received or closed.',
    operationId: 'updatePurchaseOrder',
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
        description: 'The purchase order was successfully updated',
      },
      404: {
        description: 'The purchase order was not found',
      },
    },
    'x-description-th': 'อัปเดตข้อมูลส่วนหัวและรายการของใบสั่งซื้อ เช่น จำนวน ราคา วันส่งมอบ หรือเงื่อนไขผู้ขาย ใช้ได้เฉพาะใบสั่งซื้อที่ยังไม่ได้รับสินค้าครบหรือปิดแล้ว',
  } as any)
  @ApiBody({ type: UpdatePurchaseOrderSwaggerDto })
  @ApiResponse({ status: 200, description: 'The purchase order was successfully updated', type: PurchaseOrderMutationResponseDto })
  @ApiResponse({ status: 404, description: 'The purchase order was not found' })
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: PurchaseOrderUpdateDto,
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
      PurchaseOrderController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseOrderService.update(
      id,
      { ...updateDto },
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Delete a purchase order that is no longer needed
   * ลบใบสั่งซื้อที่ไม่ต้องการแล้ว
   * @param id - Purchase order ID / รหัสใบสั่งซื้อ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @Delete(':id')
  @UseGuards(new AppIdGuard('purchaseOrder.delete'))
  @Serialize(PurchaseOrderMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Delete a purchase order',
    description: 'Removes a purchase order that is no longer needed. Typically used for draft POs that were created in error before being sent to a vendor.',
    operationId: 'deletePurchaseOrder',
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
        description: 'The purchase order was successfully deleted',
      },
      404: {
        description: 'The purchase order was not found',
      },
    },
    'x-description-th': 'ลบใบสั่งซื้อที่ไม่ต้องการแล้ว โดยทั่วไปใช้สำหรับใบสั่งซื้อฉบับร่างที่สร้างผิดพลาดก่อนส่งให้ผู้ขาย',
  } as any)
  @ApiResponse({ status: 200, description: 'The purchase order was successfully deleted', type: PurchaseOrderMutationResponseDto })
  @ApiResponse({ status: 404, description: 'The purchase order was not found' })
  @HttpCode(HttpStatus.OK)
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
      PurchaseOrderController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseOrderService.delete(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Save incremental changes to a purchase order being prepared
   * บันทึกการเปลี่ยนแปลงใบสั่งซื้อที่กำลังจัดเตรียม
   * @param id - Purchase order ID / รหัสใบสั่งซื้อ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param data - Save payload with add/update/remove details / ข้อมูลการบันทึกพร้อมรายละเอียดเพิ่ม/แก้ไข/ลบ
   * @param version - API version / เวอร์ชัน API
   * @returns Saved purchase order / ใบสั่งซื้อที่บันทึกแล้ว
   */
  @Patch(':id/save')
  @UseGuards(new AppIdGuard('purchaseOrder.save'))
  @Serialize(PurchaseOrderMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Save purchase order changes (add/update/remove details)',
    description:
      'Saves incremental changes to a purchase order that is still being prepared, including adding new items, modifying quantities or pricing, and removing line items. Used by purchasers to finalize PO details before submitting for approval.',
    operationId: 'savePurchaseOrder',
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
        description: 'The purchase order was successfully saved',
      },
      400: {
        description: 'Invalid data or user does not have permission',
      },
      404: {
        description: 'The purchase order was not found or not in progress',
      },
    },
    'x-description-th': 'บันทึกการเปลี่ยนแปลงใบสั่งซื้อที่กำลังจัดเตรียม รวมถึงเพิ่มรายการใหม่ แก้ไขจำนวนหรือราคา และลบรายการ ใช้โดยผู้จัดซื้อเพื่อสรุปรายละเอียดก่อนส่งเข้าสู่ขั้นตอนอนุมัติ',
  } as any)
  @ApiBody({
    type: SavePurchaseOrderSwaggerDto,
    description: 'Save purchase order with header changes and detail add/update/remove',
    examples: {
      'save (create role)': {
        value: EXAMPLE_SAVE_PO,
        summary: 'Creator saves PO with header + detail add/update/remove',
      },
      'save (approve role)': {
        value: EXAMPLE_SAVE_PO_APPROVE,
        summary: 'Approver saves current_stage_status on details only',
      },
    },
  })
  @ApiResponse({ status: 200, description: 'The purchase order was successfully saved', type: PurchaseOrderMutationResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid data or user does not have permission' })
  @ApiResponse({ status: 404, description: 'The purchase order was not found or not in progress' })
  @HttpCode(HttpStatus.OK)
  async save(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Body() data: SavePurchaseOrderDto,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'save',
        id,
        version,
      },
      PurchaseOrderController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseOrderService.save(
      id,
      { ...data },
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Submit a purchase order into the approval workflow
   * ส่งใบสั่งซื้อเข้าสู่ขั้นตอนการอนุมัติ
   */
  @Patch(':id/submit')
  @UseGuards(new AppIdGuard('purchaseOrder.submit'))
  @Serialize(PurchaseOrderMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Submit a purchase order',
    description: 'Submits a draft purchase order into the approval workflow. Once submitted, the PO moves from draft to in_progress status and enters the configured approval chain.',
    operationId: 'submitPurchaseOrder',
    'x-description-th': 'ส่งใบสั่งซื้อฉบับร่างเข้าสู่ขั้นตอนอนุมัติ เมื่อส่งแล้วสถานะจะเปลี่ยนจากร่างเป็นอยู่ระหว่างดำเนินการและเข้าสู่สายการอนุมัติที่กำหนดไว้',
  } as any)
  @ApiBody({ type: SubmitPurchaseOrderSwaggerDto })
  @HttpCode(HttpStatus.OK)
  async submit(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Body() payload: SubmitPurchaseOrderDto,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'submit', id, version },
      PurchaseOrderController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseOrderService.submit(id, payload, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Approve a purchase order at the current workflow stage
   * อนุมัติใบสั่งซื้อในขั้นตอนปัจจุบันของเวิร์กโฟลว์
   * @param id - Purchase order ID / รหัสใบสั่งซื้อ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param data - Approval payload / ข้อมูลการอนุมัติ
   * @param version - API version / เวอร์ชัน API
   * @returns Approved purchase order / ใบสั่งซื้อที่อนุมัติแล้ว
   */
  @Patch(':id/approve')
  @UseGuards(new AppIdGuard('purchaseOrder.approve'))
  @Serialize(PurchaseOrderMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Approve a purchase order',
    description:
      'Advances a purchase order through its approval workflow at the current stage. Each authorized approver (e.g., FC, GM) signs off to authorize the vendor commitment and expenditure.',
    operationId: 'approvePurchaseOrder',
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
        description: 'The purchase order was successfully approved',
      },
      400: {
        description: 'Invalid stage_role or user does not have permission',
      },
      404: {
        description: 'The purchase order was not found',
      },
    },
    'x-description-th': 'อนุมัติใบสั่งซื้อในขั้นตอนปัจจุบันของเวิร์กโฟลว์ ผู้มีอำนาจอนุมัติแต่ละคน (เช่น FC, GM) ลงนามเพื่ออนุมัติการสั่งซื้อและค่าใช้จ่าย',
  } as any)
  @ApiBody({
    type: ApprovePurchaseOrderSwaggerDto,
    description: 'Approve purchase order payload',
    examples: {
      approve: {
        value: EXAMPLE_APPROVE_PO,
        summary: 'Approve PO at current workflow stage',
      },
    },
  })
  @ApiResponse({ status: 200, description: 'The purchase order was successfully approved', type: PurchaseOrderMutationResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid stage_role or user does not have permission' })
  @ApiResponse({ status: 404, description: 'The purchase order was not found' })
  @HttpCode(HttpStatus.OK)
  async approve(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Body() data: ApprovePurchaseOrderDto,
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
      PurchaseOrderController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseOrderService.approve(
      id,
      { ...data },
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Reject a purchase order at the current approval stage
   * ปฏิเสธใบสั่งซื้อในขั้นตอนการอนุมัติปัจจุบัน
   * @param id - Purchase order ID / รหัสใบสั่งซื้อ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param data - Rejection payload with reason / ข้อมูลการปฏิเสธพร้อมเหตุผล
   * @param version - API version / เวอร์ชัน API
   * @returns Rejected purchase order / ใบสั่งซื้อที่ถูกปฏิเสธ
   */
  @Patch(':id/reject')
  @UseGuards(new AppIdGuard('purchaseOrder.reject'))
  @Serialize(PurchaseOrderMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Reject a purchase order',
    description:
      'Rejects a purchase order at the current approval stage, closing it and preventing it from being sent to the vendor. Used when an approver determines the order should not proceed due to budget, pricing, or business reasons.',
    operationId: 'rejectPurchaseOrder',
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
        description: 'The purchase order was successfully rejected',
      },
      400: {
        description: 'Invalid stage_role or user does not have permission',
      },
      404: {
        description: 'The purchase order was not found',
      },
    },
    'x-description-th': 'ปฏิเสธใบสั่งซื้อในขั้นตอนอนุมัติปัจจุบัน ปิดใบสั่งซื้อและป้องกันไม่ให้ส่งไปยังผู้ขาย ใช้เมื่อผู้อนุมัติพิจารณาว่าไม่ควรดำเนินการต่อ',
  } as any)
  @ApiBody({
    type: RejectPurchaseOrderSwaggerDto,
    description: 'Reject purchase order payload',
    examples: {
      reject: {
        value: EXAMPLE_REJECT_PO,
        summary: 'Reject PO with message',
      },
    },
  })
  @ApiResponse({ status: 200, description: 'The purchase order was successfully rejected', type: PurchaseOrderMutationResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid stage_role or user does not have permission' })
  @ApiResponse({ status: 404, description: 'The purchase order was not found' })
  @HttpCode(HttpStatus.OK)
  async reject(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Body() data: RejectPurchaseOrderDto,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'reject',
        id,
        version,
      },
      PurchaseOrderController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseOrderService.reject(
      id,
      { ...data },
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Return a purchase order to a previous stage for review and corrections
   * ส่งใบสั่งซื้อกลับไปยังขั้นตอนก่อนหน้าเพื่อตรวจสอบและแก้ไข
   * @param id - Purchase order ID / รหัสใบสั่งซื้อ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param data - Review payload / ข้อมูลการตรวจสอบ
   * @param version - API version / เวอร์ชัน API
   * @returns Reviewed purchase order / ใบสั่งซื้อที่ส่งกลับตรวจสอบ
   */
  @Patch(':id/review')
  @UseGuards(new AppIdGuard('purchaseOrder.review'))
  @Serialize(PurchaseOrderMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Review a purchase order',
    description:
      'Returns a purchase order to a previous workflow stage for corrections, such as adjusting vendor terms, quantities, or pricing. Allows approvers to request changes before giving final authorization.',
    operationId: 'reviewPurchaseOrder',
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
        description: 'The purchase order was successfully sent back for review',
      },
      400: {
        description: 'Invalid stage_role or user does not have permission',
      },
      404: {
        description: 'The purchase order was not found',
      },
    },
    'x-description-th': 'ส่งใบสั่งซื้อกลับไปยังขั้นตอนก่อนหน้าเพื่อแก้ไข เช่น ปรับเงื่อนไขผู้ขาย จำนวน หรือราคา ให้ผู้อนุมัติร้องขอการแก้ไขก่อนอนุมัติขั้นสุดท้าย',
  } as any)
  @ApiBody({
    type: ReviewPurchaseOrderSwaggerDto,
    description: 'Review purchase order payload',
    examples: {
      review: {
        value: EXAMPLE_REVIEW_PO,
        summary: 'Send PO back to previous stage for review',
      },
    },
  })
  @ApiResponse({ status: 200, description: 'The purchase order was successfully sent back for review', type: PurchaseOrderMutationResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid stage_role or user does not have permission' })
  @ApiResponse({ status: 404, description: 'The purchase order was not found' })
  @HttpCode(HttpStatus.OK)
  async review(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Body() data: ReviewPurchaseOrderDto,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'review',
        id,
        version,
      },
      PurchaseOrderController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseOrderService.review(
      id,
      { ...data },
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Cancel a purchase order that has not been fully received
   * ยกเลิกใบสั่งซื้อที่ยังไม่ได้รับสินค้าครบถ้วน
   * @param id - Purchase order ID / รหัสใบสั่งซื้อ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Cancelled purchase order / ใบสั่งซื้อที่ยกเลิกแล้ว
   */
  @Post(':id/cancel')
  @UseGuards(new AppIdGuard('purchaseOrder.cancel'))
  @Serialize(PurchaseOrderMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Cancel a purchase order',
    description:
      'Cancels a purchase order that has not been fully received, withdrawing the commitment to the vendor. Only draft, in-progress, or sent POs can be cancelled. Cancelled quantities are tracked on line items for reporting.',
    operationId: 'cancelPurchaseOrder',
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
        description: 'The purchase order was successfully cancelled',
      },
      400: {
        description: 'The purchase order cannot be cancelled due to invalid status',
      },
      404: {
        description: 'The purchase order was not found',
      },
    },
    'x-description-th': 'ยกเลิกใบสั่งซื้อที่ยังไม่ได้รับสินค้าครบถ้วน ถอนการสั่งซื้อจากผู้ขาย เฉพาะใบสั่งซื้อสถานะร่าง อยู่ระหว่างดำเนินการ หรือส่งแล้วเท่านั้นที่ยกเลิกได้',
  } as any)
  @ApiResponse({ status: 200, description: 'The purchase order was successfully cancelled', type: PurchaseOrderMutationResponseDto })
  @ApiResponse({ status: 400, description: 'The purchase order cannot be cancelled due to invalid status' })
  @ApiResponse({ status: 404, description: 'The purchase order was not found' })
  @HttpCode(HttpStatus.OK)
  async cancel(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'cancel',
        id,
        version,
      },
      PurchaseOrderController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseOrderService.cancel(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Close a purchase order after all goods have been received
   * ปิดใบสั่งซื้อหลังจากได้รับสินค้าครบถ้วนแล้ว
   * @param id - Purchase order ID / รหัสใบสั่งซื้อ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Closed purchase order / ใบสั่งซื้อที่ปิดแล้ว
   */
  @Post(':id/close')
  @UseGuards(new AppIdGuard('purchaseOrder.close'))
  @Serialize(PurchaseOrderMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Close a purchase order',
    description:
      'Finalizes a purchase order after all expected goods have been received or when no further deliveries are expected. Notifies the buyer and sends an email to the vendor. Unreceived quantities are recorded as cancelled for inventory and financial reconciliation.',
    operationId: 'closePurchaseOrder',
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
        description: 'The purchase order was successfully closed',
      },
      400: {
        description: 'The purchase order cannot be closed due to invalid status',
      },
      404: {
        description: 'The purchase order was not found',
      },
    },
    'x-description-th': 'ปิดใบสั่งซื้อหลังจากได้รับสินค้าครบถ้วนหรือไม่คาดว่าจะมีการส่งมอบเพิ่มเติม แจ้งผู้ซื้อและส่งอีเมลไปยังผู้ขาย จำนวนที่ยังไม่ได้รับจะถูกบันทึกเป็นยกเลิก',
  } as any)
  @ApiResponse({ status: 200, description: 'The purchase order was successfully closed', type: PurchaseOrderMutationResponseDto })
  @ApiResponse({ status: 400, description: 'The purchase order cannot be closed due to invalid status' })
  @ApiResponse({ status: 404, description: 'The purchase order was not found' })
  @HttpCode(HttpStatus.OK)
  async closePO(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'closePO',
        id,
        version,
      },
      PurchaseOrderController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseOrderService.closePO(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Preview grouping of PR line items into purchase orders by vendor
   * แสดงตัวอย่างการจัดกลุ่มรายการใบขอซื้อเป็นใบสั่งซื้อตามผู้ขาย
   * @param body - PR IDs to group / รหัสใบขอซื้อที่ต้องการจัดกลุ่ม
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Grouped purchase order preview / ตัวอย่างใบสั่งซื้อที่จัดกลุ่มแล้ว
   */
  @Post('group-pr')
  @UseGuards(new AppIdGuard('purchaseOrder.groupPr'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Group PR details for PO creation',
    description:
      'Previews how approved purchase request line items will be grouped into purchase orders by vendor, delivery date, and currency. Optionally accepts a workflow_id; if omitted, auto-resolves the default purchase_order_workflow. Used by purchasers to review the PO structure before confirming the conversion from PRs to POs.',
    operationId: 'groupPrForPo',
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
        description: 'PR details grouped successfully',
      },
      400: {
        description: 'Invalid request body or workflow_id format',
      },
      404: {
        description: 'Workflow not found',
      },
    },
    'x-description-th': 'แสดงตัวอย่างการจัดกลุ่มรายการใบขอซื้อที่อนุมัติแล้วเป็นใบสั่งซื้อตามผู้ขาย วันส่งมอบ และสกุลเงิน ใช้โดยผู้จัดซื้อเพื่อตรวจสอบโครงสร้างใบสั่งซื้อก่อนยืนยัน',
  } as any)
  @ApiBody({
    type: GroupPrForPoSwaggerDto,
    examples: {
      group: {
        summary: 'Group PRs by vendor for PO creation',
        value: EXAMPLE_GROUP_PR_FOR_PO,
      },
    },
  })
  @ApiResponse({ status: 200, description: 'PR details grouped successfully', type: GroupPrForPoResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid request body or workflow_id format' })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  @HttpCode(HttpStatus.OK)
  async groupPrForPo(
    @Body() body: { workflow_id?: string; pr_ids: string[] },
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'groupPrForPo',
        workflow_id: body.workflow_id,
        pr_ids: body.pr_ids,
        version,
      },
      PurchaseOrderController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseOrderService.groupPrForPo(
      body.pr_ids,
      user_id,
      bu_code,
      version,
      body.workflow_id,
    );
    this.respond(res, result);
  }

  /**
   * Convert approved purchase requests into purchase orders
   * แปลงใบขอซื้อที่อนุมัติแล้วเป็นใบสั่งซื้อ
   * @param body - PR IDs to confirm / รหัสใบขอซื้อที่ต้องการยืนยัน
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Created purchase orders / ใบสั่งซื้อที่สร้างจากใบขอซื้อ
   */
  @Post('confirm-pr')
  @UseGuards(new AppIdGuard('purchaseOrder.confirmPr'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Confirm PR and create PO(s)',
    description:
      'Converts approved purchase requests into purchase orders by grouping PR line items by vendor, delivery date, and currency. Optionally accepts a workflow_id; if omitted, auto-resolves the default purchase_order_workflow. Created POs are linked to the resolved workflow.',
    operationId: 'confirmPrToPo',
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
      201: {
        description: 'Purchase Orders created successfully from PRs',
      },
      400: {
        description: 'Invalid request body or workflow_id format',
      },
      404: {
        description: 'Workflow not found',
      },
    },
    'x-description-th': 'แปลงใบขอซื้อที่อนุมัติแล้วเป็นใบสั่งซื้อ โดยจัดกลุ่มรายการตามผู้ขาย วันส่งมอบ และสกุลเงิน ใบสั่งซื้อที่สร้างจะเชื่อมโยงกับขั้นตอนการทำงานที่กำหนด',
  } as any)
  @ApiBody({
    type: ConfirmPrToPoSwaggerDto,
    examples: {
      confirm: {
        summary: 'Confirm PRs and create POs',
        value: EXAMPLE_CONFIRM_PR_TO_PO,
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Purchase Orders created successfully from PRs', type: ConfirmPrToPoResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid request body or workflow_id format' })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  @HttpCode(HttpStatus.CREATED)
  async confirmPrToPo(
    @Body() body: { workflow_id?: string; pr_ids: string[] },
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'confirmPrToPo',
        workflow_id: body.workflow_id,
        pr_ids: body.pr_ids,
        version,
      },
      PurchaseOrderController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseOrderService.confirmPrToPo(
      body.pr_ids,
      user_id,
      bu_code,
      version,
      body.workflow_id,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Export a purchase order to an Excel spreadsheet
   * ส่งออกใบสั่งซื้อเป็นไฟล์ Excel
   * @param id - Purchase order ID / รหัสใบสั่งซื้อ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Excel file buffer and filename / บัฟเฟอร์ไฟล์ Excel และชื่อไฟล์
   */
  @Get(':id/export')
  @UseGuards(new AppIdGuard('purchaseOrder.export'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Export a purchase order to Excel',
    description: 'Generates an Excel spreadsheet of the purchase order with vendor details, all line items, pricing, and delivery information. Used for record-keeping, sharing with finance, or sending to vendors who require spreadsheet formats.',
    operationId: 'exportPurchaseOrder',
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
        description: 'Purchase order ID',
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
        description: 'The purchase order was not found',
      },
    },
    'x-description-th': 'ส่งออกใบสั่งซื้อเป็นไฟล์ Excel พร้อมข้อมูลผู้ขาย รายการสินค้าทั้งหมด ราคา และข้อมูลการจัดส่ง สำหรับเก็บบันทึก แชร์กับฝ่ายการเงิน หรือส่งให้ผู้ขาย',
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
      PurchaseOrderController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseOrderService.exportToExcel(id, user_id, bu_code, version);

    if (!result.isOk()) {
      this.respond(res, result);
      return;
    }

    const { buffer, filename } = result.value;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  }

  /**
   * Generate a printable PDF of the purchase order
   * สร้างไฟล์ PDF สำหรับพิมพ์ใบสั่งซื้อ
   * @param id - Purchase order ID / รหัสใบสั่งซื้อ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns PDF file buffer and filename / บัฟเฟอร์ไฟล์ PDF และชื่อไฟล์
   */
  @Get(':id/print')
  @UseGuards(new AppIdGuard('purchaseOrder.print'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Print a purchase order to PDF',
    description: 'Generates a printable PDF of the purchase order for sending to the vendor, obtaining physical signatures, or filing. Includes vendor details, line items, totals, terms, and approval signatures.',
    operationId: 'printPurchaseOrder',
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
        description: 'Purchase order ID',
      },
    ],
    responses: {
      200: {
        description: 'PDF file download',
        content: {
          'application/pdf': {
            schema: {
              type: 'string',
              format: 'binary',
            },
          },
        },
      },
      404: {
        description: 'The purchase order was not found',
      },
    },
    'x-description-th': 'พิมพ์ใบสั่งซื้อเป็นไฟล์ PDF สำหรับส่งให้ผู้ขาย ลงนามจริง หรือจัดเก็บเอกสาร รวมถึงข้อมูลผู้ขาย รายการสินค้า ยอดรวม เงื่อนไข และลายเซ็นอนุมัติ',
  } as any)
  @HttpCode(HttpStatus.OK)
  async printToPdf(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'printToPdf',
        id,
        version,
      },
      PurchaseOrderController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseOrderService.printToPdf(id, user_id, bu_code, version);

    if (!result.isOk()) {
      this.respond(res, result);
      return;
    }

    const { buffer, filename } = result.value;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  }

  // ==================== Purchase Order Detail CRUD ====================

  /**
   * List all line items on a purchase order
   * ค้นหารายการทั้งหมดของรายละเอียดใบสั่งซื้อ
   * @param id - Purchase order ID / รหัสใบสั่งซื้อ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns List of purchase order details / รายการรายละเอียดใบสั่งซื้อ
   */
  @Get(':id/details')
  @UseGuards(new AppIdGuard('purchaseOrder.findOne'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get all details for a purchase order',
    description: 'Lists all line items on a purchase order including product details, ordered quantities, unit prices, and received quantities. Used to review what has been ordered and track partial deliveries.',
    operationId: 'findAllPurchaseOrderDetails',
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Purchase order ID' },
    ],
    responses: {
      200: { description: 'The purchase order details were successfully retrieved' },
      404: { description: 'The purchase order was not found' },
    },
    'x-description-th': 'แสดงรายการทั้งหมดของใบสั่งซื้อ รวมถึงรายละเอียดสินค้า จำนวนที่สั่ง ราคาต่อหน่วย และจำนวนที่รับแล้ว สำหรับตรวจสอบการสั่งซื้อและติดตามการรับสินค้า',
  } as any)
  @ApiResponse({ status: 200, description: 'The purchase order details were successfully retrieved', type: [PurchaseOrderDetailItemResponseDto] })
  @ApiResponse({ status: 404, description: 'The purchase order was not found' })
  @HttpCode(HttpStatus.OK)
  async findAllDetails(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'findAllDetails', id, version },
      PurchaseOrderController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseOrderService.findDetailsByPurchaseOrderId(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Retrieve a single line item from a purchase order by detail ID
   * ค้นหารายการเดียวตาม ID ของรายละเอียดใบสั่งซื้อ
   * @param id - Purchase order ID / รหัสใบสั่งซื้อ
   * @param detailId - Detail line item ID / รหัสรายการรายละเอียด
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Purchase order detail / รายละเอียดรายการใบสั่งซื้อ
   */
  @Get(':id/details/:detail_id')
  @UseGuards(new AppIdGuard('purchaseOrder.findOne'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get a single purchase order detail by ID',
    description: 'Retrieves a single line item from a purchase order with full product, pricing, and delivery details. Used to inspect a specific item when creating a Good Received Note or resolving discrepancies.',
    operationId: 'findOnePurchaseOrderDetail',
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Purchase order ID' },
      { name: 'detail_id', in: 'path', required: true, description: 'Detail ID' },
    ],
    responses: {
      200: { description: 'The purchase order detail was successfully retrieved' },
      404: { description: 'The purchase order detail was not found' },
    },
    'x-description-th': 'ดึงรายการเดียวจากใบสั่งซื้อพร้อมรายละเอียดสินค้า ราคา และการจัดส่ง ใช้สำหรับตรวจสอบรายการเฉพาะเมื่อสร้างใบรับสินค้าหรือแก้ไขความคลาดเคลื่อน',
  } as any)
  @ApiResponse({ status: 200, description: 'The purchase order detail was successfully retrieved', type: PurchaseOrderDetailItemResponseDto })
  @ApiResponse({ status: 404, description: 'The purchase order detail was not found' })
  @HttpCode(HttpStatus.OK)
  async findOneDetail(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('detail_id', new ParseUUIDPipe({ version: '4' })) detailId: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'findOneDetail', id, detailId, version },
      PurchaseOrderController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseOrderService.findDetailById(detailId, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Remove a line item from a draft purchase order
   * ลบรายการจากใบสั่งซื้อฉบับร่าง
   * @param id - Purchase order ID / รหัสใบสั่งซื้อ
   * @param detailId - Detail line item ID / รหัสรายการรายละเอียด
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @Delete(':id/details/:detail_id')
  @UseGuards(new AppIdGuard('purchaseOrder.update'))
  @Serialize(PurchaseOrderMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Delete a purchase order detail',
    description: 'Removes a line item from a draft purchase order before it is sent to the vendor. Used when an item is no longer needed or was added in error.',
    operationId: 'deletePurchaseOrderDetail',
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Purchase order ID' },
      { name: 'detail_id', in: 'path', required: true, description: 'Detail ID' },
    ],
    responses: {
      200: { description: 'The purchase order detail was successfully deleted' },
      400: { description: 'Purchase order is not in draft status' },
      404: { description: 'The purchase order detail was not found' },
    },
    'x-description-th': 'ลบรายการจากใบสั่งซื้อฉบับร่างก่อนส่งให้ผู้ขาย ใช้เมื่อรายการไม่จำเป็นแล้วหรือเพิ่มผิดพลาด',
  } as any)
  @ApiResponse({ status: 200, description: 'The purchase order detail was successfully deleted', type: PurchaseOrderMutationResponseDto })
  @ApiResponse({ status: 400, description: 'Purchase order is not in draft status' })
  @ApiResponse({ status: 404, description: 'The purchase order detail was not found' })
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
      PurchaseOrderController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseOrderService.deleteDetail(detailId, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Print a purchase order via FastReport viewer (micro-report)
   * พิมพ์ใบสั่งซื้อผ่าน FastReport viewer (micro-report)
   */
  @Get(':id/print-viewer')
  @UseGuards(new AppIdGuard('purchaseOrder.print'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Print purchase order via FastReport viewer',
    description:
      'Sends PO data + signature config to micro-report which generates FastReport XML and returns a viewer URL.',
    operationId: 'printPurchaseOrderViewer',
    'x-description-th': 'ส่งข้อมูล PO + signature ไป micro-report เพื่อสร้าง FastReport XML แล้วคืน viewer URL',
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
      PurchaseOrderController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseOrderService.printToReport(id, user_id, bu_code);
    this.respond(res, result);
  }
}
