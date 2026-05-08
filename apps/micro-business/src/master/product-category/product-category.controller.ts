import { Controller, HttpStatus } from '@nestjs/common';
import { ProductCategoryService } from './product-category.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController, MicroservicePayload, MicroserviceResponse } from '@/common';

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

  private createAuditContext(payload: MicroservicePayload): AuditContext {
    return {
      tenant_id: payload.bu_code,
      user_id: payload.user_id,
      request_id: payload.request_id,
      ip_address: payload.ip_address,
      user_agent: payload.user_agent,
    };
  }

  /**
   * Find a single product category by ID
   * ค้นหารายการหมวดหมู่สินค้าเดียวตาม ID
   * @param payload - Microservice payload containing product category ID / ข้อมูล payload ที่มี ID ของหมวดหมู่สินค้า
   * @returns Product category detail / รายละเอียดหมวดหมู่สินค้า
   */
  @MessagePattern({
    cmd: 'product-category.findOne',
    service: 'product-category',
  })
  async findOne(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findOne', payload }, ProductCategoryController.name);
    const id = payload.id;
    this.productCategoryService.userId = payload.user_id;
    this.productCategoryService.bu_code = payload.bu_code;
    await this.productCategoryService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.productCategoryService.findOne(id));
    return this.handleResult(result);
  }

  /**
   * Find all product categories with pagination
   * ค้นหารายการหมวดหมู่สินค้าทั้งหมดพร้อมการแบ่งหน้า
   * @param payload - Microservice payload containing pagination parameters / ข้อมูล payload ที่มีพารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of product categories / รายการหมวดหมู่สินค้าพร้อมการแบ่งหน้า
   */
  @MessagePattern({
    cmd: 'product-category.findAll',
    service: 'product-category',
  })
  async findAll(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findAll', payload }, ProductCategoryController.name);
    this.productCategoryService.userId = payload.user_id;
    this.productCategoryService.bu_code = payload.bu_code;
    await this.productCategoryService.initializePrismaService(payload.bu_code, payload.user_id);
    const paginate = payload.paginate;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.productCategoryService.findAll(paginate));
    return this.handlePaginatedResult(result);
  }

  /**
   * Create a new product category
   * สร้างหมวดหมู่สินค้าใหม่
   * @param payload - Microservice payload containing product category data / ข้อมูล payload ที่มีข้อมูลหมวดหมู่สินค้า
   * @returns Created product category ID / ID ของหมวดหมู่สินค้าที่สร้างขึ้น
   */
  @MessagePattern({
    cmd: 'product-category.create',
    service: 'product-category',
  })
  async create(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'create', payload }, ProductCategoryController.name);
    const data = payload.data;
    this.productCategoryService.userId = payload.user_id;
    this.productCategoryService.bu_code = payload.bu_code;
    await this.productCategoryService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.productCategoryService.create(data));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  /**
   * Update an existing product category
   * อัปเดตหมวดหมู่สินค้าที่มีอยู่
   * @param payload - Microservice payload containing updated product category data / ข้อมูล payload ที่มีข้อมูลหมวดหมู่สินค้าที่อัปเดต
   * @returns Updated product category ID / ID ของหมวดหมู่สินค้าที่อัปเดต
   */
  @MessagePattern({
    cmd: 'product-category.update',
    service: 'product-category',
  })
  async update(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'update', payload }, ProductCategoryController.name);
    const data = payload.data;
    this.productCategoryService.userId = payload.user_id;
    this.productCategoryService.bu_code = payload.bu_code;
    await this.productCategoryService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.productCategoryService.update(data));
    return this.handleResult(result);
  }

  /**
   * Delete a product category (soft delete)
   * ลบหมวดหมู่สินค้า (ลบแบบซอฟต์)
   * @param payload - Microservice payload containing product category ID / ข้อมูล payload ที่มี ID ของหมวดหมู่สินค้า
   * @returns Deleted product category ID / ID ของหมวดหมู่สินค้าที่ลบ
   */
  @MessagePattern({
    cmd: 'product-category.delete',
    service: 'product-category',
  })
  async delete(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
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
