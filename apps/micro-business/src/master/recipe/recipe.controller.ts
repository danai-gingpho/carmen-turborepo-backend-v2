import { Controller, HttpStatus } from '@nestjs/common';
import { RecipeService } from './recipe.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController, MicroservicePayload, MicroserviceResponse } from '@/common';

@Controller()
export class RecipeController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    RecipeController.name,
  );

  constructor(private readonly recipeService: RecipeService) {
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
   * Find a single recipe by ID
   * ค้นหารายการสูตรอาหารเดียวตาม ID
   * @param payload - Microservice payload containing recipe ID / ข้อมูล payload ที่มี ID ของสูตรอาหาร
   * @returns Recipe detail / รายละเอียดสูตรอาหาร
   */
  @MessagePattern({ cmd: 'recipe.findOne', service: 'recipe' })
  async findOne(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findOne', payload }, RecipeController.name);
    const id = payload.id;
    this.recipeService.userId = payload.user_id;
    this.recipeService.bu_code = payload.bu_code;
    await this.recipeService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.recipeService.findOne(id));
    return this.handleResult(result);
  }

  /**
   * Find all recipes with pagination
   * ค้นหารายการสูตรอาหารทั้งหมดพร้อมการแบ่งหน้า
   * @param payload - Microservice payload containing pagination parameters / ข้อมูล payload ที่มีพารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of recipes / รายการสูตรอาหารพร้อมการแบ่งหน้า
   */
  @MessagePattern({ cmd: 'recipe.findAll', service: 'recipe' })
  async findAll(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findAll', payload }, RecipeController.name);
    this.recipeService.userId = payload.user_id;
    this.recipeService.bu_code = payload.bu_code;
    const paginate = payload.paginate;
    await this.recipeService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.recipeService.findAll(paginate));
    return this.handlePaginatedResult(result);
  }

  /**
   * Create a new recipe
   * สร้างสูตรอาหารใหม่
   * @param payload - Microservice payload containing recipe data / ข้อมูล payload ที่มีข้อมูลสูตรอาหาร
   * @returns Created recipe ID / ID ของสูตรอาหารที่สร้างขึ้น
   */
  @MessagePattern({ cmd: 'recipe.create', service: 'recipe' })
  async create(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'create', payload }, RecipeController.name);
    const data = payload.data;
    this.recipeService.userId = payload.user_id;
    this.recipeService.bu_code = payload.bu_code;
    await this.recipeService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.recipeService.create(data));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  /**
   * Update an existing recipe
   * อัปเดตสูตรอาหารที่มีอยู่
   * @param payload - Microservice payload containing updated recipe data / ข้อมูล payload ที่มีข้อมูลสูตรอาหารที่อัปเดต
   * @returns Updated recipe ID / ID ของสูตรอาหารที่อัปเดต
   */
  @MessagePattern({ cmd: 'recipe.update', service: 'recipe' })
  async update(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'update', payload }, RecipeController.name);
    const data = payload.data;
    this.recipeService.userId = payload.user_id;
    this.recipeService.bu_code = payload.bu_code;
    await this.recipeService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.recipeService.update(data));
    return this.handleResult(result);
  }

  /**
   * Partially update a recipe
   * อัปเดตบางส่วนของสูตรอาหาร
   * @param payload - Microservice payload containing partial recipe data / ข้อมูล payload ที่มีข้อมูลสูตรอาหารบางส่วน
   * @returns Updated recipe / สูตรอาหารที่อัปเดต
   */
  @MessagePattern({ cmd: 'recipe.patch', service: 'recipe' })
  async patch(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'patch', payload }, RecipeController.name);
    const data = payload.data;
    this.recipeService.userId = payload.user_id;
    this.recipeService.bu_code = payload.bu_code;
    await this.recipeService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.recipeService.patch(data));
    return this.handleResult(result);
  }

  /**
   * Delete a recipe (soft delete)
   * ลบสูตรอาหาร (ลบแบบซอฟต์)
   * @param payload - Microservice payload containing recipe ID / ข้อมูล payload ที่มี ID ของสูตรอาหาร
   * @returns Deleted recipe ID / ID ของสูตรอาหารที่ลบ
   */
  @MessagePattern({ cmd: 'recipe.delete', service: 'recipe' })
  async delete(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'delete', payload }, RecipeController.name);
    const id = payload.id;
    this.recipeService.userId = payload.user_id;
    this.recipeService.bu_code = payload.bu_code;
    await this.recipeService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.recipeService.delete(id));
    return this.handleResult(result);
  }
}
