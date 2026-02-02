import { Controller, HttpStatus } from '@nestjs/common';
import { ProductCategoryService } from './product-category.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController } from '@/common';

@Controller()
export class ProductCategoryController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    ProductCategoryController.name,
  );
  constructor(
    private readonly productCategoryService: ProductCategoryService,
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
    cmd: 'product-category.findOne',
    service: 'product-category',
  })
  async findOne(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findOne', payload }, ProductCategoryController.name);
    const id = payload.id;
    this.productCategoryService.userId = payload.user_id;
    this.productCategoryService.bu_code = payload.bu_code;
    await this.productCategoryService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.productCategoryService.findOne(id));
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'product-category.findAll',
    service: 'product-category',
  })
  async findAll(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findAll', payload }, ProductCategoryController.name);
    this.productCategoryService.userId = payload.user_id;
    this.productCategoryService.bu_code = payload.bu_code;
    await this.productCategoryService.initializePrismaService(payload.bu_code, payload.user_id);
    const paginate = payload.paginate;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.productCategoryService.findAll(paginate));
    return this.handlePaginatedResult(result);
  }

  @MessagePattern({
    cmd: 'product-category.create',
    service: 'product-category',
  })
  async create(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'create', payload }, ProductCategoryController.name);
    const data = payload.data;
    this.productCategoryService.userId = payload.user_id;
    this.productCategoryService.bu_code = payload.bu_code;
    await this.productCategoryService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.productCategoryService.create(data));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  @MessagePattern({
    cmd: 'product-category.update',
    service: 'product-category',
  })
  async update(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'update', payload }, ProductCategoryController.name);
    const data = payload.data;
    this.productCategoryService.userId = payload.user_id;
    this.productCategoryService.bu_code = payload.bu_code;
    await this.productCategoryService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.productCategoryService.update(data));
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'product-category.delete',
    service: 'product-category',
  })
  async delete(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'delete', payload }, ProductCategoryController.name);
    const id = payload.id;
    this.productCategoryService.userId = payload.user_id;
    this.productCategoryService.bu_code = payload.bu_code;
    await this.productCategoryService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.productCategoryService.delete(id));
    return this.handleResult(result);
  }
}
