import { Controller, HttpStatus } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { StockOutService } from './stock-out.service';
import { IStockOutCreate, IStockOutUpdate } from './interface/stock-out.interface';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController, MicroservicePayload, MicroserviceResponse } from '@/common';

@Controller()
export class StockOutController extends BaseMicroserviceController {
  private readonly logger = new BackendLogger(StockOutController.name);

  constructor(private readonly stockOutService: StockOutService) {
    super();
  }

  /**
   * Create audit context from payload
   * สร้างบริบทการตรวจสอบจาก payload
   * @param payload - Microservice payload / ข้อมูล payload จากไมโครเซอร์วิส
   * @returns Audit context object / ออบเจกต์บริบทการตรวจสอบ
   */
  private createAuditContext(payload: MicroservicePayload): AuditContext {
    return {
      tenant_id: payload.tenant_id || payload.bu_code,
      user_id: payload.user_id,
      request_id: payload.request_id,
      ip_address: payload.ip_address,
      user_agent: payload.user_agent,
    };
  }

  /**
   * Find a stock-out record by ID
   * ค้นหาใบเบิกสินค้าออกจากคลังรายการเดียวตาม ID
   * @param payload - Contains id, user_id, tenant_id / ประกอบด้วย id, user_id, tenant_id
   * @returns Stock-out detail / รายละเอียดใบเบิกสินค้าออกจากคลัง
   */
  @MessagePattern({ cmd: 'stock-out.findOne', service: 'stock-out' })
  async findOne(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findOne', payload }, StockOutController.name);
    const id = payload.id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockOutService.findOne(id, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  /**
   * Find all stock-out records with pagination
   * ค้นหาใบเบิกสินค้าออกจากคลังทั้งหมดพร้อมการแบ่งหน้า
   * @param payload - Contains user_id, tenant_id, paginate / ประกอบด้วย user_id, tenant_id, paginate
   * @returns Paginated list of stock-out records / รายการใบเบิกสินค้าออกจากคลังแบบแบ่งหน้า
   */
  @MessagePattern({ cmd: 'stock-out.findAll', service: 'stock-out' })
  async findAll(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findAll', payload }, StockOutController.name);
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const paginate = payload.paginate;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockOutService.findAll(user_id, tenant_id, paginate)
    );
    return this.handlePaginatedResult(result);
  }

  /**
   * Create a new stock-out record
   * สร้างใบเบิกสินค้าออกจากคลังใหม่
   * @param payload - Contains data, user_id, tenant_id / ประกอบด้วย data, user_id, tenant_id
   * @returns Created stock-out record / ใบเบิกสินค้าออกจากคลังที่สร้างแล้ว
   */
  @MessagePattern({ cmd: 'stock-out.create', service: 'stock-out' })
  async create(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'create', payload }, StockOutController.name);
    const data: IStockOutCreate = payload.data;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockOutService.create(data, user_id, tenant_id)
    );
    return this.handleResult(result, HttpStatus.CREATED);
  }

  /**
   * Update a stock-out record
   * แก้ไขใบเบิกสินค้าออกจากคลัง
   * @param payload - Contains data, user_id, tenant_id / ประกอบด้วย data, user_id, tenant_id
   * @returns Updated stock-out record / ใบเบิกสินค้าออกจากคลังที่แก้ไขแล้ว
   */
  @MessagePattern({ cmd: 'stock-out.update', service: 'stock-out' })
  async update(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'update', payload }, StockOutController.name);
    const data: IStockOutUpdate = payload.data;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockOutService.update(data, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  /**
   * Delete a stock-out record
   * ลบใบเบิกสินค้าออกจากคลัง
   * @param payload - Contains id, user_id, tenant_id / ประกอบด้วย id, user_id, tenant_id
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @MessagePattern({ cmd: 'stock-out.delete', service: 'stock-out' })
  async delete(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'delete', payload }, StockOutController.name);
    const id = payload.id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockOutService.delete(id, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'stock-out.void', service: 'stock-out' })
  async voidStockOut(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'voidStockOut', payload }, StockOutController.name);
    const id = payload.id;
    const voidReason = payload.data?.info?.void_reason || '';
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockOutService.voidStockOut(id, voidReason, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  // ==================== Stock Out Detail CRUD ====================

  /**
   * Find a stock-out detail by ID
   * ค้นหารายละเอียดใบเบิกสินค้าออกจากคลังตาม ID
   * @param payload - Contains detail_id, user_id, tenant_id / ประกอบด้วย detail_id, user_id, tenant_id
   * @returns Stock-out detail item / รายละเอียดใบเบิกสินค้าออกจากคลัง
   */
  @MessagePattern({ cmd: 'stock-out-detail.find-by-id', service: 'stock-out' })
  async getDetailById(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'getDetailById', payload }, StockOutController.name);
    const detailId = payload.detail_id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockOutService.findDetailById(detailId, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  /**
   * Find all details of a stock-out record
   * ค้นหารายละเอียดทั้งหมดของใบเบิกสินค้าออกจากคลัง
   * @param payload - Contains stock_out_id, user_id, tenant_id / ประกอบด้วย stock_out_id, user_id, tenant_id
   * @returns List of stock-out details / รายการรายละเอียดใบเบิกสินค้าออกจากคลัง
   */
  @MessagePattern({ cmd: 'stock-out-detail.find-all', service: 'stock-out' })
  async getDetailsByStockOutId(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'getDetailsByStockOutId', payload }, StockOutController.name);
    const stockOutId = payload.stock_out_id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockOutService.findDetailsByStockOutId(stockOutId, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  /**
   * Create a detail item for a stock-out record
   * สร้างรายละเอียดสินค้าในใบเบิกสินค้าออกจากคลัง
   * @param payload - Contains stock_out_id, data, user_id, tenant_id / ประกอบด้วย stock_out_id, data, user_id, tenant_id
   * @returns Created detail item / รายละเอียดสินค้าที่สร้างแล้ว
   */
  @MessagePattern({ cmd: 'stock-out-detail.create', service: 'stock-out' })
  async createDetail(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'createDetail', payload }, StockOutController.name);
    const stockOutId = payload.stock_out_id;
    const data = payload.data;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockOutService.createDetail(stockOutId, data, user_id, tenant_id)
    );
    return this.handleResult(result, HttpStatus.CREATED);
  }

  /**
   * Update a detail item of a stock-out record
   * แก้ไขรายละเอียดสินค้าในใบเบิกสินค้าออกจากคลัง
   * @param payload - Contains detail_id, data, user_id, tenant_id / ประกอบด้วย detail_id, data, user_id, tenant_id
   * @returns Updated detail item / รายละเอียดสินค้าที่แก้ไขแล้ว
   */
  @MessagePattern({ cmd: 'stock-out-detail.update', service: 'stock-out' })
  async updateDetail(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'updateDetail', payload }, StockOutController.name);
    const detailId = payload.detail_id;
    const data = payload.data;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockOutService.updateDetail(detailId, data, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  /**
   * Delete a detail item of a stock-out record
   * ลบรายละเอียดสินค้าในใบเบิกสินค้าออกจากคลัง
   * @param payload - Contains detail_id, user_id, tenant_id / ประกอบด้วย detail_id, user_id, tenant_id
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @MessagePattern({ cmd: 'stock-out-detail.delete', service: 'stock-out' })
  async deleteDetail(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'deleteDetail', payload }, StockOutController.name);
    const detailId = payload.detail_id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockOutService.deleteDetail(detailId, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  // ==================== Standalone Stock Out Detail API ====================

  /**
   * Find all stock-out details with pagination (standalone API)
   * ค้นหารายละเอียดใบเบิกสินค้าออกจากคลังทั้งหมดพร้อมการแบ่งหน้า (API แบบแยก)
   * @param payload - Contains user_id, tenant_id, paginate / ประกอบด้วย user_id, tenant_id, paginate
   * @returns Paginated list of stock-out details / รายการรายละเอียดใบเบิกสินค้าออกจากคลังแบบแบ่งหน้า
   */
  @MessagePattern({ cmd: 'stock-out-detail.findAll', service: 'stock-out-detail' })
  async findAllDetails(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findAllDetails', payload }, StockOutController.name);
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const paginate = payload.paginate;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockOutService.findAllDetails(user_id, tenant_id, paginate)
    );
    return this.handlePaginatedResult(result);
  }

  /**
   * Find a single stock-out detail (standalone API)
   * ค้นหารายละเอียดใบเบิกสินค้าออกจากคลังรายการเดียว (API แบบแยก)
   * @param payload - Contains id, user_id, tenant_id / ประกอบด้วย id, user_id, tenant_id
   * @returns Stock-out detail / รายละเอียดใบเบิกสินค้าออกจากคลัง
   */
  @MessagePattern({ cmd: 'stock-out-detail.findOne', service: 'stock-out-detail' })
  async findOneDetail(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findOneDetail', payload }, StockOutController.name);
    const detailId = payload.id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockOutService.findDetailById(detailId, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  /**
   * Create a standalone stock-out detail
   * สร้างรายละเอียดใบเบิกสินค้าออกจากคลังแบบแยก
   * @param payload - Contains data, user_id, tenant_id / ประกอบด้วย data, user_id, tenant_id
   * @returns Created standalone detail / รายละเอียดใบเบิกสินค้าออกจากคลังแบบแยกที่สร้างแล้ว
   */
  @MessagePattern({ cmd: 'stock-out-detail.createStandalone', service: 'stock-out-detail' })
  async createStandaloneDetail(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'createStandaloneDetail', payload }, StockOutController.name);
    const data = payload.data;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockOutService.createStandaloneDetail(data, user_id, tenant_id)
    );
    return this.handleResult(result, HttpStatus.CREATED);
  }

  /**
   * Update a standalone stock-out detail
   * แก้ไขรายละเอียดใบเบิกสินค้าออกจากคลังแบบแยก
   * @param payload - Contains id, data, user_id, tenant_id / ประกอบด้วย id, data, user_id, tenant_id
   * @returns Updated standalone detail / รายละเอียดใบเบิกสินค้าออกจากคลังแบบแยกที่แก้ไขแล้ว
   */
  @MessagePattern({ cmd: 'stock-out-detail.updateStandalone', service: 'stock-out-detail' })
  async updateStandaloneDetail(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'updateStandaloneDetail', payload }, StockOutController.name);
    const detailId = payload.id;
    const data = payload.data;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockOutService.updateDetail(detailId, { id: detailId, ...data }, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  /**
   * Delete a standalone stock-out detail
   * ลบรายละเอียดใบเบิกสินค้าออกจากคลังแบบแยก
   * @param payload - Contains id, user_id, tenant_id / ประกอบด้วย id, user_id, tenant_id
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @MessagePattern({ cmd: 'stock-out-detail.deleteStandalone', service: 'stock-out-detail' })
  async deleteStandaloneDetail(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'deleteStandaloneDetail', payload }, StockOutController.name);
    const detailId = payload.id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockOutService.deleteDetail(detailId, user_id, tenant_id)
    );
    return this.handleResult(result);
  }
}
