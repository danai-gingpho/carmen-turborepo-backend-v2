import { Controller, HttpStatus } from '@nestjs/common';
import { CreditTermService } from './credit_term.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController, MicroservicePayload, MicroserviceResponse } from '@/common';

@Controller()
export class CreditTermController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    CreditTermController.name,
  );
  constructor(private readonly creditTermService: CreditTermService) {
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
   * Find a single credit term by ID
   * ค้นหารายการเงื่อนไขเครดิตเดียวตาม ID
   * @param payload - Microservice payload containing credit term ID and version / ข้อมูล payload ที่มี ID ของเงื่อนไขเครดิตและเวอร์ชัน
   * @returns Credit term detail / รายละเอียดเงื่อนไขเครดิต
   */
  @MessagePattern({ cmd: 'credit-term.findOne', service: 'credit-term' })
  async findOne(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findOne', payload }, CreditTermController.name);
    const { id, version } = payload;
    this.creditTermService.userId = payload.user_id;
    this.creditTermService.bu_code = payload.bu_code;
    await this.creditTermService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.creditTermService.findOne(id, version));
    return this.handleResult(result);
  }

  /**
   * Find all credit terms with pagination
   * ค้นหารายการเงื่อนไขเครดิตทั้งหมดพร้อมการแบ่งหน้า
   * @param payload - Microservice payload containing pagination parameters and version / ข้อมูล payload ที่มีพารามิเตอร์การแบ่งหน้าและเวอร์ชัน
   * @returns Paginated list of credit terms / รายการเงื่อนไขเครดิตพร้อมการแบ่งหน้า
   */
  @MessagePattern({ cmd: 'credit-term.findAll', service: 'credit-term' })
  async findAll(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findAll', payload }, CreditTermController.name);
    const { paginate, version } = payload;
    this.creditTermService.userId = payload.user_id;
    this.creditTermService.bu_code = payload.bu_code;
    await this.creditTermService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.creditTermService.findAll(paginate, version));
    return this.handlePaginatedResult(result);
  }

  /**
   * Create a new credit term
   * สร้างเงื่อนไขเครดิตใหม่
   * @param payload - Microservice payload containing credit term data and version / ข้อมูล payload ที่มีข้อมูลเงื่อนไขเครดิตและเวอร์ชัน
   * @returns Created credit term ID / ID ของเงื่อนไขเครดิตที่สร้างขึ้น
   */
  @MessagePattern({ cmd: 'credit-term.create', service: 'credit-term' })
  async create(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'create', payload }, CreditTermController.name);
    const { data, version } = payload;
    this.creditTermService.userId = payload.user_id;
    this.creditTermService.bu_code = payload.bu_code;
    await this.creditTermService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.creditTermService.create(data, version));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  /**
   * Update an existing credit term
   * อัปเดตเงื่อนไขเครดิตที่มีอยู่
   * @param payload - Microservice payload containing updated credit term data and version / ข้อมูล payload ที่มีข้อมูลเงื่อนไขเครดิตที่อัปเดตและเวอร์ชัน
   * @returns Updated credit term ID / ID ของเงื่อนไขเครดิตที่อัปเดต
   */
  @MessagePattern({ cmd: 'credit-term.update', service: 'credit-term' })
  async update(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'update', payload }, CreditTermController.name);
    const { data, version } = payload;
    this.creditTermService.userId = payload.user_id;
    this.creditTermService.bu_code = payload.bu_code;
    await this.creditTermService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.creditTermService.update(data, version));
    return this.handleResult(result);
  }

  /**
   * Delete a credit term (soft delete)
   * ลบเงื่อนไขเครดิต (ลบแบบซอฟต์)
   * @param payload - Microservice payload containing credit term ID and version / ข้อมูล payload ที่มี ID ของเงื่อนไขเครดิตและเวอร์ชัน
   * @returns Deleted credit term ID / ID ของเงื่อนไขเครดิตที่ลบ
   */
  @MessagePattern({ cmd: 'credit-term.delete', service: 'credit-term' })
  async delete(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'delete', payload }, CreditTermController.name);
    const { id, version } = payload;
    this.creditTermService.userId = payload.user_id;
    this.creditTermService.bu_code = payload.bu_code;
    await this.creditTermService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.creditTermService.delete(id, version));
    return this.handleResult(result);
  }
}
