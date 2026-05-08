import { Controller, HttpStatus } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PeriodService } from './period.service';
import { ICreatePeriod, IUpdatePeriod } from './interface/period.interface';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController, MicroservicePayload, MicroserviceResponse } from '@/common';

@Controller()
export class PeriodController extends BaseMicroserviceController {
  private readonly logger = new BackendLogger(PeriodController.name);

  constructor(private readonly periodService: PeriodService) {
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
   * Find an inventory period by ID
   * ค้นหางวดสินค้าคงคลังรายการเดียวตาม ID
   * @param payload - Contains id, user_id, tenant_id / ประกอบด้วย id, user_id, tenant_id
   * @returns Inventory period detail / รายละเอียดงวดสินค้าคงคลัง
   */
  @MessagePattern({ cmd: 'inventory-period.findOne', service: 'inventory-period' })
  async findOne(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findOne', payload }, PeriodController.name);
    const id = payload.id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.periodService.findOne(id, user_id, tenant_id),
    );
    return this.handleResult(result);
  }

  /**
   * Find all inventory periods with pagination
   * ค้นหางวดสินค้าคงคลังทั้งหมดพร้อมการแบ่งหน้า
   * @param payload - Contains user_id, tenant_id, paginate / ประกอบด้วย user_id, tenant_id, paginate
   * @returns Paginated list of inventory periods / รายการงวดสินค้าคงคลังแบบแบ่งหน้า
   */
  @MessagePattern({ cmd: 'inventory-period.findAll', service: 'inventory-period' })
  async findAll(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findAll', payload }, PeriodController.name);
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const paginate = payload.paginate;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.periodService.findAll(user_id, tenant_id, paginate),
    );
    return this.handlePaginatedResult(result);
  }

  /**
   * Create a new inventory period
   * สร้างงวดสินค้าคงคลังใหม่
   * @param payload - Contains data, user_id, tenant_id / ประกอบด้วย data, user_id, tenant_id
   * @returns Created inventory period / งวดสินค้าคงคลังที่สร้างแล้ว
   */
  @MessagePattern({ cmd: 'inventory-period.create', service: 'inventory-period' })
  async create(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'create', payload }, PeriodController.name);
    const data: ICreatePeriod = payload.data;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.periodService.create(data, user_id, tenant_id),
    );
    return this.handleResult(result, HttpStatus.CREATED);
  }

  /**
   * Update an inventory period
   * แก้ไขงวดสินค้าคงคลัง
   * @param payload - Contains id, data, user_id, tenant_id / ประกอบด้วย id, data, user_id, tenant_id
   * @returns Updated inventory period / งวดสินค้าคงคลังที่แก้ไขแล้ว
   */
  @MessagePattern({ cmd: 'inventory-period.update', service: 'inventory-period' })
  async update(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'update', payload }, PeriodController.name);
    const data: IUpdatePeriod = { id: payload.id, ...payload.data };
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.periodService.update(data, user_id, tenant_id),
    );
    return this.handleResult(result);
  }

  /**
   * Generate next inventory periods
   * สร้างงวดสินค้าคงคลังถัดไป
   * @param payload - Contains count, start_day, user_id, tenant_id / ประกอบด้วย count, start_day, user_id, tenant_id
   * @returns Generated inventory periods / งวดสินค้าคงคลังที่สร้างแล้ว
   */
  @MessagePattern({ cmd: 'inventory-period.generateNext', service: 'inventory-period' })
  async generateNext(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'generateNext', payload }, PeriodController.name);
    const count = payload.count;
    const start_day = payload.start_day ?? 1;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.periodService.generateNextPeriods(count, start_day, user_id, tenant_id),
    );
    return this.handleResult(result, HttpStatus.CREATED);
  }

  /**
   * Find the current inventory period (open or locked)
   * ค้นหางวดสินค้าคงคลังปัจจุบัน (สถานะเปิดหรือล็อค)
   * @param payload - Contains user_id, tenant_id / ประกอบด้วย user_id, tenant_id
   * @returns Current inventory period / งวดสินค้าคงคลังปัจจุบัน
   */
  @MessagePattern({ cmd: 'inventory-period.findCurrent', service: 'inventory-period' })
  async findCurrent(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findCurrent', payload }, PeriodController.name);
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.periodService.findCurrent(user_id, tenant_id),
    );
    return this.handleResult(result);
  }

  /**
   * Delete an inventory period
   * ลบงวดสินค้าคงคลัง
   * @param payload - Contains id, user_id, tenant_id / ประกอบด้วย id, user_id, tenant_id
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @MessagePattern({ cmd: 'inventory-period.delete', service: 'inventory-period' })
  async delete(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'delete', payload }, PeriodController.name);
    const id = payload.id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.periodService.delete(id, user_id, tenant_id),
    );
    return this.handleResult(result);
  }
}
