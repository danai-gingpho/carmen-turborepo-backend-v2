import { Body, Controller, HttpStatus } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { PurchaseRequestTemplateLogic } from './purchase-request-template.logic';
import { PurchaseRequestTemplateService } from './purchase-request-template.service';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController } from '@/common';

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

  private createAuditContext(payload: any): AuditContext {
    return {
      tenant_id: payload.tenant_id || payload.bu_code,
      user_id: payload.user_id,
      request_id: payload.request_id,
      ip_address: payload.ip_address,
      user_agent: payload.user_agent,
    };
  }

  @MessagePattern({
    cmd: 'purchase-request-template.find-one',
    service: 'purchase-request-template',
  })
  async findOne(@Body() payload: any): Promise<any> {
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

  @MessagePattern({
    cmd: 'purchase-request-template.find-all',
    service: 'purchase-request-template',
  })
  async findAll(@Body() payload: any): Promise<any> {
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

  @MessagePattern({
    cmd: 'purchase-request-template.create',
    service: 'purchase-request-template',
  })
  async create(@Body() payload: any): Promise<any> {
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

  @MessagePattern({
    cmd: 'purchase-request-template.update',
    service: 'purchase-request-template',
  })
  async update(@Body() payload: any): Promise<any> {
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

  @MessagePattern({
    cmd: 'purchase-request-template.delete',
    service: 'purchase-request-template',
  })
  async delete(@Body() payload: any): Promise<any> {
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
