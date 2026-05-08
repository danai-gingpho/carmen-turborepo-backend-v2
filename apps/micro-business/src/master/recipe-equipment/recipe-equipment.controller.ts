import { Controller, HttpStatus } from '@nestjs/common';
import { RecipeEquipmentService } from './recipe-equipment.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController, MicroservicePayload, MicroserviceResponse } from '@/common';

@Controller()
export class RecipeEquipmentController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    RecipeEquipmentController.name,
  );

  constructor(private readonly recipeEquipmentService: RecipeEquipmentService) {
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
   * Find a single recipe equipment by ID
   * ค้นหารายการอุปกรณ์สูตรอาหารเดียวตาม ID
   * @param payload - Microservice payload containing recipe equipment ID / ข้อมูล payload ที่มี ID ของอุปกรณ์สูตรอาหาร
   * @returns Recipe equipment detail / รายละเอียดอุปกรณ์สูตรอาหาร
   */
  @MessagePattern({ cmd: 'recipe-equipment.findOne', service: 'recipe-equipment' })
  async findOne(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findOne', payload }, RecipeEquipmentController.name);
    const id = payload.id;
    this.recipeEquipmentService.userId = payload.user_id;
    this.recipeEquipmentService.bu_code = payload.bu_code;
    await this.recipeEquipmentService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.recipeEquipmentService.findOne(id));
    return this.handleResult(result);
  }

  /**
   * Find all recipe equipment with pagination
   * ค้นหารายการอุปกรณ์สูตรอาหารทั้งหมดพร้อมการแบ่งหน้า
   * @param payload - Microservice payload containing pagination parameters / ข้อมูล payload ที่มีพารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of recipe equipment / รายการอุปกรณ์สูตรอาหารพร้อมการแบ่งหน้า
   */
  @MessagePattern({ cmd: 'recipe-equipment.findAll', service: 'recipe-equipment' })
  async findAll(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findAll', payload }, RecipeEquipmentController.name);
    this.recipeEquipmentService.userId = payload.user_id;
    this.recipeEquipmentService.bu_code = payload.bu_code;
    const paginate = payload.paginate;
    await this.recipeEquipmentService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.recipeEquipmentService.findAll(paginate));
    return this.handlePaginatedResult(result);
  }

  /**
   * Create a new recipe equipment
   * สร้างอุปกรณ์สูตรอาหารใหม่
   * @param payload - Microservice payload containing recipe equipment data / ข้อมูล payload ที่มีข้อมูลอุปกรณ์สูตรอาหาร
   * @returns Created recipe equipment ID / ID ของอุปกรณ์สูตรอาหารที่สร้างขึ้น
   */
  @MessagePattern({ cmd: 'recipe-equipment.create', service: 'recipe-equipment' })
  async create(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'create', payload }, RecipeEquipmentController.name);
    const data = payload.data;
    this.recipeEquipmentService.userId = payload.user_id;
    this.recipeEquipmentService.bu_code = payload.bu_code;
    await this.recipeEquipmentService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.recipeEquipmentService.create(data));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  /**
   * Update an existing recipe equipment
   * อัปเดตอุปกรณ์สูตรอาหารที่มีอยู่
   * @param payload - Microservice payload containing updated recipe equipment data / ข้อมูล payload ที่มีข้อมูลอุปกรณ์สูตรอาหารที่อัปเดต
   * @returns Updated recipe equipment ID / ID ของอุปกรณ์สูตรอาหารที่อัปเดต
   */
  @MessagePattern({ cmd: 'recipe-equipment.update', service: 'recipe-equipment' })
  async update(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'update', payload }, RecipeEquipmentController.name);
    const data = payload.data;
    this.recipeEquipmentService.userId = payload.user_id;
    this.recipeEquipmentService.bu_code = payload.bu_code;
    await this.recipeEquipmentService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.recipeEquipmentService.update(data));
    return this.handleResult(result);
  }

  /**
   * Partially update a recipe equipment
   * อัปเดตบางส่วนของอุปกรณ์สูตรอาหาร
   * @param payload - Microservice payload containing partial recipe equipment data / ข้อมูล payload ที่มีข้อมูลอุปกรณ์สูตรอาหารบางส่วน
   * @returns Updated recipe equipment / อุปกรณ์สูตรอาหารที่อัปเดต
   */
  @MessagePattern({ cmd: 'recipe-equipment.patch', service: 'recipe-equipment' })
  async patch(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'patch', payload }, RecipeEquipmentController.name);
    const data = payload.data;
    this.recipeEquipmentService.userId = payload.user_id;
    this.recipeEquipmentService.bu_code = payload.bu_code;
    await this.recipeEquipmentService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.recipeEquipmentService.patch(data));
    return this.handleResult(result);
  }

  /**
   * Delete a recipe equipment (soft delete)
   * ลบอุปกรณ์สูตรอาหาร (ลบแบบซอฟต์)
   * @param payload - Microservice payload containing recipe equipment ID / ข้อมูล payload ที่มี ID ของอุปกรณ์สูตรอาหาร
   * @returns Deleted recipe equipment ID / ID ของอุปกรณ์สูตรอาหารที่ลบ
   */
  @MessagePattern({ cmd: 'recipe-equipment.delete', service: 'recipe-equipment' })
  async delete(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'delete', payload }, RecipeEquipmentController.name);
    const id = payload.id;
    this.recipeEquipmentService.userId = payload.user_id;
    this.recipeEquipmentService.bu_code = payload.bu_code;
    await this.recipeEquipmentService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.recipeEquipmentService.delete(id));
    return this.handleResult(result);
  }
}
