import { Controller, HttpStatus } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PeriodService } from './period.service';
import { ICreatePeriod, IUpdatePeriod } from './interface/period.interface';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController } from '@/common';

@Controller()
export class PeriodController extends BaseMicroserviceController {
  private readonly logger = new BackendLogger(PeriodController.name);

  constructor(private readonly periodService: PeriodService) {
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

  @MessagePattern({ cmd: 'inventory-period.findOne', service: 'inventory-period' })
  async findOne(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findOne', payload }, PeriodController.name);
    const id = payload.id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.periodService.findOne(id, user_id, tenant_id),
    );
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'inventory-period.findAll', service: 'inventory-period' })
  async findAll(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findAll', payload }, PeriodController.name);
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const paginate = payload.paginate;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.periodService.findAll(user_id, tenant_id, paginate),
    );
    return this.handlePaginatedResult(result);
  }

  @MessagePattern({ cmd: 'inventory-period.create', service: 'inventory-period' })
  async create(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'create', payload }, PeriodController.name);
    const data: ICreatePeriod = payload.data;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.periodService.create(data, user_id, tenant_id),
    );
    return this.handleResult(result, HttpStatus.CREATED);
  }

  @MessagePattern({ cmd: 'inventory-period.update', service: 'inventory-period' })
  async update(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'update', payload }, PeriodController.name);
    const data: IUpdatePeriod = { id: payload.id, ...payload.data };
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.periodService.update(data, user_id, tenant_id),
    );
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'inventory-period.delete', service: 'inventory-period' })
  async delete(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'delete', payload }, PeriodController.name);
    const id = payload.id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.periodService.delete(id, user_id, tenant_id),
    );
    return this.handleResult(result);
  }
}
