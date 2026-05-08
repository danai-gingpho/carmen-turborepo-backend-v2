import { Controller, HttpStatus } from '@nestjs/common';
import { PeriodService } from './period.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController, MicroservicePayload, MicroserviceResponse } from '@/common';

@Controller()
export class PeriodController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    PeriodController.name,
  );

  constructor(private readonly periodService: PeriodService) {
    super();
  }

  private createAuditContext(payload: MicroservicePayload): AuditContext {
    return {
      tenant_id: payload.bu_code,
      user_id: payload.user_id,
      request_id: payload.request_id,
      ip_address: payload.ip_address,
      user_agent: payload.user_agent,
    };
  }

  /**
   * Find a single period by ID
   * ค้นหารายการงวดเดียวตาม ID
   * @param payload - Microservice payload containing period ID / ข้อมูล payload ที่มี ID ของงวด
   * @returns Period detail / รายละเอียดงวด
   */
  @MessagePattern({ cmd: 'period.findOne', service: 'period' })
  async findOne(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findOne', payload }, PeriodController.name);
    const id = payload.id;
    this.periodService.userId = payload.user_id;
    this.periodService.bu_code = payload.bu_code;
    await this.periodService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.periodService.findOne(id));
    return this.handleResult(result);
  }

  /**
   * Find all periods with pagination
   * ค้นหารายการงวดทั้งหมดพร้อมการแบ่งหน้า
   * @param payload - Microservice payload containing pagination parameters / ข้อมูล payload ที่มีพารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of periods / รายการงวดพร้อมการแบ่งหน้า
   */
  @MessagePattern({ cmd: 'period.findAll', service: 'period' })
  async findAll(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findAll', payload }, PeriodController.name);
    this.periodService.userId = payload.user_id;
    this.periodService.bu_code = payload.bu_code;
    const paginate = payload.paginate;
    await this.periodService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.periodService.findAll(paginate));
    return this.handlePaginatedResult(result);
  }

  /**
   * Create a new period
   * สร้างงวดใหม่
   * @param payload - Microservice payload containing period data / ข้อมูล payload ที่มีข้อมูลงวด
   * @returns Created period ID / ID ของงวดที่สร้างขึ้น
   */
  @MessagePattern({ cmd: 'period.create', service: 'period' })
  async create(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'create', payload }, PeriodController.name);
    const data = payload.data;
    this.periodService.userId = payload.user_id;
    this.periodService.bu_code = payload.bu_code;
    await this.periodService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.periodService.create(data));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  /**
   * Update an existing period
   * อัปเดตงวดที่มีอยู่
   * @param payload - Microservice payload containing updated period data / ข้อมูล payload ที่มีข้อมูลงวดที่อัปเดต
   * @returns Updated period ID / ID ของงวดที่อัปเดต
   */
  @MessagePattern({ cmd: 'period.update', service: 'period' })
  async update(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'update', payload }, PeriodController.name);
    const data = payload.data;
    this.periodService.userId = payload.user_id;
    this.periodService.bu_code = payload.bu_code;
    await this.periodService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.periodService.update(data));
    return this.handleResult(result);
  }

  /**
   * Partially update a period
   * อัปเดตบางส่วนของงวด
   * @param payload - Microservice payload containing partial period data / ข้อมูล payload ที่มีข้อมูลงวดบางส่วน
   * @returns Updated period / งวดที่อัปเดต
   */
  @MessagePattern({ cmd: 'period.patch', service: 'period' })
  async patch(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'patch', payload }, PeriodController.name);
    const data = payload.data;
    this.periodService.userId = payload.user_id;
    this.periodService.bu_code = payload.bu_code;
    await this.periodService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.periodService.patch(data));
    return this.handleResult(result);
  }

  /**
   * Delete a period (soft delete)
   * ลบงวด (ลบแบบซอฟต์)
   * @param payload - Microservice payload containing period ID / ข้อมูล payload ที่มี ID ของงวด
   * @returns Deleted period ID / ID ของงวดที่ลบ
   */
  @MessagePattern({ cmd: 'period.delete', service: 'period' })
  async delete(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'delete', payload }, PeriodController.name);
    const id = payload.id;
    this.periodService.userId = payload.user_id;
    this.periodService.bu_code = payload.bu_code;
    await this.periodService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.periodService.delete(id));
    return this.handleResult(result);
  }
}
