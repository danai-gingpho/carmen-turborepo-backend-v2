import { Body, Controller, HttpStatus, UseFilters } from '@nestjs/common';
import { PurchaseRequestService } from './purchase-request.service';
import { MessagePattern } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { RejectPurchaseRequestDto, ReviewPurchaseRequestDto, BaseMicroserviceController, MicroservicePayload, MicroserviceResponse } from '@/common';
import { PurchaseRequestLogic } from './logic/purchase-request.logic';
import { AllExceptionsFilter } from '@/common/exception/global.filter';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { CalculatePurchaseRequestDetail } from './interface/CalculatePurchaseRequestDetail.dto';

@UseFilters(new AllExceptionsFilter())
@Controller()
export class PurchaseRequestController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    PurchaseRequestController.name,
  );
  constructor(
    private readonly purchaseRequestService: PurchaseRequestService,
    private readonly purchaseRequestLogic: PurchaseRequestLogic,
  ) {
    super();
  }

  /**
   * Create an audit context from the microservice payload
   * สร้าง audit context จาก payload ของไมโครเซอร์วิส
   * @param payload - Microservice payload containing tenant and user info / payload ของไมโครเซอร์วิสที่มีข้อมูลผู้เช่าและผู้ใช้
   * @returns Audit context object / ออบเจกต์ audit context
   */
  private createAuditContext(payload: MicroservicePayload): AuditContext {
    return {
      tenant_id: payload.tenant_id || payload.bu_code,
      user_id: payload.user_id,
      request_id: payload.request_id,
      ip_address: payload.ip_address,
      user_agent: payload.user_agent,
    };
  }

  /**
   * Find a purchase request by ID
   * ค้นหาใบขอซื้อรายการเดียวตาม ID
   * @param payload - Payload containing the purchase request ID / payload ที่มี ID ของใบขอซื้อ
   * @returns Purchase request data / ข้อมูลใบขอซื้อ
   */
  @MessagePattern({
    cmd: 'purchase-request.find-by-id',
    service: 'purchase-request',
  })
  async getById(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'getById', payload },
      PurchaseRequestController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;
    const id = payload.id;
    const userData = payload.userData;

    await this.purchaseRequestService.initializePrismaService(bu_code, user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseRequestService.findById(id, userData),
    );
    return this.handleResult(result);
  }

  /**
   * Find all purchase requests with pagination across multiple business units
   * ค้นหาใบขอซื้อทั้งหมดพร้อมการแบ่งหน้าจากหลายหน่วยธุรกิจ
   * @param payload - Payload containing user ID, business unit codes, and pagination / payload ที่มี ID ผู้ใช้ รหัสหน่วยธุรกิจ และการแบ่งหน้า
   * @returns Paginated list of purchase requests / รายการใบขอซื้อที่แบ่งหน้าแล้ว
   */
  @MessagePattern({
    cmd: 'purchase-request.find-all',
    service: 'purchase-request',
  })
  async getAll(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'getAll', payload },
      PurchaseRequestController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code as unknown as string[];
    const paginate = payload.paginate;
    const userDatas: {
      bu_id: string;
      bu_code: string;
      role: string;
      permissions: Record<string, unknown>;
    }[] = payload.userDatas;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseRequestService.findAll(
        user_id,
        bu_code,
        paginate,
        userDatas,
      ),
    );

    return this.handleMultiPaginatedResult(result);
  }

  /**
   * Find all purchase requests pending approval for the current user
   * ค้นหาใบขอซื้อทั้งหมดที่รอการอนุมัติของผู้ใช้ปัจจุบัน
   * @param payload - Payload containing user ID, business unit code, and pagination / payload ที่มี ID ผู้ใช้ รหัสหน่วยธุรกิจ และการแบ่งหน้า
   * @returns Paginated list of pending purchase requests / รายการใบขอซื้อที่รออนุมัติที่แบ่งหน้าแล้ว
   */
  @MessagePattern({
    cmd: 'my-pending.purchase-request.find-all',
    service: 'my-pending',
  })
  async findAllMyPending(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'findAllMyPending', payload },
      PurchaseRequestController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;
    const paginate = payload.paginate;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseRequestService.findAllMyPending(user_id, bu_code, paginate),
    );

    return this.handleMultiPaginatedResult(result);
  }

  /**
   * Get the count of purchase requests pending approval for the current user
   * นับจำนวนใบขอซื้อที่รอการอนุมัติของผู้ใช้ปัจจุบัน
   * @param payload - Payload containing user ID and business unit code / payload ที่มี ID ผู้ใช้และรหัสหน่วยธุรกิจ
   * @returns Count of pending purchase requests / จำนวนใบขอซื้อที่รออนุมัติ
   */
  @MessagePattern({
    cmd: 'my-pending.purchase-request.find-all.count',
    service: 'my-pending',
  })
  async findAllMyPendingCount(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'findAllMyPendingCount', payload },
      PurchaseRequestController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseRequestService.findAllMyPendingCount(user_id, bu_code),
    );

    return this.handleResult(result);
  }

  /**
   * Create a new purchase request
   * สร้างใบขอซื้อใหม่
   * @param payload - Payload containing purchase request data / payload ที่มีข้อมูลใบขอซื้อ
   * @returns Created purchase request / ใบขอซื้อที่สร้างแล้ว
   */
  @MessagePattern({
    cmd: 'purchase-request.create',
    service: 'purchase-request',
  })
  async create(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'create', payload },
      PurchaseRequestController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseRequestLogic.create(payload.data, user_id, bu_code),
    );
    return this.handleResult(result, HttpStatus.CREATED);
  }

  /**
   * Submit a purchase request for approval workflow
   * ส่งใบขอซื้อเข้าสู่ขั้นตอนการอนุมัติ
   * @param payload - Payload containing purchase request ID and submission data / payload ที่มี ID ใบขอซื้อและข้อมูลการส่ง
   * @returns Submission result / ผลลัพธ์การส่ง
   */
  @MessagePattern({
    cmd: 'purchase-request.submit',
    service: 'purchase-request',
  })
  async submit(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'submit', payload },
      PurchaseRequestController.name,
    );
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseRequestLogic.submit(
        payload.id,
        payload.payload,
        payload.user_id,
        payload.bu_code,
      ),
    );
    return this.handleResult(result);
  }

  /**
   * Approve a purchase request through the workflow
   * อนุมัติใบขอซื้อผ่านขั้นตอนการทำงาน
   * @param payload - Payload containing purchase request ID and approval data / payload ที่มี ID ใบขอซื้อและข้อมูลการอนุมัติ
   * @returns Approval result / ผลลัพธ์การอนุมัติ
   */
  @MessagePattern({
    cmd: 'purchase-request.approve',
    service: 'purchase-request',
  })
  async approve(
    @Body()
    payload: MicroservicePayload,
  ): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'approve', payload },
      PurchaseRequestController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseRequestLogic.approve(
        payload.id,
        payload.body,
        user_id,
        bu_code,
      ),
    );

    return this.handleResult(result);
  }

  /**
   * Swipe approve multiple purchase requests
   * อนุมัติใบขอซื้อแบบรวดเร็วหลายรายการ
   */
  @MessagePattern({
    cmd: 'purchase-request.swipe-approve',
    service: 'purchase-request',
  })
  async swipeApprove(
    @Body()
    payload: MicroservicePayload,
  ): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'swipeApprove', payload },
      PurchaseRequestController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;

    const auditContext = this.createAuditContext(payload);
    const results = await runWithAuditContext(auditContext, () =>
      this.purchaseRequestLogic.swipeApprove(
        payload.body.pr_ids,
        user_id,
        bu_code,
      ),
    );

    return this.handleResult({ isOk: () => true, isError: () => false, value: results } as any);
  }

  /**
   * Swipe reject multiple purchase requests
   * ปฏิเสธใบขอซื้อแบบรวดเร็วหลายรายการ
   */
  @MessagePattern({
    cmd: 'purchase-request.swipe-reject',
    service: 'purchase-request',
  })
  async swipeReject(
    @Body()
    payload: MicroservicePayload,
  ): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'swipeReject', payload },
      PurchaseRequestController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;

    const auditContext = this.createAuditContext(payload);
    const results = await runWithAuditContext(auditContext, () =>
      this.purchaseRequestLogic.swipeReject(
        payload.body.pr_ids,
        payload.body.reject_message,
        user_id,
        bu_code,
      ),
    );

    return this.handleResult({ isOk: () => true, isError: () => false, value: results } as any);
  }

  /**
   * Review a purchase request through the workflow
   * ตรวจสอบใบขอซื้อผ่านขั้นตอนการทำงาน
   * @param payload - Payload containing purchase request ID and review data / payload ที่มี ID ใบขอซื้อและข้อมูลการตรวจสอบ
   * @returns Review result / ผลลัพธ์การตรวจสอบ
   */
  @MessagePattern({
    cmd: 'purchase-request.review',
    service: 'purchase-request',
  })
  async review(
    @Body()
    payload: {
      id: string;
      body: ReviewPurchaseRequestDto;
      user_id: string;
      bu_code: string;
      version: string;
    },
  ): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'review', payload },
      PurchaseRequestController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseRequestLogic.review(
        payload.id,
        payload.body,
        user_id,
        bu_code,
      ),
    );

    return this.handleResult(result);
  }

  /**
   * Reject a purchase request through the workflow
   * ปฏิเสธใบขอซื้อผ่านขั้นตอนการทำงาน
   * @param payload - Payload containing purchase request ID and rejection data / payload ที่มี ID ใบขอซื้อและข้อมูลการปฏิเสธ
   * @returns Rejection result / ผลลัพธ์การปฏิเสธ
   */
  @MessagePattern({
    cmd: 'purchase-request.reject',
    service: 'purchase-request',
  })
  async reject(
    @Body()
    payload: MicroservicePayload & {
      id: string;
      body: RejectPurchaseRequestDto;
    },
  ): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'reject', payload },
      PurchaseRequestController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;
    const body: RejectPurchaseRequestDto = payload.body;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseRequestLogic.reject(payload.id, body, user_id, bu_code),
    );

    return this.handleResult(result);
  }

  /**
   * Save (update) a purchase request with header and detail data
   * บันทึก (อัปเดต) ใบขอซื้อพร้อมข้อมูลส่วนหัวและรายละเอียด
   * @param payload - Payload containing purchase request ID and data to save / payload ที่มี ID ใบขอซื้อและข้อมูลที่ต้องการบันทึก
   * @returns Saved purchase request result / ผลลัพธ์การบันทึกใบขอซื้อ
   */
  @MessagePattern({
    cmd: 'purchase-request.save',
    service: 'purchase-request',
  })
  async update(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'update', payload },
      PurchaseRequestController.name,
    );
    const id = payload.id;
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;
    const data = payload.data;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseRequestLogic.save(id, data, user_id, bu_code),
    );
    return this.handleResult(result);
  }

  /**
   * Duplicate existing purchase requests
   * สำเนาใบขอซื้อที่มีอยู่
   * @param payload - Payload containing IDs of purchase requests to duplicate / payload ที่มี ID ของใบขอซื้อที่ต้องการสำเนา
   * @returns Duplicated purchase request(s) / ใบขอซื้อที่สำเนาแล้ว
   */
  @MessagePattern({
    cmd: 'purchase-request.duplicate-pr',
    service: 'purchase-request',
  })
  async duplicatePr(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'duplicatePr', payload },
      PurchaseRequestController.name,
    );
    const body = payload.body;
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseRequestService.duplicatePr(body.ids, user_id, bu_code),
    );
    return this.handleResult(result);
  }

  /**
   * Split a purchase request into multiple requests by detail IDs
   * แยกใบขอซื้อออกเป็นหลายรายการตาม ID ของรายละเอียด
   * @param payload - Payload containing the PR ID and detail IDs to split / payload ที่มี ID ใบขอซื้อและ ID รายละเอียดที่ต้องการแยก
   * @returns Split purchase request result / ผลลัพธ์การแยกใบขอซื้อ
   */
  @MessagePattern({
    cmd: 'purchase-request.split',
    service: 'purchase-request',
  })
  async splitPr(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'splitPr', payload },
      PurchaseRequestController.name,
    );
    const id = payload.id;
    const detailIds = payload.body.detail_ids;
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseRequestService.splitPr(id, detailIds, user_id, bu_code),
    );
    return this.handleResult(result);
  }

  /**
   * Delete a purchase request by ID
   * ลบใบขอซื้อตาม ID
   * @param payload - Payload containing the purchase request ID to delete / payload ที่มี ID ของใบขอซื้อที่ต้องการลบ
   * @returns Deleted purchase request ID / ID ของใบขอซื้อที่ลบแล้ว
   */
  @MessagePattern({
    cmd: 'purchase-request.delete',
    service: 'purchase-request',
  })
  async delete(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'delete', payload },
      PurchaseRequestController.name,
    );
    await this.purchaseRequestService.initializePrismaService(
      payload.bu_code,
      payload.user_id,
    );
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseRequestService.delete(payload.id),
    );
    return this.handleResult(result);
  }

  /**
   * Get previous workflow stages for a purchase request
   * ดึงขั้นตอนอนุมัติก่อนหน้า current_stage ของใบขอซื้อ
   */
  @MessagePattern({
    cmd: 'purchase-request.get-previous-stages',
    service: 'purchase-request',
  })
  async getPreviousStages(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'getPreviousStages', payload },
      PurchaseRequestController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;
    const pr_id = payload.pr_id;

    await this.purchaseRequestService.initializePrismaService(bu_code, user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseRequestService.getPreviousStages(pr_id),
    );
    return this.handleResult(result);
  }

  /**
   * Find all purchase requests filtered by status with pagination
   * ค้นหาใบขอซื้อทั้งหมดตามสถานะพร้อมการแบ่งหน้า
   * @param payload - Payload containing status filter and pagination / payload ที่มีตัวกรองสถานะและการแบ่งหน้า
   * @returns Paginated list of purchase requests filtered by status / รายการใบขอซื้อที่กรองตามสถานะที่แบ่งหน้าแล้ว
   */
  @MessagePattern({
    cmd: 'purchase-request.find-all-by-status',
    service: 'purchase-request',
  })
  async findAllByStatus(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'findAllByStatus', payload },
      PurchaseRequestController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;
    const status = payload.status;
    const paginate = payload.paginate;

    await this.purchaseRequestService.initializePrismaService(bu_code, user_id);
    const auditContext = this.createAuditContext(payload);
    const options = payload.options;
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseRequestService.findAllByStatus(status, paginate, options),
    );
    return this.handlePaginatedResult(result);
  }

  /**
   * Find all workflow stages for purchase requests
   * ค้นหาขั้นตอนการทำงานทั้งหมดสำหรับใบขอซื้อ
   * @param payload - Payload containing user ID and business unit code / payload ที่มี ID ผู้ใช้และรหัสหน่วยธุรกิจ
   * @returns List of workflow stages / รายการขั้นตอนการทำงาน
   */
  @MessagePattern({
    cmd: 'purchase-request.find-all-workflow-stages-by-pr',
    service: 'purchase-request',
  })
  async findAllWorkflowStagesByPr(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'findAllWorkflowStagesByPr', payload },
      PurchaseRequestController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseRequestService.findAllWorkflowStagesByPr(user_id, bu_code),
    );
    return this.handleResult(result);
  }

  /**
   * Find all pending workflow stages for the current user
   * ค้นหาขั้นตอนการทำงานที่รอดำเนินการทั้งหมดของผู้ใช้ปัจจุบัน
   * @param payload - Payload containing user ID and business unit code / payload ที่มี ID ผู้ใช้และรหัสหน่วยธุรกิจ
   * @returns List of pending workflow stages / รายการขั้นตอนการทำงานที่รอดำเนินการ
   */
  @MessagePattern({
    cmd: 'purchase-request.find-all-my-pending-stages',
    service: 'purchase-request',
  })
  async findAllMyPendingStages(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'findAllMyPendingStages', payload },
      PurchaseRequestController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;

    await this.purchaseRequestService.initializePrismaService(bu_code, user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseRequestService.findAllMyPendingStages(),
    );
    return this.handleResult(result);
  }

  /**
   * Export a purchase request to Excel format
   * ส่งออกใบขอซื้อเป็นไฟล์ Excel
   * @param payload - Payload containing the purchase request ID to export / payload ที่มี ID ของใบขอซื้อที่ต้องการส่งออก
   * @returns Excel file buffer and filename / บัฟเฟอร์ไฟล์ Excel และชื่อไฟล์
   */
  @MessagePattern({
    cmd: 'purchase-request.export',
    service: 'purchase-request',
  })
  async exportToExcel(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'exportToExcel', payload },
      PurchaseRequestController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;
    const id = payload.id;

    await this.purchaseRequestService.initializePrismaService(bu_code, user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseRequestService.exportToExcel(id),
    );
    return this.handleResult(result);
  }

  /**
   * Print a purchase request to PDF format
   * พิมพ์ใบขอซื้อเป็นไฟล์ PDF
   * @param payload - Payload containing the purchase request ID to print / payload ที่มี ID ของใบขอซื้อที่ต้องการพิมพ์
   * @returns PDF file buffer and filename / บัฟเฟอร์ไฟล์ PDF และชื่อไฟล์
   */
  @MessagePattern({
    cmd: 'purchase-request.print',
    service: 'purchase-request',
  })
  async printToPdf(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'printToPdf', payload },
      PurchaseRequestController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;
    const id = payload.id;

    await this.purchaseRequestService.initializePrismaService(bu_code, user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseRequestService.printToPdf(id),
    );
    return this.handleResult(result);
  }

  /**
   * Print a purchase request via FastReport viewer (micro-report)
   * พิมพ์ใบขอซื้อผ่าน FastReport viewer (micro-report)
   * @param payload - Payload containing the purchase request ID / payload ที่มี ID ของใบขอซื้อ
   * @returns { viewer_url } for the rendered report / URL ของรายงานที่ render แล้ว
   */
  @MessagePattern({
    cmd: 'purchase-request.printToReport',
    service: 'purchase-request',
  })
  async printToReport(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'printToReport', payload },
      PurchaseRequestController.name,
    );
    const { user_id, bu_code, id } = payload;
    await this.purchaseRequestService.initializePrismaService(bu_code, user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseRequestService.printToReport(id),
    );
    return this.handleResult(result);
  }

  /**
   * Find dimensions associated with a purchase request detail
   * ค้นหามิติที่เกี่ยวข้องกับรายละเอียดใบขอซื้อ
   * @param payload - Payload containing the detail ID / payload ที่มี ID ของรายละเอียด
   * @returns Dimension data for the detail / ข้อมูลมิติของรายละเอียด
   */
  @MessagePattern({
    cmd: 'purchase-request.find-dimensions-by-detail-id',
    service: 'purchase-request',
  })
  async findDimensionsByDetailId(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'findDimensionsByDetailId', payload },
      PurchaseRequestController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;
    const detail_id = payload.detail_id;
    const version = payload.version;

    await this.purchaseRequestService.initializePrismaService(bu_code, user_id);
    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () =>
      this.purchaseRequestService.findDimensionsByDetailId(detail_id),
    );
  }

  /**
   * Find price history for a purchase request detail
   * ค้นหาประวัติราคาของรายละเอียดใบขอซื้อ
   * @param payload - Payload containing the detail ID / payload ที่มี ID ของรายละเอียด
   * @returns Price history data for the detail / ข้อมูลประวัติราคาของรายละเอียด
   */
  @MessagePattern({
    cmd: 'purchase-request.find-history-by-detail-id',
    service: 'purchase-request',
  })
  async findHistoryByDetailId(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'findHistoryByDetailId', payload },
      PurchaseRequestController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;
    const detail_id = payload.detail_id;
    const version = payload.version;

    await this.purchaseRequestService.initializePrismaService(bu_code, user_id);
    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () =>
      this.purchaseRequestService.findHistoryByDetailId(detail_id),
    );
  }

  /**
   * Get calculated price information for a purchase request detail
   * ดึงข้อมูลราคาที่คำนวณแล้วสำหรับรายละเอียดใบขอซื้อ
   * @param payload - Payload containing detail ID and calculation parameters / payload ที่มี ID รายละเอียดและพารามิเตอร์การคำนวณ
   * @returns Calculated price info / ข้อมูลราคาที่คำนวณแล้ว
   */
  @MessagePattern({
    cmd: 'purchase-request.get-calculate-price-info-by-detail-id',
    service: 'purchase-request',
  })
  async findCalculatePriceInfoByDetailId(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'findCalculatePriceInfoByDetailId', payload },
      PurchaseRequestController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;
    const detail_id = payload.detail_id;
    const data: CalculatePurchaseRequestDetail = payload.data;
    const version = payload.version;

    await this.purchaseRequestService.initializePrismaService(bu_code, user_id);
    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () =>
      this.purchaseRequestService.findCalculatePriceInfoByDetailId(
        detail_id,
        data,
      ),
    );
  }

  /**
   * Regenerate base_net_amount, base_total_amount on tb_purchase_request from
   * detail rows. Recomputes one PR if payload.id is provided, otherwise all
   * non-deleted PRs in tenant.
   */
  @MessagePattern({
    cmd: 'purchase-request.regenerate-totals',
    service: 'purchase-request',
  })
  async regenerateTotals(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'regenerateTotals', payload },
      PurchaseRequestController.name,
    );
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const id = payload.id as string | undefined;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseRequestService.regenerateTotals(user_id, tenant_id, id),
    );
    return this.handleResult(result);
  }
}
