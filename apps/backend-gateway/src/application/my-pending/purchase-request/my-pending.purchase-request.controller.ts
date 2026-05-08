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
import { MyPendingPurchaseRequestService } from './my-pending.purchase-request.service';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import {
  BaseHttpController,
} from '@/common';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import {
  IPaginateQuery,
  PaginateQuery,
} from 'src/shared-dto/paginate.dto';
import {
  CreatePurchaseRequestDto,
  ReviewPurchaseRequestDto,
  UpdatePurchaseRequestDto,
} from '@/common';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import {
  EXAMPLE_PURCHASE_REQUEST,
  MOCK_PURCHASE_REQUEST_LIST,
} from './example/my-pending.purchase-request.example';
import { ApproveByStageRoleDto2 } from './dto/state-change.dto';
import {
  ApproveByStageRoleRequestDto,
  ReviewPurchaseRequestRequestDto,
} from './swagger/request';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';

@Controller('api/my-pending/purchase-request')
@ApiTags('Workflow: My Pending')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class MyPendingPurchaseRequestController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    MyPendingPurchaseRequestController.name,
  );

  constructor(
    private readonly myPendingPurchaseRequestService: MyPendingPurchaseRequestService,
  ) {
    super();
  }

  /**
   * Get count of pending purchase requests for the current user
   * ดึงจำนวนใบขอซื้อที่รอดำเนินการของผู้ใช้ปัจจุบัน
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param version - API version / เวอร์ชัน API
   * @returns Pending purchase request count / จำนวนใบขอซื้อที่รอดำเนินการ
   */
  @Get('pending')
  @UseGuards(new AppIdGuard('my-pending.purchaseRequest.findAllPending.count'))
  //@IgnoreGuards(KeycloakGuard)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get count of all pending purchase requests',
    description: 'Returns the count of purchase requests currently awaiting the user\'s action in the approval pipeline, used for dashboard badge notifications and workload tracking.',
    'x-description-th': 'ดึงจำนวนใบขอซื้อที่รอดำเนินการของผู้ใช้ปัจจุบัน ใช้สำหรับแสดงป้ายแจ้งเตือนบนแดชบอร์ด',
    operationId: 'findAllPendingPurchaseRequestsCount',
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
        description: 'Pending purchase request count retrieved successfully',
        content: {
          'application/json': {
            examples: {
              default: {
                value: {
                  data: {
                    pending: 1,
                  },
                  message: 'Success',
                  status: 200,
                },
              },
            },
          },
        },
      },
      404: {
        description: 'No pending purchase requests found',
        content: {
          'application/json': {
            examples: {
              default: {
                value: {
                  data: {},
                  message: 'false',
                  status: 404,
                },
              },
            },
          },
        },
      },
    },
  } as any)
  @HttpCode(HttpStatus.OK)
  async findAllPendingPurchaseRequestsCount(
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAllPendingPurchaseRequestsCount',
        version,
      },
      MyPendingPurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result =
      await this.myPendingPurchaseRequestService.findAllMyPendingPurchaseRequestsCount(
        user_id,
        version,
      );
    this.respond(res, result);
  }

  /**
   * Get workflow stages for purchase requests
   * ดึงขั้นตอนการทำงานสำหรับใบขอซื้อ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Workflow stages / ขั้นตอนการทำงาน
   */
  @Get(':bu_code/workflow-stages')
  @UseGuards(
    new AppIdGuard('my-pending.purchaseRequest.findAllWorkflowStagesByPr'),
  )
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get workflow stages of a purchase request',
    description: 'Retrieves the approval workflow stages configured for purchase requests in the business unit, showing the sequence of approval steps (e.g., HOD, Finance Controller, GM) that a purchase request must pass through.',
    'x-description-th': 'ดึงขั้นตอนการอนุมัติที่กำหนดไว้สำหรับใบขอซื้อในหน่วยธุรกิจ แสดงลำดับขั้นตอนที่ใบขอซื้อต้องผ่าน',
    operationId: 'findPendingPurchaseRequestWorkflowStages',
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
        description: 'Purchase request workflow stages retrieved successfully',
        content: {
          'application/json': {
            examples: {
              default: {
                value: {
                  data: {
                    workflowStages: [],
                  },
                  message: 'Success',
                  status: 200,
                },
              },
            },
          },
        },
      },
      404: {
        description: 'Workflow stages not found',
        content: {
          'application/json': {
            examples: {
              default: {
                value: {
                  data: {},
                  message: 'false',
                  status: 404,
                },
              },
            },
          },
        },
      },
    },
  } as any)
  @HttpCode(HttpStatus.OK)
  async findAllWorkflowStagesByPr(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAllWorkflowStagesByPr',
        version,
      },
      MyPendingPurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result =
      await this.myPendingPurchaseRequestService.findAllMyPendingStages(
        user_id,
        bu_code,
        version,
      );
    this.respond(res, result);
  }

  /**
   * Find a pending purchase request by ID
   * ค้นหาใบขอซื้อที่รอดำเนินการรายการเดียวตาม ID
   * @param id - Purchase request ID / รหัสใบขอซื้อ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param version - API version / เวอร์ชัน API
   * @returns Purchase request details / รายละเอียดใบขอซื้อ
   */
  @Get(':bu_code/:id')
  @UseGuards(new AppIdGuard('my-pending.purchaseRequest.findOne'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get a purchase request by ID',
    description: 'Retrieves the full details of a specific purchase request pending in the approval pipeline, including requested items, quantities, estimated costs, and current approval status.',
    'x-description-th': 'ค้นหาใบขอซื้อที่รอดำเนินการตาม ID พร้อมรายละเอียดทั้งหมด รวมถึงรายการสินค้า จำนวน ราคาประมาณ และสถานะการอนุมัติ',
    operationId: 'findOnePendingPurchaseRequest',
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
      {
        name: 'bu_code',
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
  } as any)
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
      MyPendingPurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.myPendingPurchaseRequestService.findById(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * List all pending purchase requests for the current user
   * ค้นหารายการใบขอซื้อที่รอดำเนินการทั้งหมดของผู้ใช้ปัจจุบัน
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param query - Pagination query / คำค้นหาการแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated list of pending purchase requests / รายการใบขอซื้อที่รอดำเนินการแบบแบ่งหน้า
   */
  @Get()
  @UseGuards(new AppIdGuard('my-pending.purchaseRequest.findAll'))
  @ApiVersionMinRequest()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all purchase requests',
    description: 'Lists all purchase requests in the user\'s pending queue with pagination, enabling requestors and approvers to track and manage procurement requests through the approval workflow.',
    'x-description-th': 'แสดงรายการใบขอซื้อที่รอดำเนินการทั้งหมดของผู้ใช้ปัจจุบันพร้อมการแบ่งหน้า',
    operationId: 'findAllPendingPurchaseRequests',
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
      {
        name: 'bu_code',
        in: 'query',
        required: false,
      },
    ],
    responses: {
      200: {
        description: 'The purchase requests were successfully retrieved',
        content: {
          'application/json': {
            examples: {
              default: {
                value: MOCK_PURCHASE_REQUEST_LIST,
              },
            },
          },
        },
      },
      404: {
        description: 'The purchase requests were not found',
      },
    },
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
      MyPendingPurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.myPendingPurchaseRequestService.findAll(
      user_id,
      paginate.bu_code,
      paginate,
      version,
    );

    this.respond(res, result);
  }

  /**
   * List purchase requests filtered by status
   * ค้นหารายการใบขอซื้อตามสถานะ
   * @param status - Request status / สถานะใบขอซื้อ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Purchase requests by status / รายการใบขอซื้อตามสถานะ
   */
  @Get(':bu_code/status/:status')
  @UseGuards(new AppIdGuard('my-pending.purchaseRequest.findAllByStatus'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get purchase requests by status',
    description: 'Filters purchase requests by their current approval status (e.g., draft, pending, approved, rejected), allowing users to view requests at a specific stage in the procurement workflow.',
    'x-description-th': 'ค้นหารายการใบขอซื้อตามสถานะการอนุมัติ (เช่น ร่าง รออนุมัติ อนุมัติแล้ว ปฏิเสธ)',
    operationId: 'findPurchaseRequestsByStatus',
    responses: {
      200: { description: 'Purchase requests retrieved successfully' },
    },
  } as any)
  @HttpCode(HttpStatus.OK)
  async findAllByStatus(
    @Param('status') status: string,
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAllByStatus',
        status,
        version,
      },
      MyPendingPurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.myPendingPurchaseRequestService.findAllByStatus(
      status,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Create a new purchase request
   * สร้างใบขอซื้อใหม่
   * @param createDto - Purchase request data / ข้อมูลใบขอซื้อ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Created purchase request / ใบขอซื้อที่สร้างแล้ว
   */
  @Post(':bu_code')
  @UseGuards(new AppIdGuard('my-pending.purchaseRequest.create'))
  @ApiVersionMinRequest()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a purchase request',
    description: 'Creates a new purchase request for items needed by a hotel department, initiating the procurement approval workflow where the request will be routed to designated approvers (HOD, FC, GM).',
    'x-description-th': 'สร้างใบขอซื้อใหม่สำหรับสินค้าที่แผนกในโรงแรมต้องการ เริ่มต้นขั้นตอนอนุมัติการจัดซื้อ',
    operationId: 'createPendingPurchaseRequest',
    deprecated: false,
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
      },
      {
        name: 'bu_code',
        in: 'path',
        required: true,
      },
    ],
    responses: {
      201: {
        description: 'The purchase request was successfully created',
      },
      404: {
        description: 'The purchase request was not found',
      },
      401: {
        description: 'Unauthorized',
      },
    },
  } as any)
  @ApiBody({
    type: CreatePurchaseRequestDto,
    description: 'Purchase request data',
    examples: {
      example1: {
        value: EXAMPLE_PURCHASE_REQUEST,
        summary: 'Sample purchase request',
      },
    },
  })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createDto: CreatePurchaseRequestDto,
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      MyPendingPurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.myPendingPurchaseRequestService.create(
      { ...createDto },
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Submit a purchase request for approval
   * ส่งใบขอซื้อเพื่อขออนุมัติ
   * @param id - Purchase request ID / รหัสใบขอซื้อ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Submitted purchase request / ใบขอซื้อที่ส่งแล้ว
   */
  @Patch(':bu_code/:id/submit')
  @UseGuards(new AppIdGuard('my-pending.purchaseRequest.submit'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Submit a purchase request',
    description: 'Submits a draft purchase request into the approval workflow, moving it from draft status to the first approval stage where designated approvers will review the procurement request.',
    'x-description-th': 'ส่งใบขอซื้อฉบับร่างเข้าสู่ขั้นตอนอนุมัติ สถานะจะเปลี่ยนจากร่างไปยังขั้นตอนอนุมัติแรก',
    operationId: 'submitPendingPurchaseRequest',
    responses: {
      200: { description: 'Purchase request submitted successfully' },
      404: { description: 'Purchase request not found' },
    },
  } as any)
  @HttpCode(HttpStatus.OK)
  async submit(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'submit',
        id,
        version,
      },
      MyPendingPurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.myPendingPurchaseRequestService.submit(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Approve a purchase request at the current workflow stage
   * อนุมัติใบขอซื้อในขั้นตอนการทำงานปัจจุบัน
   * @param id - Purchase request ID / รหัสใบขอซื้อ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param payload - Approval payload / ข้อมูลการอนุมัติ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Approved purchase request / ใบขอซื้อที่อนุมัติแล้ว
   */
  @Patch(':bu_code/:id/approve')
  @UseGuards(new AppIdGuard('my-pending.purchaseRequest.approve'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Approve a purchase request',
    description: 'Approves a purchase request at the current user\'s workflow stage, advancing it to the next approval level or marking it as fully approved for purchase order generation.',
    'x-description-th': 'อนุมัติใบขอซื้อในขั้นตอนเวิร์กโฟลว์ปัจจุบัน เลื่อนไปยังขั้นตอนถัดไปหรืออนุมัติครบถ้วนเพื่อสร้างใบสั่งซื้อ',
    operationId: 'approvePendingPurchaseRequest',
    responses: {
      200: { description: 'Purchase request approved successfully' },
      404: { description: 'Purchase request not found' },
    },
  } as any)
  @ApiBody({ type: ApproveByStageRoleRequestDto })
  @HttpCode(HttpStatus.OK)
  async approve(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: Request,
    @Res() res: Response,
    @Body() payload: ApproveByStageRoleDto2,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'approve',
        id,
        version,
      },
      MyPendingPurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.myPendingPurchaseRequestService.approve(
      id,
      { ...payload },
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Reject a purchase request at the current workflow stage
   * ปฏิเสธใบขอซื้อในขั้นตอนการทำงานปัจจุบัน
   * @param id - Purchase request ID / รหัสใบขอซื้อ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Rejected purchase request / ใบขอซื้อที่ปฏิเสธแล้ว
   */
  @Patch(':bu_code/:id/reject')
  @UseGuards(new AppIdGuard('my-pending.purchaseRequest.reject'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Reject a purchase request',
    description: 'Rejects a purchase request at the current approval stage, sending it back to the requestor for revision or cancellation with the reason for rejection.',
    'x-description-th': 'ปฏิเสธใบขอซื้อในขั้นตอนอนุมัติปัจจุบัน ส่งกลับไปยังผู้ขอเพื่อแก้ไขหรือยกเลิกพร้อมเหตุผล',
    operationId: 'rejectPendingPurchaseRequest',
    responses: {
      200: { description: 'Purchase request rejected successfully' },
      404: { description: 'Purchase request not found' },
    },
  } as any)
  @HttpCode(HttpStatus.OK)
  async reject(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'approve',
        id,
        version,
      },
      MyPendingPurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.myPendingPurchaseRequestService.reject(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Review a purchase request before final decision
   * ตรวจสอบใบขอซื้อก่อนตัดสินใจขั้นสุดท้าย
   * @param id - Purchase request ID / รหัสใบขอซื้อ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param payload - Review payload / ข้อมูลการตรวจสอบ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Reviewed purchase request / ใบขอซื้อที่ตรวจสอบแล้ว
   */
  @Patch(':bu_code/:id/review')
  @UseGuards(new AppIdGuard('my-pending.purchaseRequest.review'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Review a purchase request',
    description: 'Allows an approver to review a purchase request and provide feedback or modifications before making a final approve/reject decision, supporting collaborative procurement review.',
    'x-description-th': 'ส่งใบขอซื้อกลับตรวจสอบ ช่วยให้ผู้อนุมัติให้ข้อเสนอแนะหรือขอแก้ไขก่อนตัดสินใจอนุมัติหรือปฏิเสธ',
    operationId: 'reviewPendingPurchaseRequest',
    responses: {
      200: { description: 'Purchase request reviewed successfully' },
      404: { description: 'Purchase request not found' },
    },
  } as any)
  @ApiBody({ type: ReviewPurchaseRequestRequestDto })
  @HttpCode(HttpStatus.OK)
  async review(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: Request,
    @Res() res: Response,
    @Body() payload: ReviewPurchaseRequestDto,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'approve',
        id,
        version,
      },
      MyPendingPurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.myPendingPurchaseRequestService.review(
      id,
      { ...payload },
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Update a draft purchase request
   * อัปเดตใบขอซื้อฉบับร่าง
   * @param id - Purchase request ID / รหัสใบขอซื้อ
   * @param updateDto - Updated request data / ข้อมูลใบขอที่อัปเดต
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Updated purchase request / ใบขอซื้อที่อัปเดตแล้ว
   */
  @Patch(':bu_code/:id/save')
  @UseGuards(new AppIdGuard('my-pending.purchaseRequest.update'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Update a purchase request',
    description: 'Saves changes to a draft purchase request, allowing the requestor to modify items, quantities, or justification before submitting it for approval.',
    'x-description-th': 'บันทึกการเปลี่ยนแปลงใบขอซื้อฉบับร่าง ช่วยให้ผู้ขอแก้ไขรายการสินค้า จำนวน หรือเหตุผลก่อนส่งอนุมัติ',
    operationId: 'updatePendingPurchaseRequest',
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
  } as any)
  @ApiBody({ type: UpdatePurchaseRequestDto })
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateDto: UpdatePurchaseRequestDto,
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateDto,
        version,
      },
      MyPendingPurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.myPendingPurchaseRequestService.update(
      id,
      { ...updateDto },
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Delete a purchase request
   * ลบใบขอซื้อ
   * @param id - Purchase request ID / รหัสใบขอซื้อ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Delete result / ผลลัพธ์การลบ
   */
  @Delete(':bu_code/:id')
  @UseGuards(new AppIdGuard('my-pending.purchaseRequest.delete'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Delete a purchase request',
    description: 'Removes a purchase request that is no longer needed, typically a draft or rejected request that the requestor has decided to discard rather than resubmit.',
    'x-description-th': 'ลบใบขอซื้อที่ไม่ต้องการ โดยทั่วไปเป็นใบขอฉบับร่างหรือที่ถูกปฏิเสธ',
    operationId: 'deletePendingPurchaseRequest',
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
  } as any)
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'delete',
        id,
        version,
      },
      MyPendingPurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.myPendingPurchaseRequestService.delete(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }
}
