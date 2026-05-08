import { Controller, HttpStatus } from '@nestjs/common';
import { AdjustmentTypeService } from './adjustment-type.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController, MicroservicePayload, MicroserviceResponse } from '@/common';

@Controller()
export class AdjustmentTypeController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    AdjustmentTypeController.name,
  );

  constructor(private readonly adjustmentTypeService: AdjustmentTypeService) {
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
   * Find a single adjustment type by ID
   * ค้นหารายการประเภทการปรับปรุงเดียวตาม ID
   * @param payload - Microservice payload containing adjustment type ID / ข้อมูล payload ที่มี ID ของประเภทการปรับปรุง
   * @returns Adjustment type detail / รายละเอียดประเภทการปรับปรุง
   */
  @MessagePattern({ cmd: 'adjustment-type.findOne', service: 'adjustment-type' })
  async findOne(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findOne', payload }, AdjustmentTypeController.name);
    const id = payload.id;
    this.adjustmentTypeService.userId = payload.user_id;
    this.adjustmentTypeService.bu_code = payload.bu_code;
    await this.adjustmentTypeService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.adjustmentTypeService.findOne(id));
    return this.handleResult(result);
  }

  /**
   * Find all adjustment types with pagination
   * ค้นหารายการประเภทการปรับปรุงทั้งหมดพร้อมการแบ่งหน้า
   * @param payload - Microservice payload containing pagination parameters / ข้อมูล payload ที่มีพารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of adjustment types / รายการประเภทการปรับปรุงพร้อมการแบ่งหน้า
   */
  @MessagePattern({ cmd: 'adjustment-type.findAll', service: 'adjustment-type' })
  async findAll(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findAll', payload }, AdjustmentTypeController.name);
    this.adjustmentTypeService.userId = payload.user_id;
    this.adjustmentTypeService.bu_code = payload.bu_code;
    await this.adjustmentTypeService.initializePrismaService(payload.bu_code, payload.user_id);
    const paginate = payload.paginate;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.adjustmentTypeService.findAll(paginate));
    return this.handlePaginatedResult(result);
  }

  /**
   * Create a new adjustment type
   * สร้างประเภทการปรับปรุงใหม่
   * @param payload - Microservice payload containing adjustment type data / ข้อมูล payload ที่มีข้อมูลประเภทการปรับปรุง
   * @returns Created adjustment type ID / ID ของประเภทการปรับปรุงที่สร้างขึ้น
   */
  @MessagePattern({ cmd: 'adjustment-type.create', service: 'adjustment-type' })
  async create(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'create', payload }, AdjustmentTypeController.name);
    const data = payload.data;
    this.adjustmentTypeService.userId = payload.user_id;
    this.adjustmentTypeService.bu_code = payload.bu_code;
    await this.adjustmentTypeService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.adjustmentTypeService.create(data));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  /**
   * Update an existing adjustment type
   * อัปเดตประเภทการปรับปรุงที่มีอยู่
   * @param payload - Microservice payload containing updated adjustment type data / ข้อมูล payload ที่มีข้อมูลประเภทการปรับปรุงที่อัปเดต
   * @returns Updated adjustment type ID / ID ของประเภทการปรับปรุงที่อัปเดต
   */
  @MessagePattern({ cmd: 'adjustment-type.update', service: 'adjustment-type' })
  async update(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'update', payload }, AdjustmentTypeController.name);
    const data = payload.data;
    this.adjustmentTypeService.userId = payload.user_id;
    this.adjustmentTypeService.bu_code = payload.bu_code;
    await this.adjustmentTypeService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.adjustmentTypeService.update(data));
    return this.handleResult(result);
  }

  /**
   * Delete an adjustment type (soft delete)
   * ลบประเภทการปรับปรุง (ลบแบบซอฟต์)
   * @param payload - Microservice payload containing adjustment type ID / ข้อมูล payload ที่มี ID ของประเภทการปรับปรุง
   * @returns Deleted adjustment type ID / ID ของประเภทการปรับปรุงที่ลบ
   */
  @MessagePattern({ cmd: 'adjustment-type.delete', service: 'adjustment-type' })
  async delete(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'delete', payload }, AdjustmentTypeController.name);
    const id = payload.id;
    this.adjustmentTypeService.userId = payload.user_id;
    this.adjustmentTypeService.bu_code = payload.bu_code;
    await this.adjustmentTypeService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.adjustmentTypeService.delete(id));
    return this.handleResult(result);
  }
}
