import { Body, Controller, HttpStatus } from '@nestjs/common';
import { CreditNoteService } from './credit-note.service';
import { MessagePattern } from '@nestjs/microservices';
import { CreditNoteLogic } from './credit-note.logic';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController, MicroservicePayload, MicroserviceResponse } from '@/common';

@Controller()
export class CreditNoteController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    CreditNoteController.name,
  );
  constructor(
    private readonly creditNoteService: CreditNoteService,
    private readonly creditNoteLogic: CreditNoteLogic,
  ) {
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
   * Find a credit note by ID
   * ค้นหาใบลดหนี้รายการเดียวตาม ID
   * @param payload - Payload containing the credit note ID / payload ที่มี ID ของใบลดหนี้
   * @returns Credit note data / ข้อมูลใบลดหนี้
   */
  @MessagePattern({
    cmd: 'credit-note.find-one',
    service: 'credit-note',
  })
  async findOne(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findOne', payload }, CreditNoteController.name);
    await this.creditNoteService.initializePrismaService(payload.tenant_id || payload.bu_code, payload.user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.creditNoteService.findOne(payload.id));
    return this.handleResult(result);
  }

  /**
   * Find all credit notes with pagination
   * ค้นหาใบลดหนี้ทั้งหมดพร้อมการแบ่งหน้า
   * @param payload - Payload containing pagination parameters / payload ที่มีพารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of credit notes / รายการใบลดหนี้ที่แบ่งหน้าแล้ว
   */
  @MessagePattern({
    cmd: 'credit-note.find-all',
    service: 'credit-note',
  })
  async findAll(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findAll', payload }, CreditNoteController.name);
    const paginate = payload.paginate;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;

    await this.creditNoteService.initializePrismaService(tenant_id, user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.creditNoteService.findAll(paginate));
    return this.handlePaginatedResult(result);
  }

  /**
   * Create a new credit note
   * สร้างใบลดหนี้ใหม่
   * @param payload - Payload containing credit note data / payload ที่มีข้อมูลใบลดหนี้
   * @returns Created credit note / ใบลดหนี้ที่สร้างแล้ว
   */
  @MessagePattern({
    cmd: 'credit-note.create',
    service: 'credit-note',
  })
  async create(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'create', payload }, CreditNoteController.name);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.creditNoteLogic.create(
        payload.data,
        payload.user_id,
        payload.tenant_id || payload.bu_code,
      )
    );
    return this.handleResult(result, HttpStatus.CREATED);
  }

  /**
   * Update an existing credit note
   * อัปเดตใบลดหนี้ที่มีอยู่
   * @param payload - Payload containing updated credit note data / payload ที่มีข้อมูลใบลดหนี้ที่อัปเดต
   * @returns Updated credit note / ใบลดหนี้ที่อัปเดตแล้ว
   */
  @MessagePattern({
    cmd: 'credit-note.update',
    service: 'credit-note',
  })
  async update(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'update', payload }, CreditNoteController.name);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.creditNoteLogic.update(
        payload.data,
        payload.user_id,
        payload.tenant_id || payload.bu_code,
      )
    );
    return this.handleResult(result);
  }

  /**
   * Delete a credit note by ID
   * ลบใบลดหนี้ตาม ID
   * @param payload - Payload containing the credit note ID to delete / payload ที่มี ID ของใบลดหนี้ที่ต้องการลบ
   * @returns Deleted credit note ID / ID ของใบลดหนี้ที่ลบแล้ว
   */
  @MessagePattern({
    cmd: 'credit-note.delete',
    service: 'credit-note',
  })
  async delete(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'delete', payload }, CreditNoteController.name);
    await this.creditNoteService.initializePrismaService(payload.tenant_id || payload.bu_code, payload.user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.creditNoteService.delete(payload.id));
    return this.handleResult(result);
  }

  /**
   * Submit a credit note — triggers inventory transaction based on type
   * ส่งใบลดหนี้ — สร้างรายการเคลื่อนไหวสินค้าคงคลังตามประเภท
   */
  @MessagePattern({
    cmd: 'credit-note.submit',
    service: 'credit-note',
  })
  async submit(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'submit', payload }, CreditNoteController.name);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.creditNoteLogic.submit(payload.id, payload.user_id, payload.tenant_id || payload.bu_code),
    );
    return this.handleResult(result);
  }

  /**
   * Print a credit note via FastReport viewer (micro-report)
   * พิมพ์ใบลดหนี้ผ่าน FastReport viewer (micro-report)
   */
  @MessagePattern({
    cmd: 'credit-note.printToReport',
    service: 'credit-note',
  })
  async printToReport(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'printToReport', payload }, CreditNoteController.name);
    const { user_id, bu_code, id } = payload;
    this.creditNoteService.userId = user_id;
    this.creditNoteService.bu_code = bu_code;
    await this.creditNoteService.initializePrismaService(bu_code, user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.creditNoteService.printToReport(id),
    );
    return this.handleResult(result);
  }
}
