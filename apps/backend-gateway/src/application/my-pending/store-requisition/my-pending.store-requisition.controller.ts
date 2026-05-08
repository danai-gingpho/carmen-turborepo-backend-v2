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
import { MyPendingStoreRequisitionService as MyPendingStoreRequisitionService } from './my-pending.store-requisition.service';
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
  CreateStoreRequisitionDto,
  UpdateStoreRequisitionDto,
} from '@/common';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
@Controller('api/my-pending/store-requisition')
@ApiTags('Workflow: My Pending')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class MyPendingStoreRequisitionController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    MyPendingStoreRequisitionController.name,
  );

  constructor(
    private readonly myPendingStoreRequisitionService: MyPendingStoreRequisitionService,
  ) {
    super();
  }

  /**
   * Get count of pending store requisitions for the current user
   * ดึงจำนวนใบเบิกสินค้าที่รอดำเนินการของผู้ใช้ปัจจุบัน
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param version - API version / เวอร์ชัน API
   * @returns Pending store requisition count / จำนวนใบเบิกสินค้าที่รอดำเนินการ
   */
  @Get('pending')
  @UseGuards(new AppIdGuard('my-pending.storeRequisition.findAllPending.count'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get count of all pending store requisitions',
    description: 'Returns the count of store requisitions currently awaiting the user\'s action in the approval pipeline, used for dashboard badge notifications and workload tracking.',
    'x-description-th': 'ดึงจำนวนใบเบิกสินค้าที่รอดำเนินการของผู้ใช้ปัจจุบัน ใช้สำหรับแสดงป้ายแจ้งเตือนบนแดชบอร์ด',
    operationId: 'findAllPendingStoreRequisitionsCount',
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
        description: 'Pending store requisition count retrieved successfully',
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
        description: 'No pending store requisitions found',
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
  async findAllPendingStoreRequisitionsCount(
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAllPendingStoreRequisitionsCount',
        version,
      },
      MyPendingStoreRequisitionController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result =
      await this.myPendingStoreRequisitionService.findAllMyPendingStoreRequisitionsCount(
        user_id,
        version,
      );
    this.respond(res, result);
  }

  /**
   * Get workflow stages for store requisitions
   * ดึงขั้นตอนการทำงานสำหรับใบเบิกสินค้า
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Workflow stages / ขั้นตอนการทำงาน
   */
  @Get(':bu_code/workflow-stages')
  @UseGuards(
    new AppIdGuard('my-pending.storeRequisition.findAllWorkflowStagesBySr'),
  )
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get workflow stages of a store requisition',
    description: 'Retrieves the approval workflow stages configured for store requisitions in the business unit, showing the sequence of approval steps that internal stock requests must pass through before fulfillment.',
    'x-description-th': 'ดึงขั้นตอนการอนุมัติที่กำหนดไว้สำหรับใบเบิกสินค้าในหน่วยธุรกิจ แสดงลำดับขั้นตอนที่คำขอเบิกสินค้าต้องผ่าน',
    operationId: 'findAllWorkflowStagesBySr',
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
        description: 'Store requisition workflow stages retrieved successfully',
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
  async findAllWorkflowStagesBySr(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAllWorkflowStagesBySr',
        version,
      },
      MyPendingStoreRequisitionController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result =
      await this.myPendingStoreRequisitionService.findAllMyPendingStages(
        user_id,
        bu_code,
        version,
      );
    this.respond(res, result);
  }

  /**
   * Find a pending store requisition by ID
   * ค้นหาใบเบิกสินค้าที่รอดำเนินการรายการเดียวตาม ID
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param id - Store requisition ID / รหัสใบเบิกสินค้า
   * @param version - API version / เวอร์ชัน API
   * @returns Store requisition details / รายละเอียดใบเบิกสินค้า
   */
  @Get(':bu_code/:id')
  @UseGuards(new AppIdGuard('my-pending.storeRequisition.findOne'))
  @ApiVersionMinRequest()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get a store requisition by ID',
    description: 'Retrieves the full details of a specific store requisition pending in the approval pipeline, including requested items, quantities, requesting department, and current approval status.',
    'x-description-th': 'ค้นหาใบเบิกสินค้าที่รอดำเนินการตาม ID พร้อมรายละเอียดทั้งหมด รวมถึงรายการสินค้า จำนวน และสถานะการอนุมัติ',
    operationId: 'findPendingStoreRequisitionById',
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
      200: {
        description: 'The store requisition was successfully retrieved',
      },
      404: {
        description: 'The store requisition was not found',
      },
    },
  } as any)
  @HttpCode(HttpStatus.OK)
  async findById(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findById',
        bu_code,
        id,
        version,
      },
      MyPendingStoreRequisitionController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.myPendingStoreRequisitionService.findById(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * List all pending store requisitions for the current user
   * ค้นหารายการใบเบิกสินค้าที่รอดำเนินการทั้งหมดของผู้ใช้ปัจจุบัน
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param query - Pagination query / คำค้นหาการแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated list of pending store requisitions / รายการใบเบิกสินค้าที่รอดำเนินการแบบแบ่งหน้า
   */
  @Get()
  @UseGuards(new AppIdGuard('my-pending.storeRequisition.findAll'))
  @ApiVersionMinRequest()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all store requisitions',
    description: 'Lists all store requisitions in the user\'s pending queue with pagination, enabling department staff and approvers to track internal stock requests through the approval and fulfillment process.',
    'x-description-th': 'แสดงรายการใบเบิกสินค้าที่รอดำเนินการทั้งหมดของผู้ใช้ปัจจุบันพร้อมการแบ่งหน้า',
    operationId: 'findAllPendingStoreRequisitions',
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
        description: 'The store requisitions were successfully retrieved',
      },
      404: {
        description: 'The store requisitions were not found',
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
      MyPendingStoreRequisitionController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.myPendingStoreRequisitionService.findAll(
      user_id,
      paginate.bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  /**
   * List store requisitions filtered by status
   * ค้นหารายการใบเบิกสินค้าตามสถานะ
   * @param status - Requisition status / สถานะใบเบิก
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Store requisitions by status / รายการใบเบิกสินค้าตามสถานะ
   */
  @Get(':bu_code/status/:status')
  @UseGuards(new AppIdGuard('my-pending.storeRequisition.findAllByStatus'))
  @ApiVersionMinRequest()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all store requisitions by status',
    description: 'Filters store requisitions by their current status (e.g., draft, pending, approved, rejected), allowing users to view internal stock requests at a specific stage in the approval workflow.',
    'x-description-th': 'ค้นหารายการใบเบิกสินค้าตามสถานะ (เช่น ร่าง รออนุมัติ อนุมัติแล้ว ปฏิเสธ)',
    operationId: 'findStoreRequisitionsByStatus',
    responses: {
      200: { description: 'Store requisitions retrieved successfully' },
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
      MyPendingStoreRequisitionController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.myPendingStoreRequisitionService.findAllByStatus(
      status,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Create a new store requisition
   * สร้างใบเบิกสินค้าใหม่
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param body - Store requisition data / ข้อมูลใบเบิกสินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Created store requisition / ใบเบิกสินค้าที่สร้างแล้ว
   */
  @Post(':bu_code')
  @UseGuards(new AppIdGuard('my-pending.storeRequisition.create'))
  @ApiVersionMinRequest()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a store requisition',
    description: 'Creates a new store requisition for a hotel department to request items from internal storage, initiating the approval workflow before the storeroom fulfills the request.',
    'x-description-th': 'สร้างใบเบิกสินค้าใหม่สำหรับแผนกในโรงแรมเพื่อขอเบิกสินค้าจากคลังภายใน',
    operationId: 'createPendingStoreRequisition',
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
  } as any)
  @ApiBody({ type: CreateStoreRequisitionDto })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: CreateStoreRequisitionDto,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        body,
        version,
      },
      MyPendingStoreRequisitionController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.myPendingStoreRequisitionService.create(
      body,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Update a draft store requisition
   * อัปเดตใบเบิกสินค้าฉบับร่าง
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param body - Updated requisition data / ข้อมูลใบเบิกที่อัปเดต
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param id - Store requisition ID / รหัสใบเบิกสินค้า
   * @param version - API version / เวอร์ชัน API
   * @returns Updated store requisition / ใบเบิกสินค้าที่อัปเดตแล้ว
   */
  @Patch(':bu_code/:id/save')
  @UseGuards(new AppIdGuard('my-pending.storeRequisition.update'))
  @ApiVersionMinRequest()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update a store requisition',
    description: 'Saves changes to a draft store requisition, allowing the requestor to modify requested items, quantities, or delivery details before submitting for approval.',
    'x-description-th': 'บันทึกการเปลี่ยนแปลงใบเบิกสินค้าฉบับร่าง ช่วยให้ผู้ขอแก้ไขรายการสินค้า จำนวน หรือรายละเอียดก่อนส่งอนุมัติ',
    operationId: 'updatePendingStoreRequisition',
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
  } as any)
  @ApiBody({ type: UpdateStoreRequisitionDto })
  @HttpCode(HttpStatus.OK)
  async update(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: UpdateStoreRequisitionDto,
    @Param('bu_code') bu_code: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        body,
        version,
      },
      MyPendingStoreRequisitionController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.myPendingStoreRequisitionService.update(
      id,
      body,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Submit a store requisition for approval
   * ส่งใบเบิกสินค้าเพื่อขออนุมัติ
   * @param id - Store requisition ID / รหัสใบเบิกสินค้า
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Submitted store requisition / ใบเบิกสินค้าที่ส่งแล้ว
   */
  @Patch(':bu_code/:id/submit')
  @UseGuards(new AppIdGuard('my-pending.storeRequisition.submit'))
  @ApiVersionMinRequest()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Submit a store requisition',
    description: 'Submits a draft store requisition into the approval workflow, moving it from draft status to the first approval stage for designated approvers to review.',
    'x-description-th': 'ส่งใบเบิกสินค้าฉบับร่างเข้าสู่ขั้นตอนอนุมัติ สถานะจะเปลี่ยนจากร่างไปยังขั้นตอนอนุมัติแรก',
    operationId: 'submitPendingStoreRequisition',
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
      MyPendingStoreRequisitionController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.myPendingStoreRequisitionService.submit(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Approve a store requisition at the current workflow stage
   * อนุมัติใบเบิกสินค้าในขั้นตอนการทำงานปัจจุบัน
   * @param id - Store requisition ID / รหัสใบเบิกสินค้า
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Approved store requisition / ใบเบิกสินค้าที่อนุมัติแล้ว
   */
  @Patch(':bu_code/:id/approve')
  @UseGuards(new AppIdGuard('my-pending.storeRequisition.approve'))
  @ApiVersionMinRequest()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Approve a store requisition',
    description: 'Approves a store requisition at the current user\'s workflow stage, advancing it to the next approval level or marking it as fully approved for storeroom fulfillment.',
    'x-description-th': 'อนุมัติใบเบิกสินค้าในขั้นตอนเวิร์กโฟลว์ปัจจุบัน เลื่อนไปยังขั้นตอนถัดไปหรืออนุมัติครบถ้วนเพื่อให้คลังดำเนินการ',
    operationId: 'approvePendingStoreRequisition',
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
  } as any)
  @HttpCode(HttpStatus.OK)
  async approve(
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
      MyPendingStoreRequisitionController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.myPendingStoreRequisitionService.approve(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Reject a store requisition at the current workflow stage
   * ปฏิเสธใบเบิกสินค้าในขั้นตอนการทำงานปัจจุบัน
   * @param id - Store requisition ID / รหัสใบเบิกสินค้า
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Rejected store requisition / ใบเบิกสินค้าที่ปฏิเสธแล้ว
   */
  @Patch(':bu_code/:id/reject')
  @UseGuards(new AppIdGuard('my-pending.storeRequisition.reject'))
  @ApiVersionMinRequest()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Reject a store requisition',
    description: 'Rejects a store requisition at the current approval stage, sending it back to the requesting department for revision or cancellation.',
    'x-description-th': 'ปฏิเสธใบเบิกสินค้าในขั้นตอนอนุมัติปัจจุบัน ส่งกลับไปยังแผนกที่ขอเพื่อแก้ไขหรือยกเลิก',
    operationId: 'rejectPendingStoreRequisition',
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
        function: 'reject',
        id,
        version,
      },
      MyPendingStoreRequisitionController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.myPendingStoreRequisitionService.reject(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Review a store requisition before final decision
   * ตรวจสอบใบเบิกสินค้าก่อนตัดสินใจขั้นสุดท้าย
   * @param id - Store requisition ID / รหัสใบเบิกสินค้า
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Reviewed store requisition / ใบเบิกสินค้าที่ตรวจสอบแล้ว
   */
  @Patch(':bu_code/:id/review')
  @UseGuards(new AppIdGuard('my-pending.storeRequisition.review'))
  @ApiVersionMinRequest()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Review a store requisition',
    description: 'Allows an approver to review a store requisition and provide feedback or modifications before making a final approve/reject decision on the internal stock request.',
    'x-description-th': 'ส่งใบเบิกสินค้ากลับตรวจสอบ ช่วยให้ผู้อนุมัติให้ข้อเสนอแนะหรือขอแก้ไขก่อนตัดสินใจอนุมัติหรือปฏิเสธ',
    operationId: 'reviewPendingStoreRequisition',
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
  } as any)
  @HttpCode(HttpStatus.OK)
  async review(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'review',
        id,
        version,
      },
      MyPendingStoreRequisitionController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.myPendingStoreRequisitionService.review(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Delete a store requisition
   * ลบใบเบิกสินค้า
   * @param id - Store requisition ID / รหัสใบเบิกสินค้า
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Delete result / ผลลัพธ์การลบ
   */
  @Delete(':bu_code/:id')
  @UseGuards(new AppIdGuard('my-pending.storeRequisition.delete'))
  @ApiVersionMinRequest()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete a store requisition',
    description: 'Removes a store requisition that is no longer needed, typically a draft or rejected request that the department has decided to discard rather than resubmit.',
    'x-description-th': 'ลบใบเบิกสินค้าที่ไม่ต้องการ โดยทั่วไปเป็นใบเบิกฉบับร่างหรือที่ถูกปฏิเสธ',
    operationId: 'deletePendingStoreRequisition',
    deprecated: false,
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
        description: 'The store requisition was successfully deleted',
      },
      404: {
        description: 'The store requisition was not found',
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
      MyPendingStoreRequisitionController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.myPendingStoreRequisitionService.delete(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }
}
