import { Controller, HttpStatus } from '@nestjs/common';
import { RecipeEquipmentCategoryService } from './recipe-equipment-category.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController, MicroservicePayload, MicroserviceResponse } from '@/common';

@Controller()
export class RecipeEquipmentCategoryController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    RecipeEquipmentCategoryController.name,
  );

  constructor(private readonly recipeEquipmentCategoryService: RecipeEquipmentCategoryService) {
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

  @MessagePattern({ cmd: 'recipe-equipment-category.findOne', service: 'recipe-equipment-category' })
  async findOne(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findOne', payload }, RecipeEquipmentCategoryController.name);
    const id = payload.id;
    this.recipeEquipmentCategoryService.userId = payload.user_id;
    this.recipeEquipmentCategoryService.bu_code = payload.bu_code;
    await this.recipeEquipmentCategoryService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.recipeEquipmentCategoryService.findOne(id));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'recipe-equipment-category.findAll', service: 'recipe-equipment-category' })
  async findAll(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findAll', payload }, RecipeEquipmentCategoryController.name);
    this.recipeEquipmentCategoryService.userId = payload.user_id;
    this.recipeEquipmentCategoryService.bu_code = payload.bu_code;
    const paginate = payload.paginate;
    await this.recipeEquipmentCategoryService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.recipeEquipmentCategoryService.findAll(paginate));
    return this.handlePaginatedResult(result);
  }

  @MessagePattern({ cmd: 'recipe-equipment-category.create', service: 'recipe-equipment-category' })
  async create(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'create', payload }, RecipeEquipmentCategoryController.name);
    const data = payload.data;
    this.recipeEquipmentCategoryService.userId = payload.user_id;
    this.recipeEquipmentCategoryService.bu_code = payload.bu_code;
    await this.recipeEquipmentCategoryService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.recipeEquipmentCategoryService.create(data));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  @MessagePattern({ cmd: 'recipe-equipment-category.update', service: 'recipe-equipment-category' })
  async update(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'update', payload }, RecipeEquipmentCategoryController.name);
    const data = payload.data;
    this.recipeEquipmentCategoryService.userId = payload.user_id;
    this.recipeEquipmentCategoryService.bu_code = payload.bu_code;
    await this.recipeEquipmentCategoryService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.recipeEquipmentCategoryService.update(data));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'recipe-equipment-category.patch', service: 'recipe-equipment-category' })
  async patch(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'patch', payload }, RecipeEquipmentCategoryController.name);
    const data = payload.data;
    this.recipeEquipmentCategoryService.userId = payload.user_id;
    this.recipeEquipmentCategoryService.bu_code = payload.bu_code;
    await this.recipeEquipmentCategoryService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.recipeEquipmentCategoryService.patch(data));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'recipe-equipment-category.delete', service: 'recipe-equipment-category' })
  async delete(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'delete', payload }, RecipeEquipmentCategoryController.name);
    const id = payload.id;
    this.recipeEquipmentCategoryService.userId = payload.user_id;
    this.recipeEquipmentCategoryService.bu_code = payload.bu_code;
    await this.recipeEquipmentCategoryService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.recipeEquipmentCategoryService.delete(id));
    return this.handleResult(result);
  }
}
