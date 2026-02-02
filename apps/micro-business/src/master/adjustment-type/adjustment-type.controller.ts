import { Controller, HttpStatus } from '@nestjs/common';
import { AdjustmentTypeService } from './adjustment-type.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController } from '@/common';

@Controller()
export class AdjustmentTypeController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    AdjustmentTypeController.name,
  );

  constructor(private readonly adjustmentTypeService: AdjustmentTypeService) {
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

  @MessagePattern({ cmd: 'adjustment-type.findOne', service: 'adjustment-type' })
  async findOne(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findOne', payload }, AdjustmentTypeController.name);
    const id = payload.id;
    this.adjustmentTypeService.userId = payload.user_id;
    this.adjustmentTypeService.bu_code = payload.bu_code;
    await this.adjustmentTypeService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.adjustmentTypeService.findOne(id));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'adjustment-type.findAll', service: 'adjustment-type' })
  async findAll(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findAll', payload }, AdjustmentTypeController.name);
    this.adjustmentTypeService.userId = payload.user_id;
    this.adjustmentTypeService.bu_code = payload.bu_code;
    await this.adjustmentTypeService.initializePrismaService(payload.bu_code, payload.user_id);
    const paginate = payload.paginate;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.adjustmentTypeService.findAll(paginate));
    return this.handlePaginatedResult(result);
  }

  @MessagePattern({ cmd: 'adjustment-type.create', service: 'adjustment-type' })
  async create(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'create', payload }, AdjustmentTypeController.name);
    const data = payload.data;
    this.adjustmentTypeService.userId = payload.user_id;
    this.adjustmentTypeService.bu_code = payload.bu_code;
    await this.adjustmentTypeService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.adjustmentTypeService.create(data));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  @MessagePattern({ cmd: 'adjustment-type.update', service: 'adjustment-type' })
  async update(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'update', payload }, AdjustmentTypeController.name);
    const data = payload.data;
    this.adjustmentTypeService.userId = payload.user_id;
    this.adjustmentTypeService.bu_code = payload.bu_code;
    await this.adjustmentTypeService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.adjustmentTypeService.update(data));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'adjustment-type.delete', service: 'adjustment-type' })
  async delete(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'delete', payload }, AdjustmentTypeController.name);
    const id = payload.id;
    this.adjustmentTypeService.userId = payload.user_id;
    this.adjustmentTypeService.bu_code = payload.bu_code;
    await this.adjustmentTypeService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.adjustmentTypeService.delete(id));
    return this.handleResult(result);
  }
}
