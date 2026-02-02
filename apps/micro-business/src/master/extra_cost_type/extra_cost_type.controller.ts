import { Controller, HttpStatus } from '@nestjs/common';
import { ExtraCostTypeService } from './extra_cost_type.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController } from '@/common';

@Controller()
export class ExtraCostTypeController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    ExtraCostTypeController.name,
  );
  constructor(private readonly extraCostTypeService: ExtraCostTypeService) {
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
    cmd: 'extra-cost-type.findOne',
    service: 'extra-cost-type',
  })
  async findOne(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findOne', payload }, ExtraCostTypeController.name);
    const id = payload.id;
    this.extraCostTypeService.userId = payload.user_id;
    this.extraCostTypeService.bu_code = payload.bu_code;
    await this.extraCostTypeService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.extraCostTypeService.findOne(id));
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'extra-cost-type.findAll',
    service: 'extra-cost-type',
  })
  async findAll(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findAll', payload }, ExtraCostTypeController.name);
    this.extraCostTypeService.userId = payload.user_id;
    this.extraCostTypeService.bu_code = payload.bu_code;
    const paginate = payload.paginate;
    await this.extraCostTypeService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.extraCostTypeService.findAll(paginate));
    return this.handlePaginatedResult(result);
  }

  @MessagePattern({ cmd: 'extra-cost-type.create', service: 'extra-cost-type' })
  async create(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'create', payload }, ExtraCostTypeController.name);
    const data = payload.data;
    this.extraCostTypeService.userId = payload.user_id;
    this.extraCostTypeService.bu_code = payload.bu_code;
    await this.extraCostTypeService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.extraCostTypeService.create(data));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  @MessagePattern({ cmd: 'extra-cost-type.update', service: 'extra-cost-type' })
  async update(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'update', payload }, ExtraCostTypeController.name);
    const data = payload.data;
    this.extraCostTypeService.userId = payload.user_id;
    this.extraCostTypeService.bu_code = payload.bu_code;
    await this.extraCostTypeService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.extraCostTypeService.update(data));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'extra-cost-type.delete', service: 'extra-cost-type' })
  async delete(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'delete', payload }, ExtraCostTypeController.name);
    const id = payload.id;
    this.extraCostTypeService.userId = payload.user_id;
    this.extraCostTypeService.bu_code = payload.bu_code;
    await this.extraCostTypeService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.extraCostTypeService.delete(id));
    return this.handleResult(result);
  }
}
