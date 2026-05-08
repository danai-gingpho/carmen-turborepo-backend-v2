import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Body,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  Patch,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { PurchaseRequestService } from './purchase-request.service';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import {
  IPaginateQuery,
  PaginateQuery,
} from 'src/shared-dto/paginate.dto';
import { EXAMPLE_PURCHASE_REQUEST } from './example/purchase-request.example';
import { EXAMPLE_APPROVE_BY_APPROVE_ROLE, EXAMPLE_APPROVE_BY_PURCHASE_ROLE } from './example/approve-purchase-request.example';
import {
  BaseHttpController,
  Serialize,
  PurchaseRequestDetailResponseSchema,
  PurchaseRequestListItemResponseSchema,
  PurchaseRequestMutationResponseSchema,
  CreatePurchaseRequestDto,
  // IGetAllResponse,
  // IPurchaseRequest,
  ReviewPurchaseRequestDto,
  RejectPurchaseRequestDto,
  SubmitPurchaseRequestDto
} from '@/common';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApproveByStageRoleDto2, SwipeApprovePurchaseRequestDto, SwipeRejectPurchaseRequestDto } from './dto/state-change.dto';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { Permission } from 'src/auth/decorators/permission.decorator';
import { PermissionGuard } from 'src/auth/guards/permission.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import { CalculatePurchaseRequestDetail } from './dto/CalculatePurchaseRequestDetail.dto';
import {
  DuplicatePurchaseRequestSwaggerDto,
  SplitPurchaseRequestSwaggerDto,
  SubmitPurchaseRequestSwaggerDto,
  RejectPurchaseRequestSwaggerDto,
  ReviewPurchaseRequestSwaggerDto,
  UpdatePurchaseRequestSwaggerDto,
  CalculatePurchaseRequestDetailSwaggerDto,
  SwipeApprovePurchaseRequestSwaggerDto,
  SwipeRejectPurchaseRequestSwaggerDto,
} from './swagger/request';
import { SwipeResultResponseDto } from './swagger/response';

