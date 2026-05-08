import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Result, PurchaseOrderUpdateDto } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
import {
  SubmitPurchaseOrderDto,
  ApprovePurchaseOrderDto,
  SavePurchaseOrderDto,
  RejectPurchaseOrderDto,
  ReviewPurchaseOrderDto,
} from './dto/state-change.dto';

@Injectable()
export class PurchaseOrderService {
  private readonly logger: BackendLogger = new BackendLogger(
    PurchaseOrderService.name,
  );

  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly procurementService: ClientProxy,
  ) {}

  /**
   * Find a purchase order by ID via microservice
   * ค้นหารายการเดียวตาม ID ของใบสั่งซื้อผ่านไมโครเซอร์วิส
   * @param id - Purchase order ID / รหัสใบสั่งซื้อ
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Purchase order data / ข้อมูลใบสั่งซื้อ
   */
  async findOne(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        version,
      },
      PurchaseOrderService.name,
    );

    const response = await firstValueFrom(
      this.procurementService.send(
      { cmd: 'purchase-order.find-by-id', service: 'purchase-order' },
      { id, user_id, bu_code, version, ...getGatewayRequestContext() },
    ),
    );

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  /**
   * List purchase orders available for GRN creation via microservice
   * ค้นหาใบสั่งซื้อที่พร้อมสำหรับสร้างใบรับสินค้า (GRN) ผ่านไมโครเซอร์วิส
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated PO list with location-level breakdown / รายการ PO พร้อมรายละเอียดตาม location
   */
  async findAllForGrn(
    user_id: string,
    bu_code: string,
    paginate: IPaginate,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findAllForGrn', version },
      PurchaseOrderService.name,
    );

    const response = await firstValueFrom(
      this.procurementService.send(
      { cmd: 'purchase-order.find-all-for-grn', service: 'purchase-order' },
      { user_id, bu_code, paginate, version, ...getGatewayRequestContext() },
    ),
    );

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  /**
   * List distinct vendors from POs with sent/partial status for GRN
   * แสดงรายการผู้ขายที่มีใบสั่งซื้อสถานะ sent หรือ partial สำหรับ GRN
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Distinct vendor list / รายการผู้ขายที่ไม่ซ้ำ
   */
  async findVendorsForGrn(
    user_id: string,
    bu_code: string,
    paginate: IPaginate,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findVendorsForGrn', version },
      PurchaseOrderService.name,
    );

    const response = await firstValueFrom(
      this.procurementService.send(
      { cmd: 'purchase-order.find-vendors-for-grn', service: 'purchase-order' },
      { user_id, bu_code, paginate, version, ...getGatewayRequestContext() },
    ),
    );

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  /**
   * List purchase orders for GRN by vendor ID via microservice
   * ค้นหาใบสั่งซื้อสำหรับ GRN ตาม vendor ID ผ่านไมโครเซอร์วิส
   * @param vendor_id - Vendor ID / รหัสผู้ขาย
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated PO list filtered by vendor / รายการ PO ที่กรองตาม vendor
   */
  async findAllForGrnByVendorId(
    vendor_id: string,
    user_id: string,
    bu_code: string,
    paginate: IPaginate,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findAllForGrnByVendorId', vendor_id, version },
      PurchaseOrderService.name,
    );

    const response = await firstValueFrom(
      this.procurementService.send(
      { cmd: 'purchase-order.find-all-for-grn-by-vendor', service: 'purchase-order' },
      { vendor_id, user_id, bu_code, paginate, version, ...getGatewayRequestContext() },
    ),
    );

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  /**
   * Find all purchase orders with pagination via microservice
   * ค้นหารายการทั้งหมดของใบสั่งซื้อพร้อมการแบ่งหน้าผ่านไมโครเซอร์วิส
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated purchase order list / รายการใบสั่งซื้อแบบแบ่งหน้า
   */
  async findAll(
    user_id: string,
    bu_code: string,
    paginate: IPaginate,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'findAll',
        user_id,
        bu_code,
        paginate,
        version,
      },
      PurchaseOrderService.name,
    );

    const response = await firstValueFrom(
      this.procurementService.send(
      { cmd: 'purchase-order.find-all', service: 'purchase-order' },
      { user_id, bu_code, paginate, version, ...getGatewayRequestContext() },
    ),
    );

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok({ data: response.data, paginate: response.paginate });
  }

  /**
   * Create a new purchase order via microservice
   * สร้างใบสั่งซื้อใหม่ผ่านไมโครเซอร์วิส
   * @param createDto - Purchase order creation data / ข้อมูลสำหรับสร้างใบสั่งซื้อ
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Created purchase order / ใบสั่งซื้อที่สร้างแล้ว
   */
  async create(
    createDto: Record<string, unknown>,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      PurchaseOrderService.name,
    );

    const response = await firstValueFrom(
      this.procurementService.send(
      { cmd: 'purchase-order.create', service: 'purchase-order' },
      { data: createDto, user_id, bu_code, version, ...getGatewayRequestContext() },
    ),
    );

    if (response.response.status !== HttpStatus.CREATED) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  /**
   * Update a purchase order via microservice
   * อัปเดตใบสั่งซื้อผ่านไมโครเซอร์วิส
   * @param id - Purchase order ID / รหัสใบสั่งซื้อ
   * @param updateDto - Updated purchase order data / ข้อมูลใบสั่งซื้อที่อัปเดต
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Updated purchase order / ใบสั่งซื้อที่อัปเดตแล้ว
   */
  async update(
    id: string,
    updateDto: PurchaseOrderUpdateDto,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateDto,
        version,
      },
      PurchaseOrderService.name,
    );

    const response = await firstValueFrom(
      this.procurementService.send(
      { cmd: 'purchase-order.update', service: 'purchase-order' },
      { data: { id, ...updateDto }, user_id, bu_code, version, ...getGatewayRequestContext() },
    ),
    );

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  /**
   * Delete a purchase order via microservice
   * ลบใบสั่งซื้อผ่านไมโครเซอร์วิส
   * @param id - Purchase order ID / รหัสใบสั่งซื้อ
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  async delete(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'delete',
        id,
        version,
      },
      PurchaseOrderService.name,
    );

    const response = await firstValueFrom(
      this.procurementService.send(
      { cmd: 'purchase-order.delete', service: 'purchase-order' },
      { data: id, user_id, bu_code, version, ...getGatewayRequestContext() },
    ),
    );

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  /**
   * Group purchase request items for purchase order creation preview
   * จัดกลุ่มรายการใบขอซื้อเพื่อแสดงตัวอย่างการสร้างใบสั่งซื้อ
   * @param pr_ids - Purchase request IDs / รหัสใบขอซื้อ
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Grouped purchase order preview / ตัวอย่างใบสั่งซื้อที่จัดกลุ่มแล้ว
   */
  async groupPrForPo(
    pr_ids: string[],
    user_id: string,
    bu_code: string,
    version: string,
    workflow_id?: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'groupPrForPo',
        pr_ids,
        workflow_id,
        version,
      },
      PurchaseOrderService.name,
    );

    const response = await firstValueFrom(
      this.procurementService.send(
      { cmd: 'purchase-order.group-pr', service: 'purchase-order' },
      { data: { pr_ids, workflow_id }, user_id, bu_code, version, ...getGatewayRequestContext() },
    ),
    );

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  /**
   * Confirm purchase requests and create purchase orders
   * ยืนยันใบขอซื้อและสร้างใบสั่งซื้อ
   * @param pr_ids - Purchase request IDs / รหัสใบขอซื้อ
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Created purchase orders / ใบสั่งซื้อที่สร้างจากใบขอซื้อ
   */
  async confirmPrToPo(
    pr_ids: string[],
    user_id: string,
    bu_code: string,
    version: string,
    workflow_id?: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'confirmPrToPo',
        pr_ids,
        workflow_id,
        version,
      },
      PurchaseOrderService.name,
    );

    const response = await firstValueFrom(
      this.procurementService.send(
      { cmd: 'purchase-order.confirm-pr', service: 'purchase-order' },
      { data: { pr_ids, workflow_id }, user_id, bu_code, version, ...getGatewayRequestContext() },
    ),
    );

    if (response.response.status !== HttpStatus.CREATED) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  /**
   * Cancel a purchase order via microservice
   * ยกเลิกใบสั่งซื้อผ่านไมโครเซอร์วิส
   * @param id - Purchase order ID / รหัสใบสั่งซื้อ
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Cancelled purchase order / ใบสั่งซื้อที่ยกเลิกแล้ว
   */
  async cancel(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'cancel',
        id,
        version,
      },
      PurchaseOrderService.name,
    );

    const response = await firstValueFrom(
      this.procurementService.send(
      { cmd: 'purchase-order.cancel', service: 'purchase-order' },
      { id, user_id, bu_code, version, ...getGatewayRequestContext() },
    ),
    );

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  /**
   * Close a purchase order via microservice
   * ปิดใบสั่งซื้อผ่านไมโครเซอร์วิส
   * @param id - Purchase order ID / รหัสใบสั่งซื้อ
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Closed purchase order / ใบสั่งซื้อที่ปิดแล้ว
   */
  async closePO(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'closePO',
        id,
        version,
      },
      PurchaseOrderService.name,
    );

    const response = await firstValueFrom(
      this.procurementService.send(
      { cmd: 'purchase-order.close', service: 'purchase-order' },
      { id, user_id, bu_code, version, ...getGatewayRequestContext() },
    ),
    );

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  /**
   * Export a purchase order to Excel via microservice
   * ส่งออกใบสั่งซื้อเป็นไฟล์ Excel ผ่านไมโครเซอร์วิส
   * @param id - Purchase order ID / รหัสใบสั่งซื้อ
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Excel file buffer and filename / บัฟเฟอร์ไฟล์ Excel และชื่อไฟล์
   */
  async exportToExcel(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<{ buffer: Buffer; filename: string }>> {
    this.logger.debug(
      {
        function: 'exportToExcel',
        id,
        version,
      },
      PurchaseOrderService.name,
    );

    const response = await firstValueFrom(
      this.procurementService.send(
      { cmd: 'purchase-order.export', service: 'purchase-order' },
      { id, user_id, bu_code, version, ...getGatewayRequestContext() },
    ),
    );

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    // Convert the buffer data back to Buffer if it was serialized
    const data = response.data;
    if (data && data.buffer && data.buffer.type === 'Buffer') {
      data.buffer = Buffer.from(data.buffer.data);
    }

    return Result.ok(data);
  }

  /**
   * Print a purchase order to PDF via microservice
   * พิมพ์ใบสั่งซื้อเป็นไฟล์ PDF ผ่านไมโครเซอร์วิส
   * @param id - Purchase order ID / รหัสใบสั่งซื้อ
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns PDF file buffer and filename / บัฟเฟอร์ไฟล์ PDF และชื่อไฟล์
   */
  async printToPdf(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<{ buffer: Buffer; filename: string }>> {
    this.logger.debug(
      {
        function: 'printToPdf',
        id,
        version,
      },
      PurchaseOrderService.name,
    );

    const response = await firstValueFrom(
      this.procurementService.send(
      { cmd: 'purchase-order.print', service: 'purchase-order' },
      { id, user_id, bu_code, version, ...getGatewayRequestContext() },
    ),
    );

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    // Convert the buffer data back to Buffer if it was serialized
    const data = response.data;
    if (data && data.buffer && data.buffer.type === 'Buffer') {
      data.buffer = Buffer.from(data.buffer.data);
    }

    return Result.ok(data);
  }

  /**
   * Save incremental changes to a purchase order via microservice
   * บันทึกการเปลี่ยนแปลงใบสั่งซื้อผ่านไมโครเซอร์วิส
   * @param id - Purchase order ID / รหัสใบสั่งซื้อ
   * @param data - Save payload / ข้อมูลการบันทึก
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Saved purchase order / ใบสั่งซื้อที่บันทึกแล้ว
   */
  async save(
    id: string,
    data: SavePurchaseOrderDto,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'save',
        id,
        version,
      },
      PurchaseOrderService.name,
    );

    const response = await firstValueFrom(
      this.procurementService.send(
      { cmd: 'purchase-order.save', service: 'purchase-order' },
      { id, data, user_id, bu_code, version, ...getGatewayRequestContext() },
    ),
    );

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  /**
   * Approve a purchase order via microservice
   * อนุมัติใบสั่งซื้อผ่านไมโครเซอร์วิส
   * @param id - Purchase order ID / รหัสใบสั่งซื้อ
   * @param data - Approval payload / ข้อมูลการอนุมัติ
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Approved purchase order / ใบสั่งซื้อที่อนุมัติแล้ว
   */
  async submit(
    id: string,
    payload: SubmitPurchaseOrderDto,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'submit', id, version },
      PurchaseOrderService.name,
    );

    const response = await firstValueFrom(
      this.procurementService.send(
      { cmd: 'purchase-order.submit', service: 'purchase-order' },
      { id, payload, user_id, bu_code, version, ...getGatewayRequestContext() },
    ),
    );

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  async approve(
    id: string,
    data: ApprovePurchaseOrderDto,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'approve',
        id,
        version,
      },
      PurchaseOrderService.name,
    );

    const response = await firstValueFrom(
      this.procurementService.send(
      { cmd: 'purchase-order.approve', service: 'purchase-order' },
      { id, data, user_id, bu_code, version, ...getGatewayRequestContext() },
    ),
    );

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  /**
   * Reject a purchase order via microservice
   * ปฏิเสธใบสั่งซื้อผ่านไมโครเซอร์วิส
   * @param id - Purchase order ID / รหัสใบสั่งซื้อ
   * @param data - Rejection payload / ข้อมูลการปฏิเสธ
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Rejected purchase order / ใบสั่งซื้อที่ถูกปฏิเสธ
   */
  async reject(
    id: string,
    data: RejectPurchaseOrderDto,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'reject',
        id,
        version,
      },
      PurchaseOrderService.name,
    );

    const response = await firstValueFrom(
      this.procurementService.send(
      { cmd: 'purchase-order.reject', service: 'purchase-order' },
      { id, data, user_id, bu_code, version, ...getGatewayRequestContext() },
    ),
    );

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  /**
   * Send a purchase order back for review via microservice
   * ส่งใบสั่งซื้อกลับเพื่อตรวจสอบผ่านไมโครเซอร์วิส
   * @param id - Purchase order ID / รหัสใบสั่งซื้อ
   * @param data - Review payload / ข้อมูลการตรวจสอบ
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Reviewed purchase order / ใบสั่งซื้อที่ส่งกลับตรวจสอบ
   */
  async review(
    id: string,
    data: ReviewPurchaseOrderDto,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'review',
        id,
        version,
      },
      PurchaseOrderService.name,
    );

    const response = await firstValueFrom(
      this.procurementService.send(
      { cmd: 'purchase-order.review', service: 'purchase-order' },
      { id, data, user_id, bu_code, version, ...getGatewayRequestContext() },
    ),
    );

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  // ==================== Purchase Order Detail CRUD ====================

  /**
   * Find a purchase order detail by ID via microservice
   * ค้นหารายการเดียวตาม ID ของรายละเอียดใบสั่งซื้อผ่านไมโครเซอร์วิส
   * @param detailId - Detail line item ID / รหัสรายการรายละเอียด
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Purchase order detail / รายละเอียดรายการใบสั่งซื้อ
   */
  async findDetailById(
    detailId: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findDetailById', detailId, version },
      PurchaseOrderService.name,
    );

    const response = await firstValueFrom(
      this.procurementService.send(
      { cmd: 'purchase-order-detail.find-by-id', service: 'purchase-order' },
      { detail_id: detailId, user_id, bu_code, version, ...getGatewayRequestContext() },
    ),
    );

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  /**
   * Find all details for a purchase order via microservice
   * ค้นหารายการทั้งหมดของรายละเอียดใบสั่งซื้อผ่านไมโครเซอร์วิส
   * @param purchaseOrderId - Purchase order ID / รหัสใบสั่งซื้อ
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns List of purchase order details / รายการรายละเอียดใบสั่งซื้อ
   */
  async findDetailsByPurchaseOrderId(
    purchaseOrderId: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findDetailsByPurchaseOrderId', purchaseOrderId, version },
      PurchaseOrderService.name,
    );

    const response = await firstValueFrom(
      this.procurementService.send(
      { cmd: 'purchase-order-detail.find-all', service: 'purchase-order' },
      { purchase_order_id: purchaseOrderId, user_id, bu_code, version, ...getGatewayRequestContext() },
    ),
    );

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  /**
   * Delete a purchase order detail via microservice
   * ลบรายละเอียดใบสั่งซื้อผ่านไมโครเซอร์วิส
   * @param detailId - Detail line item ID / รหัสรายการรายละเอียด
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  async deleteDetail(
    detailId: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'deleteDetail', detailId, version },
      PurchaseOrderService.name,
    );

    const response = await firstValueFrom(
      this.procurementService.send(
      { cmd: 'purchase-order-detail.delete', service: 'purchase-order' },
      { detail_id: detailId, user_id, bu_code, version, ...getGatewayRequestContext() },
    ),
    );

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  /**
   * Get previous workflow stages for a purchase order
   * ดึงขั้นตอนอนุมัติก่อนหน้าของใบสั่งซื้อ
   */
  async getPreviousStages(
    po_id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'getPreviousStages', po_id, user_id, bu_code, version },
      PurchaseOrderService.name,
    );

    const response = await firstValueFrom(
      this.procurementService.send(
      { cmd: 'purchase-order.get-previous-stages', service: 'purchase-order' },
      { po_id, user_id, bu_code, version, ...getGatewayRequestContext() },
    ),
    );

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  async findAllWorkflowStagesByPo(
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findAllWorkflowStagesByPo', user_id, bu_code, version },
      PurchaseOrderService.name,
    );

    const response = await firstValueFrom(
      this.procurementService.send(
      {
          cmd: 'purchase-order.find-all-workflow-stages-by-po',
          service: 'purchase-order',
        },
      { user_id, bu_code, version, ...getGatewayRequestContext() },
    ),
    );

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  /**
   * Print a purchase order via FastReport viewer (micro-report)
   * พิมพ์ใบสั่งซื้อผ่าน FastReport viewer (micro-report)
   */
  async printToReport(
    id: string,
    user_id: string,
    bu_code: string,
  ): Promise<Result<{ viewer_url: string }>> {
    this.logger.debug(
      { function: 'printToReport', id },
      PurchaseOrderService.name,
    );

    const response = await firstValueFrom(
      this.procurementService.send(
        { cmd: 'purchase-order.printToReport', service: 'purchase-order' },
        { id, user_id, bu_code, ...getGatewayRequestContext() },
      ),
    );

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }
}
