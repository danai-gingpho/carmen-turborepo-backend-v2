import { Controller, HttpStatus } from '@nestjs/common';
import { RecipeCategoryService } from './recipe-category.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController, MicroservicePayload, MicroserviceResponse } from '@/common';

@Controller()
export class RecipeCategoryController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    RecipeCategoryController.name,
  );

  constructor(private readonly recipeCategoryService: RecipeCategoryService) {
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
   * Find a single recipe category by ID
   * ค้นหารายการหมวดหมู่สูตรอาหารเดียวตาม ID
   * @param payload - Microservice payload containing recipe category ID / ข้อมูล payload ที่มี ID ของหมวดหมู่สูตรอาหาร
   * @returns Recipe category detail / รายละเอียดหมวดหมู่สูตรอาหาร
   */
  @MessagePattern({ cmd: 'recipe-category.findOne', service: 'recipe-category' })
  async findOne(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findOne', payload }, RecipeCategoryController.name);
    const id = payload.id;
    this.recipeCategoryService.userId = payload.user_id;
    this.recipeCategoryService.bu_code = payload.bu_code;
    await this.recipeCategoryService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.recipeCategoryService.findOne(id));
    return this.handleResult(result);
  }

  /**
   * Find all recipe categories with pagination
   * ค้นหารายการหมวดหมู่สูตรอาหารทั้งหมดพร้อมการแบ่งหน้า
   * @param payload - Microservice payload containing pagination parameters / ข้อมูล payload ที่มีพารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of recipe categories / รายการหมวดหมู่สูตรอาหารพร้อมการแบ่งหน้า
   */
  @MessagePattern({ cmd: 'recipe-category.findAll', service: 'recipe-category' })
  async findAll(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findAll', payload }, RecipeCategoryController.name);
    this.recipeCategoryService.userId = payload.user_id;
    this.recipeCategoryService.bu_code = payload.bu_code;
    const paginate = payload.paginate;
    await this.recipeCategoryService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.recipeCategoryService.findAll(paginate));
    return this.handlePaginatedResult(result);
  }

  /**
   * Create a new recipe category
   * สร้างหมวดหมู่สูตรอาหารใหม่
   * @param payload - Microservice payload containing recipe category data / ข้อมูล payload ที่มีข้อมูลหมวดหมู่สูตรอาหาร
   * @returns Created recipe category ID / ID ของหมวดหมู่สูตรอาหารที่สร้างขึ้น
   */
  @MessagePattern({ cmd: 'recipe-category.create', service: 'recipe-category' })
  async create(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'create', payload }, RecipeCategoryController.name);
    const data = payload.data;
    this.recipeCategoryService.userId = payload.user_id;
    this.recipeCategoryService.bu_code = payload.bu_code;
    await this.recipeCategoryService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.recipeCategoryService.create(data));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  /**
   * Update an existing recipe category
   * อัปเดตหมวดหมู่สูตรอาหารที่มีอยู่
   * @param payload - Microservice payload containing updated recipe category data / ข้อมูล payload ที่มีข้อมูลหมวดหมู่สูตรอาหารที่อัปเดต
   * @returns Updated recipe category ID / ID ของหมวดหมู่สูตรอาหารที่อัปเดต
   */
  @MessagePattern({ cmd: 'recipe-category.update', service: 'recipe-category' })
  async update(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'update', payload }, RecipeCategoryController.name);
    const data = payload.data;
    this.recipeCategoryService.userId = payload.user_id;
    this.recipeCategoryService.bu_code = payload.bu_code;
    await this.recipeCategoryService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.recipeCategoryService.update(data));
    return this.handleResult(result);
  }

  /**
   * Partially update a recipe category
   * อัปเดตบางส่วนของหมวดหมู่สูตรอาหาร
   * @param payload - Microservice payload containing partial recipe category data / ข้อมูล payload ที่มีข้อมูลหมวดหมู่สูตรอาหารบางส่วน
   * @returns Updated recipe category / หมวดหมู่สูตรอาหารที่อัปเดต
   */
  @MessagePattern({ cmd: 'recipe-category.patch', service: 'recipe-category' })
  async patch(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'patch', payload }, RecipeCategoryController.name);
    const data = payload.data;
    this.recipeCategoryService.userId = payload.user_id;
    this.recipeCategoryService.bu_code = payload.bu_code;
    await this.recipeCategoryService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.recipeCategoryService.patch(data));
    return this.handleResult(result);
  }

  /**
   * Delete a recipe category (soft delete)
   * ลบหมวดหมู่สูตรอาหาร (ลบแบบซอฟต์)
   * @param payload - Microservice payload containing recipe category ID / ข้อมูล payload ที่มี ID ของหมวดหมู่สูตรอาหาร
   * @returns Deleted recipe category ID / ID ของหมวดหมู่สูตรอาหารที่ลบ
   */
  @MessagePattern({ cmd: 'recipe-category.delete', service: 'recipe-category' })
  async delete(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'delete', payload }, RecipeCategoryController.name);
    const id = payload.id;
    this.recipeCategoryService.userId = payload.user_id;
    this.recipeCategoryService.bu_code = payload.bu_code;
    await this.recipeCategoryService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.recipeCategoryService.delete(id));
    return this.handleResult(result);
  }
}
