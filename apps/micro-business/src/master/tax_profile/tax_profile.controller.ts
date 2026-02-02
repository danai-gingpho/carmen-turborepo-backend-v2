import { Controller, HttpStatus } from '@nestjs/common';
import { TaxProfileService } from './tax_profile.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController } from '@/common';

@Controller()
export class TaxProfileController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    TaxProfileController.name,
  );
  constructor(
    private readonly taxProfileService: TaxProfileService,
  ) {
    super();
  }

  private createAuditContext(payload: any): AuditContext {
    return {
      tenant_id: payload.bu_code,
      user_id: payload.user_id,
      request_id: payload.request_id,
      ip_address: payload.ip_address,
      user_agent: payload.user_agent,
    };
  }

  @MessagePattern({
    cmd: 'tax-profile.findOne',
    service: 'tax-profile',
  })
  async findOne(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findOne', payload }, TaxProfileController.name);
    const id = payload.id;
    this.taxProfileService.userId = payload.user_id;
    this.taxProfileService.bu_code = payload.bu_code;
    await this.taxProfileService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.taxProfileService.findOne(id));
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'tax-profile.findAll',
    service: 'tax-profile',
  })
  async findAll(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findAll', payload }, TaxProfileController.name);
    this.taxProfileService.userId = payload.user_id;
    this.taxProfileService.bu_code = payload.bu_code;
    await this.taxProfileService.initializePrismaService(payload.bu_code, payload.user_id);
    const paginate = payload.paginate;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.taxProfileService.findAll(paginate));
    return this.handlePaginatedResult(result);
  }

  @MessagePattern({
    cmd: 'tax-profile.find-all-by-id',
    service: 'tax-profile',
  })
  async findAllById(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findAllById', payload }, TaxProfileController.name);
    const ids = payload.ids;
    this.taxProfileService.userId = payload.user_id;
    this.taxProfileService.bu_code = payload.bu_code;
    await this.taxProfileService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.taxProfileService.findAllById(ids));
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'tax-profile.create',
    service: 'tax-profile',
  })
  async create(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'create', payload }, TaxProfileController.name);
    const data = payload.data;
    this.taxProfileService.userId = payload.user_id;
    this.taxProfileService.bu_code = payload.bu_code;
    await this.taxProfileService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.taxProfileService.create(data));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  @MessagePattern({
    cmd: 'tax-profile.update',
    service: 'tax-profile',
  })
  async update(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'update', payload }, TaxProfileController.name);
    const id = payload.id;
    const data = payload.data;
    this.taxProfileService.userId = payload.user_id;
    this.taxProfileService.bu_code = payload.bu_code;
    await this.taxProfileService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.taxProfileService.update(id, data));
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'tax-profile.delete',
    service: 'tax-profile',
  })
  async delete(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'delete', payload }, TaxProfileController.name);
    const id = payload.id;
    this.taxProfileService.userId = payload.user_id;
    this.taxProfileService.bu_code = payload.bu_code;
    await this.taxProfileService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.taxProfileService.delete(id));
    return this.handleResult(result);
  }
}
