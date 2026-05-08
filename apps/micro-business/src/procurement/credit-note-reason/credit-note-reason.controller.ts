import { Body, Controller, HttpStatus } from "@nestjs/common";
import { CreditNoteReasonService } from "./credit-note-reason.service";
import { MessagePattern } from "@nestjs/microservices";
import { BackendLogger } from "@/common/helpers/backend.logger";
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController, MicroservicePayload, MicroserviceResponse } from '@/common';

@Controller()
export class CreditNoteReasonController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(CreditNoteReasonController.name);
  constructor(private readonly creditNoteReasonService: CreditNoteReasonService) {
    super();
  }

  /**
   * Create an audit context from the microservice payload
   * สร้าง audit context จาก payload ของไมโครเซอร์วิส
   * @param payload - Microservice payload containing tenant and user info / payload ของไมโครเซอร์วิสที่มีข้อมูลผู้เช่าและผู้ใช้
   * @returns Audit context object / ออบเจกต์ audit context
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
   * Find all credit note reasons with pagination
   * ค้นหาเหตุผลใบลดหนี้ทั้งหมดพร้อมการแบ่งหน้า
   * @param payload - Payload containing pagination parameters / payload ที่มีพารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of credit note reasons / รายการเหตุผลใบลดหนี้ที่แบ่งหน้าแล้ว
   */
  @MessagePattern({
    cmd: 'credit-note-reason.find-all',
    service: 'credit-note-reason',
  })
  async findAll(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findAll', payload }, CreditNoteReasonController.name);
    await this.creditNoteReasonService.initializePrismaService(payload.tenant_id || payload.bu_code, payload.user_id);
    this.creditNoteReasonService.bu_code = payload.tenant_id || payload.bu_code;
    this.creditNoteReasonService.userId = payload.user_id;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.creditNoteReasonService.findAll(payload.paginate));
    return this.handlePaginatedResult(result);
  }

  @MessagePattern({
    cmd: 'credit-note-reason.create',
    service: 'credit-note-reason',
  })
  async create(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'create', payload }, CreditNoteReasonController.name);
    const data = payload.data;
    await this.creditNoteReasonService.initializePrismaService(payload.tenant_id || payload.bu_code, payload.user_id);
    this.creditNoteReasonService.bu_code = payload.tenant_id || payload.bu_code;
    this.creditNoteReasonService.userId = payload.user_id;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.creditNoteReasonService.create(data));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  @MessagePattern({
    cmd: 'credit-note-reason.find-one',
    service: 'credit-note-reason',
  })
  async findOne(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findOne', payload }, CreditNoteReasonController.name);
    await this.creditNoteReasonService.initializePrismaService(payload.tenant_id || payload.bu_code, payload.user_id);
    this.creditNoteReasonService.bu_code = payload.tenant_id || payload.bu_code;
    this.creditNoteReasonService.userId = payload.user_id;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.creditNoteReasonService.findOne(payload.id));
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'credit-note-reason.update',
    service: 'credit-note-reason',
  })
  async update(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'update', payload }, CreditNoteReasonController.name);
    const data = payload.data;
    await this.creditNoteReasonService.initializePrismaService(payload.tenant_id || payload.bu_code, payload.user_id);
    this.creditNoteReasonService.bu_code = payload.tenant_id || payload.bu_code;
    this.creditNoteReasonService.userId = payload.user_id;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.creditNoteReasonService.update(data.id, data));
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'credit-note-reason.patch',
    service: 'credit-note-reason',
  })
  async patch(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'patch', payload }, CreditNoteReasonController.name);
    const data = payload.data;
    await this.creditNoteReasonService.initializePrismaService(payload.tenant_id || payload.bu_code, payload.user_id);
    this.creditNoteReasonService.bu_code = payload.tenant_id || payload.bu_code;
    this.creditNoteReasonService.userId = payload.user_id;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.creditNoteReasonService.patch(data.id, data));
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'credit-note-reason.delete',
    service: 'credit-note-reason',
  })
  async delete(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'delete', payload }, CreditNoteReasonController.name);
    await this.creditNoteReasonService.initializePrismaService(payload.tenant_id || payload.bu_code, payload.user_id);
    this.creditNoteReasonService.bu_code = payload.tenant_id || payload.bu_code;
    this.creditNoteReasonService.userId = payload.user_id;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.creditNoteReasonService.delete(payload.id));
    return this.handleResult(result);
  }
}
