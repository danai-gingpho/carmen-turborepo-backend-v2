import { Controller, HttpStatus } from '@nestjs/common';
import { PeriodService } from './period.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController } from '@/common';

@Controller()
export class PeriodController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    PeriodController.name,
  );

  constructor(private readonly periodService: PeriodService) {
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

  @MessagePattern({ cmd: 'period.findOne', service: 'period' })
  async findOne(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findOne', payload }, PeriodController.name);
    const id = payload.id;
    this.periodService.userId = payload.user_id;
    this.periodService.bu_code = payload.bu_code;
    await this.periodService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.periodService.findOne(id));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'period.findAll', service: 'period' })
  async findAll(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findAll', payload }, PeriodController.name);
    this.periodService.userId = payload.user_id;
    this.periodService.bu_code = payload.bu_code;
    const paginate = payload.paginate;
    await this.periodService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.periodService.findAll(paginate));
    return this.handlePaginatedResult(result);
  }

  @MessagePattern({ cmd: 'period.create', service: 'period' })
  async create(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'create', payload }, PeriodController.name);
    const data = payload.data;
    this.periodService.userId = payload.user_id;
    this.periodService.bu_code = payload.bu_code;
    await this.periodService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.periodService.create(data));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  @MessagePattern({ cmd: 'period.update', service: 'period' })
  async update(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'update', payload }, PeriodController.name);
    const data = payload.data;
    this.periodService.userId = payload.user_id;
    this.periodService.bu_code = payload.bu_code;
    await this.periodService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.periodService.update(data));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'period.patch', service: 'period' })
  async patch(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'patch', payload }, PeriodController.name);
    const data = payload.data;
    this.periodService.userId = payload.user_id;
    this.periodService.bu_code = payload.bu_code;
    await this.periodService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.periodService.patch(data));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'period.delete', service: 'period' })
  async delete(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'delete', payload }, PeriodController.name);
    const id = payload.id;
    this.periodService.userId = payload.user_id;
    this.periodService.bu_code = payload.bu_code;
    await this.periodService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.periodService.delete(id));
    return this.handleResult(result);
  }
}
