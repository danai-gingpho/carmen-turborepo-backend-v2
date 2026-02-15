import { Controller, HttpStatus } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SpotCheckService } from './spot-check.service';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController } from '@/common';

@Controller()
export class SpotCheckController extends BaseMicroserviceController {
  private readonly logger = new BackendLogger(SpotCheckController.name);

  constructor(private readonly spotCheckService: SpotCheckService) {
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

  @MessagePattern({ cmd: 'spot-check.findOne', service: 'spot-check' })
  async findOne(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'findOne', payload },
      SpotCheckController.name,
    );
    const { id, user_id } = payload;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.spotCheckService.findOne(id, user_id, tenant_id),
    );
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'spot-check.findAll', service: 'spot-check' })
  async findAll(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'findAll', payload },
      SpotCheckController.name,
    );
    const { user_id, paginate } = payload;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.spotCheckService.findAll(user_id, tenant_id, paginate),
    );
    return this.handlePaginatedResult(result);
  }

  @MessagePattern({ cmd: 'spot-check.create', service: 'spot-check' })
  async create(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'create', payload },
      SpotCheckController.name,
    );
    const { data, user_id } = payload;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.spotCheckService.create(data, user_id, tenant_id),
    );
    return this.handleResult(result, HttpStatus.CREATED);
  }

  @MessagePattern({ cmd: 'spot-check.delete', service: 'spot-check' })
  async delete(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'delete', payload },
      SpotCheckController.name,
    );
    const { id, user_id } = payload;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.spotCheckService.delete(id, user_id, tenant_id),
    );
    return this.handleResult(result);
  }
}
