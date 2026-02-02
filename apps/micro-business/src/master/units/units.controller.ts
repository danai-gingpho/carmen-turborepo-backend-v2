import { Controller, HttpStatus } from '@nestjs/common';
import { UnitsService } from './units.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController } from '@/common';

@Controller()
export class UnitsController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    UnitsController.name,
  );
  constructor(private readonly unitsService: UnitsService) {
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

  @MessagePattern({ cmd: 'units.findOne', service: 'units' })
  async findOne(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findOne', payload }, UnitsController.name);
    const id = payload.id;
    this.unitsService.userId = payload.user_id;
    this.unitsService.bu_code = payload.bu_code;
    await this.unitsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.unitsService.findOne(id));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'units.findAll', service: 'units' })
  async findAll(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findAll', payload }, UnitsController.name);
    this.unitsService.userId = payload.user_id;
    this.unitsService.bu_code = payload.bu_code;
    await this.unitsService.initializePrismaService(payload.bu_code, payload.user_id);
    const paginate = payload.paginate;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.unitsService.findAll(paginate));
    return this.handlePaginatedResult(result);
  }

  @MessagePattern({ cmd: 'units.find-all-by-id', service: 'units' })
  async findAllById(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findAllById', payload }, UnitsController.name);
    const ids = payload.ids;
    this.unitsService.userId = payload.user_id;
    this.unitsService.bu_code = payload.bu_code;
    await this.unitsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.unitsService.findAllById(ids));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'units.create', service: 'units' })
  async create(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'create', payload }, UnitsController.name);
    const data = payload.data;
    this.unitsService.userId = payload.user_id;
    this.unitsService.bu_code = payload.bu_code;
    await this.unitsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.unitsService.create(data));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  @MessagePattern({ cmd: 'units.update', service: 'units' })
  async update(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'update', payload }, UnitsController.name);
    const data = payload.data;
    this.unitsService.userId = payload.user_id;
    this.unitsService.bu_code = payload.bu_code;
    await this.unitsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.unitsService.update(data));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'units.delete', service: 'units' })
  async delete(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'delete', payload }, UnitsController.name);
    const id = payload.id;
    this.unitsService.userId = payload.user_id;
    this.unitsService.bu_code = payload.bu_code;
    await this.unitsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.unitsService.delete(id));
    return this.handleResult(result);
  }
}
