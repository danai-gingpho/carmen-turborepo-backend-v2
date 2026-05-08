import { Controller, HttpStatus } from '@nestjs/common';
import { ProductSubCategoryService } from './product-sub-category.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController, MicroservicePayload, MicroserviceResponse } from '@/common';

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
   * Find a single product sub-category by ID
   * ค้นหารายการหมวดหมู่ย่อยสินค้าเดียวตาม ID
   * @param payload - Microservice payload containing product sub-category ID / ข้อมูล payload ที่มี ID ของหมวดหมู่ย่อยสินค้า
   * @returns Product sub-category detail / รายละเอียดหมวดหมู่ย่อยสินค้า
   */
  @MessagePattern({
    cmd: 'product-sub-category.findOne',
    service: 'product-sub-category',
  })
  async findOne(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findOne', payload }, ProductSubCategoryController.name);
    const id = payload.id;
    this.productSubCategoryService.userId = payload.user_id;
    this.productSubCategoryService.bu_code = payload.bu_code;
    await this.productSubCategoryService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.productSubCategoryService.findOne(id));
    return this.handleResult(result);
  }

  /**
   * Find all product sub-categories with pagination
   * ค้นหารายการหมวดหมู่ย่อยสินค้าทั้งหมดพร้อมการแบ่งหน้า
   * @param payload - Microservice payload containing pagination parameters / ข้อมูล payload ที่มีพารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of product sub-categories / รายการหมวดหมู่ย่อยสินค้าพร้อมการแบ่งหน้า
   */
  @MessagePattern({
    cmd: 'product-sub-category.findAll',
    service: 'product-sub-category',
  })
  async findAll(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findAll', payload }, ProductSubCategoryController.name);
    this.productSubCategoryService.userId = payload.user_id;
    this.productSubCategoryService.bu_code = payload.bu_code;
    await this.productSubCategoryService.initializePrismaService(payload.bu_code, payload.user_id);
    const paginate = payload.paginate;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.productSubCategoryService.findAll(paginate));
    return this.handlePaginatedResult(result);
  }

  /**
   * Create a new product sub-category
   * สร้างหมวดหมู่ย่อยสินค้าใหม่
   * @param payload - Microservice payload containing product sub-category data / ข้อมูล payload ที่มีข้อมูลหมวดหมู่ย่อยสินค้า
   * @returns Created product sub-category ID / ID ของหมวดหมู่ย่อยสินค้าที่สร้างขึ้น
   */
  @MessagePattern({
    cmd: 'product-sub-category.create',
    service: 'product-sub-category',
  })
  async create(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'create', payload }, ProductSubCategoryController.name);
    const data = payload.data;
    this.productSubCategoryService.userId = payload.user_id;
    this.productSubCategoryService.bu_code = payload.bu_code;
    await this.productSubCategoryService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.productSubCategoryService.create(data));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  /**
   * Update an existing product sub-category
   * อัปเดตหมวดหมู่ย่อยสินค้าที่มีอยู่
   * @param payload - Microservice payload containing updated product sub-category data / ข้อมูล payload ที่มีข้อมูลหมวดหมู่ย่อยสินค้าที่อัปเดต
   * @returns Updated product sub-category ID / ID ของหมวดหมู่ย่อยสินค้าที่อัปเดต
   */
  @MessagePattern({
    cmd: 'product-sub-category.update',
    service: 'product-sub-category',
  })
  async update(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'update', payload }, ProductSubCategoryController.name);
    const data = payload.data;
    this.productSubCategoryService.userId = payload.user_id;
    this.productSubCategoryService.bu_code = payload.bu_code;
    await this.productSubCategoryService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.productSubCategoryService.update(data));
    return this.handleResult(result);
  }

  /**
   * Delete a product sub-category (soft delete)
   * ลบหมวดหมู่ย่อยสินค้า (ลบแบบซอฟต์)
   * @param payload - Microservice payload containing product sub-category ID / ข้อมูล payload ที่มี ID ของหมวดหมู่ย่อยสินค้า
   * @returns Deleted product sub-category ID / ID ของหมวดหมู่ย่อยสินค้าที่ลบ
   */
  @MessagePattern({
    cmd: 'product-sub-category.delete',
    service: 'product-sub-category',
  })
  async delete(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
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
