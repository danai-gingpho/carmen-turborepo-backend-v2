import { Controller, HttpStatus } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SpotCheckService } from './spot-check.service';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController, MicroservicePayload, MicroserviceResponse } from '@/common';

@Controller()
export class SpotCheckController extends BaseMicroserviceController {
  private readonly logger = new BackendLogger(SpotCheckController.name);

  constructor(private readonly spotCheckService: SpotCheckService) {
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
   * Find a spot check by ID
   * ค้นหาการตรวจสอบจุดรายการเดียวตาม ID
   * @param payload - Contains id, user_id, tenant_id / ประกอบด้วย id, user_id, tenant_id
   * @returns Spot check detail / รายละเอียดการตรวจสอบจุด
   */
  @MessagePattern({ cmd: 'spot-check.findOne', service: 'spot-check' })
  async findOne(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'findOne', payload },
      SpotCheckController.name,
    );
    const { id, user_id } = payload;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.spotCheckService.findOne(id, user_id, tenant_id),
    );
    return this.handleResult(result);
  }

  /**
   * Find all spot checks with pagination
   * ค้นหาการตรวจสอบจุดทั้งหมดพร้อมการแบ่งหน้า
   * @param payload - Contains user_id, tenant_id, paginate / ประกอบด้วย user_id, tenant_id, paginate
   * @returns Paginated list of spot checks / รายการตรวจสอบจุดแบบแบ่งหน้า
   */
  @MessagePattern({ cmd: 'spot-check.findAll', service: 'spot-check' })
  async findAll(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'findAll', payload },
      SpotCheckController.name,
    );
    const { user_id, paginate } = payload;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.spotCheckService.findAll(user_id, tenant_id, paginate),
    );
    return this.handlePaginatedResult(result);
  }

  /**
   * Create a new spot check
   * สร้างการตรวจสอบจุดใหม่
   * @param payload - Contains data, user_id, tenant_id / ประกอบด้วย data, user_id, tenant_id
   * @returns Created spot check / การตรวจสอบจุดที่สร้างแล้ว
   */
  @MessagePattern({ cmd: 'spot-check.create', service: 'spot-check' })
  async create(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'create', payload },
      SpotCheckController.name,
    );
    const { data, user_id } = payload;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.spotCheckService.create(data, user_id, tenant_id),
    );
    return this.handleResult(result, HttpStatus.CREATED);
  }

  /**
   * Update a spot check
   * แก้ไขการตรวจสอบจุด
   * @param payload - Contains id, data, user_id, tenant_id / ประกอบด้วย id, data, user_id, tenant_id
   * @returns Updated spot check / การตรวจสอบจุดที่แก้ไขแล้ว
   */
  @MessagePattern({ cmd: 'spot-check.update', service: 'spot-check' })
  async update(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'update', payload },
      SpotCheckController.name,
    );
    const { id, data, user_id } = payload;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.spotCheckService.update(id, data, user_id, tenant_id),
    );
    return this.handleResult(result);
  }

  /**
   * Delete a spot check
   * ลบการตรวจสอบจุด
   * @param payload - Contains id, user_id, tenant_id / ประกอบด้วย id, user_id, tenant_id
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @MessagePattern({ cmd: 'spot-check.delete', service: 'spot-check' })
  async delete(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'delete', payload },
      SpotCheckController.name,
    );
    const { id, user_id } = payload;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.spotCheckService.delete(id, user_id, tenant_id),
    );
    return this.handleResult(result);
  }

  /**
   * Find current period spot checks grouped by location
   * ค้นหาการตรวจสอบจุดในงวดปัจจุบันจัดกลุ่มตามสถานที่
   */
  @MessagePattern({ cmd: 'spot-check.current', service: 'spot-check' })
  async findCurrentByLocation(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findCurrentByLocation', payload }, SpotCheckController.name);
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const include_not_count = payload.include_not_count || false;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.spotCheckService.findCurrentByLocation(user_id, tenant_id, include_not_count),
    );
    return this.handleResult(result);
  }

  /**
   * Count pending spot checks for a user across all business units
   * นับจำนวนการตรวจสอบจุดที่รอดำเนินการของผู้ใช้
   */
  @MessagePattern({ cmd: 'spot-check.find-all-pending-count', service: 'spot-check' })
  async findAllPendingCount(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findAllPendingCount', payload }, SpotCheckController.name);
    const user_id = payload.user_id;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.spotCheckService.findAllPendingCount(user_id),
    );
    return this.handleResult(result);
  }

  /**
   * Print a spot check via FastReport viewer (micro-report)
   * พิมพ์ใบสุ่มตรวจสินค้าผ่าน FastReport viewer (micro-report)
   */
  @MessagePattern({ cmd: 'spot-check.printToReport', service: 'spot-check' })
  async printToReport(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'printToReport', payload }, SpotCheckController.name);
    const { user_id, bu_code, id } = payload;
    const tenant_id = payload.tenant_id || bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.spotCheckService.printToReport(id, user_id, tenant_id),
    );
    return this.handleResult(result);
  }
}
