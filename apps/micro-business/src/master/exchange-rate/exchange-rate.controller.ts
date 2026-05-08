import { Controller, HttpStatus } from '@nestjs/common';
import { ExchangeRateService } from './exchange-rate.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { ICreateExchangeRate } from './interface/exchange-rate.interface';
import { BaseMicroserviceController, MicroservicePayload, MicroserviceResponse } from '@/common';

@Controller()
export class ExchangeRateController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    ExchangeRateController.name,
  );
  constructor(private readonly exchangeRateService: ExchangeRateService) {
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
   * Find a single exchange rate by ID
   * ค้นหารายการอัตราแลกเปลี่ยนเดียวตาม ID
   * @param payload - Microservice payload containing exchange rate ID / ข้อมูล payload ที่มี ID ของอัตราแลกเปลี่ยน
   * @returns Exchange rate detail / รายละเอียดอัตราแลกเปลี่ยน
   */
  @MessagePattern({ cmd: 'exchange-rate.findOne', service: 'exchange-rate' })
  async findOne(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findOne', payload }, ExchangeRateController.name);
    const id = payload.id;
    this.exchangeRateService.userId = payload.user_id;
    this.exchangeRateService.bu_code = payload.bu_code;
    await this.exchangeRateService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.exchangeRateService.findOne(id));
    return this.handleResult(result);
  }

  /**
   * Find all exchange rates with pagination
   * ค้นหารายการอัตราแลกเปลี่ยนทั้งหมดพร้อมการแบ่งหน้า
   * @param payload - Microservice payload containing pagination parameters / ข้อมูล payload ที่มีพารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of exchange rates / รายการอัตราแลกเปลี่ยนพร้อมการแบ่งหน้า
   */
  @MessagePattern({ cmd: 'exchange-rate.findAll', service: 'exchange-rate' })
  async findAll(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findAll', payload }, ExchangeRateController.name);
    this.exchangeRateService.userId = payload.user_id;
    this.exchangeRateService.bu_code = payload.bu_code;
    const paginate = payload.paginate;
    await this.exchangeRateService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.exchangeRateService.findAll(paginate));
    return this.handlePaginatedResult(result);
  }

  /**
   * Find exchange rate by date and currency code
   * ค้นหาอัตราแลกเปลี่ยนตามวันที่และรหัสสกุลเงิน
   * @param payload - Microservice payload containing date and currency_code / ข้อมูล payload ที่มีวันที่และรหัสสกุลเงิน
   * @returns Exchange rate detail / รายละเอียดอัตราแลกเปลี่ยน
   */
  @MessagePattern({ cmd: 'exchange-rate.findByDateAndCurrency', service: 'exchange-rate' })
  async findByDateAndCurrency(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findByDateAndCurrency', payload }, ExchangeRateController.name);
    const { date, currency_code } = payload;
    this.exchangeRateService.userId = payload.user_id;
    this.exchangeRateService.bu_code = payload.bu_code;
    await this.exchangeRateService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.exchangeRateService.findByDateAndCurrency(date, currency_code));
    return this.handleResult(result);
  }

  /**
   * Create a new exchange rate
   * สร้างอัตราแลกเปลี่ยนใหม่
   * @param payload - Microservice payload containing exchange rate data / ข้อมูล payload ที่มีข้อมูลอัตราแลกเปลี่ยน
   * @returns Created exchange rate ID / ID ของอัตราแลกเปลี่ยนที่สร้างขึ้น
   */
  @MessagePattern({ cmd: 'exchange-rate.create', service: 'exchange-rate' })
  async create(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'create', payload }, ExchangeRateController.name);
    const data = payload.data;
    this.exchangeRateService.userId = payload.user_id;
    this.exchangeRateService.bu_code = payload.bu_code;
    await this.exchangeRateService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);

    if (Array.isArray(data)) {
      const result = await runWithAuditContext(auditContext, () => this.exchangeRateService.createBulk(data));
      return this.handleResult(result, HttpStatus.CREATED);
    }

    const result = await runWithAuditContext(auditContext, () => this.exchangeRateService.create(data as ICreateExchangeRate));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  /**
   * Update an existing exchange rate
   * อัปเดตอัตราแลกเปลี่ยนที่มีอยู่
   * @param payload - Microservice payload containing updated exchange rate data / ข้อมูล payload ที่มีข้อมูลอัตราแลกเปลี่ยนที่อัปเดต
   * @returns Updated exchange rate ID / ID ของอัตราแลกเปลี่ยนที่อัปเดต
   */
  @MessagePattern({ cmd: 'exchange-rate.update', service: 'exchange-rate' })
  async update(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'update', payload }, ExchangeRateController.name);
    const data = payload.data;
    this.exchangeRateService.userId = payload.user_id;
    this.exchangeRateService.bu_code = payload.bu_code;
    await this.exchangeRateService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.exchangeRateService.update(data));
    return this.handleResult(result);
  }

  /**
   * Delete an exchange rate (soft delete)
   * ลบอัตราแลกเปลี่ยน (ลบแบบซอฟต์)
   * @param payload - Microservice payload containing exchange rate ID / ข้อมูล payload ที่มี ID ของอัตราแลกเปลี่ยน
   * @returns Deleted exchange rate ID / ID ของอัตราแลกเปลี่ยนที่ลบ
   */
  @MessagePattern({ cmd: 'exchange-rate.delete', service: 'exchange-rate' })
  async delete(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'delete', payload }, ExchangeRateController.name);
    const id = payload.id;
    this.exchangeRateService.userId = payload.user_id;
    this.exchangeRateService.bu_code = payload.bu_code;
    await this.exchangeRateService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.exchangeRateService.delete(id));
    return this.handleResult(result);
  }
}
