import { Controller, HttpStatus } from '@nestjs/common';
import { PriceListService } from './price-list.service';
import { PriceListLogic } from './price-list.logic';
import { Payload } from '@nestjs/microservices';
import { MessagePattern } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController, MicroservicePayload, MicroserviceResponse } from '@/common';

@Controller()
export class PriceListController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    PriceListController.name,
  );
  constructor(
    private readonly priceListService: PriceListService,
    private readonly priceListLogic: PriceListLogic,
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
   * Find a single price list by ID
   * ค้นหารายการราคาเดียวตาม ID
   * @param payload - Microservice payload containing price list ID / ข้อมูล payload ที่มี ID ของรายการราคา
   * @returns Price list detail / รายละเอียดรายการราคา
   */
  @MessagePattern({ cmd: 'price-list.findOne', service: 'price-list' })
  async findOne(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findOne', payload }, PriceListController.name);
    this.priceListService.userId = payload.user_id;
    this.priceListService.bu_code = payload.bu_code;
    const id = payload.id;
    await this.priceListService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.priceListService.findOne(id));
    return this.handleResult(result);
  }

  /**
   * Find all price lists with pagination
   * ค้นหารายการราคาทั้งหมดพร้อมการแบ่งหน้า
   * @param payload - Microservice payload containing pagination parameters / ข้อมูล payload ที่มีพารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of price lists / รายการราคาพร้อมการแบ่งหน้า
   */
  @MessagePattern({ cmd: 'price-list.findAll', service: 'price-list' })
  async findAll(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findAll', payload }, PriceListController.name);
    this.priceListService.userId = payload.user_id;
    this.priceListService.bu_code = payload.bu_code;
    await this.priceListService.initializePrismaService(payload.bu_code, payload.user_id);
    const paginate = payload.paginate;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.priceListService.findAll(paginate));
    return this.handlePaginatedResult(result);
  }

  /**
   * Find multiple price lists by their IDs with pagination
   * ค้นหารายการราคาหลายรายการตาม ID พร้อมการแบ่งหน้า
   * @param payload - Microservice payload containing array of price list IDs / ข้อมูล payload ที่มีอาร์เรย์ของ ID รายการราคา
   * @returns Paginated list of price lists matching the IDs / รายการราคาที่ตรงกับ ID พร้อมการแบ่งหน้า
   */
  @MessagePattern({ cmd: 'price-list.find-all-by-id', service: 'price-list' })
  async findAllById(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findAllById', payload }, PriceListController.name);
    this.priceListService.userId = payload.user_id;
    this.priceListService.bu_code = payload.bu_code;
    await this.priceListService.initializePrismaService(payload.bu_code, payload.user_id);
    const ids = payload.ids;
    const paginate = payload.paginate;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.priceListService.findAllById(ids, paginate));
    return this.handlePaginatedResult(result);
  }

  /**
   * Compare prices across price lists
   * เปรียบเทียบราคาจากรายการราคาต่างๆ
   * @param payload - Microservice payload containing price comparison data / ข้อมูล payload ที่มีข้อมูลเปรียบเทียบราคา
   * @returns Price comparison results / ผลการเปรียบเทียบราคา
   */
  @MessagePattern({ cmd: 'price-list.price-compare', service: 'price-list' })
  async priceCompare(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'priceCompare', payload }, PriceListController.name);
    this.priceListService.userId = payload.user_id;
    this.priceListService.bu_code = payload.bu_code;
    await this.priceListService.initializePrismaService(payload.bu_code, payload.user_id);
    const data = payload.data;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.priceListService.priceCompare(data));
    return this.handleResult(result);
  }

  /**
   * Create a new price list
   * สร้างรายการราคาใหม่
   * @param payload - Microservice payload containing price list data / ข้อมูล payload ที่มีข้อมูลรายการราคา
   * @returns Created price list ID / ID ของรายการราคาที่สร้างขึ้น
   */
  @MessagePattern({ cmd: 'price-list.create', service: 'price-list' })
  async create(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'create', payload }, PriceListController.name);
    const data = payload.data;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.priceListLogic.create(data, payload.user_id, payload.bu_code),
    );
    return this.handleResult(result, HttpStatus.CREATED);
  }

  /**
   * Update an existing price list
   * อัปเดตรายการราคาที่มีอยู่
   * @param payload - Microservice payload containing updated price list data / ข้อมูล payload ที่มีข้อมูลรายการราคาที่อัปเดต
   * @returns Updated price list ID / ID ของรายการราคาที่อัปเดต
   */
  @MessagePattern({ cmd: 'price-list.update', service: 'price-list' })
  async update(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'update', payload }, PriceListController.name);
    const data = { ...payload.data, id: payload.id };

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.priceListLogic.update(data, payload.user_id, payload.bu_code),
    );
    return this.handleResult(result);
  }

  /**
   * Remove a price list (soft delete)
   * ลบรายการราคา (ลบแบบซอฟต์)
   * @param payload - Microservice payload containing price list ID / ข้อมูล payload ที่มี ID ของรายการราคา
   * @returns Removed price list ID / ID ของรายการราคาที่ลบ
   */
  @MessagePattern({ cmd: 'price-list.remove', service: 'price-list' })
  async remove(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'remove', payload }, PriceListController.name);
    this.priceListService.userId = payload.user_id;
    this.priceListService.bu_code = payload.bu_code;
    await this.priceListService.initializePrismaService(payload.bu_code, payload.user_id);
    const id = payload.id;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.priceListService.remove(id));
    return this.handleResult(result);
  }

  /**
   * Upload price list data from an Excel file
   * อัปโหลดข้อมูลรายการราคาจากไฟล์ Excel
   * @param payload - Microservice payload containing Excel file data / ข้อมูล payload ที่มีข้อมูลไฟล์ Excel
   * @returns Upload result / ผลการอัปโหลด
   */
  @MessagePattern({ cmd: 'price-list.uploadExcel', service: 'price-list' })
  async uploadExcel(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'uploadExcel', payload }, PriceListController.name);
    this.priceListService.userId = payload.user_id;
    this.priceListService.bu_code = payload.bu_code;
    await this.priceListService.initializePrismaService(payload.bu_code, payload.user_id);
    const data = payload.data;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.priceListService.uploadExcel(data));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  /**
   * Download price list data as an Excel file
   * ดาวน์โหลดข้อมูลรายการราคาเป็นไฟล์ Excel
   * @param payload - Microservice payload containing download parameters / ข้อมูล payload ที่มีพารามิเตอร์การดาวน์โหลด
   * @returns Excel file data / ข้อมูลไฟล์ Excel
   */
  @MessagePattern({ cmd: 'price-list.downloadExcel', service: 'price-list' })
  async downloadExcel(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'downloadExcel', payload }, PriceListController.name);
    this.priceListService.userId = payload.user_id;
    this.priceListService.bu_code = payload.bu_code;
    await this.priceListService.initializePrismaService(payload.bu_code, payload.user_id);
    const data = payload.data;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.priceListService.downloadExcel(data));
    return this.handleResult(result);
  }

  /**
   * Find all price list details by detail IDs
   * ค้นหารายละเอียดรายการราคาทั้งหมดตาม ID รายละเอียด
   * @param payload - Microservice payload containing array of detail IDs / ข้อมูล payload ที่มีอาร์เรย์ของ ID รายละเอียด
   * @returns List of price list details / รายการรายละเอียดรายการราคา
   */
  @MessagePattern({ cmd: 'price-list.find-all-by-detail-id', service: 'price-list' })
  async findAllByDetailId(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findAllByDetailId', payload }, PriceListController.name);
    this.priceListService.userId = payload.user_id;
    this.priceListService.bu_code = payload.bu_code;
    await this.priceListService.initializePrismaService(payload.bu_code, payload.user_id);
    const price_list_detail_ids = payload.ids;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.priceListService.findAllByDetail(price_list_detail_ids));
    return this.handleResult(result);
  }

  /**
   * Import price list data from a CSV file
   * นำเข้าข้อมูลรายการราคาจากไฟล์ CSV
   * @param payload - Microservice payload containing CSV content / ข้อมูล payload ที่มีเนื้อหา CSV
   * @returns Import result / ผลการนำเข้า
   */
  @MessagePattern({ cmd: 'price-list.importCsv', service: 'price-list' })
  async importCsv(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'importCsv', payload: { ...payload, csvContent: payload.csvContent?.substring(0, 100) + '...' } }, PriceListController.name);
    this.priceListService.userId = payload.user_id;
    this.priceListService.bu_code = payload.bu_code;
    await this.priceListService.initializePrismaService(payload.bu_code, payload.user_id);
    const csvContent = payload.csvContent;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.priceListService.importCsv(csvContent));
    return this.handleResult(result, HttpStatus.CREATED);
  }

}
