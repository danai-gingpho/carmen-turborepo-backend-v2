import { Controller, HttpStatus } from '@nestjs/common';
import { CreditTermService } from './credit_term.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController } from '@/common';

@Controller()
export class CreditTermController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    CreditTermController.name,
  );
  constructor(private readonly creditTermService: CreditTermService) {
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

  @MessagePattern({ cmd: 'credit-term.findOne', service: 'credit-term' })
  async findOne(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findOne', payload }, CreditTermController.name);
    const { id, version } = payload;
    this.creditTermService.userId = payload.user_id;
    this.creditTermService.bu_code = payload.bu_code;
    await this.creditTermService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.creditTermService.findOne(id, version));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'credit-term.findAll', service: 'credit-term' })
  async findAll(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findAll', payload }, CreditTermController.name);
    const { paginate, version } = payload;
    this.creditTermService.userId = payload.user_id;
    this.creditTermService.bu_code = payload.bu_code;
    await this.creditTermService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.creditTermService.findAll(paginate, version));
    return this.handlePaginatedResult(result);
  }

  @MessagePattern({ cmd: 'credit-term.create', service: 'credit-term' })
  async create(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'create', payload }, CreditTermController.name);
    const { data, version } = payload;
    this.creditTermService.userId = payload.user_id;
    this.creditTermService.bu_code = payload.bu_code;
    await this.creditTermService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.creditTermService.create(data, version));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  @MessagePattern({ cmd: 'credit-term.update', service: 'credit-term' })
  async update(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'update', payload }, CreditTermController.name);
    const { data, version } = payload;
    this.creditTermService.userId = payload.user_id;
    this.creditTermService.bu_code = payload.bu_code;
    await this.creditTermService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.creditTermService.update(data, version));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'credit-term.delete', service: 'credit-term' })
  async delete(@Payload() payload: any): Promise<any> {
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
