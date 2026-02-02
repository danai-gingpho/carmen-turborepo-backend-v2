import { Controller, HttpStatus } from '@nestjs/common';
import { CurrenciesService } from './currencies.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController } from '@/common';

@Controller()
export class CurrenciesController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    CurrenciesController.name,
  );
  constructor(private readonly currenciesService: CurrenciesService) {
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

  @MessagePattern({ cmd: 'currencies.findOne', service: 'currencies' })
  async findOne(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findOne', payload }, CurrenciesController.name);
    const id = payload.id;
    this.currenciesService.userId = payload.user_id;
    this.currenciesService.bu_code = payload.bu_code;
    await this.currenciesService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.currenciesService.findOne(id));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'currencies.findAll', service: 'currencies' })
  async findAll(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findAll', payload }, CurrenciesController.name);
    this.currenciesService.userId = payload.user_id;
    this.currenciesService.bu_code = payload.bu_code;
    const paginate = payload.paginate;
    await this.currenciesService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.currenciesService.findAll(paginate));
    return this.handlePaginatedResult(result);
  }

  @MessagePattern({ cmd: 'currencies.findAllActive', service: 'currencies' })
  async findAllActive(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findAllActive', payload }, CurrenciesController.name);
    this.currenciesService.userId = payload.user_id;
    this.currenciesService.bu_code = payload.bu_code;
    const paginate = payload.paginate;
    await this.currenciesService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.currenciesService.findAllActive(paginate));
    return this.handlePaginatedResult(result);
  }

  @MessagePattern({ cmd: 'currencies.find-all-by-id', service: 'currencies' })
  async findAllById(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findAllById', payload }, CurrenciesController.name);
    const ids = payload.ids;
    this.currenciesService.userId = payload.user_id;
    this.currenciesService.bu_code = payload.bu_code;
    await this.currenciesService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.currenciesService.findAllById(ids));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'currencies.create', service: 'currencies' })
  async create(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'create', payload }, CurrenciesController.name);
    const data = payload.data;
    this.currenciesService.userId = payload.user_id;
    this.currenciesService.bu_code = payload.bu_code;
    await this.currenciesService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.currenciesService.create(data));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  @MessagePattern({ cmd: 'currencies.update', service: 'currencies' })
  async update(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'update', payload }, CurrenciesController.name);
    const data = payload.data;
    this.currenciesService.userId = payload.user_id;
    this.currenciesService.bu_code = payload.bu_code;
    await this.currenciesService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.currenciesService.update(data));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'currencies.patch', service: 'currencies' })
  async patch(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'patch', payload }, CurrenciesController.name);
    const data = payload.data;
    this.currenciesService.userId = payload.user_id;
    this.currenciesService.bu_code = payload.bu_code;
    await this.currenciesService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.currenciesService.patch(data));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'currencies.delete', service: 'currencies' })
  async delete(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'delete', payload }, CurrenciesController.name);
    const id = payload.id;
    this.currenciesService.userId = payload.user_id;
    this.currenciesService.bu_code = payload.bu_code;
    await this.currenciesService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.currenciesService.delete(id));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'currencies.getDefault', service: 'currencies' })
  async getDefault(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'getDefault', payload }, CurrenciesController.name);
    this.currenciesService.userId = payload.user_id;
    this.currenciesService.bu_code = payload.bu_code;
    await this.currenciesService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.currenciesService.getDefault());
    return this.handleResult(result);
  }
}
