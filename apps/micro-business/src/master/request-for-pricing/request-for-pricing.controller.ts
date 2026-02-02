import { Controller, HttpStatus } from '@nestjs/common';
import { RequestForPricingService } from './request-for-pricing.service';
import { Payload } from '@nestjs/microservices';
import { MessagePattern } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController } from '@/common';

@Controller()
export class RequestForPricingController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    RequestForPricingController.name,
  );
  constructor(
    private readonly requestForPricingService: RequestForPricingService,
  ) {
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
    cmd: 'request-for-pricing.findOne',
    service: 'request-for-pricing',
  })
  async findOne(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'findOne', payload },
      RequestForPricingController.name,
    );
    const id = payload.id;
    this.requestForPricingService.userId = payload.user_id;
    this.requestForPricingService.bu_code = payload.bu_code;
    await this.requestForPricingService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.requestForPricingService.findOne(id));
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'request-for-pricing.findAll',
    service: 'request-for-pricing',
  })
  async findAll(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'findAll', payload },
      RequestForPricingController.name,
    );
    this.requestForPricingService.userId = payload.user_id;
    this.requestForPricingService.bu_code = payload.bu_code;
    const paginate = payload.paginate;
    await this.requestForPricingService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.requestForPricingService.findAll(paginate));
    return this.handlePaginatedResult(result);
  }

  @MessagePattern({
    cmd: 'request-for-pricing.create',
    service: 'request-for-pricing',
  })
  async create(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'create', payload },
      RequestForPricingController.name,
    );
    const data = payload.data;
    this.requestForPricingService.userId = payload.user_id;
    this.requestForPricingService.bu_code = payload.bu_code;
    await this.requestForPricingService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.requestForPricingService.create(data));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  @MessagePattern({
    cmd: 'request-for-pricing.update',
    service: 'request-for-pricing',
  })
  async update(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'update', payload },
      RequestForPricingController.name,
    );
    const data = payload.data;
    this.requestForPricingService.userId = payload.user_id;
    this.requestForPricingService.bu_code = payload.bu_code;
    await this.requestForPricingService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.requestForPricingService.update(data));
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'request-for-pricing.remove',
    service: 'request-for-pricing',
  })
  async remove(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'remove', payload },
      RequestForPricingController.name,
    );
    const id = payload.id;
    this.requestForPricingService.userId = payload.user_id;
    this.requestForPricingService.bu_code = payload.bu_code;
    await this.requestForPricingService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.requestForPricingService.remove(id));
    return this.handleResult(result);
  }
}
