import { Body, Controller, HttpStatus } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { PurchaseRequestTemplateLogic } from './purchase-request-template.logic';
import { PurchaseRequestTemplateService } from './purchase-request-template.service';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController, MicroservicePayload, MicroserviceResponse } from '@/common';

@Controller()
export class PurchaseRequestTemplateController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    PurchaseRequestTemplateController.name,
  );
  constructor(
    private readonly purchaseRequestTemplateLogic: PurchaseRequestTemplateLogic,
    private readonly purchaseRequestTemplateService: PurchaseRequestTemplateService,
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
   * Find a purchase request template by ID
   * ค้นหาเทมเพลตใบขอซื้อรายการเดียวตาม ID
   * @param payload - Payload containing the template ID / payload ที่มี ID ของเทมเพลต
   * @returns Purchase request template data / ข้อมูลเทมเพลตใบขอซื้อ
   */
  @MessagePattern({
    cmd: 'purchase-request-template.find-one',
    service: 'purchase-request-template',
  })
  async findOne(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findOne', payload }, PurchaseRequestTemplateController.name);
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const id = payload.id;

    this.purchaseRequestTemplateService.bu_code = tenant_id;
    this.purchaseRequestTemplateService.userId = user_id;
    await this.purchaseRequestTemplateService.initializePrismaService(tenant_id, user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.purchaseRequestTemplateService.findOne(id));
    return this.handleResult(result);
  }

  /**
   * Find all purchase request templates with pagination
   * ค้นหาเทมเพลตใบขอซื้อทั้งหมดพร้อมการแบ่งหน้า
   * @param payload - Payload containing pagination parameters / payload ที่มีพารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of purchase request templates / รายการเทมเพลตใบขอซื้อที่แบ่งหน้าแล้ว
   */
  @MessagePattern({
    cmd: 'purchase-request-template.find-all',
    service: 'purchase-request-template',
  })
  async findAll(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findAll', payload }, PurchaseRequestTemplateController.name);
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const paginate = payload.paginate;

    this.purchaseRequestTemplateService.bu_code = tenant_id;
    this.purchaseRequestTemplateService.userId = user_id;
    await this.purchaseRequestTemplateService.initializePrismaService(tenant_id, user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.purchaseRequestTemplateService.findAll(paginate));
    return this.handlePaginatedResult(result);
  }

  /**
   * Create a new purchase request template
   * สร้างเทมเพลตใบขอซื้อใหม่
   * @param payload - Payload containing template data / payload ที่มีข้อมูลเทมเพลต
   * @returns Created purchase request template / เทมเพลตใบขอซื้อที่สร้างแล้ว
   */
  @MessagePattern({
    cmd: 'purchase-request-template.create',
    service: 'purchase-request-template',
  })
  async create(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'create', payload }, PurchaseRequestTemplateController.name);
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseRequestTemplateLogic.create(
        payload.data,
        user_id,
        tenant_id,
      )
    );
    return this.handleResult(result, HttpStatus.CREATED);
  }

  /**
   * Update an existing purchase request template
   * อัปเดตเทมเพลตใบขอซื้อที่มีอยู่
   * @param payload - Payload containing updated template data / payload ที่มีข้อมูลเทมเพลตที่อัปเดต
   * @returns Updated purchase request template / เทมเพลตใบขอซื้อที่อัปเดตแล้ว
   */
  @MessagePattern({
    cmd: 'purchase-request-template.update',
    service: 'purchase-request-template',
  })
  async update(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'update', payload }, PurchaseRequestTemplateController.name);
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseRequestTemplateLogic.update(
        payload.data,
        user_id,
        tenant_id,
      )
    );
    return this.handleResult(result);
  }

  /**
   * Delete a purchase request template by ID
   * ลบเทมเพลตใบขอซื้อตาม ID
   * @param payload - Payload containing the template ID to delete / payload ที่มี ID ของเทมเพลตที่ต้องการลบ
   * @returns Deleted template ID / ID ของเทมเพลตที่ลบแล้ว
   */
  @MessagePattern({
    cmd: 'purchase-request-template.delete',
    service: 'purchase-request-template',
  })
  async delete(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'delete', payload }, PurchaseRequestTemplateController.name);
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const id = payload.id;

    this.purchaseRequestTemplateService.bu_code = tenant_id;
    this.purchaseRequestTemplateService.userId = user_id;
    await this.purchaseRequestTemplateService.initializePrismaService(tenant_id, user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.purchaseRequestTemplateService.delete(id));
    return this.handleResult(result);
  }
}
