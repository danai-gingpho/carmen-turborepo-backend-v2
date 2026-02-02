import { Controller } from '@nestjs/common';
import { PriceListTemplateService } from './price-list-template.service';
import { Payload } from '@nestjs/microservices';
import { MessagePattern } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';

@Controller()
export class PriceListTemplateController {
  private readonly logger: BackendLogger = new BackendLogger(
    PriceListTemplateController.name,
  );
  constructor(
    private readonly priceListTemplateService: PriceListTemplateService,
  ) {}

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
    cmd: 'price-list-template.findOne',
    service: 'price-list-template',
  })
  async findOne(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'findOne', payload },
      PriceListTemplateController.name,
    );
    const id = payload.id;
    this.priceListTemplateService.userId = payload.user_id;
    this.priceListTemplateService.bu_code = payload.bu_code;
    await this.priceListTemplateService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.priceListTemplateService.findOne(id));
  }

  @MessagePattern({
    cmd: 'price-list-template.findAll',
    service: 'price-list-template',
  })
  async findAll(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'findAll', payload },
      PriceListTemplateController.name,
    );
    this.priceListTemplateService.userId = payload.user_id;
    this.priceListTemplateService.bu_code = payload.bu_code;
    const paginate = payload.paginate;
    await this.priceListTemplateService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.priceListTemplateService.findAll(paginate));
  }

  @MessagePattern({
    cmd: 'price-list-template.create',
    service: 'price-list-template',
  })
  async create(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'create', payload },
      PriceListTemplateController.name,
    );
    const data = payload.data;
    this.priceListTemplateService.userId = payload.user_id;
    this.priceListTemplateService.bu_code = payload.bu_code;
    await this.priceListTemplateService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.priceListTemplateService.create(data));
  }

  @MessagePattern({
    cmd: 'price-list-template.update',
    service: 'price-list-template',
  })
  async update(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'update', payload },
      PriceListTemplateController.name,
    );
    const data = payload.data;
    this.priceListTemplateService.userId = payload.user_id;
    this.priceListTemplateService.bu_code = payload.bu_code;
    await this.priceListTemplateService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.priceListTemplateService.update(data));
  }

  @MessagePattern({
    cmd: 'price-list-template.remove',
    service: 'price-list-template',
  })
  async remove(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'remove', payload },
      PriceListTemplateController.name,
    );
    const id = payload.id;
    this.priceListTemplateService.userId = payload.user_id;
    this.priceListTemplateService.bu_code = payload.bu_code;
    await this.priceListTemplateService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.priceListTemplateService.remove(id));
  }

  @MessagePattern({
    cmd: 'price-list-template.updateStatus',
    service: 'price-list-template',
  })
  async updateStatus(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'updateStatus', payload },
      PriceListTemplateController.name,
    );
    const id = payload.id;
    const status = payload.status;
    this.priceListTemplateService.userId = payload.user_id;
    this.priceListTemplateService.bu_code = payload.bu_code;
    await this.priceListTemplateService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () =>
      this.priceListTemplateService.updateStatus(id, status),
    );
  }
}
