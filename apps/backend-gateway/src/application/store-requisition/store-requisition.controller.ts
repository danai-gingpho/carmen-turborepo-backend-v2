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
import { StoreRequisitionService } from './store-requisition.service';
import {
  ApiTags,
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import {
  CreateStoreRequisitionSwaggerDto,
  UpdateStoreRequisitionSwaggerDto,
  SubmitStoreRequisitionSwaggerDto,
  ApproveStoreRequisitionSwaggerDto,
  RejectStoreRequisitionSwaggerDto,
  ReviewStoreRequisitionSwaggerDto,
} from './swagger/request';
import {
  ApiVersionMinRequest,
  ApiUserFilterQueries,
} from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { IPaginateQuery, PaginateQuery } from 'src/shared-dto/paginate.dto';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import {
  BaseHttpController,
  Serialize,
  StoreRequisitionDetailResponseSchema,
  StoreRequisitionListItemResponseSchema,
  StoreRequisitionMutationResponseSchema,
  CreateStoreRequisitionDto,
  UpdateStoreRequisitionDto,
  SubmitStoreRequisitionDto,
  RejectStoreRequisitionDto,
  ReviewStoreRequisitionDto,
  ApproveStoreRequisitionByStageRoleDto,
} from '@/common';

@Controller('api')
@ApiTags('Procurement: Store Requisitions')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class StoreRequisitionController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    StoreRequisitionController.name,
  );

  constructor(
    private readonly storeRequisitionService: StoreRequisitionService,
  ) {
    super();
  }

  /**
   * Retrieve a store requisition by ID with full details.
   * ค้นหาใบเบิกสินค้าเดียวตาม ID พร้อมรายละเอียดทั้งหมด
   * @param id - Store requisition ID / รหัสใบเบิกสินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Store requisition with details / ใบเบิกสินค้าพร้อมรายละเอียด
   */
  @Get('/:bu_code/store-requisition/:id')
  @UseGuards(new AppIdGuard('storeRequisition.findOne'))
  @Serialize(StoreRequisitionDetailResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get a store requisition by ID',
    description: 'Retrieves the full details of a store requisition including requested items, quantities, requesting department, and current approval status. Used to review an internal stock request before approving or issuing items from the store.',
    'x-description-th': 'ค้นหาใบเบิกสินค้าตาม ID พร้อมรายละเอียดทั้งหมด รวมถึงรายการสินค้าที่ขอเบิก จำนวน แผนกที่ขอ และสถานะการอนุมัติปัจจุบัน',
    operationId: 'findOneStoreRequisition',
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
        description: 'The store requisition was successfully retrieved',
      },
      404: {
        description: 'The store requisition was not found',
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
      StoreRequisitionController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const buDatasHeader = (req.headers as unknown as Record<string, string>)['x-bu-datas'];
    const userDatas: {
      bu_id: string;
      bu_code: string;
      role: string;
      permissions: Record<string, string[]>;
    }[] = buDatasHeader ? JSON.parse(buDatasHeader) : [];
    const userData = userDatas.find((ud) => ud.bu_code === bu_code);
    const result = await this.storeRequisitionService.findOne(
      id,
      user_id,
      bu_code,
      userData,
      version,
    );
    this.respond(res, result);
  }

  /**
   * List all store requisitions with pagination and filtering.
   * ค้นหาใบเบิกสินค้าทั้งหมดพร้อมการแบ่งหน้าและตัวกรอง
   * @param query - Pagination and filter parameters / พารามิเตอร์การแบ่งหน้าและตัวกรอง
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated list of store requisitions / ใบเบิกสินค้าพร้อมการแบ่งหน้า
   */
  @Get('store-requisition')
  @UseGuards(new AppIdGuard('storeRequisition.findAll'))
  @Serialize(StoreRequisitionListItemResponseSchema)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiOperation({
    summary: 'Get all store requisitions',
    description: 'Lists all store requisitions across business units with pagination and filtering. Used by department staff to track their internal stock requests and by store managers to view pending issuance requests.',
    'x-description-th': 'แสดงรายการใบเบิกสินค้าทั้งหมดพร้อมการแบ่งหน้าและตัวกรอง ใช้โดยเจ้าหน้าที่แผนกเพื่อติดตามคำขอเบิกสินค้าภายใน',
    operationId: 'findAllStoreRequisitions',
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
      StoreRequisitionController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const bu_code = query.bu_code
      ? Array.isArray(query.bu_code)
        ? query.bu_code
        : [query.bu_code]
      : [];
    const buDatasHeader = (req.headers as unknown as Record<string, string>)['x-bu-datas'];
    const userDatas: {
      bu_id: string;
      bu_code: string;
      role: string;
      permissions: Record<string, string[]>;
    }[] = buDatasHeader ? JSON.parse(buDatasHeader) : [];
    const result = await this.storeRequisitionService.findAll(
      user_id,
      bu_code,
      paginate,
      userDatas,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Create a new store requisition in draft status.
   * สร้างใบเบิกสินค้าใหม่ในสถานะร่าง
   * @param createDto - Store requisition creation data / ข้อมูลสำหรับสร้างใบเบิกสินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Created store requisition / ใบเบิกสินค้าที่สร้างแล้ว
   */
  @Post(':bu_code/store-requisition')
  @UseGuards(new AppIdGuard('storeRequisition.create'))
  @Serialize(StoreRequisitionMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Create a store requisition',
    description: 'Creates a new internal store requisition for a department to request items from inventory (e.g., kitchen supplies, cleaning materials, office supplies). The SR starts in draft status and must be submitted for approval before items can be issued.',
    'x-description-th': 'สร้างใบเบิกสินค้าใหม่ในสถานะร่าง สำหรับแผนกที่ต้องการขอเบิกสินค้าจากคลัง ต้องส่งเข้าขั้นตอนอนุมัติก่อนจึงจะเบิกสินค้าได้',
    operationId: 'createStoreRequisition',
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
        description: 'The store requisition was successfully created',
      },
      400: {
        description: 'Invalid request body',
      },
    },
  } as any)
  @ApiBody({ type: CreateStoreRequisitionSwaggerDto })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createDto: CreateStoreRequisitionDto,
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
      StoreRequisitionController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.storeRequisitionService.create(
      { ...createDto },
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Update an existing store requisition before submission.
   * อัปเดตใบเบิกสินค้าที่มีอยู่ก่อนส่งอนุมัติ
   * @param id - Store requisition ID / รหัสใบเบิกสินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param updateDto - Store requisition update data / ข้อมูลสำหรับอัปเดตใบเบิกสินค้า
   * @param version - API version / เวอร์ชัน API
   * @returns Updated store requisition / ใบเบิกสินค้าที่อัปเดตแล้ว
   */
  @Put(':bu_code/store-requisition/:id')
  @UseGuards(new AppIdGuard('storeRequisition.update'))
  @Serialize(StoreRequisitionMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Update a store requisition',
    description: 'Modifies a store requisition to adjust requested items, quantities, or other details. Used by department staff to refine their internal stock request before submitting for approval.',
    'x-description-th': 'อัปเดตใบเบิกสินค้าเพื่อปรับรายการสินค้า จำนวน หรือรายละเอียดอื่น ๆ ก่อนส่งเข้าขั้นตอนอนุมัติ',
    operationId: 'updateStoreRequisition',
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
        description: 'The store requisition was successfully updated',
      },
      404: {
        description: 'The store requisition was not found',
      },
    },
  } as any)
  @ApiBody({ type: UpdateStoreRequisitionSwaggerDto })
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: UpdateStoreRequisitionDto,
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
      StoreRequisitionController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.storeRequisitionService.update(
      id,
      { ...updateDto },
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Submit a store requisition into the approval workflow.
   * ส่งใบเบิกสินค้าเข้าสู่ขั้นตอนการอนุมัติ
   * @param id - Store requisition ID / รหัสใบเบิกสินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param payload - Submission data / ข้อมูลการส่ง
   * @param version - API version / เวอร์ชัน API
   * @returns Submitted store requisition / ใบเบิกสินค้าที่ส่งแล้ว
   */
  @Patch(':bu_code/store-requisition/:id/submit')
  @UseGuards(new AppIdGuard('storeRequisition.submit'))
  @Serialize(StoreRequisitionMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Submit a store requisition',
    description: 'Submits a draft store requisition into the approval workflow, making it visible to approvers. Once submitted, the SR moves from draft to pending status and enters the configured approval chain.',
    'x-description-th': 'ส่งใบเบิกสินค้าฉบับร่างเข้าสู่ขั้นตอนอนุมัติ สถานะจะเปลี่ยนจากร่างเป็นรออนุมัติ',
    operationId: 'submitStoreRequisition',
  } as any)
  @ApiBody({ type: SubmitStoreRequisitionSwaggerDto })
  @HttpCode(HttpStatus.OK)
  async submit(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Body() payload: SubmitStoreRequisitionDto,
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
      StoreRequisitionController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.storeRequisitionService.submit(
      id,
      { ...payload },
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Approve a store requisition at the current workflow stage.
   * อนุมัติใบเบิกสินค้าในขั้นตอนปัจจุบันของเวิร์กโฟลว์
   * @param id - Store requisition ID / รหัสใบเบิกสินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param payload - Approval data / ข้อมูลการอนุมัติ
   * @param version - API version / เวอร์ชัน API
   * @returns Approved store requisition / ใบเบิกสินค้าที่อนุมัติแล้ว
   */
  @Patch(':bu_code/store-requisition/:id/approve')
  @UseGuards(new AppIdGuard('storeRequisition.approve'))
  @Serialize(StoreRequisitionMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Approve a store requisition',
    description: 'Advances a store requisition through its approval workflow at the current stage. Once fully approved, items can be issued from the store to the requesting department, triggering inventory deductions.',
    'x-description-th': 'อนุมัติใบเบิกสินค้าในขั้นตอนปัจจุบันของเวิร์กโฟลว์ เมื่ออนุมัติครบถ้วนจะเบิกสินค้าจากคลังและหักยอดสินค้าคงคลัง',
    operationId: 'approveStoreRequisition',
  } as any)
  @ApiBody({ type: ApproveStoreRequisitionSwaggerDto })
  @HttpCode(HttpStatus.OK)
  async approve(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Body() payload: ApproveStoreRequisitionByStageRoleDto,
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
      StoreRequisitionController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.storeRequisitionService.approve(
      id,
      { ...payload },
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Reject a store requisition with a reason.
   * ปฏิเสธใบเบิกสินค้าพร้อมเหตุผล
   * @param id - Store requisition ID / รหัสใบเบิกสินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param payload - Rejection data with reason / ข้อมูลการปฏิเสธพร้อมเหตุผล
   * @param version - API version / เวอร์ชัน API
   * @returns Rejected store requisition / ใบเบิกสินค้าที่ปฏิเสธแล้ว
   */
  @Patch(':bu_code/store-requisition/:id/reject')
  @UseGuards(new AppIdGuard('storeRequisition.reject'))
  @Serialize(StoreRequisitionMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Reject a store requisition',
    description: 'Rejects a store requisition at the current approval stage, preventing items from being issued. Used when the request exceeds budget, items are unavailable, or the request is not justified.',
    'x-description-th': 'ปฏิเสธใบเบิกสินค้าในขั้นตอนอนุมัติปัจจุบัน ใช้เมื่อคำขอเกินงบประมาณ สินค้าไม่พร้อม หรือคำขอไม่มีเหตุผลเพียงพอ',
    operationId: 'rejectStoreRequisition',
  } as any)
  @ApiBody({ type: RejectStoreRequisitionSwaggerDto })
  @HttpCode(HttpStatus.OK)
  async reject(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Body() payload: RejectStoreRequisitionDto,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'reject',
        id,
        payload,
        version,
      },
      StoreRequisitionController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.storeRequisitionService.reject(
      id,
      { ...payload },
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Send a store requisition back for review at a previous stage.
   * ส่งใบเบิกสินค้ากลับไปตรวจสอบในขั้นตอนก่อนหน้า
   * @param id - Store requisition ID / รหัสใบเบิกสินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param payload - Review data / ข้อมูลการตรวจสอบ
   * @param version - API version / เวอร์ชัน API
   * @returns Reviewed store requisition / ใบเบิกสินค้าที่ส่งกลับตรวจสอบ
   */
  @Patch(':bu_code/store-requisition/:id/review')
  @UseGuards(new AppIdGuard('storeRequisition.review'))
  @Serialize(StoreRequisitionMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Review a store requisition',
    description: 'Returns a store requisition to a previous workflow stage for corrections, such as adjusting quantities or replacing unavailable items. Allows approvers to request changes before granting final authorization.',
    'x-description-th': 'ส่งใบเบิกสินค้ากลับไปยังขั้นตอนก่อนหน้าเพื่อแก้ไข เช่น ปรับจำนวนหรือเปลี่ยนสินค้าที่ไม่พร้อมใช้งาน',
    operationId: 'reviewStoreRequisition',
  } as any)
  @ApiBody({ type: ReviewStoreRequisitionSwaggerDto })
  @HttpCode(HttpStatus.OK)
  async review(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Body() payload: ReviewStoreRequisitionDto,
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
      StoreRequisitionController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.storeRequisitionService.review(
      id,
      { ...payload },
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Delete a store requisition.
   * ลบใบเบิกสินค้า
   * @param id - Store requisition ID / รหัสใบเบิกสินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @Delete(':bu_code/store-requisition/:id')
  @UseGuards(new AppIdGuard('storeRequisition.delete'))
  @Serialize(StoreRequisitionMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Delete a store requisition',
    description: 'Removes a store requisition that is no longer needed. Typically used for draft SRs that were created in error or when the department no longer requires the requested items.',
    'x-description-th': 'ลบใบเบิกสินค้าที่ไม่ต้องการ โดยทั่วไปใช้สำหรับใบเบิกฉบับร่างที่สร้างผิดพลาด',
    operationId: 'deleteStoreRequisition',
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
      StoreRequisitionController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.storeRequisitionService.delete(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  // ==================== Mobile-specific endpoints ====================

  /**
   * Get workflow permissions for the current user on a store requisition.
   * ดึงสิทธิ์เวิร์กโฟลว์ของผู้ใช้ปัจจุบันสำหรับใบเบิกสินค้า
   * @param id - Store requisition ID / รหัสใบเบิกสินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Available workflow actions / การดำเนินการเวิร์กโฟลว์ที่ใช้ได้
   */
  @Get(':bu_code/store-requisition/:id/workflow-permission')
  @UseGuards(new AppIdGuard('storeRequisition.getWorkflowPermission'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get workflow permission for a store requisition',
    description: 'Checks what workflow actions (approve, reject, review) the current user is authorized to perform on a specific store requisition based on their role and the SR current stage.',
    'x-description-th': 'ตรวจสอบสิทธิ์การดำเนินการเวิร์กโฟลว์ (อนุมัติ ปฏิเสธ ส่งกลับตรวจสอบ) ที่ผู้ใช้ปัจจุบันสามารถทำได้กับใบเบิกสินค้านี้',
    operationId: 'getStoreRequisitionWorkflowPermission',
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Store Requisition ID' },
      { name: 'bu_code', in: 'path', required: true, description: 'Business Unit Code' },
    ],
    responses: {
      200: { description: 'Workflow permission retrieved successfully' },
      404: { description: 'Store requisition not found' },
    },
  } as any)
  @HttpCode(HttpStatus.OK)
  async getWorkflowPermission(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'getWorkflowPermission',
        id,
        version,
      },
      StoreRequisitionController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.storeRequisitionService.getWorkflowPermission(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Get all workflow stages for store requisitions in a business unit
   * แสดงขั้นตอนเวิร์กโฟลว์การอนุมัติสำหรับใบเบิกสินค้าในหน่วยธุรกิจ
   */
  @Get(':bu_code/store-requisition/workflow-stages')
  @UseGuards(new AppIdGuard('storeRequisition.findAll'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all workflow stages for store requisitions',
    description: 'Returns the configured approval workflow stages (e.g., HOD, Issuer) for store requisitions in this business unit. Used to display workflow progress and filter by stage.',
    operationId: 'findAllWorkflowStagesBySr',
    'x-description-th': 'แสดงขั้นตอนเวิร์กโฟลว์การอนุมัติสำหรับใบเบิกสินค้าในหน่วยธุรกิจ ใช้เพื่อแสดงความคืบหน้าและกรองตามขั้นตอน',
  } as any)
  @ApiResponse({ status: 200, description: 'Workflow stages retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Workflow stages not found' })
  async findAllWorkflowStagesBySr(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'findAllWorkflowStagesBySr', version },
      StoreRequisitionController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.storeRequisitionService.findAllWorkflowStagesBySr(
      user_id, bu_code, version,
    );
    this.respond(res, result);
  }

  /**
   * Get the list of previous workflow steps for review targeting.
   * ดึงรายการขั้นตอนเวิร์กโฟลว์ก่อนหน้าสำหรับการส่งกลับตรวจสอบ
   * @param id - Store requisition ID / รหัสใบเบิกสินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns List of previous workflow steps / รายการขั้นตอนเวิร์กโฟลว์ก่อนหน้า
   */
  @Get(':bu_code/store-requisition/:id/workflow-previous-step-list')
  @UseGuards(new AppIdGuard('storeRequisition.getWorkflowPreviousStepList'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get workflow previous step list for a store requisition',
    description: 'Returns the list of earlier workflow stages that a store requisition can be sent back to for review. Used to populate the review target selection when an approver needs to return the SR for corrections.',
    'x-description-th': 'ดึงรายการขั้นตอนเวิร์กโฟลว์ก่อนหน้าที่สามารถส่งใบเบิกสินค้ากลับไปตรวจสอบได้',
    operationId: 'getStoreRequisitionWorkflowPreviousStepList',
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Store Requisition ID' },
      { name: 'bu_code', in: 'path', required: true, description: 'Business Unit Code' },
    ],
    responses: {
      200: { description: 'Workflow previous step list retrieved successfully' },
      404: { description: 'Store requisition not found' },
    },
  } as any)
  @HttpCode(HttpStatus.OK)
  async getWorkflowPreviousStepList(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'getWorkflowPreviousStepList',
        id,
        version,
      },
      StoreRequisitionController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.storeRequisitionService.getWorkflowPreviousStepList(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Print a store requisition via FastReport viewer (micro-report)
   * พิมพ์ใบเบิกสินค้าผ่าน FastReport viewer (micro-report)
   */
  @Get(':bu_code/store-requisition/:id/print-viewer')
  @UseGuards(new AppIdGuard('storeRequisition.print'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Print store requisition via FastReport viewer',
    description:
      'Sends SR data + signature config to micro-report which generates FastReport XML and returns a viewer URL.',
    operationId: 'printStoreRequisitionViewer',
    'x-description-th': 'ส่งข้อมูล SR + signature ไป micro-report เพื่อสร้าง FastReport XML แล้วคืน viewer URL',
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
      StoreRequisitionController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.storeRequisitionService.printToReport(id, user_id, bu_code);
    this.respond(res, result);
  }
}
