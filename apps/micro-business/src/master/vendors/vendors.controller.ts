import { Controller, HttpStatus } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController } from '@/common';

@Controller()
export class VendorsController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    VendorsController.name,
  );
  constructor(private readonly vendorsService: VendorsService) {
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

  @MessagePattern({ cmd: 'vendors.findOne', service: 'vendors' })
  async findOne(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findOne', payload }, VendorsController.name);
    const id = payload.id;
    this.vendorsService.userId = payload.user_id;
    this.vendorsService.bu_code = payload.bu_code;
    await this.vendorsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.vendorsService.findOne(id));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'vendors.findAll', service: 'vendors' })
  async findAll(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findAll', payload }, VendorsController.name);
    this.vendorsService.userId = payload.user_id;
    this.vendorsService.bu_code = payload.bu_code;
    await this.vendorsService.initializePrismaService(payload.bu_code, payload.user_id);
    const paginate = payload.paginate;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.vendorsService.findAll(paginate));
    return this.handlePaginatedResult(result);
  }

  @MessagePattern({ cmd: 'vendors.find-all-by-id', service: 'vendors' })
  async findAllById(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findAllById', payload }, VendorsController.name);
    const ids = payload.ids;
    this.vendorsService.userId = payload.user_id;
    this.vendorsService.bu_code = payload.bu_code;
    await this.vendorsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.vendorsService.findAllById(ids));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'vendors.create', service: 'vendors' })
  async create(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'create', payload }, VendorsController.name);
    const data = payload.data;
    this.vendorsService.userId = payload.user_id;
    this.vendorsService.bu_code = payload.bu_code;
    await this.vendorsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.vendorsService.create(data));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  @MessagePattern({ cmd: 'vendors.update', service: 'vendors' })
  async update(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'update', payload }, VendorsController.name);
    const data = payload.data;
    this.vendorsService.userId = payload.user_id;
    this.vendorsService.bu_code = payload.bu_code;
    await this.vendorsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.vendorsService.update(data));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'vendors.delete', service: 'vendors' })
  async delete(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'delete', payload }, VendorsController.name);
    const id = payload.id;
    this.vendorsService.userId = payload.user_id;
    this.vendorsService.bu_code = payload.bu_code;
    await this.vendorsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.vendorsService.delete(id));
    return this.handleResult(result);
  }
}
