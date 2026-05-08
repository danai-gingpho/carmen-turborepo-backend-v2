import { Controller, HttpStatus } from '@nestjs/common';
import { TaxProfileService } from './tax_profile.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController, MicroservicePayload, MicroserviceResponse } from '@/common';

@Controller()
export class TaxProfileController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    TaxProfileController.name,
  );
  constructor(
    private readonly taxProfileService: TaxProfileService,
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
   * Find a single tax profile by ID
   * ค้นหารายการโปรไฟล์ภาษีเดียวตาม ID
   * @param payload - Microservice payload containing tax profile ID / ข้อมูล payload ที่มี ID ของโปรไฟล์ภาษี
   * @returns Tax profile detail / รายละเอียดโปรไฟล์ภาษี
   */
  @MessagePattern({
    cmd: 'tax-profile.findOne',
    service: 'tax-profile',
  })
  async findOne(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findOne', payload }, TaxProfileController.name);
    const id = payload.id;
    this.taxProfileService.userId = payload.user_id;
    this.taxProfileService.bu_code = payload.bu_code;
    await this.taxProfileService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.taxProfileService.findOne(id));
    return this.handleResult(result);
  }

  /**
   * Find all tax profiles with pagination
   * ค้นหารายการโปรไฟล์ภาษีทั้งหมดพร้อมการแบ่งหน้า
   * @param payload - Microservice payload containing pagination parameters / ข้อมูล payload ที่มีพารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of tax profiles / รายการโปรไฟล์ภาษีพร้อมการแบ่งหน้า
   */
  @MessagePattern({
    cmd: 'tax-profile.findAll',
    service: 'tax-profile',
  })
  async findAll(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findAll', payload }, TaxProfileController.name);
    this.taxProfileService.userId = payload.user_id;
    this.taxProfileService.bu_code = payload.bu_code;
    await this.taxProfileService.initializePrismaService(payload.bu_code, payload.user_id);
    const paginate = payload.paginate;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.taxProfileService.findAll(paginate));
    return this.handlePaginatedResult(result);
  }

  /**
   * Find multiple tax profiles by their IDs
   * ค้นหารายการโปรไฟล์ภาษีหลายรายการตาม ID
   * @param payload - Microservice payload containing array of tax profile IDs / ข้อมูล payload ที่มีอาร์เรย์ของ ID โปรไฟล์ภาษี
   * @returns List of tax profiles matching the IDs / รายการโปรไฟล์ภาษีที่ตรงกับ ID
   */
  @MessagePattern({
    cmd: 'tax-profile.find-all-by-id',
    service: 'tax-profile',
  })
  async findAllById(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findAllById', payload }, TaxProfileController.name);
    const ids = payload.ids;
    this.taxProfileService.userId = payload.user_id;
    this.taxProfileService.bu_code = payload.bu_code;
    await this.taxProfileService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.taxProfileService.findAllById(ids));
    return this.handleResult(result);
  }

  /**
   * Create a new tax profile
   * สร้างโปรไฟล์ภาษีใหม่
   * @param payload - Microservice payload containing tax profile data / ข้อมูล payload ที่มีข้อมูลโปรไฟล์ภาษี
   * @returns Created tax profile ID / ID ของโปรไฟล์ภาษีที่สร้างขึ้น
   */
  @MessagePattern({
    cmd: 'tax-profile.create',
    service: 'tax-profile',
  })
  async create(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'create', payload }, TaxProfileController.name);
    const data = payload.data;
    this.taxProfileService.userId = payload.user_id;
    this.taxProfileService.bu_code = payload.bu_code;
    await this.taxProfileService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.taxProfileService.create(data));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  /**
   * Update an existing tax profile
   * อัปเดตโปรไฟล์ภาษีที่มีอยู่
   * @param payload - Microservice payload containing updated tax profile data / ข้อมูล payload ที่มีข้อมูลโปรไฟล์ภาษีที่อัปเดต
   * @returns Updated tax profile ID / ID ของโปรไฟล์ภาษีที่อัปเดต
   */
  @MessagePattern({
    cmd: 'tax-profile.update',
    service: 'tax-profile',
  })
  async update(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'update', payload }, TaxProfileController.name);
    const id = payload.id;
    const data = payload.data;
    this.taxProfileService.userId = payload.user_id;
    this.taxProfileService.bu_code = payload.bu_code;
    await this.taxProfileService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.taxProfileService.update(id, data));
    return this.handleResult(result);
  }

  /**
   * Delete a tax profile (soft delete)
   * ลบโปรไฟล์ภาษี (ลบแบบซอฟต์)
   * @param payload - Microservice payload containing tax profile ID / ข้อมูล payload ที่มี ID ของโปรไฟล์ภาษี
   * @returns Deleted tax profile ID / ID ของโปรไฟล์ภาษีที่ลบ
   */
  @MessagePattern({
    cmd: 'tax-profile.delete',
    service: 'tax-profile',
  })
  async delete(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'delete', payload }, TaxProfileController.name);
    const id = payload.id;
    this.taxProfileService.userId = payload.user_id;
    this.taxProfileService.bu_code = payload.bu_code;
    await this.taxProfileService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.taxProfileService.delete(id));
    return this.handleResult(result);
  }
}
