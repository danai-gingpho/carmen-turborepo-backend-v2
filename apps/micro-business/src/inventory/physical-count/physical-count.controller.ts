import { Controller, HttpStatus } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PhysicalCountService } from './physical-count.service';
import {
  IPhysicalCountCreate,
  IPhysicalCountSave,
  IPhysicalCountSubmit,
  IPhysicalCountDetailCommentCreate,
  IPhysicalCountDetailCommentUpdate,
  IPhysicalCountDetailCommentAttachment,
} from './interface/physical-count.interface';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController, MicroservicePayload, MicroserviceResponse } from '@/common';

@Controller()
export class PhysicalCountController extends BaseMicroserviceController {
  private readonly logger = new BackendLogger(PhysicalCountController.name);

  constructor(private readonly physicalCountService: PhysicalCountService) {
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
   * Find a physical count by ID
   * ค้นหาการตรวจนับสินค้ารายการเดียวตาม ID
   * @param payload - Contains id, user_id, tenant_id / ประกอบด้วย id, user_id, tenant_id
   * @returns Physical count detail / รายละเอียดการตรวจนับสินค้า
   */
  @MessagePattern({ cmd: 'physical-count.findOne', service: 'physical-count' })
  async findOne(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findOne', payload }, PhysicalCountController.name);
    const id = payload.id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.physicalCountService.findOne(id, user_id, tenant_id),
    );
    return this.handleResult(result);
  }

