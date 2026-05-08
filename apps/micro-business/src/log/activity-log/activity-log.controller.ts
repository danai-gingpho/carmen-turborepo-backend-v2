import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ActivityLogService } from './activity-log.service';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController, MicroservicePayload, MicroserviceResponse } from '@/common';

@Controller()
export class ActivityLogController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    ActivityLogController.name,
  );

  constructor(private readonly activityLogService: ActivityLogService) {
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
   * Find all activity logs with pagination and filters
   * ค้นหาบันทึกกิจกรรมทั้งหมดพร้อมการแบ่งหน้าและตัวกรอง
   * @param payload - Contains paginate, filters, user_id, bu_code / ประกอบด้วย paginate, filters, user_id, bu_code
   * @returns Paginated list of activity logs / รายการบันทึกกิจกรรมแบบแบ่งหน้า
   */
  @MessagePattern({ cmd: 'activity-log.findAll', service: 'activity-log' })
  async findAll(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'findAll', payload },
      ActivityLogController.name,
    );

    this.activityLogService.userId = payload.user_id;
    this.activityLogService.bu_code = payload.bu_code;
    await this.activityLogService.initializePrismaService(
      payload.bu_code,
      payload.user_id,
    );

    const paginate = payload.paginate || {};
    const filters = payload.filters || {};

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.activityLogService.findAll(paginate, filters),
    );

    return this.handlePaginatedResult(result);
  }

  /**
   * Find activity logs by entity type
   * ค้นหาบันทึกกิจกรรมตามประเภทเอนทิตี
   * @param payload - Contains entity_type, paginate, user_id, bu_code / ประกอบด้วย entity_type, paginate, user_id, bu_code
   * @returns Paginated list of activity logs by entity / รายการบันทึกกิจกรรมตามเอนทิตีแบบแบ่งหน้า
   */
  @MessagePattern({ cmd: 'activity-log.findByEntity', service: 'activity-log' })
  async findByEntity(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'findByEntity', payload },
      ActivityLogController.name,
    );

    this.activityLogService.userId = payload.user_id;
    this.activityLogService.bu_code = payload.bu_code;
    await this.activityLogService.initializePrismaService(
      payload.bu_code,
      payload.user_id,
    );

    const paginate = payload.paginate || {};

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.activityLogService.findByEntity(payload.entity_type, paginate),
    );

    return this.handlePaginatedResult(result);
  }

  /**
   * Find an activity log by ID
   * ค้นหาบันทึกกิจกรรมรายการเดียวตาม ID
   * @param payload - Contains id, user_id, bu_code / ประกอบด้วย id, user_id, bu_code
   * @returns Activity log detail / รายละเอียดบันทึกกิจกรรม
   */
  @MessagePattern({ cmd: 'activity-log.findOne', service: 'activity-log' })
  async findOne(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'findOne', payload },
      ActivityLogController.name,
    );

    this.activityLogService.userId = payload.user_id;
    this.activityLogService.bu_code = payload.bu_code;
    await this.activityLogService.initializePrismaService(
      payload.bu_code,
      payload.user_id,
    );

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.activityLogService.findOne(payload.id),
    );

    return this.handleResult(result);
  }

  /**
   * Soft delete an activity log
   * ลบบันทึกกิจกรรมแบบซอฟต์ดีลีท
   * @param payload - Contains id, user_id, bu_code / ประกอบด้วย id, user_id, bu_code
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @MessagePattern({ cmd: 'activity-log.delete', service: 'activity-log' })
  async delete(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'delete', payload },
      ActivityLogController.name,
    );

    this.activityLogService.userId = payload.user_id;
    this.activityLogService.bu_code = payload.bu_code;
    await this.activityLogService.initializePrismaService(
      payload.bu_code,
      payload.user_id,
    );

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.activityLogService.delete(payload.id, payload.user_id),
    );

    return this.handleResult(result);
  }

  /**
   * Soft delete multiple activity logs
   * ลบบันทึกกิจกรรมหลายรายการแบบซอฟต์ดีลีท
   * @param payload - Contains ids array, user_id, bu_code / ประกอบด้วยอาร์เรย์ ids, user_id, bu_code
   * @returns Deletion count result / ผลลัพธ์จำนวนที่ลบ
   */
  @MessagePattern({ cmd: 'activity-log.deleteMany', service: 'activity-log' })
  async deleteMany(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'deleteMany', payload },
      ActivityLogController.name,
    );

    this.activityLogService.userId = payload.user_id;
    this.activityLogService.bu_code = payload.bu_code;
    await this.activityLogService.initializePrismaService(
      payload.bu_code,
      payload.user_id,
    );

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.activityLogService.deleteMany(payload.ids, payload.user_id),
    );

    return this.handleResult(result);
  }

  /**
   * Permanently delete an activity log
   * ลบบันทึกกิจกรรมอย่างถาวร
   * @param payload - Contains id, user_id, bu_code / ประกอบด้วย id, user_id, bu_code
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @MessagePattern({ cmd: 'activity-log.hardDelete', service: 'activity-log' })
  async hardDelete(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'hardDelete', payload },
      ActivityLogController.name,
    );

    this.activityLogService.userId = payload.user_id;
    this.activityLogService.bu_code = payload.bu_code;
    await this.activityLogService.initializePrismaService(
      payload.bu_code,
      payload.user_id,
    );

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.activityLogService.hardDelete(payload.id),
    );

    return this.handleResult(result);
  }

  /**
   * Permanently delete multiple activity logs
   * ลบบันทึกกิจกรรมหลายรายการอย่างถาวร
   * @param payload - Contains ids array, user_id, bu_code / ประกอบด้วยอาร์เรย์ ids, user_id, bu_code
   * @returns Deletion count result / ผลลัพธ์จำนวนที่ลบ
   */
  @MessagePattern({ cmd: 'activity-log.hardDeleteMany', service: 'activity-log' })
  async hardDeleteMany(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'hardDeleteMany', payload },
      ActivityLogController.name,
    );

    this.activityLogService.userId = payload.user_id;
    this.activityLogService.bu_code = payload.bu_code;
    await this.activityLogService.initializePrismaService(
      payload.bu_code,
      payload.user_id,
    );

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.activityLogService.hardDeleteMany(payload.ids),
    );

    return this.handleResult(result);
  }
}
