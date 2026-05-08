import { Controller, HttpStatus } from '@nestjs/common';
import { CurrenciesService } from './currencies.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController, MicroservicePayload, MicroserviceResponse } from '@/common';

@Controller()
export class CurrenciesController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    CurrenciesController.name,
  );
  constructor(private readonly currenciesService: CurrenciesService) {
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
   * Find a single currency by ID
   * ค้นหารายการสกุลเงินเดียวตาม ID
   * @param payload - Microservice payload containing currency ID / ข้อมูล payload ที่มี ID ของสกุลเงิน
   * @returns Currency detail / รายละเอียดสกุลเงิน
   */
  @MessagePattern({ cmd: 'currencies.findOne', service: 'currencies' })
  async findOne(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findOne', payload }, CurrenciesController.name);
    const id = payload.id;
    this.currenciesService.userId = payload.user_id;
    this.currenciesService.bu_code = payload.bu_code;
    await this.currenciesService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.currenciesService.findOne(id));
    return this.handleResult(result);
  }

  /**
   * Find all currencies with pagination
   * ค้นหารายการสกุลเงินทั้งหมดพร้อมการแบ่งหน้า
   * @param payload - Microservice payload containing pagination parameters / ข้อมูล payload ที่มีพารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of currencies / รายการสกุลเงินพร้อมการแบ่งหน้า
   */
  @MessagePattern({ cmd: 'currencies.findAll', service: 'currencies' })
  async findAll(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findAll', payload }, CurrenciesController.name);
    this.currenciesService.userId = payload.user_id;
    this.currenciesService.bu_code = payload.bu_code;
    const paginate = payload.paginate;
    await this.currenciesService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.currenciesService.findAll(paginate));
    return this.handlePaginatedResult(result);
  }

  /**
   * Find all active currencies with pagination
   * ค้นหารายการสกุลเงินที่ใช้งานอยู่ทั้งหมดพร้อมการแบ่งหน้า
   * @param payload - Microservice payload containing pagination parameters / ข้อมูล payload ที่มีพารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of active currencies / รายการสกุลเงินที่ใช้งานอยู่พร้อมการแบ่งหน้า
   */
  @MessagePattern({ cmd: 'currencies.findAllActive', service: 'currencies' })
  async findAllActive(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findAllActive', payload }, CurrenciesController.name);
    this.currenciesService.userId = payload.user_id;
    this.currenciesService.bu_code = payload.bu_code;
    const paginate = payload.paginate;
    await this.currenciesService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.currenciesService.findAllActive(paginate));
    return this.handlePaginatedResult(result);
  }

  /**
   * Find multiple currencies by their IDs
   * ค้นหารายการสกุลเงินหลายรายการตาม ID
   * @param payload - Microservice payload containing array of currency IDs / ข้อมูล payload ที่มีอาร์เรย์ของ ID สกุลเงิน
   * @returns List of currencies matching the IDs / รายการสกุลเงินที่ตรงกับ ID
   */
  @MessagePattern({ cmd: 'currencies.find-all-by-id', service: 'currencies' })
  async findAllById(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findAllById', payload }, CurrenciesController.name);
    const ids = payload.ids;
    this.currenciesService.userId = payload.user_id;
    this.currenciesService.bu_code = payload.bu_code;
    await this.currenciesService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.currenciesService.findAllById(ids));
    return this.handleResult(result);
  }

  /**
   * Create a new currency
   * สร้างสกุลเงินใหม่
   * @param payload - Microservice payload containing currency data / ข้อมูล payload ที่มีข้อมูลสกุลเงิน
   * @returns Created currency ID / ID ของสกุลเงินที่สร้างขึ้น
   */
  @MessagePattern({ cmd: 'currencies.create', service: 'currencies' })
  async create(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'create', payload }, CurrenciesController.name);
    const data = payload.data;
    this.currenciesService.userId = payload.user_id;
    this.currenciesService.bu_code = payload.bu_code;
    await this.currenciesService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.currenciesService.create(data));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  /**
   * Update an existing currency
   * อัปเดตสกุลเงินที่มีอยู่
   * @param payload - Microservice payload containing updated currency data / ข้อมูล payload ที่มีข้อมูลสกุลเงินที่อัปเดต
   * @returns Updated currency ID / ID ของสกุลเงินที่อัปเดต
   */
  @MessagePattern({ cmd: 'currencies.update', service: 'currencies' })
  async update(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'update', payload }, CurrenciesController.name);
    const data = payload.data;
    this.currenciesService.userId = payload.user_id;
    this.currenciesService.bu_code = payload.bu_code;
    await this.currenciesService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.currenciesService.update(data));
    return this.handleResult(result);
  }

  /**
   * Partially update a currency
   * อัปเดตสกุลเงินบางส่วน
   * @param payload - Microservice payload containing partial currency data / ข้อมูล payload ที่มีข้อมูลสกุลเงินบางส่วน
   * @returns Updated currency ID / ID ของสกุลเงินที่อัปเดต
   */
  @MessagePattern({ cmd: 'currencies.patch', service: 'currencies' })
  async patch(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'patch', payload }, CurrenciesController.name);
    const data = payload.data;
    this.currenciesService.userId = payload.user_id;
    this.currenciesService.bu_code = payload.bu_code;
    await this.currenciesService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.currenciesService.patch(data));
    return this.handleResult(result);
  }

  /**
   * Delete a currency (soft delete)
   * ลบสกุลเงิน (ลบแบบซอฟต์)
   * @param payload - Microservice payload containing currency ID / ข้อมูล payload ที่มี ID ของสกุลเงิน
   * @returns Deleted currency ID / ID ของสกุลเงินที่ลบ
   */
  @MessagePattern({ cmd: 'currencies.delete', service: 'currencies' })
  async delete(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'delete', payload }, CurrenciesController.name);
    const id = payload.id;
    this.currenciesService.userId = payload.user_id;
    this.currenciesService.bu_code = payload.bu_code;
    await this.currenciesService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.currenciesService.delete(id));
    return this.handleResult(result);
  }

  /**
   * Get the default currency for the business unit
   * ดึงสกุลเงินเริ่มต้นของหน่วยธุรกิจ
   * @param payload - Microservice payload containing business unit context / ข้อมูล payload ที่มีบริบทหน่วยธุรกิจ
   * @returns Default currency detail / รายละเอียดสกุลเงินเริ่มต้น
   */
  @MessagePattern({ cmd: 'currencies.getDefault', service: 'currencies' })
  async getDefault(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'getDefault', payload }, CurrenciesController.name);
    this.currenciesService.userId = payload.user_id;
    this.currenciesService.bu_code = payload.bu_code;
    await this.currenciesService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.currenciesService.getDefault());
    return this.handleResult(result);
  }
}