  /**
   * Find all physical counts with pagination
   * ค้นหาการตรวจนับสินค้าทั้งหมดพร้อมการแบ่งหน้า
   * @param payload - Contains user_id, tenant_id, paginate, location_ids, period_id / ประกอบด้วย user_id, tenant_id, paginate, location_ids, period_id
   * @returns Paginated list of physical counts / รายการตรวจนับสินค้าแบบแบ่งหน้า
   */
  @MessagePattern({ cmd: 'physical-count.findAll', service: 'physical-count' })
  async findAll(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findAll', payload }, PhysicalCountController.name);
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const paginate = payload.paginate;
    const location_ids: string[] = payload.location_ids || [];
    const period_id: string | undefined = payload.period_id;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.physicalCountService.findAll(user_id, tenant_id, paginate, location_ids, period_id),
    );
    return this.handlePaginatedResult(result);
  }

  /**
   * Create a new physical count
   * สร้างการตรวจนับสินค้าใหม่
   * @param payload - Contains data, user_id, tenant_id / ประกอบด้วย data, user_id, tenant_id
   * @returns Created physical count / การตรวจนับสินค้าที่สร้างแล้ว
   */
  @MessagePattern({ cmd: 'physical-count.create', service: 'physical-count' })
  async create(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'create', payload }, PhysicalCountController.name);
    const data: IPhysicalCountCreate = payload.data;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.physicalCountService.create(data, user_id, tenant_id),
    );
    return this.handleResult(result, HttpStatus.CREATED);
  }

  /**
   * Refresh product list for a physical count
   * รีเฟรชรายการสินค้าในการตรวจนับสินค้า
   * @param payload - Contains id, user_id, tenant_id / ประกอบด้วย id, user_id, tenant_id
   * @returns Refreshed physical count with details / การตรวจนับสินค้าที่รีเฟรชแล้วพร้อมรายละเอียด
   */
  @MessagePattern({ cmd: 'physical-count.refresh', service: 'physical-count' })
  async refresh(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'refresh', payload }, PhysicalCountController.name);
    const id = payload.id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.physicalCountService.refresh(id, user_id, tenant_id),
    );
    return this.handleResult(result);
  }

  /**
   * Save physical count data
   * บันทึกข้อมูลการตรวจนับสินค้า
   * @param payload - Contains id, data, user_id, tenant_id / ประกอบด้วย id, data, user_id, tenant_id
   * @returns Saved physical count / การตรวจนับสินค้าที่บันทึกแล้ว
   */
  @MessagePattern({ cmd: 'physical-count.save-items', service: 'physical-count' })
  async save(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'save', payload }, PhysicalCountController.name);
    const body = payload.data || {};
    const data: IPhysicalCountSave = { id: payload.id, details: body.items || [] };
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.physicalCountService.save(data, user_id, tenant_id),
    );
    return this.handleResult(result);
  }

  /**
   * Review physical count items
   * ตรวจสอบรายการตรวจนับสินค้า
   * @param payload - Contains id, data, user_id, tenant_id / ประกอบด้วย id, data, user_id, tenant_id
   * @returns Review result / ผลลัพธ์การตรวจสอบ
   */
  @MessagePattern({ cmd: 'physical-count.review-items', service: 'physical-count' })
  async reviewItems(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'reviewItems', payload }, PhysicalCountController.name);
    const id = payload.id;
    const data = payload.data;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.physicalCountService.reviewItems(id, data, user_id, tenant_id),
    );
    return this.handleResult(result);
  }

  /**
   * Get physical count review details
   * ดึงรายละเอียดการตรวจสอบการตรวจนับสินค้า
   * @param payload - Contains id, user_id, tenant_id / ประกอบด้วย id, user_id, tenant_id
   * @returns Physical count review detail / รายละเอียดการตรวจสอบการตรวจนับ
   */
  @MessagePattern({ cmd: 'physical-count.get-review', service: 'physical-count' })
  async getReview(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'getReview', payload }, PhysicalCountController.name);
    const id = payload.id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.physicalCountService.findOne(id, user_id, tenant_id),
    );
    return this.handleResult(result);
  }

  /**
   * Submit a physical count for processing
   * ส่งการตรวจนับสินค้าเพื่อดำเนินการ
   * @param payload - Contains id, user_id, tenant_id / ประกอบด้วย id, user_id, tenant_id
   * @returns Submitted physical count / การตรวจนับสินค้าที่ส่งแล้ว
   */
  @MessagePattern({ cmd: 'physical-count.submit', service: 'physical-count' })
  async submit(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'submit', payload }, PhysicalCountController.name);
    const data: IPhysicalCountSubmit = { id: payload.id };
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.physicalCountService.submit(data, user_id, tenant_id),
    );
    return this.handleResult(result);
  }

  /**
   * Delete a physical count
   * ลบการตรวจนับสินค้า
   * @param payload - Contains id, user_id, tenant_id / ประกอบด้วย id, user_id, tenant_id
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @MessagePattern({ cmd: 'physical-count.delete', service: 'physical-count' })
  async delete(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'delete', payload }, PhysicalCountController.name);
    const id = payload.id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.physicalCountService.delete(id, user_id, tenant_id),
    );
    return this.handleResult(result);
  }

  // ==================== Detail Comment Endpoints ====================

  /**
   * Find all comments for a physical count detail
   * ค้นหาความคิดเห็นทั้งหมดของรายละเอียดการตรวจนับ
   * @param payload - Contains physical_count_detail_id, user_id, tenant_id / ประกอบด้วย physical_count_detail_id, user_id, tenant_id
   * @returns List of detail comments / รายการความคิดเห็นของรายละเอียด
   */
  @MessagePattern({ cmd: 'physical-count-detail-comment.find-all-by-physical-count-detail-id', service: 'physical-count' })
  async findDetailComments(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findDetailComments', payload }, PhysicalCountController.name);
    const physical_count_detail_id = payload.physical_count_detail_id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const paginate = payload.paginate;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.physicalCountService.findDetailComments(physical_count_detail_id, user_id, tenant_id, paginate),
    );
    return this.handlePaginatedResult(result);
  }

  /**
   * Find a physical-count-detail comment by ID
   * ค้นหาความคิดเห็นของรายละเอียดการตรวจนับด้วย ID
   */
  @MessagePattern({ cmd: 'physical-count-detail-comment.find-by-id', service: 'physical-count' })
  async findDetailCommentById(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findDetailCommentById', payload }, PhysicalCountController.name);
    const id = payload.id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.physicalCountService.findDetailCommentById(id, user_id, tenant_id),
    );
    return this.handleResult(result);
  }

  /**
   * Create a comment on a physical count detail
   * สร้างความคิดเห็นในรายละเอียดการตรวจนับ
   * @param payload - Contains data, user_id, tenant_id / ประกอบด้วย data, user_id, tenant_id
   * @returns Created comment / ความคิดเห็นที่สร้างแล้ว
   */
  @MessagePattern({ cmd: 'physical-count-detail-comment.create', service: 'physical-count' })
  async createDetailComment(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'createDetailComment', payload }, PhysicalCountController.name);
    const data: IPhysicalCountDetailCommentCreate = payload.data;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.physicalCountService.createDetailComment(data, user_id, tenant_id),
    );
    return this.handleResult(result, HttpStatus.CREATED);
  }

  /**
   * Update a comment on a physical count detail
   * แก้ไขความคิดเห็นในรายละเอียดการตรวจนับ
   * @param payload - Contains id, data, user_id, tenant_id / ประกอบด้วย id, data, user_id, tenant_id
   * @returns Updated comment / ความคิดเห็นที่แก้ไขแล้ว
   */
  @MessagePattern({ cmd: 'physical-count-detail-comment.update', service: 'physical-count' })
  async updateDetailComment(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'updateDetailComment', payload }, PhysicalCountController.name);
    const data: IPhysicalCountDetailCommentUpdate = { id: payload.id, ...payload.data };
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.physicalCountService.updateDetailComment(data, user_id, tenant_id),
    );
    return this.handleResult(result);
  }

  /**
   * Delete a comment on a physical count detail
   * ลบความคิดเห็นในรายละเอียดการตรวจนับ
   * @param payload - Contains id, user_id, tenant_id / ประกอบด้วย id, user_id, tenant_id
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @MessagePattern({ cmd: 'physical-count-detail-comment.delete', service: 'physical-count' })
  async deleteDetailComment(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'deleteDetailComment', payload }, PhysicalCountController.name);
    const id = payload.id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.physicalCountService.deleteDetailComment(id, user_id, tenant_id),
    );
    return this.handleResult(result);
  }

  /**
   * Add an attachment to a physical-count-detail comment
   * เพิ่มไฟล์แนบให้กับความคิดเห็นในรายละเอียดการตรวจนับ
   */
  @MessagePattern({ cmd: 'physical-count-detail-comment.add-attachment', service: 'physical-count' })
  async addAttachmentToDetailComment(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'addAttachmentToDetailComment', payload }, PhysicalCountController.name);
    const id = payload.id;
    const attachment: IPhysicalCountDetailCommentAttachment = payload.attachment;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.physicalCountService.addAttachmentToDetailComment(id, attachment, user_id, tenant_id),
    );
    return this.handleResult(result);
  }

  /**
   * Remove an attachment from a physical-count-detail comment
   * ลบไฟล์แนบออกจากความคิดเห็นในรายละเอียดการตรวจนับ
   */
  @MessagePattern({ cmd: 'physical-count-detail-comment.remove-attachment', service: 'physical-count' })
  async removeAttachmentFromDetailComment(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'removeAttachmentFromDetailComment', payload }, PhysicalCountController.name);
    const id = payload.id;
    const fileToken = payload.fileToken;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.physicalCountService.removeAttachmentFromDetailComment(id, fileToken, user_id, tenant_id),
    );
    return this.handleResult(result);
  }

  /**
   * Print a physical count via FastReport viewer (micro-report)
   * พิมพ์ใบนับสินค้าผ่าน FastReport viewer (micro-report)
   */
  @MessagePattern({
    cmd: 'physical-count.printToReport',
    service: 'physical-count',
  })
  async printToReport(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'printToReport', payload }, PhysicalCountController.name);
    const { user_id, bu_code, id } = payload;
    const tenant_id = payload.tenant_id || bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.physicalCountService.printToReport(id, user_id, tenant_id),
    );
    return this.handleResult(result);
  }
}
