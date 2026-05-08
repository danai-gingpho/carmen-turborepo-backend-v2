import { Controller, HttpStatus } from '@nestjs/common';
import { UnitsService } from './units.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController, MicroservicePayload, MicroserviceResponse } from '@/common';

@Controller()
export class UnitsController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    UnitsController.name,
  );
  constructor(private readonly unitsService: UnitsService) {
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
   * Find a single unit by ID
   * ค้นหารายการหน่วยเดียวตาม ID
   * @param payload - Microservice payload containing unit ID / ข้อมูล payload ที่มี ID ของหน่วย
   * @returns Unit detail / รายละเอียดหน่วย
   */
  @MessagePattern({ cmd: 'units.findOne', service: 'units' })
  async findOne(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findOne', payload }, UnitsController.name);
    const id = payload.id;
    this.unitsService.userId = payload.user_id;
    this.unitsService.bu_code = payload.bu_code;
    await this.unitsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.unitsService.findOne(id));
    return this.handleResult(result);
  }

  /**
   * Find all units with pagination
   * ค้นหารายการหน่วยทั้งหมดพร้อมการแบ่งหน้า
   * @param payload - Microservice payload containing pagination parameters / ข้อมูล payload ที่มีพารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of units / รายการหน่วยพร้อมการแบ่งหน้า
   */
  @MessagePattern({ cmd: 'units.findAll', service: 'units' })
  async findAll(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findAll', payload }, UnitsController.name);
    this.unitsService.userId = payload.user_id;
    this.unitsService.bu_code = payload.bu_code;
    await this.unitsService.initializePrismaService(payload.bu_code, payload.user_id);
    const paginate = payload.paginate;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.unitsService.findAll(paginate));
    return this.handlePaginatedResult(result);
  }

  /**
   * Find multiple units by their IDs
   * ค้นหารายการหน่วยหลายรายการตาม ID
   * @param payload - Microservice payload containing array of unit IDs / ข้อมูล payload ที่มีอาร์เรย์ของ ID หน่วย
   * @returns List of units matching the IDs / รายการหน่วยที่ตรงกับ ID
   */
  @MessagePattern({ cmd: 'units.find-all-by-id', service: 'units' })
  async findAllById(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findAllById', payload }, UnitsController.name);
    const ids = payload.ids;
    this.unitsService.userId = payload.user_id;
    this.unitsService.bu_code = payload.bu_code;
    await this.unitsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.unitsService.findAllById(ids));
    return this.handleResult(result);
  }

  /**
   * Create a new unit
   * สร้างหน่วยใหม่
   * @param payload - Microservice payload containing unit data / ข้อมูล payload ที่มีข้อมูลหน่วย
   * @returns Created unit ID / ID ของหน่วยที่สร้างขึ้น
   */
  @MessagePattern({ cmd: 'units.create', service: 'units' })
  async create(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'create', payload }, UnitsController.name);
    const data = payload.data;
    this.unitsService.userId = payload.user_id;
    this.unitsService.bu_code = payload.bu_code;
    await this.unitsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.unitsService.create(data));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  /**
   * Update an existing unit
   * อัปเดตหน่วยที่มีอยู่
   * @param payload - Microservice payload containing updated unit data / ข้อมูล payload ที่มีข้อมูลหน่วยที่อัปเดต
   * @returns Updated unit ID / ID ของหน่วยที่อัปเดต
   */
  @MessagePattern({ cmd: 'units.update', service: 'units' })
  async update(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'update', payload }, UnitsController.name);
    const data = payload.data;
    this.unitsService.userId = payload.user_id;
    this.unitsService.bu_code = payload.bu_code;
    await this.unitsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.unitsService.update(data));
    return this.handleResult(result);
  }

  /**
   * Delete a unit (soft delete)
   * ลบหน่วย (ลบแบบซอฟต์)
   * @param payload - Microservice payload containing unit ID / ข้อมูล payload ที่มี ID ของหน่วย
   * @returns Deleted unit ID / ID ของหน่วยที่ลบ
   */
  @MessagePattern({ cmd: 'units.delete', service: 'units' })
  async delete(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'delete', payload }, UnitsController.name);
    const id = payload.id;
    this.unitsService.userId = payload.user_id;
    this.unitsService.bu_code = payload.bu_code;
    await this.unitsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.unitsService.delete(id));
    return this.handleResult(result);
  }
}