@Controller('api')
@ApiTags('Procurement: Purchase Requests')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard, PermissionGuard)
@ApiBearerAuth()
export class PurchaseRequestController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    PurchaseRequestController.name,
  );

  constructor(
    private readonly purchaseRequestService: PurchaseRequestService,
  ) {
    super();
  }

  /**
   * List approved purchase requests available for PO creation
   * ค้นหาใบขอซื้อที่อนุมัติแล้วสำหรับสร้างใบสั่งซื้อ
   * @param query - Pagination and filter parameters / พารามิเตอร์การแบ่งหน้าและตัวกรอง
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated list of approved purchase requests / รายการใบขอซื้อที่อนุมัติแบบแบ่งหน้า
   */
  @Get(':bu_code/purchase-request/for-po')
  @UseGuards(new AppIdGuard('purchaseRequest.findAll'))
  @Serialize(PurchaseRequestListItemResponseSchema)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiOperation({
    summary: 'Get approved purchase requests for PO creation',
    description: 'Lists all purchase requests with approved status that are available for creating purchase orders. Used by purchasers to select which approved PRs to convert into POs.',
    operationId: 'findAllApprovedPurchaseRequestsForPo',
    responses: {
      200: { description: 'Approved purchase requests retrieved successfully' },
    },
    'x-description-th': 'แสดงรายการใบขอซื้อที่อนุมัติแล้วทั้งหมดที่พร้อมสำหรับสร้างใบสั่งซื้อ ใช้โดยผู้จัดซื้อเพื่อเลือกใบขอซื้อที่จะแปลงเป็นใบสั่งซื้อ',
  } as any)
  @HttpCode(HttpStatus.OK)
  async findAllForPo(
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAllForPo',
        query,
        version,
      },
      PurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.purchaseRequestService.findAllByStatus(
      'approved',
      user_id,
      bu_code,
      paginate,
      version,
      { excludeWorkflowHistory: true },
    );
    this.respond(res, result);
  }

  /**
   * List all purchase requests with pagination and filtering
   * ค้นหารายการทั้งหมดของใบขอซื้อพร้อมการแบ่งหน้าและตัวกรอง
   * @param query - Pagination and filter parameters / พารามิเตอร์การแบ่งหน้าและตัวกรอง
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated list of purchase requests / รายการใบขอซื้อแบบแบ่งหน้า
   */
  @Get('purchase-request')
  @Permission({ 'procurement.purchase_request': ['view'] })
  @UseGuards(new AppIdGuard('purchaseRequest.findAll'))
  @Serialize(PurchaseRequestListItemResponseSchema)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all purchase requests',
    description: 'Lists all purchase requests for the current user across business units, filtered by status, search term, and pagination. Used by department staff and approvers to view and track PR documents in the procurement workflow.',
    operationId: 'findAllPurchaseRequests',
    deprecated: false,
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
      },
      {
        name: 'page',
        in: 'query',
        required: false,
      },
      {
        name: 'perpage',
        in: 'query',
        required: false,
      },
      {
        name: 'search',
        in: 'query',
        required: false,
      },
    ],
    responses: {
      200: {
        description: 'The purchase requests were successfully retrieved',
      },
      404: {
        description: 'The purchase requests were not found',
      },
    },
    'x-description-th': 'แสดงรายการใบขอซื้อทั้งหมดของผู้ใช้ปัจจุบัน พร้อมการแบ่งหน้า ค้นหา และกรองตามสถานะ ใช้สำหรับเจ้าหน้าที่แผนกและผู้อนุมัติในการดูและติดตามเอกสารใบขอซื้อ',
  } as any)
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAll',
        query,
        version,
      },
      PurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const buDatasHeader = req.headers['x-bu-datas'] as string;
    const userData: {
      bu_id: string;
      bu_code: string;
      role: string;
      permissions: Record<string, string[]>;
    } = buDatasHeader ? JSON.parse(buDatasHeader) : {};

    if (paginate?.bu_code.length === 0) {
      throw new BadRequestException('bu_code is required');
    }

    const result = await this.purchaseRequestService.findAll(
      user_id,
      paginate.bu_code,
      paginate,
      userData,
      version,
    );

    this.respond(res, result);
  }

  /**
   * Retrieve all workflow stages for purchase requests in a business unit
   * ค้นหารายการทั้งหมดของขั้นตอนเวิร์กโฟลว์สำหรับใบขอซื้อในหน่วยธุรกิจ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns List of workflow stages / รายการขั้นตอนเวิร์กโฟลว์
   */
  @Get(':bu_code/purchase-request/workflow-stages')
  @Permission({ 'procurement.purchase_request': ['view'] })
  @UseGuards(new AppIdGuard('purchaseRequest.findAll'))
  @ApiVersionMinRequest()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all workflow stages by purchase request',
    description: 'Returns the configured approval workflow stages (e.g., HOD, Purchaser, FC, GM) for purchase requests in this business unit. Used to display workflow progress and determine which approval steps a PR must pass through.',
    operationId: 'findAllWorkflowStagesByPr',
    deprecated: false,
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
      },
      {
        name: 'page',
        in: 'query',
        required: false,
      },
      {
        name: 'perpage',
        in: 'query',
        required: false,
      },
      {
        name: 'search',
        in: 'query',
        required: false,
      },
    ],
    responses: {
      200: {
        description: 'The workflow stages were successfully retrieved',
      },
      404: {
        description: 'The workflow stages were not found',
      },
    },
    'x-description-th': 'แสดงขั้นตอนเวิร์กโฟลว์การอนุมัติที่กำหนดค่าไว้ (เช่น HOD, ผู้จัดซื้อ, FC, GM) สำหรับใบขอซื้อในหน่วยธุรกิจนี้ ใช้เพื่อแสดงความคืบหน้าของเวิร์กโฟลว์',
  } as any)
  @HttpCode(HttpStatus.OK)
  async findAllWorkflowStagesByPr(
    @Req() req: Request,
    @Res() res: Response,
    @Query('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAllWorkflowStagesByPr',
        version,
      },
      PurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);

    const result = await this.purchaseRequestService.findAllWorkflowStagesByPr(
      user_id,
      bu_code,
      version,
    );

    this.respond(res, result);
  }

  /**
   * Get previous workflow stages for a purchase request
   * ดึงขั้นตอนอนุมัติก่อนหน้า current_stage ของใบขอซื้อ
   * @param pr_id - Purchase request ID / รหัสใบขอซื้อ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Previous workflow stages / ขั้นตอนการทำงานก่อนหน้า
   */
  @Get(':bu_code/purchase-request/:pr_id/previous-stages')
  @UseGuards(new AppIdGuard('purchaseRequest.findOne'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get previous workflow stages by PR ID',
    description:
      'Retrieves all workflow stages before the current stage of a purchase request. Used to determine revert/return-to options in the approval chain.',
    operationId: 'getPreviousStagesByPrId',
    responses: {
      200: { description: 'Previous stages retrieved successfully' },
      404: { description: 'Purchase request not found or no workflow assigned' },
    },
    'x-description-th': 'ดึงขั้นตอนเวิร์กโฟลว์ทั้งหมดก่อนขั้นตอนปัจจุบันของใบขอซื้อ ใช้เพื่อกำหนดตัวเลือกการย้อนกลับ/ส่งคืนในสายการอนุมัติ',
  } as any)
  async getPreviousStagesByPrId(
    @Param('pr_id', new ParseUUIDPipe({ version: '4' })) pr_id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'getPreviousStagesByPrId', pr_id, version },
      PurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseRequestService.getPreviousStages(
      pr_id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Retrieve a purchase request by ID with full details
   * ค้นหารายการเดียวตาม ID ของใบขอซื้อพร้อมรายละเอียดทั้งหมด
   * @param id - Purchase request ID / รหัสใบขอซื้อ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Purchase request details / รายละเอียดใบขอซื้อ
   */
  @Get(':bu_code/purchase-request/:id')
  @UseGuards(new AppIdGuard('purchaseRequest.findOne'))
  @Serialize(PurchaseRequestDetailResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get a purchase request by ID',
    description: 'Retrieves the full details of a specific purchase request including all line items, quantities, pricing, and current approval status. Used to review PR contents before approving, rejecting, or converting to a purchase order.',
    operationId: 'findOnePurchaseRequest',
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
        description: 'The purchase request was successfully retrieved',
      },
      404: {
        description: 'The purchase request was not found',
      },
    },
    'x-description-th': 'ดึงรายละเอียดทั้งหมดของใบขอซื้อตาม ID รวมถึงรายการสินค้า จำนวน ราคา และสถานะการอนุมัติปัจจุบัน',
  } as any)
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('bu_code') bu_code: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
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
      PurchaseRequestController.name,
    );
    const buDatasHeader = req.headers['x-bu-datas'] as string;
    const userDatas: {
      bu_id: string;
      bu_code: string;
      role: string;
      permissions: Record<string, string[]>;
    }[] = buDatasHeader ? JSON.parse(buDatasHeader) : [];

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseRequestService.findById(
      id,
      user_id,
      bu_code,
      userDatas[0],
      version,
    );
    this.respond(res, result);
  }


  /**
   * Filter purchase requests by workflow status
   * ค้นหาใบขอซื้อตามสถานะเวิร์กโฟลว์
   * @param status - Workflow status filter / ตัวกรองสถานะเวิร์กโฟลว์
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Filtered list of purchase requests / รายการใบขอซื้อที่กรองแล้ว
   */
  @Get(':bu_code/purchase-request/:id/status/:status')
  @UseGuards(new AppIdGuard('purchaseRequest.approval'))
  @Serialize(PurchaseRequestListItemResponseSchema)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiOperation({
    summary: 'Get purchase requests by status',
    description: 'Filters purchase requests by a specific workflow status (e.g., draft, pending, approved, rejected). Used by approvers and managers to view PRs at a particular stage of the approval workflow.',
    operationId: 'findAllPurchaseRequestsByStatus',
    'x-description-th': 'กรองใบขอซื้อตามสถานะเวิร์กโฟลว์ที่กำหนด (เช่น draft, pending, approved, rejected) ใช้โดยผู้อนุมัติและผู้จัดการเพื่อดูใบขอซื้อในขั้นตอนเฉพาะ',
  } as any)
  @HttpCode(HttpStatus.OK)
  async findAllByStatus(
    @Param('status') status: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAllByStatus',
        status,
        version,
      },
      PurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.purchaseRequestService.findAllByStatus(
      status,
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Create a new purchase request for a department
   * สร้างใบขอซื้อใหม่สำหรับแผนก
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param createDto - Purchase request creation data / ข้อมูลสำหรับสร้างใบขอซื้อ
   * @param version - API version / เวอร์ชัน API
   * @returns Created purchase request / ใบขอซื้อที่สร้างแล้ว
   */
  @Post(':bu_code/purchase-request')
  @UseGuards(new AppIdGuard('purchaseRequest.create'))
  @Serialize(PurchaseRequestMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a purchase request',
    description: 'Creates a new purchase request for a department to request items or services they need. The PR starts in draft status and includes line items with product details, quantities, and estimated costs. Once created, it can be submitted for approval through the configured workflow.',
    operationId: 'createPurchaseRequest',
    deprecated: false,
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
      },
    ],
    responses: {
      201: {
        description: 'The purchase request was successfully created',
      },
      400: {
        description: 'Invalid request body',
      },
      401: {
        description: 'Unauthorized',
      },
    },
    'x-description-th': 'สร้างใบขอซื้อใหม่สำหรับแผนกเพื่อขอสินค้าหรือบริการที่ต้องการ เริ่มต้นในสถานะฉบับร่างและสามารถส่งเข้าสู่เวิร์กโฟลว์การอนุมัติได้',
  } as any)
  @ApiBody({
    type: CreatePurchaseRequestDto || String || Object,
    description: 'Purchase request data',
    examples: {
      example1: {
        value: EXAMPLE_PURCHASE_REQUEST,
        summary: 'Sample purchase request',
      }
    },
  })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('bu_code') bu_code: string,
    @Body() createDto: CreatePurchaseRequestDto,
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
      PurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);

    const result = await this.purchaseRequestService.create(
      createDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Duplicate one or more existing purchase requests
   * ทำสำเนาใบขอซื้อที่มีอยู่หนึ่งรายการขึ้นไป
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param body - IDs of purchase requests to duplicate / รหัสใบขอซื้อที่ต้องการทำสำเนา
   * @param version - API version / เวอร์ชัน API
   * @returns Duplicated purchase requests / ใบขอซื้อที่ทำสำเนาแล้ว
   */
  @Post(':bu_code/purchase-request/duplicate-pr')
  @UseGuards(new AppIdGuard('purchaseRequest.duplicatePr'))
  @Serialize(PurchaseRequestMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Duplicate purchase requests',
    description: 'Creates copies of one or more existing purchase requests, preserving their line items and details. Useful for recurring procurement needs where departments regularly order the same items.',
    operationId: 'duplicatePurchaseRequests',
    'x-description-th': 'ทำสำเนาใบขอซื้อที่มีอยู่หนึ่งรายการขึ้นไป โดยคงรายการสินค้าและรายละเอียดไว้ เหมาะสำหรับการจัดซื้อซ้ำที่แผนกสั่งสินค้าเดิมเป็นประจำ',
  } as any)
  @ApiBody({ type: DuplicatePurchaseRequestSwaggerDto })
  @HttpCode(HttpStatus.CREATED)
  async duplicatePr(
    @Param('bu_code') bu_code: string,
    @Body() body: { ids: string[] },
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'duplicatePr',
        body,
        version,
      },
      PurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseRequestService.duplicatePr(body, user_id, bu_code, version);
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Split selected line items into a new purchase request
   * แยกรายการที่เลือกออกเป็นใบขอซื้อใหม่
   * @param id - Original purchase request ID / รหัสใบขอซื้อต้นฉบับ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param body - Detail IDs to split / รหัสรายละเอียดที่ต้องการแยก
   * @param version - API version / เวอร์ชัน API
   * @returns Split result with new purchase request / ผลลัพธ์การแยกพร้อมใบขอซื้อใหม่
   */
  @Post(':bu_code/purchase-request/:id/split')
  @UseGuards(new AppIdGuard('purchaseRequest.split'))
  @Serialize(PurchaseRequestMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Split purchase request',
    description: 'Moves selected line items from an existing purchase request into a new separate PR, preserving the original workflow status. Used when a purchaser needs to separate items for different vendors or delivery timelines.',
    operationId: 'splitPurchaseRequest',
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Original purchase request ID' },
      { name: 'bu_code', in: 'path', required: true, description: 'Business unit code' },
    ],
    responses: {
      200: {
        description: 'The purchase request was successfully split',
      },
      400: {
        description: 'Invalid request - no valid detail IDs or cannot split all details',
      },
      404: {
        description: 'The purchase request was not found',
      },
    },
    'x-description-th': 'แยกรายการที่เลือกจากใบขอซื้อที่มีอยู่ออกเป็นใบขอซื้อใหม่ ใช้เมื่อผู้จัดซื้อต้องการแยกสินค้าสำหรับผู้ขายหรือกำหนดการส่งที่แตกต่างกัน',
  } as any)
  @ApiBody({ type: SplitPurchaseRequestSwaggerDto })
  @HttpCode(HttpStatus.OK)
  async splitPr(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Body() body: { detail_ids: string[] },
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'splitPr',
        id,
        body,
        version,
      },
      PurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseRequestService.splitPr(id, body, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Submit a draft purchase request into the approval workflow
   * ส่งใบขอซื้อฉบับร่างเข้าสู่เวิร์กโฟลว์การอนุมัติ
   * @param id - Purchase request ID / รหัสใบขอซื้อ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param payload - Submit payload / ข้อมูลการส่ง
   * @param version - API version / เวอร์ชัน API
   * @returns Submitted purchase request / ใบขอซื้อที่ส่งแล้ว
   */
  @Patch(':bu_code/purchase-request/:id/submit')
  @UseGuards(new AppIdGuard('purchaseRequest.submit'))
  @Serialize(PurchaseRequestMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Submit a purchase request',
    description: 'Submits a draft purchase request into the approval workflow, making it available for review by the next approver (e.g., HOD). Once submitted, the PR moves from draft to pending status and can no longer be freely edited.',
    operationId: 'submitPurchaseRequest',
    'x-description-th': 'ส่งใบขอซื้อฉบับร่างเข้าสู่เวิร์กโฟลว์การอนุมัติ เมื่อส่งแล้วสถานะจะเปลี่ยนจากฉบับร่างเป็นรอดำเนินการ และไม่สามารถแก้ไขได้อย่างอิสระอีกต่อไป',
  } as any)
  @ApiBody({ type: SubmitPurchaseRequestSwaggerDto })
  @HttpCode(HttpStatus.OK)
  async submit(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Body() payload: SubmitPurchaseRequestDto,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'submit',
        id,
        version,
      },
      PurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseRequestService.submit(id, payload, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Swipe approve multiple purchase requests
   * อนุมัติใบขอซื้อแบบรวดเร็วหลายรายการ
   */
  @Post(':bu_code/purchase-request/swipe-approve')
  @UseGuards(new AppIdGuard('purchaseRequest.approve'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Swipe approve multiple purchase requests',
    description: 'Quickly approve multiple purchase requests at once. Only works for approval roles (HOD, FC, GM). Purchase role cannot use this endpoint. The user must be an action user for each PR.',
    operationId: 'swipeApprovePurchaseRequests',
    'x-description-th': 'อนุมัติใบขอซื้อแบบรวดเร็วหลายรายการ ใช้ได้เฉพาะผู้อนุมัติ (HOD, FC, GM)',
  } as any)
  @ApiBody({ type: SwipeApprovePurchaseRequestSwaggerDto })
  @ApiResponse({ status: 200, description: 'Swipe approve results', type: SwipeResultResponseDto })
  @HttpCode(HttpStatus.OK)
  async swipeApprove(
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: SwipeApprovePurchaseRequestDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'swipeApprove', body, version },
      PurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseRequestService.swipeApprove(body.pr_ids, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Swipe reject multiple purchase requests
   * ปฏิเสธใบขอซื้อแบบรวดเร็วหลายรายการ
   */
  @Post(':bu_code/purchase-request/swipe-reject')
  @UseGuards(new AppIdGuard('purchaseRequest.approve'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Swipe reject multiple purchase requests',
    description: 'Quickly reject multiple purchase requests at once with a shared reject message. Only works for approval roles (HOD, FC, GM). Purchase role cannot use this endpoint.',
    operationId: 'swipeRejectPurchaseRequests',
    'x-description-th': 'ปฏิเสธใบขอซื้อแบบรวดเร็วหลายรายการพร้อมเหตุผล',
  } as any)
  @ApiBody({ type: SwipeRejectPurchaseRequestSwaggerDto })
  @ApiResponse({ status: 200, description: 'Swipe reject results', type: SwipeResultResponseDto })
  @HttpCode(HttpStatus.OK)
  async swipeReject(
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: SwipeRejectPurchaseRequestDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'swipeReject', body, version },
      PurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseRequestService.swipeReject(body.pr_ids, body.reject_message, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Approve a purchase request at the current workflow stage
   * อนุมัติใบขอซื้อในขั้นตอนปัจจุบันของเวิร์กโฟลว์
   * @param id - Purchase request ID / รหัสใบขอซื้อ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param payload - Approval payload / ข้อมูลการอนุมัติ
   * @param version - API version / เวอร์ชัน API
   * @returns Approved purchase request / ใบขอซื้อที่อนุมัติแล้ว
   */
  @Patch(':bu_code/purchase-request/:id/approve')
  @UseGuards(new AppIdGuard('purchaseRequest.approve'))
  @Serialize(PurchaseRequestMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Approve a purchase request',
    description: 'Advances a purchase request through the approval workflow at the current stage. Approval roles (HOD, FC, GM) confirm the request, while the purchase role adds vendor selection, price list, tax, and discount details to prepare the PR for conversion into a purchase order.',
    operationId: 'approvePurchaseRequest',
    'x-description-th': 'อนุมัติใบขอซื้อในขั้นตอนปัจจุบันของเวิร์กโฟลว์ ผู้อนุมัติ (HOD, FC, GM) ยืนยันคำขอ ในขณะที่ผู้จัดซื้อเพิ่มข้อมูลผู้ขาย ราคา ภาษี และส่วนลด',
  } as any)
  @ApiBody({
    description: 'Approve purchase request payload. Use stage_role to determine which role is approving.',
    examples: {
      'Approve Role': {
        summary: 'Approve by approve role',
        value: EXAMPLE_APPROVE_BY_APPROVE_ROLE,
      },
      'Purchase Role': {
        summary: 'Approve by purchase role (with pricelist_type, vendor, tax, discount)',
        value: EXAMPLE_APPROVE_BY_PURCHASE_ROLE,
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async approve(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Body() payload: ApproveByStageRoleDto2,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'approve',
        id,
        version,
      },
      PurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseRequestService.approve(id, payload, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Reject a purchase request at the current approval stage
   * ปฏิเสธใบขอซื้อในขั้นตอนการอนุมัติปัจจุบัน
   * @param id - Purchase request ID / รหัสใบขอซื้อ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param payload - Rejection payload with reason / ข้อมูลการปฏิเสธพร้อมเหตุผล
   * @param version - API version / เวอร์ชัน API
   * @returns Rejected purchase request / ใบขอซื้อที่ถูกปฏิเสธ
   */
  @Patch(':bu_code/purchase-request/:id/reject')
  @UseGuards(new AppIdGuard('purchaseRequest.reject'))
  @Serialize(PurchaseRequestMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Reject a purchase request',
    description: 'Rejects a purchase request at the current approval stage, returning it to the requester with a reason. Used by approvers (HOD, Purchaser, FC, GM) when the request does not meet requirements or budget constraints.',
    operationId: 'rejectPurchaseRequest',
    'x-description-th': 'ปฏิเสธใบขอซื้อในขั้นตอนการอนุมัติปัจจุบัน และส่งกลับไปยังผู้ขอพร้อมเหตุผล ใช้โดยผู้อนุมัติเมื่อคำขอไม่ตรงตามข้อกำหนดหรือข้อจำกัดงบประมาณ',
  } as any)
  @ApiBody({ type: RejectPurchaseRequestSwaggerDto })
  @HttpCode(HttpStatus.OK)
  async reject(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Body() payload: RejectPurchaseRequestDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'approve',
        id,
        payload,
        version,
      },
      PurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseRequestService.reject(id, payload, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Send a purchase request back for review and corrections
   * ส่งใบขอซื้อกลับเพื่อตรวจสอบและแก้ไข
   * @param id - Purchase request ID / รหัสใบขอซื้อ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param payload - Review payload / ข้อมูลการตรวจสอบ
   * @param version - API version / เวอร์ชัน API
   * @returns Reviewed purchase request / ใบขอซื้อที่ส่งกลับตรวจสอบ
   */
  @Patch(':bu_code/purchase-request/:id/review')
  @UseGuards(new AppIdGuard('purchaseRequest.review'))
  @Serialize(PurchaseRequestMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Review a purchase request',
    description: 'Sends a purchase request back to a previous workflow stage for corrections or additional information. Used by approvers who need the requester or a prior approver to revise the PR before it can proceed.',
    operationId: 'reviewPurchaseRequest',
    'x-description-th': 'ส่งใบขอซื้อกลับไปยังขั้นตอนก่อนหน้าของเวิร์กโฟลว์เพื่อแก้ไขหรือขอข้อมูลเพิ่มเติม ใช้โดยผู้อนุมัติที่ต้องการให้ผู้ขอปรับปรุงใบขอซื้อ',
  } as any)
  @ApiBody({ type: ReviewPurchaseRequestSwaggerDto })
  @HttpCode(HttpStatus.OK)
  async review(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Body() payload: ReviewPurchaseRequestDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'approve',
        id,
        version,
      },
      PurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseRequestService.review(id, payload, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Save changes to a purchase request before submission
   * บันทึกการเปลี่ยนแปลงใบขอซื้อก่อนการส่ง
   * @param id - Purchase request ID / รหัสใบขอซื้อ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param updateDto - Updated data / ข้อมูลที่อัปเดต
   * @param version - API version / เวอร์ชัน API
   * @returns Updated purchase request / ใบขอซื้อที่อัปเดตแล้ว
   */
  @Patch(':bu_code/purchase-request/:id/save')
  @UseGuards(new AppIdGuard('purchaseRequest.update'))
  @Serialize(PurchaseRequestMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Update a purchase request',
    description: 'Saves changes to a purchase request including header information and line item modifications. Used to update quantities, add or remove items, or adjust details before submitting the PR for approval.',
    operationId: 'updatePurchaseRequest',
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
        description: 'The purchase request was successfully updated',
      },
      404: {
        description: 'The purchase request was not found',
      },
    },
    'x-description-th': 'บันทึกการเปลี่ยนแปลงใบขอซื้อรวมถึงข้อมูลส่วนหัวและการแก้ไขรายการสินค้า ใช้สำหรับปรับปรุงจำนวน เพิ่มหรือลบรายการ หรือแก้ไขรายละเอียดก่อนส่งเข้าอนุมัติ',
  } as any)
  @ApiBody({ type: UpdatePurchaseRequestSwaggerDto })
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: Record<string, unknown>,
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
      PurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);

    const result = await this.purchaseRequestService.save(
      id,
      updateDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Export a purchase request to an Excel spreadsheet
   * ส่งออกใบขอซื้อเป็นไฟล์ Excel
   * @param id - Purchase request ID / รหัสใบขอซื้อ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Excel file buffer and filename / บัฟเฟอร์ไฟล์ Excel และชื่อไฟล์
   */
  @Get(':bu_code/purchase-request/:id/export')
  @UseGuards(new AppIdGuard('purchaseRequest.export'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Export a purchase request to Excel',
    description: 'Generates an Excel spreadsheet of the purchase request with all line items, pricing, and approval details. Used for offline review, sharing with stakeholders, or archival purposes.',
    operationId: 'exportPurchaseRequest',
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Purchase request ID' },
    ],
    responses: {
      200: {
        description: 'Excel file download',
        content: {
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
            schema: { type: 'string', format: 'binary' },
          },
        },
      },
      404: { description: 'The purchase request was not found' },
    },
    'x-description-th': 'สร้างไฟล์ Excel ของใบขอซื้อพร้อมรายการสินค้า ราคา และรายละเอียดการอนุมัติทั้งหมด ใช้สำหรับตรวจสอบแบบออฟไลน์ แชร์กับผู้เกี่ยวข้อง หรือเก็บเป็นเอกสาร',
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
      { function: 'exportToExcel', id, version },
      PurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseRequestService.exportToExcel(id, user_id, bu_code, version);

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
   * Generate a printable PDF of the purchase request
   * สร้างไฟล์ PDF สำหรับพิมพ์ใบขอซื้อ
   * @param id - Purchase request ID / รหัสใบขอซื้อ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns PDF file buffer and filename / บัฟเฟอร์ไฟล์ PDF และชื่อไฟล์
   */
  @Get(':bu_code/purchase-request/:id/print')
  @UseGuards(new AppIdGuard('purchaseRequest.print'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Print a purchase request to PDF',
    description: 'Generates a printable PDF document of the purchase request for physical signatures, filing, or sending to vendors. Includes all line items, totals, and approval history.',
    operationId: 'printPurchaseRequest',
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Purchase request ID' },
    ],
    responses: {
      200: {
        description: 'PDF file download',
        content: {
          'application/pdf': {
            schema: { type: 'string', format: 'binary' },
          },
        },
      },
      404: { description: 'The purchase request was not found' },
    },
    'x-description-th': 'สร้างเอกสาร PDF สำหรับพิมพ์ใบขอซื้อ รวมถึงรายการสินค้า ยอดรวม และประวัติการอนุมัติ ใช้สำหรับลงนาม จัดเก็บเอกสาร หรือส่งให้ผู้ขาย',
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
      { function: 'printToPdf', id, version },
      PurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseRequestService.printToPdf(id, user_id, bu_code, version);

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

  /**
   * Print a purchase request via FastReport viewer (micro-report)
   * พิมพ์ใบขอซื้อผ่าน FastReport viewer (micro-report)
   * @param id - Purchase request ID / รหัสใบขอซื้อ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @returns { viewer_url } / URL ของ report viewer
   */
  @Get(':bu_code/purchase-request/:id/print-viewer')
  @UseGuards(new AppIdGuard('purchaseRequest.print'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Print purchase request via FastReport viewer',
    description:
      'Sends PR data + signature config to micro-report which generates FastReport XML and returns a viewer URL. The frontend can open this URL in an iframe or new tab.',
    operationId: 'printPurchaseRequestViewer',
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Purchase request ID' },
      { name: 'bu_code', in: 'path', required: true, description: 'Business unit code' },
    ],
    responses: {
      200: {
        description: 'Viewer URL returned',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: { viewer_url: { type: 'string', example: 'https://report.blueledgers.cloud/viewer/abc123' } },
            },
          },
        },
      },
      404: { description: 'Purchase request or report template not found' },
    },
    'x-description-th': 'ส่งข้อมูล PR + signature ไป micro-report เพื่อสร้าง FastReport XML แล้วคืน viewer URL สำหรับเปิดดู/พิมพ์',
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
      PurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseRequestService.printToReport(id, user_id, bu_code);
    this.respond(res, result);
  }

  /**
   * Delete a purchase request that is no longer needed
   * ลบใบขอซื้อที่ไม่ต้องการแล้ว
   * @param id - Purchase request ID / รหัสใบขอซื้อ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @Delete(':bu_code/purchase-request/:id')
  @UseGuards(new AppIdGuard('purchaseRequest.delete'))
  @Serialize(PurchaseRequestMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Delete a purchase request',
    description: 'Removes a purchase request that is no longer needed. Typically used for draft PRs that were created in error or are no longer required by the department.',
    operationId: 'deletePurchaseRequest',
    deprecated: false,
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
      },
    ],
    responses: {
      200: {
        description: 'The purchase request was successfully deleted',
      },
      404: {
        description: 'The purchase request was not found',
      },
    },
    'x-description-th': 'ลบใบขอซื้อที่ไม่ต้องการแล้ว โดยทั่วไปใช้สำหรับใบขอซื้อฉบับร่างที่สร้างผิดพลาดหรือไม่จำเป็นอีกต่อไป',
  } as any)
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
      PurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseRequestService.delete(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Retrieve cost allocation dimensions for a purchase request detail
   * ค้นหามิติการจัดสรรต้นทุนของรายละเอียดใบขอซื้อ
   * @param detail_id - Purchase request detail ID / รหัสรายละเอียดใบขอซื้อ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Dimension data / ข้อมูลมิติ
   */
  @Get(':bu_code/purchase-request/detail/:detail_id/dimension')
  @UseGuards(new AppIdGuard('purchaseRequest.detail.findDimensions'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get dimensions of a purchase request detail',
    description: 'Retrieves cost allocation dimensions (e.g., department, cost center, project) associated with a specific PR line item. Used for financial reporting and budget tracking across organizational units.',
    operationId: 'findDimensionsByPurchaseRequestDetailId',
    'x-description-th': 'ดึงมิติการจัดสรรต้นทุน (เช่น แผนก ศูนย์ต้นทุน โครงการ) ที่เชื่อมโยงกับรายการใบขอซื้อเฉพาะ ใช้สำหรับรายงานทางการเงินและติดตามงบประมาณ',
  } as any)
  @HttpCode(HttpStatus.OK)
  async findDimensionsByDetailId(
    @Param('detail_id', new ParseUUIDPipe({ version: '4' })) detail_id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Query('version') version: string = 'latest',
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'findDimensionsByDetailId',
        detail_id,
        version,
      },
      PurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    return this.purchaseRequestService.findDimensionsByDetailId(
      detail_id,
      user_id,
      bu_code,
      version,
    );
  }


  /**
   * Retrieve change history for a purchase request detail
   * ค้นหาประวัติการเปลี่ยนแปลงของรายละเอียดใบขอซื้อ
   * @param detail_id - Purchase request detail ID / รหัสรายละเอียดใบขอซื้อ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Change history / ประวัติการเปลี่ยนแปลง
   */
  @Get(':bu_code/purchase-request/detail/:detail_id/history')
  @UseGuards(new AppIdGuard('purchaseRequest.detail.findhistory'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get history of a purchase request detail',
    description: 'Retrieves the change history and audit trail for a specific PR line item, including price changes, quantity adjustments, and approval actions taken at each workflow stage.',
    operationId: 'findHistoryByPurchaseRequestDetailId',
    'x-description-th': 'ดึงประวัติการเปลี่ยนแปลงและบันทึกตรวจสอบของรายการใบขอซื้อเฉพาะ รวมถึงการเปลี่ยนแปลงราคา การปรับจำนวน และการดำเนินการอนุมัติ',
  } as any)
  @HttpCode(HttpStatus.OK)
  async findHistoryByDetailId(
    @Param('detail_id', new ParseUUIDPipe({ version: '4' })) detail_id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Query('version') version: string = 'latest',
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'findHistoryByDetailId',
        detail_id,
        version,
      },
      PurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    return this.purchaseRequestService.findHistoryByDetailId(
      detail_id,
      user_id,
      bu_code,
      version,
    );
  }


  /**
   * Calculate price breakdown for a purchase request detail
   * คำนวณรายละเอียดราคาของรายการใบขอซื้อ
   * @param detail_id - Purchase request detail ID / รหัสรายละเอียดใบขอซื้อ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param data - Calculation parameters / พารามิเตอร์การคำนวณ
   * @param version - API version / เวอร์ชัน API
   * @returns Price calculation result / ผลลัพธ์การคำนวณราคา
   */
  @Get(':bu_code/purchase-request/detail/:detail_id/calculate')
  @UseGuards(new AppIdGuard('purchaseRequest.detail.findhistory'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Calculate price info for a purchase request detail',
    description: 'Calculates the total cost breakdown for a PR line item including unit price, tax, discount, and net amount. Used by purchasers to evaluate pricing from different vendors and price lists before finalizing the request.',
    operationId: 'calculatePriceInfoByDetailId',
    'x-description-th': 'คำนวณรายละเอียดต้นทุนทั้งหมดของรายการใบขอซื้อ รวมถึงราคาต่อหน่วย ภาษี ส่วนลด และยอดสุทธิ ใช้โดยผู้จัดซื้อเพื่อประเมินราคาจากผู้ขายต่างๆ',
  } as any)
  @ApiBody({ type: CalculatePurchaseRequestDetailSwaggerDto })
  @HttpCode(HttpStatus.OK)
  async getCalculatePriceInfoByDetailId(
    @Param('detail_id', new ParseUUIDPipe({ version: '4' })) detail_id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Body() data: CalculatePurchaseRequestDetail,
    @Query('version') version: string = 'latest',
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'getCalculatePriceInfoByDetailId',
        detail_id,
        version,
      },
      PurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    return this.purchaseRequestService.getCalculatePriceInfoByDetailId(
      detail_id,
      data,
      user_id,
      bu_code,
      version,
    );
  }

  /**
   * Regenerate denormalized base amount totals on tb_purchase_request from detail rows.
   * Recompute one PR by id, or all non-deleted PRs in the business unit if id is omitted.
   */
  @Post(':bu_code/purchase-request/regenerate-totals')
  @ApiOperation({
    summary: 'Regenerate Purchase Request amount totals (all)',
    description:
      'Recomputes base_net_amount and base_total_amount on every non-deleted Purchase Request in the business unit by aggregating from detail rows. Use after manual DB edits or schema migrations to repair drift.',
    operationId: 'regenerateAllPurchaseRequestTotals',
  } as any)
  @HttpCode(HttpStatus.OK)
  async regenerateAllTotals(
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.debug({ function: 'regenerateAllTotals', bu_code }, PurchaseRequestController.name);
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseRequestService.regenerateTotals(user_id, bu_code);
    this.respond(res, result);
  }

  @Post(':bu_code/purchase-request/:id/regenerate-totals')
  @ApiOperation({
    summary: 'Regenerate Purchase Request amount totals (single)',
    description:
      'Recomputes base_net_amount and base_total_amount on a single Purchase Request by aggregating from detail rows.',
    operationId: 'regeneratePurchaseRequestTotals',
  } as any)
  @HttpCode(HttpStatus.OK)
  async regenerateTotalsById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.debug({ function: 'regenerateTotalsById', id, bu_code }, PurchaseRequestController.name);
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseRequestService.regenerateTotals(user_id, bu_code, id);
    this.respond(res, result);
  }
}
