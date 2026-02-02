import { Controller, HttpStatus } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Payload } from '@nestjs/microservices';
import { MessagePattern } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController } from '@/common';

@Controller()
export class ProductsController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    ProductsController.name,
  );
  constructor(private readonly productsService: ProductsService) {
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

  @MessagePattern({ cmd: 'products.findOne', service: 'products' })
  async findOne(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findOne', payload }, ProductsController.name);
    const id = payload.id;
    this.productsService.userId = payload.user_id;
    this.productsService.bu_code = payload.bu_code;
    await this.productsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.productsService.findOne(id));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'products.findAll', service: 'products' })
  async findAll(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findAll', payload }, ProductsController.name);
    this.productsService.userId = payload.user_id;
    this.productsService.bu_code = payload.bu_code;
    await this.productsService.initializePrismaService(payload.bu_code, payload.user_id);
    const paginate = payload.paginate;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.productsService.findAll(paginate));
    return this.handlePaginatedResult(result);
  }

  @MessagePattern({ cmd: 'products.find-many-by-id', service: 'products' })
  async findManyById(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findManyById', payload }, ProductsController.name);
    const ids = payload.ids;
    this.productsService.userId = payload.user_id;
    this.productsService.bu_code = payload.bu_code;
    await this.productsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.productsService.findManyById(ids));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'products.create', service: 'products' })
  async create(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'create', payload }, ProductsController.name);
    const data = payload.data;
    this.productsService.userId = payload.user_id;
    this.productsService.bu_code = payload.bu_code;
    await this.productsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.productsService.create(data));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  @MessagePattern({ cmd: 'products.update', service: 'products' })
  async update(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'update', payload }, ProductsController.name);
    const data = payload.data;
    this.productsService.userId = payload.user_id;
    this.productsService.bu_code = payload.bu_code;
    await this.productsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.productsService.update(data));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'products.delete', service: 'products' })
  async delete(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'delete', payload }, ProductsController.name);
    const id = payload.id;
    this.productsService.userId = payload.user_id;
    this.productsService.bu_code = payload.bu_code;
    await this.productsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.productsService.delete(id));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'products.findItemGroup', service: 'products' })
  async findItemGroup(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findItemGroup', payload }, ProductsController.name);
    const id = payload.id;
    this.productsService.userId = payload.user_id;
    this.productsService.bu_code = payload.bu_code;
    await this.productsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.productsService.findItemGroup(id));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'products.getByLocationId', service: 'products' })
  async getByLocationId(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'getByLocationId', payload },
      ProductsController.name,
    );
    this.productsService.userId = payload.user_id;
    this.productsService.bu_code = payload.bu_code;
    await this.productsService.initializePrismaService(payload.bu_code, payload.user_id);
    const location_id = payload.location_id;
    const paginate = payload.paginate;
    const version = payload.version;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.productsService.getByLocationId(
      location_id,
      paginate,
      version,
    ));
    return this.handlePaginatedResult(result);
  }
}
