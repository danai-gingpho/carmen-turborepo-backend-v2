import { Controller, HttpStatus } from '@nestjs/common';
import { ExchangeRateService } from './exchange-rate.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { ICreateExchangeRate } from './interface/exchange-rate.interface';
import { BaseMicroserviceController } from '@/common';

@Controller()
export class ExchangeRateController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    ExchangeRateController.name,
  );
  constructor(private readonly exchangeRateService: ExchangeRateService) {
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

  @MessagePattern({ cmd: 'exchange-rate.findOne', service: 'exchange-rate' })
  async findOne(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findOne', payload }, ExchangeRateController.name);
    const id = payload.id;
    this.exchangeRateService.userId = payload.user_id;
    this.exchangeRateService.bu_code = payload.bu_code;
    await this.exchangeRateService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.exchangeRateService.findOne(id));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'exchange-rate.findAll', service: 'exchange-rate' })
  async findAll(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findAll', payload }, ExchangeRateController.name);
    this.exchangeRateService.userId = payload.user_id;
    this.exchangeRateService.bu_code = payload.bu_code;
    const paginate = payload.paginate;
    await this.exchangeRateService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.exchangeRateService.findAll(paginate));
    return this.handlePaginatedResult(result);
  }

  @MessagePattern({ cmd: 'exchange-rate.create', service: 'exchange-rate' })
  async create(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'create', payload }, ExchangeRateController.name);
    const data: ICreateExchangeRate = payload.data;
    this.exchangeRateService.userId = payload.user_id;
    this.exchangeRateService.bu_code = payload.bu_code;
    await this.exchangeRateService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.exchangeRateService.create(data));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  @MessagePattern({ cmd: 'exchange-rate.update', service: 'exchange-rate' })
  async update(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'update', payload }, ExchangeRateController.name);
    const data = payload.data;
    this.exchangeRateService.userId = payload.user_id;
    this.exchangeRateService.bu_code = payload.bu_code;
    await this.exchangeRateService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.exchangeRateService.update(data));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'exchange-rate.delete', service: 'exchange-rate' })
  async delete(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'delete', payload }, ExchangeRateController.name);
    const id = payload.id;
    this.exchangeRateService.userId = payload.user_id;
    this.exchangeRateService.bu_code = payload.bu_code;
    await this.exchangeRateService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.exchangeRateService.delete(id));
    return this.handleResult(result);
  }
}
