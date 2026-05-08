import { Controller } from '@nestjs/common';
import { PriceListTemplateService } from './price-list-template.service';
import { Payload } from '@nestjs/microservices';
import { MessagePattern } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { MicroservicePayload, MicroserviceResponse } from '@/common';

@Controller()
export class PriceListTemplateController {
  private readonly logger: BackendLogger = new BackendLogger(
    PriceListTemplateController.name,
  );
  constructor(
    private readonly priceListTemplateService: PriceListTemplateService,
  ) {}

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
   * Find a single price list template by ID
   * ค้นหารายการแม่แบบรายการราคาเดียวตาม ID
   * @param payload - Microservice payload containing price list template ID / ข้อมูล payload ที่มี ID ของแม่แบบรายการราคา
   * @returns Price list template detail / รายละเอียดแม่แบบรายการราคา
   */
  @MessagePattern({
    cmd: 'price-list-template.findOne',
    service: 'price-list-template',
  })
  async findOne(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'findOne', payload },
      PriceListTemplateController.name,
    );
    const id = payload.id;
    this.priceListTemplateService.userId = payload.user_id;
    this.priceListTemplateService.bu_code = payload.bu_code;
    await this.priceListTemplateService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.priceListTemplateService.findOne(id));
  }

  /**
   * Find all price list templates with pagination
   * ค้นหารายการแม่แบบรายการราคาทั้งหมดพร้อมการแบ่งหน้า
   * @param payload - Microservice payload containing pagination parameters / ข้อมูล payload ที่มีพารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of price list templates / รายการแม่แบบรายการราคาพร้อมการแบ่งหน้า
   */
  @MessagePattern({
    cmd: 'price-list-template.findAll',
    service: 'price-list-template',
  })
  async findAll(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'findAll', payload },
      PriceListTemplateController.name,
    );
    this.priceListTemplateService.userId = payload.user_id;
    this.priceListTemplateService.bu_code = payload.bu_code;
    const paginate = payload.paginate;
    await this.priceListTemplateService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.priceListTemplateService.findAll(paginate));
  }

  /**
   * Create a new price list template
   * สร้างแม่แบบรายการราคาใหม่
   * @param payload - Microservice payload containing price list template data / ข้อมูล payload ที่มีข้อมูลแม่แบบรายการราคา
   * @returns Created price list template / แม่แบบรายการราคาที่สร้างขึ้น
   */
  @MessagePattern({
    cmd: 'price-list-template.create',
    service: 'price-list-template',
  })
  async create(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'create', payload },
      PriceListTemplateController.name,
    );
    const data = payload.data;
    this.priceListTemplateService.userId = payload.user_id;
    this.priceListTemplateService.bu_code = payload.bu_code;
    await this.priceListTemplateService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.priceListTemplateService.create(data));
  }

  /**
   * Update an existing price list template
   * อัปเดตแม่แบบรายการราคาที่มีอยู่
   * @param payload - Microservice payload containing updated price list template data / ข้อมูล payload ที่มีข้อมูลแม่แบบรายการราคาที่อัปเดต
   * @returns Updated price list template / แม่แบบรายการราคาที่อัปเดต
   */
  @MessagePattern({
    cmd: 'price-list-template.update',
    service: 'price-list-template',
  })
  async update(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'update', payload },
      PriceListTemplateController.name,
    );
    const data = payload.data;
    this.priceListTemplateService.userId = payload.user_id;
    this.priceListTemplateService.bu_code = payload.bu_code;
    await this.priceListTemplateService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.priceListTemplateService.update(data));
  }

  /**
   * Delete a price list template (soft delete)
   * ลบแม่แบบรายการราคา (ลบแบบซอฟต์)
   * @param payload - Microservice payload containing price list template ID / ข้อมูล payload ที่มี ID ของแม่แบบรายการราคา
   * @returns Deleted price list template ID / ID ของแม่แบบรายการราคาที่ลบ
   */
  @MessagePattern({
    cmd: 'price-list-template.remove',
    service: 'price-list-template',
  })
  async remove(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'remove', payload },
      PriceListTemplateController.name,
    );
    const id = payload.id;
    this.priceListTemplateService.userId = payload.user_id;
    this.priceListTemplateService.bu_code = payload.bu_code;
    await this.priceListTemplateService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.priceListTemplateService.remove(id));
  }

  /**
   * Update the status of a price list template
   * อัปเดตสถานะของแม่แบบรายการราคา
   * @param payload - Microservice payload containing template ID and new status / ข้อมูล payload ที่มี ID ของแม่แบบและสถานะใหม่
   * @returns Updated price list template status / สถานะแม่แบบรายการราคาที่อัปเดต
   */
  @MessagePattern({
    cmd: 'price-list-template.updateStatus',
    service: 'price-list-template',
  })
  async updateStatus(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'updateStatus', payload },
      PriceListTemplateController.name,
    );
    const id = payload.id;
    const status = payload.status;
    this.priceListTemplateService.userId = payload.user_id;
    this.priceListTemplateService.bu_code = payload.bu_code;
    await this.priceListTemplateService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () =>
      this.priceListTemplateService.updateStatus(id, status),
    );
  }
}
