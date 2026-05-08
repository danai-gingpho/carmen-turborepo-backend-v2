import { Controller, HttpStatus } from '@nestjs/common';
import { VendorBusinessTypeService } from './vendor_business_type.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController, MicroservicePayload, MicroserviceResponse } from '@/common';

@Controller()
export class VendorBusinessTypeController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    VendorBusinessTypeController.name,
  );
  constructor(
    private readonly vendorBusinessTypeService: VendorBusinessTypeService,
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
   * Find a single vendor business type by ID
   * ค้นหารายการประเภทธุรกิจผู้ขายเดียวตาม ID
   * @param payload - Microservice payload containing vendor business type ID / ข้อมูล payload ที่มี ID ของประเภทธุรกิจผู้ขาย
   * @returns Vendor business type detail / รายละเอียดประเภทธุรกิจผู้ขาย
   */
  @MessagePattern({
    cmd: 'vendor-business-type.findOne',
    service: 'vendor-business-type',
  })
  async findOne(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'findOne', payload },
      VendorBusinessTypeController.name,
    );
    const id = payload.id;
    this.vendorBusinessTypeService.userId = payload.user_id;
    this.vendorBusinessTypeService.bu_code = payload.bu_code;
    await this.vendorBusinessTypeService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.vendorBusinessTypeService.findOne(id));
    return this.handleResult(result);
  }

  /**
   * Find all vendor business types with pagination
   * ค้นหารายการประเภทธุรกิจผู้ขายทั้งหมดพร้อมการแบ่งหน้า
   * @param payload - Microservice payload containing pagination parameters / ข้อมูล payload ที่มีพารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of vendor business types / รายการประเภทธุรกิจผู้ขายพร้อมการแบ่งหน้า
   */
  @MessagePattern({
    cmd: 'vendor-business-type.findAll',
    service: 'vendor-business-type',
  })
  async findAll(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'findAll', payload },
      VendorBusinessTypeController.name,
    );
    this.vendorBusinessTypeService.userId = payload.user_id;
    this.vendorBusinessTypeService.bu_code = payload.bu_code;
    await this.vendorBusinessTypeService.initializePrismaService(payload.bu_code, payload.user_id);
    const paginate = payload.paginate;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.vendorBusinessTypeService.findAll(paginate));
    return this.handlePaginatedResult(result);
  }

  /**
   * Create a new vendor business type
   * สร้างประเภทธุรกิจผู้ขายใหม่
   * @param payload - Microservice payload containing vendor business type data / ข้อมูล payload ที่มีข้อมูลประเภทธุรกิจผู้ขาย
   * @returns Created vendor business type ID / ID ของประเภทธุรกิจผู้ขายที่สร้างขึ้น
   */
  @MessagePattern({
    cmd: 'vendor-business-type.create',
    service: 'vendor-business-type',
  })
  async create(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'create', payload },
      VendorBusinessTypeController.name,
    );
    const data = payload.data;
    this.vendorBusinessTypeService.userId = payload.user_id;
    this.vendorBusinessTypeService.bu_code = payload.bu_code;
    await this.vendorBusinessTypeService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.vendorBusinessTypeService.create(data));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  /**
   * Update an existing vendor business type
   * อัปเดตประเภทธุรกิจผู้ขายที่มีอยู่
   * @param payload - Microservice payload containing updated vendor business type data / ข้อมูล payload ที่มีข้อมูลประเภทธุรกิจผู้ขายที่อัปเดต
   * @returns Updated vendor business type ID / ID ของประเภทธุรกิจผู้ขายที่อัปเดต
   */
  @MessagePattern({
    cmd: 'vendor-business-type.update',
    service: 'vendor-business-type',
  })
  async update(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'update', payload },
      VendorBusinessTypeController.name,
    );
    const data = payload.data;
    this.vendorBusinessTypeService.userId = payload.user_id;
    this.vendorBusinessTypeService.bu_code = payload.bu_code;
    await this.vendorBusinessTypeService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.vendorBusinessTypeService.update(data));
    return this.handleResult(result);
  }

  /**
   * Delete a vendor business type (soft delete)
   * ลบประเภทธุรกิจผู้ขาย (ลบแบบซอฟต์)
   * @param payload - Microservice payload containing vendor business type ID / ข้อมูล payload ที่มี ID ของประเภทธุรกิจผู้ขาย
   * @returns Deleted vendor business type ID / ID ของประเภทธุรกิจผู้ขายที่ลบ
   */
  @MessagePattern({
    cmd: 'vendor-business-type.delete',
    service: 'vendor-business-type',
  })
  async delete(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'delete', payload },
      VendorBusinessTypeController.name,
    );
    const id = payload.id;
    this.vendorBusinessTypeService.userId = payload.user_id;
    this.vendorBusinessTypeService.bu_code = payload.bu_code;
    await this.vendorBusinessTypeService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.vendorBusinessTypeService.delete(id));
    return this.handleResult(result);
  }
}
