import { Controller, HttpStatus } from '@nestjs/common';
import { RecipeCuisineService } from './recipe-cuisine.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController, MicroservicePayload, MicroserviceResponse } from '@/common';

@Controller()
export class RecipeCuisineController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    RecipeCuisineController.name,
  );

  constructor(private readonly recipeCuisineService: RecipeCuisineService) {
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
   * Find a single recipe cuisine by ID
   * ค้นหารายการประเภทอาหารตามสูตรเดียวตาม ID
   * @param payload - Microservice payload containing recipe cuisine ID / ข้อมูล payload ที่มี ID ของประเภทอาหารตามสูตร
   * @returns Recipe cuisine detail / รายละเอียดประเภทอาหารตามสูตร
   */
  @MessagePattern({ cmd: 'recipe-cuisine.findOne', service: 'recipe-cuisine' })
  async findOne(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findOne', payload }, RecipeCuisineController.name);
    const id = payload.id;
    this.recipeCuisineService.userId = payload.user_id;
    this.recipeCuisineService.bu_code = payload.bu_code;
    await this.recipeCuisineService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.recipeCuisineService.findOne(id));
    return this.handleResult(result);
  }

  /**
   * Find all recipe cuisines with pagination
   * ค้นหารายการประเภทอาหารตามสูตรทั้งหมดพร้อมการแบ่งหน้า
   * @param payload - Microservice payload containing pagination parameters / ข้อมูล payload ที่มีพารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of recipe cuisines / รายการประเภทอาหารตามสูตรพร้อมการแบ่งหน้า
   */
  @MessagePattern({ cmd: 'recipe-cuisine.findAll', service: 'recipe-cuisine' })
  async findAll(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findAll', payload }, RecipeCuisineController.name);
    this.recipeCuisineService.userId = payload.user_id;
    this.recipeCuisineService.bu_code = payload.bu_code;
    const paginate = payload.paginate;
    await this.recipeCuisineService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.recipeCuisineService.findAll(paginate));
    return this.handlePaginatedResult(result);
  }

  /**
   * Create a new recipe cuisine
   * สร้างประเภทอาหารตามสูตรใหม่
   * @param payload - Microservice payload containing recipe cuisine data / ข้อมูล payload ที่มีข้อมูลประเภทอาหารตามสูตร
   * @returns Created recipe cuisine ID / ID ของประเภทอาหารตามสูตรที่สร้างขึ้น
   */
  @MessagePattern({ cmd: 'recipe-cuisine.create', service: 'recipe-cuisine' })
  async create(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'create', payload }, RecipeCuisineController.name);
    const data = payload.data;
    this.recipeCuisineService.userId = payload.user_id;
    this.recipeCuisineService.bu_code = payload.bu_code;
    await this.recipeCuisineService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.recipeCuisineService.create(data));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  /**
   * Update an existing recipe cuisine
   * อัปเดตประเภทอาหารตามสูตรที่มีอยู่
   * @param payload - Microservice payload containing updated recipe cuisine data / ข้อมูล payload ที่มีข้อมูลประเภทอาหารตามสูตรที่อัปเดต
   * @returns Updated recipe cuisine ID / ID ของประเภทอาหารตามสูตรที่อัปเดต
   */
  @MessagePattern({ cmd: 'recipe-cuisine.update', service: 'recipe-cuisine' })
  async update(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'update', payload }, RecipeCuisineController.name);
    const data = payload.data;
    this.recipeCuisineService.userId = payload.user_id;
    this.recipeCuisineService.bu_code = payload.bu_code;
    await this.recipeCuisineService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.recipeCuisineService.update(data));
    return this.handleResult(result);
  }

  /**
   * Partially update a recipe cuisine
   * อัปเดตประเภทอาหารตามสูตรบางส่วน
   * @param payload - Microservice payload containing partial recipe cuisine data / ข้อมูล payload ที่มีข้อมูลประเภทอาหารตามสูตรบางส่วน
   * @returns Updated recipe cuisine ID / ID ของประเภทอาหารตามสูตรที่อัปเดต
   */
  @MessagePattern({ cmd: 'recipe-cuisine.patch', service: 'recipe-cuisine' })
  async patch(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'patch', payload }, RecipeCuisineController.name);
    const data = payload.data;
    this.recipeCuisineService.userId = payload.user_id;
    this.recipeCuisineService.bu_code = payload.bu_code;
    await this.recipeCuisineService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.recipeCuisineService.patch(data));
    return this.handleResult(result);
  }

  /**
   * Delete a recipe cuisine (soft delete)
   * ลบประเภทอาหารตามสูตร (ลบแบบซอฟต์)
   * @param payload - Microservice payload containing recipe cuisine ID / ข้อมูล payload ที่มี ID ของประเภทอาหารตามสูตร
   * @returns Deleted recipe cuisine ID / ID ของประเภทอาหารตามสูตรที่ลบ
   */
  @MessagePattern({ cmd: 'recipe-cuisine.delete', service: 'recipe-cuisine' })
  async delete(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'delete', payload }, RecipeCuisineController.name);
    const id = payload.id;
    this.recipeCuisineService.userId = payload.user_id;
    this.recipeCuisineService.bu_code = payload.bu_code;
    await this.recipeCuisineService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.recipeCuisineService.delete(id));
    return this.handleResult(result);
  }
}
