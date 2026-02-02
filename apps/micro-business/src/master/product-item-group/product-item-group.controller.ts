import { Controller, HttpStatus } from '@nestjs/common';
import { ProductItemGroupService } from './product-item-group.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController } from '@/common';

@Controller()
export class ProductItemGroupController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    ProductItemGroupController.name,
  );
  constructor(
    private readonly productItemGroupService: ProductItemGroupService,
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
    cmd: 'product-item-group.findOne',
    service: 'product-item-group',
  })
  async findOne(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findOne', payload }, ProductItemGroupController.name);
    const id = payload.id;
    this.productItemGroupService.userId = payload.user_id;
    this.productItemGroupService.bu_code = payload.bu_code;
    await this.productItemGroupService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.productItemGroupService.findOne(id));
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'product-item-group.findAll',
    service: 'product-item-group',
  })
  async findAll(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findAll', payload }, ProductItemGroupController.name);
    this.productItemGroupService.userId = payload.user_id;
    this.productItemGroupService.bu_code = payload.bu_code;
    await this.productItemGroupService.initializePrismaService(payload.bu_code, payload.user_id);
    const paginate = payload.paginate;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.productItemGroupService.findAll(paginate));
    return this.handlePaginatedResult(result);
  }

  @MessagePattern({
    cmd: 'product-item-group.create',
    service: 'product-item-group',
  })
  async create(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'create', payload }, ProductItemGroupController.name);
    const data = payload.data;
    this.productItemGroupService.userId = payload.user_id;
    this.productItemGroupService.bu_code = payload.bu_code;
    await this.productItemGroupService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.productItemGroupService.create(data));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  @MessagePattern({
    cmd: 'product-item-group.update',
    service: 'product-item-group',
  })
  async update(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'update', payload }, ProductItemGroupController.name);
    const data = payload.data;
    this.productItemGroupService.userId = payload.user_id;
    this.productItemGroupService.bu_code = payload.bu_code;
    await this.productItemGroupService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.productItemGroupService.update(data));
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'product-item-group.delete',
    service: 'product-item-group',
  })
  async delete(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'delete', payload }, ProductItemGroupController.name);
    const id = payload.id;
    this.productItemGroupService.userId = payload.user_id;
    this.productItemGroupService.bu_code = payload.bu_code;
    await this.productItemGroupService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.productItemGroupService.delete(id));
    return this.handleResult(result);
  }
}
