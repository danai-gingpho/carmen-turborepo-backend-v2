import { HttpStatus, Injectable } from '@nestjs/common';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { Observable } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import {
  IGoodReceivedNoteCreate,
  IGoodReceivedNoteUpdate,
  Result,
  MicroserviceResponse,
} from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { randomInt } from 'crypto';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class GoodReceivedNoteService {
  private readonly logger: BackendLogger = new BackendLogger(
    GoodReceivedNoteService.name,
  );
  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly inventoryService: ClientProxy,
  ) {}

  /**
   * Find a Good Received Note by ID via microservice
   * ค้นหารายการเดียวตาม ID ของใบรับสินค้าผ่านไมโครเซอร์วิส
   * @param id - Good Received Note ID / รหัสใบรับสินค้า
   * @param user_id - User ID / รหัสผู้ใช้
   * @param tenant_id - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Good Received Note data / ข้อมูลใบรับสินค้า
   */
  async findOne(
    id: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        user_id,
        tenant_id,
        version,
      },
      GoodReceivedNoteService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'good-received-note.findOne', service: 'good-received-note' },
      { id: id, user_id: user_id, tenant_id: tenant_id, version: version, ...getGatewayRequestContext() },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  /**
   * Find all Good Received Notes with pagination via microservice
   * ค้นหารายการทั้งหมดของใบรับสินค้าพร้อมการแบ่งหน้าผ่านไมโครเซอร์วิส
   * @param user_id - User ID / รหัสผู้ใช้
   * @param tenant_id - Business unit code / รหัสหน่วยธุรกิจ
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated GRN list / รายการใบรับสินค้าแบบแบ่งหน้า
   */
  async findAll(
    user_id: string,
    tenant_id: string,
    paginate: IPaginate,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'findAll',
        user_id,
        tenant_id,
        paginate,
        version,
      },
      GoodReceivedNoteService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'good-received-note.findAll', service: 'good-received-note' },
      {
        user_id: user_id,
        tenant_id: tenant_id,
        paginate: paginate,
        version: version, ...getGatewayRequestContext() },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok({ data: response.data, paginate: response.paginate });
  }

  /**
   * Create a new Good Received Note via microservice
   * สร้างใบรับสินค้าใหม่ผ่านไมโครเซอร์วิส
   * @param data - GRN creation data / ข้อมูลสำหรับสร้างใบรับสินค้า
   * @param user_id - User ID / รหัสผู้ใช้
   * @param tenant_id - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Created Good Received Note / ใบรับสินค้าที่สร้างแล้ว
   */
  async findByVendorId(
    vendor_id: string,
    user_id: string,
    tenant_id: string,
    paginate: IPaginate,
    version: string,
  ): Promise<Result<unknown>> {
    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'good-received-note.findByVendorId', service: 'good-received-note' },
      { vendor_id, user_id, tenant_id, paginate, version, ...getGatewayRequestContext() },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok({ data: response.data, paginate: response.paginate });
  }

  /**
   * Find Good Received Notes by vendor filtered for Credit Note selection via microservice
   * ค้นหาใบรับสินค้าของผู้ขายสำหรับใช้เลือกตอนสร้างใบลดหนี้ผ่านไมโครเซอร์วิส
   * @param vendor_id - Vendor ID / รหัสผู้ขาย
   * @param user_id - User ID / รหัสผู้ใช้
   * @param tenant_id - Business unit code / รหัสหน่วยธุรกิจ
   * @param paginate - Pagination/filter/sort options / ตัวเลือกการแบ่งหน้า กรอง และเรียงลำดับ
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated list of GRNs with doc_status in (saved, committed) / รายการใบรับสินค้าที่สถานะเป็น saved หรือ committed แบบแบ่งหน้า
   */
  async findByVendorIdForCn(
    vendor_id: string,
    user_id: string,
    tenant_id: string,
    paginate: IPaginate,
    version: string,
  ): Promise<Result<unknown>> {
    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'good-received-note.findByVendorIdForCn', service: 'good-received-note' },
      { vendor_id, user_id, tenant_id, paginate, version, ...getGatewayRequestContext() },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok({ data: response.data, paginate: response.paginate });
  }

  async create(
    data: IGoodReceivedNoteCreate,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'create',
        data,
        user_id,
        tenant_id,
        version,
      },
      GoodReceivedNoteService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'good-received-note.create', service: 'good-received-note' },
      { data: data, user_id: user_id, tenant_id: tenant_id, version: version, ...getGatewayRequestContext() },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.CREATED) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  /**
   * Update a Good Received Note via microservice
   * อัปเดตใบรับสินค้าผ่านไมโครเซอร์วิส
   * @param data - Updated GRN data / ข้อมูลใบรับสินค้าที่อัปเดต
   * @param user_id - User ID / รหัสผู้ใช้
   * @param tenant_id - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Updated Good Received Note / ใบรับสินค้าที่อัปเดตแล้ว
   */
  async update(
    data: IGoodReceivedNoteUpdate,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'update',
        data,
        user_id,
        tenant_id,
        version,
      },
      GoodReceivedNoteService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'good-received-note.update', service: 'good-received-note' },
      { updateGoodReceivedNoteDto: data, user_id: user_id, tenant_id: tenant_id, version: version, ...getGatewayRequestContext() },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  /**
   * Delete a Good Received Note via microservice
   * ลบใบรับสินค้าผ่านไมโครเซอร์วิส
   * @param id - Good Received Note ID / รหัสใบรับสินค้า
   * @param user_id - User ID / รหัสผู้ใช้
   * @param tenant_id - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  async delete(
    id: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'delete',
        id,
        user_id,
        tenant_id,
        version,
      },
      GoodReceivedNoteService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'good-received-note.delete', service: 'good-received-note' },
      { id: id, user_id: user_id, tenant_id: tenant_id, version: version, ...getGatewayRequestContext() },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  /**
   * Void a Good Received Note via microservice
   * ยกเลิกใบรับสินค้าผ่านไมโครเซอร์วิส
   */
  async voidGrn(
    id: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'voidGrn', id, user_id, tenant_id, version },
      GoodReceivedNoteService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'good-received-note.void', service: 'good-received-note' },
      { id, user_id, tenant_id, version, ...getGatewayRequestContext() },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  /**
   * Export a Good Received Note to Excel via microservice
   * ส่งออกใบรับสินค้าเป็นไฟล์ Excel ผ่านไมโครเซอร์วิส
   * @param id - Good Received Note ID / รหัสใบรับสินค้า
   * @param user_id - User ID / รหัสผู้ใช้
   * @param tenant_id - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Excel file buffer and filename / บัฟเฟอร์ไฟล์ Excel และชื่อไฟล์
   */
  async exportToExcel(
    id: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<{ buffer: Buffer; filename: string }>> {
    this.logger.debug(
      {
        function: 'exportToExcel',
        id,
        user_id,
        tenant_id,
        version,
      },
      GoodReceivedNoteService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'good-received-note.export', service: 'good-received-note' },
      { id, user_id, tenant_id, version, ...getGatewayRequestContext() },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    // Convert the buffer data back to Buffer if it was serialized
    const data = response.data as any;
    if (data && data.buffer && data.buffer.type === 'Buffer') {
      data.buffer = Buffer.from(data.buffer.data);
    }

    return Result.ok(data);
  }

  /**
   * Reject a Good Received Note via microservice
   * ปฏิเสธใบรับสินค้าผ่านไมโครเซอร์วิส
   * @param id - Good Received Note ID / รหัสใบรับสินค้า
   * @param reason - Rejection reason / เหตุผลในการปฏิเสธ
   * @param user_id - User ID / รหัสผู้ใช้
   * @param tenant_id - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Rejected Good Received Note / ใบรับสินค้าที่ถูกปฏิเสธ
   */
  async reject(
    id: string,
    reason: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'reject',
        id,
        reason,
        user_id,
        tenant_id,
        version,
      },
      GoodReceivedNoteService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'good-received-note.reject', service: 'good-received-note' },
      { id, reason, user_id, tenant_id, version, ...getGatewayRequestContext() },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  /**
   * Approve a Good Received Note via microservice
   * อนุมัติใบรับสินค้าผ่านไมโครเซอร์วิส
   * @param id - Good Received Note ID / รหัสใบรับสินค้า
   * @param user_id - User ID / รหัสผู้ใช้
   * @param tenant_id - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Approved Good Received Note / ใบรับสินค้าที่อนุมัติแล้ว
   */
  async approve(
    id: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'approve',
        id,
        user_id,
        tenant_id,
        version,
      },
      GoodReceivedNoteService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'good-received-note.approve', service: 'good-received-note' },
      { id, user_id, tenant_id, version, ...getGatewayRequestContext() },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  // ==================== Good Received Note Detail CRUD ====================

  /**
   * Find a GRN detail by ID via microservice
   * ค้นหารายการเดียวตาม ID ของรายละเอียดใบรับสินค้าผ่านไมโครเซอร์วิส
   * @param detailId - GRN detail ID / รหัสรายละเอียดใบรับสินค้า
   * @param user_id - User ID / รหัสผู้ใช้
   * @param tenant_id - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns GRN detail data / ข้อมูลรายละเอียดใบรับสินค้า
   */
  async findDetailById(
    detailId: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findDetailById', detailId, user_id, tenant_id, version },
      GoodReceivedNoteService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'good-received-note-detail.find-by-id', service: 'good-received-note' },
      { detail_id: detailId, user_id, tenant_id, version, ...getGatewayRequestContext() },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  /**
   * Find all details for a Good Received Note via microservice
   * ค้นหารายการทั้งหมดของรายละเอียดใบรับสินค้าผ่านไมโครเซอร์วิส
   * @param grnId - Good Received Note ID / รหัสใบรับสินค้า
   * @param user_id - User ID / รหัสผู้ใช้
   * @param tenant_id - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns List of GRN details / รายการรายละเอียดใบรับสินค้า
   */
  async findDetailsByGrnId(
    grnId: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findDetailsByGrnId', grnId, user_id, tenant_id, version },
      GoodReceivedNoteService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'good-received-note-detail.find-all', service: 'good-received-note' },
      { grn_id: grnId, user_id, tenant_id, version, ...getGatewayRequestContext() },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  /**
   * Delete a GRN detail via microservice
   * ลบรายละเอียดใบรับสินค้าผ่านไมโครเซอร์วิส
   * @param detailId - GRN detail ID / รหัสรายละเอียดใบรับสินค้า
   * @param user_id - User ID / รหัสผู้ใช้
   * @param tenant_id - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  async deleteDetail(
    detailId: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'deleteDetail', detailId, user_id, tenant_id, version },
      GoodReceivedNoteService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'good-received-note-detail.delete', service: 'good-received-note' },
      { detail_id: detailId, user_id, tenant_id, version, ...getGatewayRequestContext() },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  // ==================== Sub-resource list endpoints (products/locations in a GRN) ====================

  /**
   * List distinct products in a GRN via microservice
   * ค้นหาสินค้าแบบไม่ซ้ำในใบรับสินค้าผ่านไมโครเซอร์วิส
   */
  async findProductsByGrnId(
    grnId: string,
    user_id: string,
    tenant_id: string,
    paginate: IPaginate,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findProductsByGrnId', grnId, user_id, tenant_id, paginate, version },
      GoodReceivedNoteService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'good-received-note.findProductsByGrnId', service: 'good-received-note' },
      { grn_id: grnId, user_id, tenant_id, paginate, version, ...getGatewayRequestContext() },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok({ data: response.data, paginate: response.paginate });
  }

  /**
   * List locations for a specific product in a GRN via microservice
   * ค้นหาตำแหน่งจัดเก็บของสินค้าหนึ่งในใบรับสินค้าผ่านไมโครเซอร์วิส
   */
  async findLocationsByGrnIdAndProductId(
    grnId: string,
    productId: string,
    user_id: string,
    tenant_id: string,
    paginate: IPaginate,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findLocationsByGrnIdAndProductId', grnId, productId, user_id, tenant_id, paginate, version },
      GoodReceivedNoteService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'good-received-note.findLocationsByGrnIdAndProductId', service: 'good-received-note' },
      { grn_id: grnId, product_id: productId, user_id, tenant_id, paginate, version, ...getGatewayRequestContext() },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok({ data: response.data, paginate: response.paginate });
  }

  /**
   * List distinct locations in a GRN via microservice
   * ค้นหาตำแหน่งจัดเก็บแบบไม่ซ้ำในใบรับสินค้าผ่านไมโครเซอร์วิส
   */
  async findLocationsByGrnId(
    grnId: string,
    user_id: string,
    tenant_id: string,
    paginate: IPaginate,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findLocationsByGrnId', grnId, user_id, tenant_id, paginate, version },
      GoodReceivedNoteService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'good-received-note.findLocationsByGrnId', service: 'good-received-note' },
      { grn_id: grnId, user_id, tenant_id, paginate, version, ...getGatewayRequestContext() },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok({ data: response.data, paginate: response.paginate });
  }

  /**
   * List products at a specific location in a GRN via microservice
   * ค้นหาสินค้าที่อยู่ในตำแหน่งจัดเก็บหนึ่งในใบรับสินค้าผ่านไมโครเซอร์วิส
   */
  async findProductsByGrnIdAndLocationId(
    grnId: string,
    locationId: string,
    user_id: string,
    tenant_id: string,
    paginate: IPaginate,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findProductsByGrnIdAndLocationId', grnId, locationId, user_id, tenant_id, paginate, version },
      GoodReceivedNoteService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'good-received-note.findProductsByGrnIdAndLocationId', service: 'good-received-note' },
      { grn_id: grnId, location_id: locationId, user_id, tenant_id, paginate, version, ...getGatewayRequestContext() },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok({ data: response.data, paginate: response.paginate });
  }

  // ==================== Mobile-specific endpoints ====================

  /**
   * Find a GRN by manual PO number via microservice
   * ค้นหาใบรับสินค้าตามเลขที่ใบสั่งซื้อผ่านไมโครเซอร์วิส
   * @param po_no - Purchase order number / เลขที่ใบสั่งซื้อ
   * @param user_id - User ID / รหัสผู้ใช้
   * @param tenant_id - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Good Received Note data / ข้อมูลใบรับสินค้า
   */
  async findByManualPO(
    po_no: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findByManualPO', po_no, user_id, tenant_id, version },
      GoodReceivedNoteService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'good-received-note.find-by-manual-po', service: 'good-received-note' },
      { po_no, user_id, tenant_id, version, ...getGatewayRequestContext() },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  /**
   * Save a Good Received Note via microservice — creates inventory transactions and updates PO
   * บันทึกใบรับสินค้าผ่านไมโครเซอร์วิส — สร้าง inventory transactions และอัปเดต PO
   */
  async save(
    id: string,
    data: Record<string, unknown>,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'save', id, data, user_id, tenant_id, version },
      GoodReceivedNoteService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'good-received-note.save', service: 'good-received-note' },
      { id, data, user_id, tenant_id, version, ...getGatewayRequestContext() },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  /**
   * Commit a Good Received Note via microservice — changes status from saved to committed
   * ยืนยันใบรับสินค้าผ่านไมโครเซอร์วิส — เปลี่ยนสถานะจาก saved เป็น committed
   */
  async commit(
    id: string,
    data: Record<string, unknown>,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'commit', id, data, user_id, tenant_id, version },
      GoodReceivedNoteService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'good-received-note.commit', service: 'good-received-note' },
      { id, data, user_id, tenant_id, version, ...getGatewayRequestContext() },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  /**
   * Get pending Good Received Notes count via microservice
   * ค้นหาจำนวนใบรับสินค้าที่รอดำเนินการผ่านไมโครเซอร์วิส
   * @param user_id - User ID / รหัสผู้ใช้
   * @param version - API version / เวอร์ชัน API
   * @returns Pending GRN count / จำนวนใบรับสินค้าที่รอดำเนินการ
   */
  async findAllPendingGoodReceivedNoteCount(
    user_id: string,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'findAllPendingGoodReceivedNoteCount',
        version,
        user_id,
      },
      GoodReceivedNoteService.name,
    );

    // const res: Observable<MicroserviceResponse> = this.inventoryService.send(
    //   { cmd: 'good-received-note.find-all.count', service: 'good-received-note' },
    //   {
    //     user_id,
    //     version: version,
    //   },
    // );

    // const response = await firstValueFrom(res);

    // todo: implement the actual call to inventory service
    // mock response for testing purpose
    const response = {
      data: {
        pending: randomInt(1, 100),
      },
      response: {
        status: HttpStatus.OK,
        message: 'Success',
      },
    };

    this.logger.debug(
      {
        function: 'findAllPendingGoodReceivedNoteCount',
        version,
        user_id,
        response,
      },
      GoodReceivedNoteService.name,
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
   * Regenerate denormalized totals on tb_good_received_note via microservice.
   * Pass id to scope to a single GRN; omit to recompute all non-deleted GRNs.
   */
  async regenerateTotals(
    user_id: string,
    tenant_id: string,
    id?: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'regenerateTotals', user_id, tenant_id, id },
      GoodReceivedNoteService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'good-received-note.regenerate-totals', service: 'good-received-note' },
      { user_id, tenant_id, id, ...getGatewayRequestContext() },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  /**
   * Print a goods received note via FastReport viewer (micro-report)
   * พิมพ์ใบรับสินค้าผ่าน FastReport viewer (micro-report)
   */
  async printToReport(
    id: string,
    user_id: string,
    bu_code: string,
  ): Promise<Result<{ viewer_url: string }>> {
    this.logger.debug(
      { function: 'printToReport', id },
      GoodReceivedNoteService.name,
    );

    const response = await firstValueFrom(
      this.inventoryService.send(
        { cmd: 'good-received-note.printToReport', service: 'good-received-note' },
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
