import { Controller, HttpStatus } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController, MicroservicePayload, MicroserviceResponse } from '@/common';

@Controller()
export class VendorsController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    VendorsController.name,
  );
  constructor(private readonly vendorsService: VendorsService) {
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
   * Find a single vendor by ID
   * ค้นหารายการผู้ขายเดียวตาม ID
   * @param payload - Microservice payload containing vendor ID / ข้อมูล payload ที่มี ID ของผู้ขาย
   * @returns Vendor detail / รายละเอียดผู้ขาย
   */
  @MessagePattern({ cmd: 'vendors.findOne', service: 'vendors' })
  async findOne(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findOne', payload }, VendorsController.name);
    const id = payload.id;
    this.vendorsService.userId = payload.user_id;
    this.vendorsService.bu_code = payload.bu_code;
    await this.vendorsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.vendorsService.findOne(id));
    return this.handleResult(result);
  }

  /**
   * Find all vendors with pagination
   * ค้นหารายการผู้ขายทั้งหมดพร้อมการแบ่งหน้า
   * @param payload - Microservice payload containing pagination parameters / ข้อมูล payload ที่มีพารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of vendors / รายการผู้ขายพร้อมการแบ่งหน้า
   */
  @MessagePattern({ cmd: 'vendors.findAll', service: 'vendors' })
  async findAll(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findAll', payload }, VendorsController.name);
    this.vendorsService.userId = payload.user_id;
    this.vendorsService.bu_code = payload.bu_code;
    await this.vendorsService.initializePrismaService(payload.bu_code, payload.user_id);
    const paginate = payload.paginate;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.vendorsService.findAll(paginate));
    return this.handlePaginatedResult(result);
  }

  /**
   * Find multiple vendors by their IDs
   * ค้นหารายการผู้ขายหลายรายการตาม ID
   * @param payload - Microservice payload containing array of vendor IDs / ข้อมูล payload ที่มีอาร์เรย์ของ ID ผู้ขาย
   * @returns List of vendors matching the IDs / รายการผู้ขายที่ตรงกับ ID
   */
  @MessagePattern({ cmd: 'vendors.find-all-by-id', service: 'vendors' })
  async findAllById(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findAllById', payload }, VendorsController.name);
    const ids = payload.ids;
    this.vendorsService.userId = payload.user_id;
    this.vendorsService.bu_code = payload.bu_code;
    await this.vendorsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.vendorsService.findAllById(ids));
    return this.handleResult(result);
  }

  /**
   * Create a new vendor
   * สร้างผู้ขายใหม่
   * @param payload - Microservice payload containing vendor data / ข้อมูล payload ที่มีข้อมูลผู้ขาย
   * @returns Created vendor ID / ID ของผู้ขายที่สร้างขึ้น
   */
  @MessagePattern({ cmd: 'vendors.create', service: 'vendors' })
  async create(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'create', payload }, VendorsController.name);
    const data = payload.data;
    this.vendorsService.userId = payload.user_id;
    this.vendorsService.bu_code = payload.bu_code;
    await this.vendorsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.vendorsService.create(data));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  /**
   * Update an existing vendor
   * อัปเดตผู้ขายที่มีอยู่
   * @param payload - Microservice payload containing updated vendor data / ข้อมูล payload ที่มีข้อมูลผู้ขายที่อัปเดต
   * @returns Updated vendor ID / ID ของผู้ขายที่อัปเดต
   */
  @MessagePattern({ cmd: 'vendors.update', service: 'vendors' })
  async update(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'update', payload }, VendorsController.name);
    const data = payload.data;
    this.vendorsService.userId = payload.user_id;
    this.vendorsService.bu_code = payload.bu_code;
    await this.vendorsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.vendorsService.update(data));
    return this.handleResult(result);
  }

  /**
   * Delete a vendor (soft delete)
   * ลบผู้ขาย (ลบแบบซอฟต์)
   * @param payload - Microservice payload containing vendor ID / ข้อมูล payload ที่มี ID ของผู้ขาย
   * @returns Deleted vendor ID / ID ของผู้ขายที่ลบ
   */
  @MessagePattern({ cmd: 'vendors.delete', service: 'vendors' })
  async delete(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'delete', payload }, VendorsController.name);
    const id = payload.id;
    this.vendorsService.userId = payload.user_id;
    this.vendorsService.bu_code = payload.bu_code;
    await this.vendorsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.vendorsService.delete(id));
    return this.handleResult(result);
  }
}
