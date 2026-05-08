import { Body, Controller, HttpStatus, UseFilters } from '@nestjs/common';
import { StoreRequisitionService } from './store-requisition.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import {
  RejectStoreRequisitionDto,
  ReviewStoreRequisitionDto,
  BaseMicroserviceController,
  MicroservicePayload,
  MicroserviceResponse,
  Result
} from '@/common';
import { StoreRequisitionLogic } from './logic/store-requisition.logic';
import { AllExceptionsFilter } from '@/common/exception/global.filter';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';

@UseFilters(new AllExceptionsFilter())
@Controller()
export class StoreRequisitionController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    StoreRequisitionController.name,
  );
  constructor(
    private readonly storeRequisitionService: StoreRequisitionService,
    private readonly storeRequisitionLogic: StoreRequisitionLogic,
  ) {
    super();
  }

  /**
   * Create audit context from payload
   * สร้างบริบทการตรวจสอบจาก payload
   * @param payload - Microservice payload / ข้อมูล payload จากไมโครเซอร์วิส
   * @returns Audit context object / ออบเจกต์บริบทการตรวจสอบ
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
   * Find a store requisition by ID
   * ค้นหาใบเบิกสินค้ารายการเดียวตาม ID
   * @param payload - Contains id, user_id, bu_code / ประกอบด้วย id, user_id, bu_code
   * @returns Store requisition detail / รายละเอียดใบเบิกสินค้า
   */
  @MessagePattern({
    cmd: 'store-requisition.find-by-id',
    service: 'store-requisition',
  })
  async getById(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'getById', payload },
      StoreRequisitionController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;
    const id = payload.id;
    const userData = payload.userData;

    await this.storeRequisitionService.initializePrismaService(bu_code, user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.storeRequisitionService.findById(id, userData),
    );
    return this.handleResult(result);
  }

  /**
   * Find all store requisitions with pagination
   * ค้นหาใบเบิกสินค้าทั้งหมดพร้อมการแบ่งหน้า
   * @param payload - Contains user_id, bu_code, paginate, userDatas / ประกอบด้วย user_id, bu_code, paginate, userDatas
   * @returns Paginated list of store requisitions / รายการใบเบิกสินค้าแบบแบ่งหน้า
   */
  @MessagePattern({
    cmd: 'store-requisition.find-all',
    service: 'store-requisition',
  })
  async getAll(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'getAll', payload },
      StoreRequisitionController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code as unknown as string[];
    const paginate = payload.paginate;
    const userDatas = payload.userDatas;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.storeRequisitionService.findAll(
        user_id,
        bu_code,
        paginate,
        userDatas,
      ),
    );

    return this.handleMultiPaginatedResult(result);
  }

  /**
   * Create a new store requisition
   * สร้างใบเบิกสินค้าใหม่
   * @param payload - Contains data, user_id, bu_code / ประกอบด้วย data, user_id, bu_code
   * @returns Created store requisition / ใบเบิกสินค้าที่สร้างแล้ว
   */
  @MessagePattern({
    cmd: 'store-requisition.create',
    service: 'store-requisition',
  })
  async create(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'create', payload },
      StoreRequisitionController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.storeRequisitionLogic.create(payload.data, user_id, bu_code),
    );
    return this.handleResult(result, HttpStatus.CREATED);
  }

  /**
   * Submit a store requisition for approval
   * ส่งใบเบิกสินค้าเพื่อขออนุมัติ
   * @param payload - Contains id, payload, user_id, bu_code / ประกอบด้วย id, payload, user_id, bu_code
   * @returns Submitted store requisition / ใบเบิกสินค้าที่ส่งแล้ว
   */
  @MessagePattern({
    cmd: 'store-requisition.submit',
    service: 'store-requisition',
  })
  async submit(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'submit', payload },
      StoreRequisitionController.name,
    );
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.storeRequisitionLogic.submit(
        payload.id,
        payload.payload,
        payload.user_id,
        payload.bu_code,
      ),
    );
    return this.handleResult(result);
  }

  /**
   * Approve a store requisition
   * อนุมัติใบเบิกสินค้า
   * @param payload - Contains id, body, user_id, bu_code / ประกอบด้วย id, body, user_id, bu_code
   * @returns Approved store requisition / ใบเบิกสินค้าที่อนุมัติแล้ว
   */
  @MessagePattern({
    cmd: 'store-requisition.approve',
    service: 'store-requisition',
  })
  async approve(
    @Payload()
    payload: MicroservicePayload,
  ): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'approve', payload },
      StoreRequisitionController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.storeRequisitionLogic.approve(
        payload.id,
        payload.body,
        user_id,
        bu_code,
      ),
    );

    return this.handleResult(result);
  }

  /**
   * Reject a store requisition
   * ปฏิเสธใบเบิกสินค้า
   * @param payload - Contains id, body with rejection reason, user_id, bu_code / ประกอบด้วย id, body พร้อมเหตุผลการปฏิเสธ, user_id, bu_code
   * @returns Rejected store requisition / ใบเบิกสินค้าที่ปฏิเสธแล้ว
   */
  @MessagePattern({
    cmd: 'store-requisition.reject',
    service: 'store-requisition',
  })
  async reject(
    @Payload()
    payload: MicroservicePayload & {
      id: string;
      body: RejectStoreRequisitionDto;
    },
  ): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'reject', payload },
      StoreRequisitionController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;
    const body: RejectStoreRequisitionDto = payload.body;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.storeRequisitionLogic.reject(payload.id, body, user_id, bu_code),
    );

    return this.handleResult(result);
  }

  /**
   * Review a store requisition
   * ตรวจสอบใบเบิกสินค้า
   * @param payload - Contains id, body with review data, user_id, bu_code / ประกอบด้วย id, body พร้อมข้อมูลการตรวจสอบ, user_id, bu_code
   * @returns Reviewed store requisition / ใบเบิกสินค้าที่ตรวจสอบแล้ว
   */
  @MessagePattern({
    cmd: 'store-requisition.review',
    service: 'store-requisition',
  })
  async review(
    @Payload()
    payload: MicroservicePayload & {
      id: string;
      body: ReviewStoreRequisitionDto;
    },
  ): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'review', payload },
      StoreRequisitionController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;
    const body: ReviewStoreRequisitionDto = payload.body;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.storeRequisitionLogic.review(payload.id, body, user_id, bu_code),
    );

    return this.handleResult(result);
  }

  /**
   * Save/update a store requisition
   * บันทึก/แก้ไขใบเบิกสินค้า
   * @param payload - Contains id, data, user_id, bu_code / ประกอบด้วย id, data, user_id, bu_code
   * @returns Updated store requisition / ใบเบิกสินค้าที่แก้ไขแล้ว
   */
  @MessagePattern({
    cmd: 'store-requisition.save',
    service: 'store-requisition',
  })
  async update(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'update', payload },
      StoreRequisitionController.name,
    );
    const id = payload.id;
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;
    const data = payload.data;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.storeRequisitionLogic.save(id, data, user_id, bu_code),
    );
    return this.handleResult(result);
  }

  /**
   * Delete a store requisition
   * ลบใบเบิกสินค้า
   * @param payload - Contains id, user_id, bu_code / ประกอบด้วย id, user_id, bu_code
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @MessagePattern({
    cmd: 'store-requisition.delete',
    service: 'store-requisition',
  })
  async delete(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'delete', payload },
      StoreRequisitionController.name,
    );
    await this.storeRequisitionService.initializePrismaService(
      payload.bu_code,
      payload.user_id,
    );
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.storeRequisitionService.delete(payload.id),
    );
    return this.handleResult(result);
  }

  /**
   * Find all store requisitions filtered by status
   * ค้นหาใบเบิกสินค้าทั้งหมดตามสถานะ
   * @param payload - Contains status, paginate, user_id, bu_code / ประกอบด้วย status, paginate, user_id, bu_code
   * @returns Paginated list of store requisitions by status / รายการใบเบิกสินค้าตามสถานะแบบแบ่งหน้า
   */
  @MessagePattern({
    cmd: 'store-requisition.find-all-by-status',
    service: 'store-requisition',
  })
  async findAllByStatus(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'findAllByStatus', payload },
      StoreRequisitionController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;
    const status = payload.status;
    const paginate = payload.paginate;

    await this.storeRequisitionService.initializePrismaService(bu_code, user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.storeRequisitionService.findAllByStatus(status, paginate),
    );
    return this.handlePaginatedResult(result);
  }

  /**
   * Find all pending store requisitions for the current user
   * ค้นหาใบเบิกสินค้าที่รอดำเนินการของผู้ใช้ปัจจุบัน
   * @param payload - Contains user_id, bu_code, paginate / ประกอบด้วย user_id, bu_code, paginate
   * @returns Paginated list of pending store requisitions / รายการใบเบิกสินค้าที่รอดำเนินการแบบแบ่งหน้า
   */
  @MessagePattern({
    cmd: 'my-pending.store-requisition.find-all',
    service: 'my-pending',
  })
  async findAllMyPending(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'findAllMyPending', payload },
      StoreRequisitionController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;
    const paginate = payload.paginate;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.storeRequisitionService.findAllMyPending(user_id, bu_code, paginate),
    );

    return this.handlePaginatedResult(result);
  }

  /**
   * Count all pending store requisitions for the current user
   * นับจำนวนใบเบิกสินค้าที่รอดำเนินการของผู้ใช้ปัจจุบัน
   * @param payload - Contains user_id, bu_code / ประกอบด้วย user_id, bu_code
   * @returns Count of pending store requisitions / จำนวนใบเบิกสินค้าที่รอดำเนินการ
   */
  @MessagePattern({
    cmd: 'my-pending.store-requisition.find-all.count',
    service: 'my-pending',
  })
  async findAllMyPendingCount(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'findAllMyPendingCount', payload },
      StoreRequisitionController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.storeRequisitionService.findAllMyPendingCount(user_id, bu_code),
    );

    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'store-requisition.get-previous-stages',
    service: 'store-requisition',
  })
  async getPreviousStages(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'getPreviousStages', payload },
      StoreRequisitionController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;
    const sr_id = payload.sr_id;

    await this.storeRequisitionService.initializePrismaService(bu_code, user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.storeRequisitionService.getPreviousStages(sr_id),
    );
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'store-requisition.find-all-workflow-stages-by-sr',
    service: 'store-requisition',
  })
  async findAllWorkflowStagesBySr(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'findAllWorkflowStagesBySr', payload },
      StoreRequisitionController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.storeRequisitionService.findAllWorkflowStagesBySr(user_id, bu_code),
    );
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'store-requisition.find-all-my-pending-stages',
    service: 'store-requisition',
  })
  async findAllMyPendingStages(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'findAllMyPendingStages', payload },
      StoreRequisitionController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;

    await this.storeRequisitionService.initializePrismaService(bu_code, user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.storeRequisitionService.findAllMyPendingStages(),
    );
    return this.handleResult(result);
  }

  /**
   * Print a store requisition via FastReport viewer (micro-report)
   * พิมพ์ใบเบิกสินค้าผ่าน FastReport viewer (micro-report)
   */
  @MessagePattern({
    cmd: 'store-requisition.printToReport',
    service: 'store-requisition',
  })
  async printToReport(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'printToReport', payload }, StoreRequisitionController.name);
    const { user_id, bu_code, id } = payload;
    this.storeRequisitionService.userId = user_id;
    this.storeRequisitionService.bu_code = bu_code;
    await this.storeRequisitionService.initializePrismaService(bu_code, user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.storeRequisitionService.printToReport(id),
    );
    return this.handleResult(result);
  }
}
