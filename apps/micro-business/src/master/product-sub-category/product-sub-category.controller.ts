import { Controller, HttpStatus } from '@nestjs/common';
import { ProductSubCategoryService } from './product-sub-category.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController } from '@/common';

@Controller()
export class ProductSubCategoryController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    ProductSubCategoryController.name,
  );
  constructor(
    private readonly productSubCategoryService: ProductSubCategoryService,
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
    cmd: 'product-sub-category.findOne',
    service: 'product-sub-category',
  })
  async findOne(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findOne', payload }, ProductSubCategoryController.name);
    const id = payload.id;
    this.productSubCategoryService.userId = payload.user_id;
    this.productSubCategoryService.bu_code = payload.bu_code;
    await this.productSubCategoryService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.productSubCategoryService.findOne(id));
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'product-sub-category.findAll',
    service: 'product-sub-category',
  })
  async findAll(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findAll', payload }, ProductSubCategoryController.name);
    this.productSubCategoryService.userId = payload.user_id;
    this.productSubCategoryService.bu_code = payload.bu_code;
    await this.productSubCategoryService.initializePrismaService(payload.bu_code, payload.user_id);
    const paginate = payload.paginate;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.productSubCategoryService.findAll(paginate));
    return this.handlePaginatedResult(result);
  }

  @MessagePattern({
    cmd: 'product-sub-category.create',
    service: 'product-sub-category',
  })
  async create(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'create', payload }, ProductSubCategoryController.name);
    const data = payload.data;
    this.productSubCategoryService.userId = payload.user_id;
    this.productSubCategoryService.bu_code = payload.bu_code;
    await this.productSubCategoryService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.productSubCategoryService.create(data));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  @MessagePattern({
    cmd: 'product-sub-category.update',
    service: 'product-sub-category',
  })
  async update(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'update', payload }, ProductSubCategoryController.name);
    const data = payload.data;
    this.productSubCategoryService.userId = payload.user_id;
    this.productSubCategoryService.bu_code = payload.bu_code;
    await this.productSubCategoryService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.productSubCategoryService.update(data));
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'product-sub-category.delete',
    service: 'product-sub-category',
  })
  async delete(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'delete', payload }, ProductSubCategoryController.name);
    const id = payload.id;
    this.productSubCategoryService.userId = payload.user_id;
    this.productSubCategoryService.bu_code = payload.bu_code;
    await this.productSubCategoryService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.productSubCategoryService.delete(id));
    return this.handleResult(result);
  }
}
