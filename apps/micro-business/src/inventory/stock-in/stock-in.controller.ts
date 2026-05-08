import { Controller, HttpStatus } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { StockInService } from './stock-in.service';
import { IStockInCreate, IStockInUpdate } from './interface/stock-in.interface';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController, MicroservicePayload, MicroserviceResponse } from '@/common';

@Controller()
export class StockInController extends BaseMicroserviceController {
  private readonly logger = new BackendLogger(StockInController.name);

  constructor(private readonly stockInService: StockInService) {
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
   * Find a stock-in record by ID
   * ค้นหาใบรับสินค้าเข้าคลังรายการเดียวตาม ID
   * @param payload - Contains id, user_id, tenant_id / ประกอบด้วย id, user_id, tenant_id
   * @returns Stock-in detail / รายละเอียดใบรับสินค้าเข้าคลัง
   */
  @MessagePattern({ cmd: 'stock-in.findOne', service: 'stock-in' })
  async findOne(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findOne', payload }, StockInController.name);
    const id = payload.id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockInService.findOne(id, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  /**
   * Find all stock-in records with pagination
   * ค้นหาใบรับสินค้าเข้าคลังทั้งหมดพร้อมการแบ่งหน้า
   * @param payload - Contains user_id, tenant_id, paginate / ประกอบด้วย user_id, tenant_id, paginate
   * @returns Paginated list of stock-in records / รายการใบรับสินค้าเข้าคลังแบบแบ่งหน้า
   */
  @MessagePattern({ cmd: 'stock-in.findAll', service: 'stock-in' })
  async findAll(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findAll', payload }, StockInController.name);
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const paginate = payload.paginate;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockInService.findAll(user_id, tenant_id, paginate)
    );
    return this.handlePaginatedResult(result);
  }

  /**
   * Create a new stock-in record
   * สร้างใบรับสินค้าเข้าคลังใหม่
   * @param payload - Contains data, user_id, tenant_id / ประกอบด้วย data, user_id, tenant_id
   * @returns Created stock-in record / ใบรับสินค้าเข้าคลังที่สร้างแล้ว
   */
  @MessagePattern({ cmd: 'stock-in.create', service: 'stock-in' })
  async create(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'create', payload }, StockInController.name);
    const data: IStockInCreate = payload.data;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockInService.create(data, user_id, tenant_id)
    );
    return this.handleResult(result, HttpStatus.CREATED);
  }

  /**
   * Update a stock-in record
   * แก้ไขใบรับสินค้าเข้าคลัง
   * @param payload - Contains data, user_id, tenant_id / ประกอบด้วย data, user_id, tenant_id
   * @returns Updated stock-in record / ใบรับสินค้าเข้าคลังที่แก้ไขแล้ว
   */
  @MessagePattern({ cmd: 'stock-in.update', service: 'stock-in' })
  async update(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'update', payload }, StockInController.name);
    const data: IStockInUpdate = payload.data;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockInService.update(data, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  /**
   * Delete a stock-in record
   * ลบใบรับสินค้าเข้าคลัง
   * @param payload - Contains id, user_id, tenant_id / ประกอบด้วย id, user_id, tenant_id
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @MessagePattern({ cmd: 'stock-in.delete', service: 'stock-in' })
  async delete(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'delete', payload }, StockInController.name);
    const id = payload.id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockInService.delete(id, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'stock-in.void', service: 'stock-in' })
  async voidStockIn(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'voidStockIn', payload }, StockInController.name);
    const id = payload.id;
    const voidReason = payload.data?.info?.void_reason || '';
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockInService.voidStockIn(id, voidReason, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  // ==================== Stock In Detail CRUD ====================

  /**
   * Find a stock-in detail by ID
   * ค้นหารายละเอียดใบรับสินค้าเข้าคลังตาม ID
   * @param payload - Contains detail_id, user_id, tenant_id / ประกอบด้วย detail_id, user_id, tenant_id
   * @returns Stock-in detail item / รายละเอียดใบรับสินค้าเข้าคลัง
   */
  @MessagePattern({ cmd: 'stock-in-detail.find-by-id', service: 'stock-in' })
  async getDetailById(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'getDetailById', payload }, StockInController.name);
    const detailId = payload.detail_id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockInService.findDetailById(detailId, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  /**
   * Find all details of a stock-in record
   * ค้นหารายละเอียดทั้งหมดของใบรับสินค้าเข้าคลัง
   * @param payload - Contains stock_in_id, user_id, tenant_id / ประกอบด้วย stock_in_id, user_id, tenant_id
   * @returns List of stock-in details / รายการรายละเอียดใบรับสินค้าเข้าคลัง
   */
  @MessagePattern({ cmd: 'stock-in-detail.find-all', service: 'stock-in' })
  async getDetailsByStockInId(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'getDetailsByStockInId', payload }, StockInController.name);
    const stockInId = payload.stock_in_id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockInService.findDetailsByStockInId(stockInId, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  /**
   * Create a detail item for a stock-in record
   * สร้างรายละเอียดสินค้าในใบรับสินค้าเข้าคลัง
   * @param payload - Contains stock_in_id, data, user_id, tenant_id / ประกอบด้วย stock_in_id, data, user_id, tenant_id
   * @returns Created detail item / รายละเอียดสินค้าที่สร้างแล้ว
   */
  @MessagePattern({ cmd: 'stock-in-detail.create', service: 'stock-in' })
  async createDetail(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'createDetail', payload }, StockInController.name);
    const stockInId = payload.stock_in_id;
    const data = payload.data;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockInService.createDetail(stockInId, data, user_id, tenant_id)
    );
    return this.handleResult(result, HttpStatus.CREATED);
  }

  /**
   * Update a detail item of a stock-in record
   * แก้ไขรายละเอียดสินค้าในใบรับสินค้าเข้าคลัง
   * @param payload - Contains detail_id, data, user_id, tenant_id / ประกอบด้วย detail_id, data, user_id, tenant_id
   * @returns Updated detail item / รายละเอียดสินค้าที่แก้ไขแล้ว
   */
  @MessagePattern({ cmd: 'stock-in-detail.update', service: 'stock-in' })
  async updateDetail(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'updateDetail', payload }, StockInController.name);
    const detailId = payload.detail_id;
    const data = payload.data;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockInService.updateDetail(detailId, data, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  /**
   * Delete a detail item of a stock-in record
   * ลบรายละเอียดสินค้าในใบรับสินค้าเข้าคลัง
   * @param payload - Contains detail_id, user_id, tenant_id / ประกอบด้วย detail_id, user_id, tenant_id
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @MessagePattern({ cmd: 'stock-in-detail.delete', service: 'stock-in' })
  async deleteDetail(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'deleteDetail', payload }, StockInController.name);
    const detailId = payload.detail_id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockInService.deleteDetail(detailId, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  // ==================== Standalone Stock In Detail API ====================

  /**
   * Find all stock-in details with pagination (standalone API)
   * ค้นหารายละเอียดใบรับสินค้าเข้าคลังทั้งหมดพร้อมการแบ่งหน้า (API แบบแยก)
   * @param payload - Contains user_id, tenant_id, paginate / ประกอบด้วย user_id, tenant_id, paginate
   * @returns Paginated list of stock-in details / รายการรายละเอียดใบรับสินค้าเข้าคลังแบบแบ่งหน้า
   */
  @MessagePattern({ cmd: 'stock-in-detail.findAll', service: 'stock-in-detail' })
  async findAllDetails(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findAllDetails', payload }, StockInController.name);
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const paginate = payload.paginate;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockInService.findAllDetails(user_id, tenant_id, paginate)
    );
    return this.handlePaginatedResult(result);
  }

  /**
   * Find a single stock-in detail (standalone API)
   * ค้นหารายละเอียดใบรับสินค้าเข้าคลังรายการเดียว (API แบบแยก)
   * @param payload - Contains id, user_id, tenant_id / ประกอบด้วย id, user_id, tenant_id
   * @returns Stock-in detail / รายละเอียดใบรับสินค้าเข้าคลัง
   */
  @MessagePattern({ cmd: 'stock-in-detail.findOne', service: 'stock-in-detail' })
  async findOneDetail(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findOneDetail', payload }, StockInController.name);
    const detailId = payload.id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockInService.findDetailById(detailId, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  /**
   * Create a standalone stock-in detail
   * สร้างรายละเอียดใบรับสินค้าเข้าคลังแบบแยก
   * @param payload - Contains data, user_id, tenant_id / ประกอบด้วย data, user_id, tenant_id
   * @returns Created standalone detail / รายละเอียดใบรับสินค้าเข้าคลังแบบแยกที่สร้างแล้ว
   */
  @MessagePattern({ cmd: 'stock-in-detail.createStandalone', service: 'stock-in-detail' })
  async createStandaloneDetail(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'createStandaloneDetail', payload }, StockInController.name);
    const data = payload.data;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockInService.createStandaloneDetail(data, user_id, tenant_id)
    );
    return this.handleResult(result, HttpStatus.CREATED);
  }

  /**
   * Update a standalone stock-in detail
   * แก้ไขรายละเอียดใบรับสินค้าเข้าคลังแบบแยก
   * @param payload - Contains id, data, user_id, tenant_id / ประกอบด้วย id, data, user_id, tenant_id
   * @returns Updated standalone detail / รายละเอียดใบรับสินค้าเข้าคลังแบบแยกที่แก้ไขแล้ว
   */
  @MessagePattern({ cmd: 'stock-in-detail.updateStandalone', service: 'stock-in-detail' })
  async updateStandaloneDetail(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'updateStandaloneDetail', payload }, StockInController.name);
    const detailId = payload.id;
    const data = payload.data;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockInService.updateDetail(detailId, { id: detailId, ...data }, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  /**
   * Delete a standalone stock-in detail
   * ลบรายละเอียดใบรับสินค้าเข้าคลังแบบแยก
   * @param payload - Contains id, user_id, tenant_id / ประกอบด้วย id, user_id, tenant_id
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @MessagePattern({ cmd: 'stock-in-detail.deleteStandalone', service: 'stock-in-detail' })
  async deleteStandaloneDetail(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'deleteStandaloneDetail', payload }, StockInController.name);
    const detailId = payload.id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockInService.deleteDetail(detailId, user_id, tenant_id)
    );
    return this.handleResult(result);
  }
}
