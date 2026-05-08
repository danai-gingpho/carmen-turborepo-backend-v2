import { Controller, HttpStatus } from '@nestjs/common';
import { ProductItemGroupService } from './product-item-group.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController, MicroservicePayload, MicroserviceResponse } from '@/common';

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
   * Find a single product item group by ID
   * ค้นหารายการกลุ่มสินค้าเดียวตาม ID
   * @param payload - Microservice payload containing product item group ID / ข้อมูล payload ที่มี ID ของกลุ่มสินค้า
   * @returns Product item group detail / รายละเอียดกลุ่มสินค้า
   */
  @MessagePattern({
    cmd: 'product-item-group.findOne',
    service: 'product-item-group',
  })
  async findOne(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findOne', payload }, ProductItemGroupController.name);
    const id = payload.id;
    this.productItemGroupService.userId = payload.user_id;
    this.productItemGroupService.bu_code = payload.bu_code;
    await this.productItemGroupService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.productItemGroupService.findOne(id));
    return this.handleResult(result);
  }

  /**
   * Find all product item groups with pagination
   * ค้นหารายการกลุ่มสินค้าทั้งหมดพร้อมการแบ่งหน้า
   * @param payload - Microservice payload containing pagination parameters / ข้อมูล payload ที่มีพารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of product item groups / รายการกลุ่มสินค้าพร้อมการแบ่งหน้า
   */
  @MessagePattern({
    cmd: 'product-item-group.findAll',
    service: 'product-item-group',
  })
  async findAll(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findAll', payload }, ProductItemGroupController.name);
    this.productItemGroupService.userId = payload.user_id;
    this.productItemGroupService.bu_code = payload.bu_code;
    await this.productItemGroupService.initializePrismaService(payload.bu_code, payload.user_id);
    const paginate = payload.paginate;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.productItemGroupService.findAll(paginate));
    return this.handlePaginatedResult(result);
  }

  /**
   * Create a new product item group
   * สร้างกลุ่มสินค้าใหม่
   * @param payload - Microservice payload containing product item group data / ข้อมูล payload ที่มีข้อมูลกลุ่มสินค้า
   * @returns Created product item group ID / ID ของกลุ่มสินค้าที่สร้างขึ้น
   */
  @MessagePattern({
    cmd: 'product-item-group.create',
    service: 'product-item-group',
  })
  async create(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'create', payload }, ProductItemGroupController.name);
    const data = payload.data;
    this.productItemGroupService.userId = payload.user_id;
    this.productItemGroupService.bu_code = payload.bu_code;
    await this.productItemGroupService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.productItemGroupService.create(data));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  /**
   * Update an existing product item group
   * อัปเดตกลุ่มสินค้าที่มีอยู่
   * @param payload - Microservice payload containing updated product item group data / ข้อมูล payload ที่มีข้อมูลกลุ่มสินค้าที่อัปเดต
   * @returns Updated product item group ID / ID ของกลุ่มสินค้าที่อัปเดต
   */
  @MessagePattern({
    cmd: 'product-item-group.update',
    service: 'product-item-group',
  })
  async update(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'update', payload }, ProductItemGroupController.name);
    const data = payload.data;
    this.productItemGroupService.userId = payload.user_id;
    this.productItemGroupService.bu_code = payload.bu_code;
    await this.productItemGroupService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.productItemGroupService.update(data));
    return this.handleResult(result);
  }

  /**
   * Delete a product item group (soft delete)
   * ลบกลุ่มสินค้า (ลบแบบซอฟต์)
   * @param payload - Microservice payload containing product item group ID / ข้อมูล payload ที่มี ID ของกลุ่มสินค้า
   * @returns Deleted product item group ID / ID ของกลุ่มสินค้าที่ลบ
   */
  @MessagePattern({
    cmd: 'product-item-group.delete',
    service: 'product-item-group',
  })
  async delete(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
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
