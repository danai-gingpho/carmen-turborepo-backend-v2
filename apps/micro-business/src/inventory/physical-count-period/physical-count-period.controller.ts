import { Controller, HttpStatus } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PhysicalCountPeriodService } from './physical-count-period.service';
import { IPhysicalCountPeriodCreate, IPhysicalCountPeriodUpdate } from './interface/physical-count-period.interface';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController } from '@/common';

@Controller()
export class PhysicalCountPeriodController extends BaseMicroserviceController {
  private readonly logger = new BackendLogger(PhysicalCountPeriodController.name);

  constructor(private readonly physicalCountPeriodService: PhysicalCountPeriodService) {
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

  @MessagePattern({ cmd: 'physical-count-period.findOne', service: 'physical-count-period' })
  async findOne(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findOne', payload }, PhysicalCountPeriodController.name);
    const id = payload.id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.physicalCountPeriodService.findOne(id, user_id, tenant_id),
    );
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'physical-count-period.findAll', service: 'physical-count-period' })
  async findAll(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findAll', payload }, PhysicalCountPeriodController.name);
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const paginate = payload.paginate;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.physicalCountPeriodService.findAll(user_id, tenant_id, paginate),
    );
    return this.handlePaginatedResult(result);
  }

  @MessagePattern({ cmd: 'physical-count-period.nearest', service: 'physical-count-period' })
  async findNearest(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findNearest', payload }, PhysicalCountPeriodController.name);
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.physicalCountPeriodService.findNearest(user_id, tenant_id),
    );
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'physical-count-period.create', service: 'physical-count-period' })
  async create(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'create', payload }, PhysicalCountPeriodController.name);
    const data: IPhysicalCountPeriodCreate = payload.data;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.physicalCountPeriodService.create(data, user_id, tenant_id),
    );
    return this.handleResult(result, HttpStatus.CREATED);
  }

  @MessagePattern({ cmd: 'physical-count-period.update', service: 'physical-count-period' })
  async update(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'update', payload }, PhysicalCountPeriodController.name);
    const data: IPhysicalCountPeriodUpdate = { id: payload.id, ...payload.data };
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.physicalCountPeriodService.update(data, user_id, tenant_id),
    );
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'physical-count-period.delete', service: 'physical-count-period' })
  async delete(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'delete', payload }, PhysicalCountPeriodController.name);
    const id = payload.id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.physicalCountPeriodService.delete(id, user_id, tenant_id),
    );
    return this.handleResult(result);
  }
}
