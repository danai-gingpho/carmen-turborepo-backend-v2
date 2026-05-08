import { Controller, HttpStatus } from '@nestjs/common';
import { PurchaseOrderService } from './purchase-order.service';
import { PurchaseOrderLogic } from './purchase-order.logic';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController, MicroservicePayload, MicroserviceResponse } from '@/common';

@Controller()
export class PurchaseOrderController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    PurchaseOrderController.name,
  );

  constructor(
    private readonly purchaseOrderService: PurchaseOrderService,
    private readonly purchaseOrderLogic: PurchaseOrderLogic,
  ) {
    super();
  }

  /**
   * Create an audit context from the microservice payload
   * สร้าง audit context จาก payload ของไมโครเซอร์วิส
   * @param payload - Microservice payload containing tenant and user info / payload ของไมโครเซอร์วิสที่มีข้อมูลผู้เช่าและผู้ใช้
   * @returns Audit context object / ออบเจกต์ audit context
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
   * Find a purchase order by ID
   * ค้นหาใบสั่งซื้อรายการเดียวตาม ID
   * @param payload - Payload containing the purchase order ID / payload ที่มี ID ของใบสั่งซื้อ
   * @returns Purchase order data / ข้อมูลใบสั่งซื้อ
   */
  @MessagePattern({
    cmd: 'purchase-order.find-by-id',
    service: 'purchase-order',
  })
  async getById(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'getById', payload },
      PurchaseOrderController.name,
    );
    this.purchaseOrderService.userId = payload.user_id;
    this.purchaseOrderService.bu_code = payload.tenant_id || payload.bu_code;
    await this.purchaseOrderService.initializePrismaService(
      payload.tenant_id || payload.bu_code,
      payload.user_id,
    );
    const id = payload.id;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.purchaseOrderService.findById(id));
    return this.handleResult(result);
  }

  /**
   * List purchase orders available for GRN creation (with location breakdown from PR details)
   * ค้นหาใบสั่งซื้อที่พร้อมสำหรับสร้างใบรับสินค้า (GRN) พร้อมรายละเอียดตาม location จาก PR
   * @param payload - Payload containing pagination parameters / payload ที่มีพารามิเตอร์การแบ่งหน้า
   * @returns Paginated PO list with location-level breakdown / รายการ PO พร้อมรายละเอียดตาม location
   */
  @MessagePattern({
    cmd: 'purchase-order.find-all-for-grn',
    service: 'purchase-order',
  })
  async getAllForGrn(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'getAllForGrn', payload },
      PurchaseOrderController.name,
    );
    this.purchaseOrderService.userId = payload.user_id;
    this.purchaseOrderService.bu_code = payload.tenant_id || payload.bu_code;
    await this.purchaseOrderService.initializePrismaService(
      payload.tenant_id || payload.bu_code,
      payload.user_id,
    );
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseOrderLogic.findAllForGrn(payload.paginate),
    );
    return this.handleResult(result);
  }

  /**
   * List distinct vendors from POs with sent/partial status for GRN
   * แสดงรายการผู้ขายที่มีใบสั่งซื้อสถานะ sent หรือ partial สำหรับ GRN
   * @param payload - Payload containing pagination parameters / payload ที่มีพารามิเตอร์การแบ่งหน้า
   * @returns Distinct vendor list / รายการผู้ขายที่ไม่ซ้ำ
   */
  @MessagePattern({
    cmd: 'purchase-order.find-vendors-for-grn',
    service: 'purchase-order',
  })
  async getVendorsForGrn(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'getVendorsForGrn', payload },
      PurchaseOrderController.name,
    );
    this.purchaseOrderService.userId = payload.user_id;
    this.purchaseOrderService.bu_code = payload.tenant_id || payload.bu_code;
    await this.purchaseOrderService.initializePrismaService(
      payload.tenant_id || payload.bu_code,
      payload.user_id,
    );
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseOrderLogic.findVendorsForGrn(payload.paginate),
    );
    return this.handleResult(result);
  }

  /**
   * List purchase orders for GRN by vendor ID (sent/partial status)
   * ค้นหาใบสั่งซื้อสำหรับ GRN ตาม vendor ID (สถานะ sent หรือ partial)
   * @param payload - Payload containing vendor_id and pagination parameters / payload ที่มี vendor_id และพารามิเตอร์การแบ่งหน้า
   * @returns Paginated PO list filtered by vendor / รายการ PO ที่กรองตาม vendor
   */
  @MessagePattern({
    cmd: 'purchase-order.find-all-for-grn-by-vendor',
    service: 'purchase-order',
  })
  async getAllForGrnByVendor(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'getAllForGrnByVendor', payload },
      PurchaseOrderController.name,
    );
    this.purchaseOrderService.userId = payload.user_id;
    this.purchaseOrderService.bu_code = payload.tenant_id || payload.bu_code;
    await this.purchaseOrderService.initializePrismaService(
      payload.tenant_id || payload.bu_code,
      payload.user_id,
    );
    const vendorId = payload.vendor_id;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseOrderLogic.findAllForGrnByVendorId(vendorId, payload.paginate),
    );
    return this.handleResult(result);
  }

  /**
   * Find all purchase orders with pagination
   * ค้นหาใบสั่งซื้อทั้งหมดพร้อมการแบ่งหน้า
   * @param payload - Payload containing pagination parameters / payload ที่มีพารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of purchase orders / รายการใบสั่งซื้อที่แบ่งหน้าแล้ว
   */
  @MessagePattern({
    cmd: 'purchase-order.find-all',
    service: 'purchase-order',
  })
  async getAll(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'getAll', payload },
      PurchaseOrderController.name,
    );
    this.purchaseOrderService.userId = payload.user_id;
    this.purchaseOrderService.bu_code = payload.tenant_id || payload.bu_code;
    await this.purchaseOrderService.initializePrismaService(
      payload.tenant_id || payload.bu_code,
      payload.user_id,
    );
    const paginate = payload.paginate;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.purchaseOrderService.findAll(paginate));
    return this.handlePaginatedResult(result);
  }

  /**
   * Create a new purchase order
   * สร้างใบสั่งซื้อใหม่
   * @param payload - Payload containing purchase order data / payload ที่มีข้อมูลใบสั่งซื้อ
   * @returns Created purchase order / ใบสั่งซื้อที่สร้างแล้ว
   */
  @MessagePattern({
    cmd: 'purchase-order.create',
    service: 'purchase-order',
  })
  async create(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'create', payload },
      PurchaseOrderController.name,
    );
    const data = payload.data;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseOrderLogic.create(data, payload.user_id, payload.tenant_id || payload.bu_code),
    );
    return this.handleResult(result, HttpStatus.CREATED);
  }

  /**
   * Update an existing purchase order
   * อัปเดตใบสั่งซื้อที่มีอยู่
   * @param payload - Payload containing updated purchase order data / payload ที่มีข้อมูลใบสั่งซื้อที่อัปเดต
   * @returns Updated purchase order / ใบสั่งซื้อที่อัปเดตแล้ว
   */
  @MessagePattern({
    cmd: 'purchase-order.update',
    service: 'purchase-order',
  })
  async update(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'update', payload },
      PurchaseOrderController.name,
    );
    this.purchaseOrderService.userId = payload.user_id;
    this.purchaseOrderService.bu_code = payload.tenant_id || payload.bu_code;
    await this.purchaseOrderService.initializePrismaService(
      payload.tenant_id || payload.bu_code,
      payload.user_id,
    );
    const data = payload.data;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.purchaseOrderService.update(data));
    return this.handleResult(result);
  }

  /**
   * Delete a purchase order by ID
   * ลบใบสั่งซื้อตาม ID
   * @param payload - Payload containing the purchase order ID to delete / payload ที่มี ID ของใบสั่งซื้อที่ต้องการลบ
   * @returns Deleted purchase order ID / ID ของใบสั่งซื้อที่ลบแล้ว
   */
  @MessagePattern({
    cmd: 'purchase-order.delete',
    service: 'purchase-order',
  })
  async delete(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'delete', payload },
      PurchaseOrderController.name,
    );
    this.purchaseOrderService.userId = payload.user_id;
    this.purchaseOrderService.bu_code = payload.tenant_id || payload.bu_code;
    await this.purchaseOrderService.initializePrismaService(
      payload.tenant_id || payload.bu_code,
      payload.user_id,
    );
    const id = payload.data;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.purchaseOrderService.delete(id));
    return this.handleResult(result);
  }

  /**
   * Group purchase requests for creating a purchase order
   * จัดกลุ่มใบขอซื้อสำหรับสร้างใบสั่งซื้อ
   * @param payload - Payload containing purchase request IDs to group / payload ที่มี ID ของใบขอซื้อที่ต้องการจัดกลุ่ม
   * @returns Grouped purchase request data for PO creation / ข้อมูลใบขอซื้อที่จัดกลุ่มแล้วสำหรับสร้างใบสั่งซื้อ
   */
  @MessagePattern({
    cmd: 'purchase-order.group-pr',
    service: 'purchase-order',
  })
  async groupPrForPo(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'groupPrForPo', payload },
      PurchaseOrderController.name,
    );
    this.purchaseOrderService.userId = payload.user_id;
    this.purchaseOrderService.bu_code = payload.tenant_id || payload.bu_code;
    await this.purchaseOrderService.initializePrismaService(
      payload.tenant_id || payload.bu_code,
      payload.user_id,
    );
    const pr_ids = payload.data?.pr_ids || payload.pr_ids;
    const workflow_id = payload.data?.workflow_id;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.purchaseOrderService.groupPrForPo(pr_ids, workflow_id));
    return this.handleResult(result);
  }

  /**
   * Confirm purchase requests and convert them into purchase orders
   * ยืนยันใบขอซื้อและแปลงเป็นใบสั่งซื้อ
   * @param payload - Payload containing purchase request IDs to confirm / payload ที่มี ID ของใบขอซื้อที่ต้องการยืนยัน
   * @returns Created purchase order(s) from confirmed PRs / ใบสั่งซื้อที่สร้างจากใบขอซื้อที่ยืนยันแล้ว
   */
  @MessagePattern({
    cmd: 'purchase-order.confirm-pr',
    service: 'purchase-order',
  })
  async confirmPrToPo(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'confirmPrToPo', payload },
      PurchaseOrderController.name,
    );
    this.purchaseOrderService.userId = payload.user_id;
    this.purchaseOrderService.bu_code = payload.tenant_id || payload.bu_code;
    await this.purchaseOrderService.initializePrismaService(
      payload.tenant_id || payload.bu_code,
      payload.user_id,
    );
    const pr_ids = payload.data?.pr_ids || payload.pr_ids;
    const workflow_id = payload.data?.workflow_id;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.purchaseOrderService.confirmPrToPo(pr_ids, workflow_id));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  /**
   * Cancel a purchase order
   * ยกเลิกใบสั่งซื้อ
   * @param payload - Payload containing the purchase order ID to cancel / payload ที่มี ID ของใบสั่งซื้อที่ต้องการยกเลิก
   * @returns Cancelled purchase order result / ผลลัพธ์การยกเลิกใบสั่งซื้อ
   */
  @MessagePattern({
    cmd: 'purchase-order.cancel',
    service: 'purchase-order',
  })
  async cancel(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'cancel', payload },
      PurchaseOrderController.name,
    );
    this.purchaseOrderService.userId = payload.user_id;
    this.purchaseOrderService.bu_code = payload.tenant_id || payload.bu_code;
    await this.purchaseOrderService.initializePrismaService(
      payload.tenant_id || payload.bu_code,
      payload.user_id,
    );
    const id = payload.id;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.purchaseOrderService.cancel(id));
    return this.handleResult(result);
  }

  /**
   * Close a purchase order
   * ปิดใบสั่งซื้อ
   * @param payload - Payload containing the purchase order ID to close / payload ที่มี ID ของใบสั่งซื้อที่ต้องการปิด
   * @returns Closed purchase order result / ผลลัพธ์การปิดใบสั่งซื้อ
   */
  @MessagePattern({
    cmd: 'purchase-order.close',
    service: 'purchase-order',
  })
  async closePO(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'closePO', payload },
      PurchaseOrderController.name,
    );
    this.purchaseOrderService.userId = payload.user_id;
    this.purchaseOrderService.bu_code = payload.tenant_id || payload.bu_code;
    await this.purchaseOrderService.initializePrismaService(
      payload.tenant_id || payload.bu_code,
      payload.user_id,
    );
    const id = payload.id;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.purchaseOrderService.closePO(id));
    return this.handleResult(result);
  }

  /**
   * Export a purchase order to Excel format
   * ส่งออกใบสั่งซื้อเป็นไฟล์ Excel
   * @param payload - Payload containing the purchase order ID to export / payload ที่มี ID ของใบสั่งซื้อที่ต้องการส่งออก
   * @returns Excel file buffer and filename / บัฟเฟอร์ไฟล์ Excel และชื่อไฟล์
   */
  @MessagePattern({
    cmd: 'purchase-order.export',
    service: 'purchase-order',
  })
  async exportToExcel(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'exportToExcel', payload },
      PurchaseOrderController.name,
    );
    this.purchaseOrderService.userId = payload.user_id;
    this.purchaseOrderService.bu_code = payload.tenant_id || payload.bu_code;
    await this.purchaseOrderService.initializePrismaService(
      payload.tenant_id || payload.bu_code,
      payload.user_id,
    );
    const id = payload.id;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.purchaseOrderService.exportToExcel(id));
    return this.handleResult(result);
  }

  /**
   * Print a purchase order to PDF format
   * พิมพ์ใบสั่งซื้อเป็นไฟล์ PDF
   * @param payload - Payload containing the purchase order ID to print / payload ที่มี ID ของใบสั่งซื้อที่ต้องการพิมพ์
   * @returns PDF file buffer and filename / บัฟเฟอร์ไฟล์ PDF และชื่อไฟล์
   */
  @MessagePattern({
    cmd: 'purchase-order.print',
    service: 'purchase-order',
  })
  async printToPdf(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'printToPdf', payload },
      PurchaseOrderController.name,
    );
    this.purchaseOrderService.userId = payload.user_id;
    this.purchaseOrderService.bu_code = payload.tenant_id || payload.bu_code;
    await this.purchaseOrderService.initializePrismaService(
      payload.tenant_id || payload.bu_code,
      payload.user_id,
    );
    const id = payload.id;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.purchaseOrderService.printToPdf(id));
    return this.handleResult(result);
  }

  /**
   * Save a purchase order (create or update header and details)
   * บันทึกใบสั่งซื้อ (สร้างหรืออัปเดตส่วนหัวและรายละเอียด)
   * @param payload - Payload containing purchase order ID, data, user ID, and business unit code / payload ที่มี ID ใบสั่งซื้อ ข้อมูล ID ผู้ใช้ และรหัสหน่วยธุรกิจ
   * @returns Saved purchase order result / ผลลัพธ์การบันทึกใบสั่งซื้อ
   */
  @MessagePattern({
    cmd: 'purchase-order.submit',
    service: 'purchase-order',
  })
  async submit(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'submit', payload }, PurchaseOrderController.name);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseOrderLogic.submit(
        payload.id,
        payload.payload,
        payload.user_id,
        payload.tenant_id || payload.bu_code,
      ),
    );
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'purchase-order.save',
    service: 'purchase-order',
  })
  async save(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'save', payload },
      PurchaseOrderController.name,
    );
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseOrderLogic.save(
        payload.id,
        payload.data,
        payload.user_id,
        payload.tenant_id || payload.bu_code,
      ),
    );
    return this.handleResult(result);
  }

  /**
   * Approve a purchase order through the workflow
   * อนุมัติใบสั่งซื้อผ่านขั้นตอนการทำงาน
   * @param payload - Payload containing purchase order ID and approval data / payload ที่มี ID ใบสั่งซื้อและข้อมูลการอนุมัติ
   * @returns Approval result / ผลลัพธ์การอนุมัติ
   */
  @MessagePattern({
    cmd: 'purchase-order.approve',
    service: 'purchase-order',
  })
  async approve(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'approve', payload },
      PurchaseOrderController.name,
    );
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseOrderLogic.approve(
        payload.id,
        payload.data,
        payload.user_id,
        payload.tenant_id || payload.bu_code,
      ),
    );
    return this.handleResult(result);
  }

  /**
   * Reject a purchase order through the workflow
   * ปฏิเสธใบสั่งซื้อผ่านขั้นตอนการทำงาน
   * @param payload - Payload containing purchase order ID and rejection data / payload ที่มี ID ใบสั่งซื้อและข้อมูลการปฏิเสธ
   * @returns Rejection result / ผลลัพธ์การปฏิเสธ
   */
  @MessagePattern({
    cmd: 'purchase-order.reject',
    service: 'purchase-order',
  })
  async reject(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'reject', payload },
      PurchaseOrderController.name,
    );
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseOrderLogic.reject(
        payload.id,
        payload.data,
        payload.user_id,
        payload.tenant_id || payload.bu_code,
      ),
    );
    return this.handleResult(result);
  }

  /**
   * Review a purchase order through the workflow
   * ตรวจสอบใบสั่งซื้อผ่านขั้นตอนการทำงาน
   * @param payload - Payload containing purchase order ID and review data / payload ที่มี ID ใบสั่งซื้อและข้อมูลการตรวจสอบ
   * @returns Review result / ผลลัพธ์การตรวจสอบ
   */
  @MessagePattern({
    cmd: 'purchase-order.review',
    service: 'purchase-order',
  })
  async review(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'review', payload },
      PurchaseOrderController.name,
    );
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseOrderLogic.review(
        payload.id,
        payload.data,
        payload.user_id,
        payload.tenant_id || payload.bu_code,
      ),
    );
    return this.handleResult(result);
  }

  // ==================== Purchase Order Detail CRUD ====================

  /**
   * Find a purchase order detail by its ID
   * ค้นหารายละเอียดใบสั่งซื้อรายการเดียวตาม ID
   * @param payload - Payload containing the detail ID / payload ที่มี ID ของรายละเอียด
   * @returns Purchase order detail data / ข้อมูลรายละเอียดใบสั่งซื้อ
   */
  @MessagePattern({
    cmd: 'purchase-order-detail.find-by-id',
    service: 'purchase-order',
  })
  async getDetailById(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'getDetailById', payload },
      PurchaseOrderController.name,
    );
    this.purchaseOrderService.userId = payload.user_id;
    this.purchaseOrderService.bu_code = payload.tenant_id || payload.bu_code;
    await this.purchaseOrderService.initializePrismaService(
      payload.tenant_id || payload.bu_code,
      payload.user_id,
    );
    const detailId = payload.detail_id;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.purchaseOrderService.findDetailById(detailId));
    return this.handleResult(result);
  }

  /**
   * Find all details for a specific purchase order
   * ค้นหารายละเอียดทั้งหมดของใบสั่งซื้อที่ระบุ
   * @param payload - Payload containing the purchase order ID / payload ที่มี ID ของใบสั่งซื้อ
   * @returns List of purchase order details / รายการรายละเอียดใบสั่งซื้อ
   */
  @MessagePattern({
    cmd: 'purchase-order-detail.find-all',
    service: 'purchase-order',
  })
  async getDetailsByPurchaseOrderId(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'getDetailsByPurchaseOrderId', payload },
      PurchaseOrderController.name,
    );
    this.purchaseOrderService.userId = payload.user_id;
    this.purchaseOrderService.bu_code = payload.tenant_id || payload.bu_code;
    await this.purchaseOrderService.initializePrismaService(
      payload.tenant_id || payload.bu_code,
      payload.user_id,
    );
    const purchaseOrderId = payload.purchase_order_id;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.purchaseOrderService.findDetailsByPurchaseOrderId(purchaseOrderId));
    return this.handleResult(result);
  }

  /**
   * Create a new purchase order detail line item
   * สร้างรายการรายละเอียดใบสั่งซื้อใหม่
   * @param payload - Payload containing purchase order ID and detail data / payload ที่มี ID ใบสั่งซื้อและข้อมูลรายละเอียด
   * @returns Created purchase order detail / รายละเอียดใบสั่งซื้อที่สร้างแล้ว
   */
  @MessagePattern({
    cmd: 'purchase-order-detail.create',
    service: 'purchase-order',
  })
  async createDetail(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'createDetail', payload },
      PurchaseOrderController.name,
    );
    this.purchaseOrderService.userId = payload.user_id;
    this.purchaseOrderService.bu_code = payload.tenant_id || payload.bu_code;
    await this.purchaseOrderService.initializePrismaService(
      payload.tenant_id || payload.bu_code,
      payload.user_id,
    );
    const purchaseOrderId = payload.purchase_order_id;
    const detailData = payload.data;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.purchaseOrderService.createDetail(purchaseOrderId, detailData));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  /**
   * Update an existing purchase order detail line item
   * อัปเดตรายการรายละเอียดใบสั่งซื้อที่มีอยู่
   * @param payload - Payload containing detail ID and updated data / payload ที่มี ID รายละเอียดและข้อมูลที่อัปเดต
   * @returns Updated purchase order detail / รายละเอียดใบสั่งซื้อที่อัปเดตแล้ว
   */
  @MessagePattern({
    cmd: 'purchase-order-detail.update',
    service: 'purchase-order',
  })
  async updateDetail(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'updateDetail', payload },
      PurchaseOrderController.name,
    );
    this.purchaseOrderService.userId = payload.user_id;
    this.purchaseOrderService.bu_code = payload.tenant_id || payload.bu_code;
    await this.purchaseOrderService.initializePrismaService(
      payload.tenant_id || payload.bu_code,
      payload.user_id,
    );
    const detailId = payload.detail_id;
    const detailData = payload.data;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.purchaseOrderService.updateDetail(detailId, detailData));
    return this.handleResult(result);
  }

  /**
   * Delete a purchase order detail line item
   * ลบรายการรายละเอียดใบสั่งซื้อ
   * @param payload - Payload containing the detail ID to delete / payload ที่มี ID รายละเอียดที่ต้องการลบ
   * @returns Deleted detail ID / ID ของรายละเอียดที่ลบแล้ว
   */
  @MessagePattern({
    cmd: 'purchase-order-detail.delete',
    service: 'purchase-order',
  })
  async deleteDetail(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'deleteDetail', payload },
      PurchaseOrderController.name,
    );
    this.purchaseOrderService.userId = payload.user_id;
    this.purchaseOrderService.bu_code = payload.tenant_id || payload.bu_code;
    await this.purchaseOrderService.initializePrismaService(
      payload.tenant_id || payload.bu_code,
      payload.user_id,
    );
    const detailId = payload.detail_id;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.purchaseOrderService.deleteDetail(detailId));
    return this.handleResult(result);
  }

  /**
   * Find all purchase orders pending approval for the current user
   * ค้นหาใบสั่งซื้อทั้งหมดที่รอการอนุมัติของผู้ใช้ปัจจุบัน
   * @param payload - Payload containing user ID, business unit code, and pagination / payload ที่มี ID ผู้ใช้ รหัสหน่วยธุรกิจ และการแบ่งหน้า
   * @returns Paginated list of pending purchase orders / รายการใบสั่งซื้อที่รออนุมัติที่แบ่งหน้าแล้ว
   */
  @MessagePattern({
    cmd: 'my-pending.purchase-order.find-all',
    service: 'my-pending',
  })
  async findAllMyPending(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'findAllMyPending', payload },
      PurchaseOrderController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;
    const paginate = payload.paginate;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseOrderService.findAllMyPending(user_id, bu_code, paginate),
    );
    return this.handleMultiPaginatedResult(result);
  }

  /**
   * Get the count of purchase orders pending approval for the current user
   * นับจำนวนใบสั่งซื้อที่รอการอนุมัติของผู้ใช้ปัจจุบัน
   * @param payload - Payload containing user ID and business unit code / payload ที่มี ID ผู้ใช้และรหัสหน่วยธุรกิจ
   * @returns Count of pending purchase orders / จำนวนใบสั่งซื้อที่รออนุมัติ
   */
  @MessagePattern({
    cmd: 'my-pending.purchase-order.find-all.count',
    service: 'my-pending',
  })
  async findAllMyPendingCount(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'findAllMyPendingCount', payload },
      PurchaseOrderController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseOrderService.findAllMyPendingCount(user_id, bu_code),
    );
    return this.handleResult(result);
  }

  /**
   * Get previous workflow stages for a purchase order
   * ดึงขั้นตอนอนุมัติก่อนหน้า current_stage ของใบสั่งซื้อ
   */
  @MessagePattern({
    cmd: 'purchase-order.get-previous-stages',
    service: 'purchase-order',
  })
  async getPreviousStages(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'getPreviousStages', payload },
      PurchaseOrderController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;
    const po_id = payload.po_id;

    await this.purchaseOrderService.initializePrismaService(bu_code, user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseOrderService.getPreviousStages(po_id),
    );
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'purchase-order.find-all-workflow-stages-by-po',
    service: 'purchase-order',
  })
  async findAllWorkflowStagesByPo(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'findAllWorkflowStagesByPo', payload },
      PurchaseOrderController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseOrderService.findAllWorkflowStagesByPo(user_id, bu_code),
    );
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'purchase-order.find-all-my-pending-stages',
    service: 'purchase-order',
  })
  async findAllMyPendingStages(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'findAllMyPendingStages', payload },
      PurchaseOrderController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;

    await this.purchaseOrderService.initializePrismaService(bu_code, user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseOrderService.findAllMyPendingStages(),
    );
    return this.handleResult(result);
  }

  /**
   * Print a purchase order via FastReport viewer (micro-report)
   * พิมพ์ใบสั่งซื้อผ่าน FastReport viewer (micro-report)
   */
  @MessagePattern({
    cmd: 'purchase-order.printToReport',
    service: 'purchase-order',
  })
  async printToReport(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'printToReport', payload },
      PurchaseOrderController.name,
    );
    const { user_id, bu_code, id } = payload;
    this.purchaseOrderService.userId = user_id;
    this.purchaseOrderService.bu_code = bu_code;
    await this.purchaseOrderService.initializePrismaService(bu_code, user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseOrderService.printToReport(id),
    );
    return this.handleResult(result);
  }
}
