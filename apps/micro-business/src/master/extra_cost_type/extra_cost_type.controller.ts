import { Controller, HttpStatus } from '@nestjs/common';
import { ExtraCostTypeService } from './extra_cost_type.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController, MicroservicePayload, MicroserviceResponse } from '@/common';

@Controller()
export class ExtraCostTypeController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    ExtraCostTypeController.name,
  );
  constructor(private readonly extraCostTypeService: ExtraCostTypeService) {
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
   * Find a single extra cost type by ID
   * ค้นหารายการประเภทค่าใช้จ่ายเพิ่มเติมเดียวตาม ID
   * @param payload - Microservice payload containing extra cost type ID / ข้อมูล payload ที่มี ID ของประเภทค่าใช้จ่ายเพิ่มเติม
   * @returns Extra cost type detail / รายละเอียดประเภทค่าใช้จ่ายเพิ่มเติม
   */
  @MessagePattern({
    cmd: 'extra-cost-type.findOne',
    service: 'extra-cost-type',
  })
  async findOne(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findOne', payload }, ExtraCostTypeController.name);
    const id = payload.id;
    this.extraCostTypeService.userId = payload.user_id;
    this.extraCostTypeService.bu_code = payload.bu_code;
    await this.extraCostTypeService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.extraCostTypeService.findOne(id));
    return this.handleResult(result);
  }

  /**
   * Find all extra cost types with pagination
   * ค้นหารายการประเภทค่าใช้จ่ายเพิ่มเติมทั้งหมดพร้อมการแบ่งหน้า
   * @param payload - Microservice payload containing pagination parameters / ข้อมูล payload ที่มีพารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of extra cost types / รายการประเภทค่าใช้จ่ายเพิ่มเติมพร้อมการแบ่งหน้า
   */
  @MessagePattern({
    cmd: 'extra-cost-type.findAll',
    service: 'extra-cost-type',
  })
  async findAll(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findAll', payload }, ExtraCostTypeController.name);
    this.extraCostTypeService.userId = payload.user_id;
    this.extraCostTypeService.bu_code = payload.bu_code;
    const paginate = payload.paginate;
    await this.extraCostTypeService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.extraCostTypeService.findAll(paginate));
    return this.handlePaginatedResult(result);
  }

  /**
   * Create a new extra cost type
   * สร้างประเภทค่าใช้จ่ายเพิ่มเติมใหม่
   * @param payload - Microservice payload containing extra cost type data / ข้อมูล payload ที่มีข้อมูลประเภทค่าใช้จ่ายเพิ่มเติม
   * @returns Created extra cost type ID / ID ของประเภทค่าใช้จ่ายเพิ่มเติมที่สร้างขึ้น
   */
  @MessagePattern({ cmd: 'extra-cost-type.create', service: 'extra-cost-type' })
  async create(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'create', payload }, ExtraCostTypeController.name);
    const data = payload.data;
    this.extraCostTypeService.userId = payload.user_id;
    this.extraCostTypeService.bu_code = payload.bu_code;
    await this.extraCostTypeService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.extraCostTypeService.create(data));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  /**
   * Update an existing extra cost type
   * อัปเดตประเภทค่าใช้จ่ายเพิ่มเติมที่มีอยู่
   * @param payload - Microservice payload containing updated extra cost type data / ข้อมูล payload ที่มีข้อมูลประเภทค่าใช้จ่ายเพิ่มเติมที่อัปเดต
   * @returns Updated extra cost type ID / ID ของประเภทค่าใช้จ่ายเพิ่มเติมที่อัปเดต
   */
  @MessagePattern({ cmd: 'extra-cost-type.update', service: 'extra-cost-type' })
  async update(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'update', payload }, ExtraCostTypeController.name);
    const data = payload.data;
    this.extraCostTypeService.userId = payload.user_id;
    this.extraCostTypeService.bu_code = payload.bu_code;
    await this.extraCostTypeService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.extraCostTypeService.update(data));
    return this.handleResult(result);
  }

  /**
   * Delete an extra cost type (soft delete)
   * ลบประเภทค่าใช้จ่ายเพิ่มเติม (ลบแบบซอฟต์)
   * @param payload - Microservice payload containing extra cost type ID / ข้อมูล payload ที่มี ID ของประเภทค่าใช้จ่ายเพิ่มเติม
   * @returns Deleted extra cost type ID / ID ของประเภทค่าใช้จ่ายเพิ่มเติมที่ลบ
   */
  @MessagePattern({ cmd: 'extra-cost-type.delete', service: 'extra-cost-type' })
  async delete(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'delete', payload }, ExtraCostTypeController.name);
    const id = payload.id;
    this.extraCostTypeService.userId = payload.user_id;
    this.extraCostTypeService.bu_code = payload.bu_code;
    await this.extraCostTypeService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.extraCostTypeService.delete(id));
    return this.handleResult(result);
  }
}
