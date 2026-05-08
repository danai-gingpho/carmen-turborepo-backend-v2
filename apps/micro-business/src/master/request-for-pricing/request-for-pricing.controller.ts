import { Controller, HttpStatus } from '@nestjs/common';
import { RequestForPricingService } from './request-for-pricing.service';
import { Payload } from '@nestjs/microservices';
import { MessagePattern } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController, MicroservicePayload, MicroserviceResponse } from '@/common';

@Controller()
export class RequestForPricingController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    RequestForPricingController.name,
  );
  constructor(
    private readonly requestForPricingService: RequestForPricingService,
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
   * Find a single request for pricing by ID
   * ค้นหารายการคำขอราคาเดียวตาม ID
   * @param payload - Microservice payload containing request for pricing ID / ข้อมูล payload ที่มี ID ของคำขอราคา
   * @returns Request for pricing detail / รายละเอียดคำขอราคา
   */
  @MessagePattern({
    cmd: 'request-for-pricing.findOne',
    service: 'request-for-pricing',
  })
  async findOne(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'findOne', payload },
      RequestForPricingController.name,
    );
    const id = payload.id;
    this.requestForPricingService.userId = payload.user_id;
    this.requestForPricingService.bu_code = payload.bu_code;
    await this.requestForPricingService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.requestForPricingService.findOne(id));
    return this.handleResult(result);
  }

  /**
   * Find all requests for pricing with pagination
   * ค้นหารายการคำขอราคาทั้งหมดพร้อมการแบ่งหน้า
   * @param payload - Microservice payload containing pagination parameters / ข้อมูล payload ที่มีพารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of requests for pricing / รายการคำขอราคาพร้อมการแบ่งหน้า
   */
  @MessagePattern({
    cmd: 'request-for-pricing.findAll',
    service: 'request-for-pricing',
  })
  async findAll(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'findAll', payload },
      RequestForPricingController.name,
    );
    this.requestForPricingService.userId = payload.user_id;
    this.requestForPricingService.bu_code = payload.bu_code;
    const paginate = payload.paginate;
    await this.requestForPricingService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.requestForPricingService.findAll(paginate));
    return this.handlePaginatedResult(result);
  }

  /**
   * Create a new request for pricing
   * สร้างคำขอราคาใหม่
   * @param payload - Microservice payload containing request for pricing data / ข้อมูล payload ที่มีข้อมูลคำขอราคา
   * @returns Created request for pricing ID / ID ของคำขอราคาที่สร้างขึ้น
   */
  @MessagePattern({
    cmd: 'request-for-pricing.create',
    service: 'request-for-pricing',
  })
  async create(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'create', payload },
      RequestForPricingController.name,
    );
    const data = payload.data;
    this.requestForPricingService.userId = payload.user_id;
    this.requestForPricingService.bu_code = payload.bu_code;
    await this.requestForPricingService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.requestForPricingService.create(data));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  /**
   * Update an existing request for pricing
   * อัปเดตคำขอราคาที่มีอยู่
   * @param payload - Microservice payload containing updated request for pricing data / ข้อมูล payload ที่มีข้อมูลคำขอราคาที่อัปเดต
   * @returns Updated request for pricing / คำขอราคาที่อัปเดต
   */
  @MessagePattern({
    cmd: 'request-for-pricing.update',
    service: 'request-for-pricing',
  })
  async update(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'update', payload },
      RequestForPricingController.name,
    );
    const data = payload.data;
    this.requestForPricingService.userId = payload.user_id;
    this.requestForPricingService.bu_code = payload.bu_code;
    await this.requestForPricingService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.requestForPricingService.update(data));
    return this.handleResult(result);
  }

  /**
   * Delete a request for pricing (soft delete)
   * ลบคำขอราคา (ลบแบบซอฟต์)
   * @param payload - Microservice payload containing request for pricing ID / ข้อมูล payload ที่มี ID ของคำขอราคา
   * @returns Deleted request for pricing ID / ID ของคำขอราคาที่ลบ
   */
  @MessagePattern({
    cmd: 'request-for-pricing.remove',
    service: 'request-for-pricing',
  })
  async remove(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'remove', payload },
      RequestForPricingController.name,
    );
    const id = payload.id;
    this.requestForPricingService.userId = payload.user_id;
    this.requestForPricingService.bu_code = payload.bu_code;
    await this.requestForPricingService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.requestForPricingService.remove(id));
    return this.handleResult(result);
  }

  /**
   * Print a request-for-pricing via FastReport viewer (micro-report)
   * พิมพ์ใบขอราคาผ่าน FastReport viewer (micro-report)
   */
  @MessagePattern({
    cmd: 'request-for-pricing.printToReport',
    service: 'request-for-pricing',
  })
  async printToReport(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'printToReport', payload }, RequestForPricingController.name);
    const { user_id, bu_code, id } = payload;
    this.requestForPricingService.userId = user_id;
    this.requestForPricingService.bu_code = bu_code;
    await this.requestForPricingService.initializePrismaService(bu_code, user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.requestForPricingService.printToReport(id),
    );
    return this.handleResult(result);
  }
}
