import { HttpStatus, Injectable } from '@nestjs/common';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { Observable } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { Result, MicroserviceResponse } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { randomInt } from 'crypto';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class PhysicalCountService {
  private readonly logger: BackendLogger = new BackendLogger(
    PhysicalCountService.name,
  );
  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly inventoryService: ClientProxy,
  ) {}

  /**
   * Find a physical count by ID via microservice
   * ค้นหารายการตรวจนับสินค้าเดียวตาม ID ผ่านไมโครเซอร์วิส
   * @param id - Physical count ID / รหัสการตรวจนับสินค้า
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param tenant_id - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Physical count details / รายละเอียดการตรวจนับสินค้า
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
      PhysicalCountService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'physical-count.findOne', service: 'physical-count' },
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
   * Find all physical counts with pagination via microservice
   * ค้นหารายการตรวจนับสินค้าทั้งหมดพร้อมการแบ่งหน้าผ่านไมโครเซอร์วิส
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param tenant_id - Business unit code / รหัสหน่วยธุรกิจ
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated physical count list / รายการตรวจนับสินค้าแบบแบ่งหน้า
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
      PhysicalCountService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'physical-count.findAll', service: 'physical-count' },
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
   * Create a new physical count via microservice
   * สร้างรายการตรวจนับสินค้าใหม่ผ่านไมโครเซอร์วิส
   * @param data - Physical count creation data / ข้อมูลสำหรับสร้างการตรวจนับสินค้า
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param tenant_id - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Created physical count / การตรวจนับสินค้าที่สร้างขึ้น
   */
  async create(
    data: Record<string, unknown>,
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
      PhysicalCountService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'physical-count.create', service: 'physical-count' },
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
   * Update an existing physical count via microservice
   * อัปเดตรายการตรวจนับสินค้าที่มีอยู่ผ่านไมโครเซอร์วิส
   * @param id - Physical count ID / รหัสการตรวจนับสินค้า
   * @param data - Fields to update / ข้อมูลที่ต้องการอัปเดต
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param tenant_id - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Updated physical count / การตรวจนับสินค้าที่อัปเดตแล้ว
   */
  async update(
    id: string,
    data: Record<string, unknown>,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'update',
        id,
        data,
        user_id,
        tenant_id,
        version,
      },
      PhysicalCountService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'physical-count.update', service: 'physical-count' },
      { id: id, data: data, user_id: user_id, tenant_id: tenant_id, version: version, ...getGatewayRequestContext() },
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
   * Delete a physical count by ID via microservice
   * ลบรายการตรวจนับสินค้าตาม ID ผ่านไมโครเซอร์วิส
   * @param id - Physical count ID / รหัสการตรวจนับสินค้า
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
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
      PhysicalCountService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'physical-count.delete', service: 'physical-count' },
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
   * Refresh product list for a physical count via microservice
   * รีเฟรชรายการสินค้าในการตรวจนับสินค้าผ่านไมโครเซอร์วิส
   * @param id - Physical count ID / รหัสการตรวจนับสินค้า
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param tenant_id - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Refreshed physical count with details / การตรวจนับสินค้าที่รีเฟรชแล้วพร้อมรายละเอียด
   */
  async refresh(
    id: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'refresh', id, user_id, tenant_id, version },
      PhysicalCountService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'physical-count.refresh', service: 'physical-count' },
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

  // ==================== Physical Count Detail CRUD ====================

  /**
   * Find a physical count detail by ID via microservice
   * ค้นหารายละเอียดการตรวจนับสินค้าเดียวตาม ID ผ่านไมโครเซอร์วิส
   * @param detailId - Physical count detail ID / รหัสรายละเอียดการตรวจนับ
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param tenant_id - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Physical count detail / รายละเอียดการตรวจนับสินค้า
   */
  async findDetailById(
    detailId: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findDetailById', detailId, user_id, tenant_id, version },
      PhysicalCountService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'physical-count-detail.find-by-id', service: 'physical-count' },
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
   * Find all details for a physical count via microservice
   * ค้นหารายละเอียดทั้งหมดของการตรวจนับสินค้าผ่านไมโครเซอร์วิส
   * @param physicalCountId - Physical count ID / รหัสการตรวจนับสินค้า
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param tenant_id - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Physical count detail items / รายการรายละเอียดการตรวจนับสินค้า
   */
  async findDetailsByPhysicalCountId(
    physicalCountId: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findDetailsByPhysicalCountId', physicalCountId, user_id, tenant_id, version },
      PhysicalCountService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'physical-count-detail.find-all', service: 'physical-count' },
      { physical_count_id: physicalCountId, user_id, tenant_id, version, ...getGatewayRequestContext() },
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
   * Delete a physical count detail item via microservice
   * ลบรายละเอียดการตรวจนับสินค้าผ่านไมโครเซอร์วิส
   * @param detailId - Physical count detail ID / รหัสรายละเอียดการตรวจนับ
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
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
      PhysicalCountService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'physical-count-detail.delete', service: 'physical-count' },
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

  // ==================== Mobile-specific endpoints ====================

  /**
   * Save counted item quantities as draft via microservice
   * บันทึกจำนวนสินค้าที่นับได้เป็นร่างผ่านไมโครเซอร์วิส
   * @param id - Physical count ID / รหัสการตรวจนับสินค้า
   * @param data - Items with actual quantities / รายการสินค้าพร้อมจำนวนจริง
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param tenant_id - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Save result / ผลลัพธ์การบันทึก
   */
  async saveItems(
    id: string,
    data: { items: Array<{ id: string; actual_qty: number }> },
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'saveItems', id, data, user_id, tenant_id, version },
      PhysicalCountService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'physical-count.save-items', service: 'physical-count' },
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
   * Calculate variances between actual and system quantities via microservice
   * คำนวณผลต่างระหว่างจำนวนจริงกับจำนวนในระบบผ่านไมโครเซอร์วิส
   * @param id - Physical count ID / รหัสการตรวจนับสินค้า
   * @param data - Items with actual quantities / รายการสินค้าพร้อมจำนวนจริง
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param tenant_id - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Variance review result / ผลลัพธ์การตรวจสอบผลต่าง
   */
  async reviewItems(
    id: string,
    data: { items: Array<{ id: string; actual_qty: number }> },
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'reviewItems', id, data, user_id, tenant_id, version },
      PhysicalCountService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'physical-count.review-items', service: 'physical-count' },
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
   * Get the variance report for a physical count via microservice
   * ดึงรายงานผลต่างของการตรวจนับสินค้าผ่านไมโครเซอร์วิส
   * @param id - Physical count ID / รหัสการตรวจนับสินค้า
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param tenant_id - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Variance report / รายงานผลต่าง
   */
  async getReview(
    id: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'getReview', id, user_id, tenant_id, version },
      PhysicalCountService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'physical-count.get-review', service: 'physical-count' },
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
   * Submit a physical count and trigger inventory adjustments via microservice
   * ส่งการตรวจนับสินค้าและสร้างรายการปรับปรุงสินค้าคงคลังผ่านไมโครเซอร์วิส
   * @param id - Physical count ID / รหัสการตรวจนับสินค้า
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param tenant_id - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Submission result / ผลลัพธ์การส่ง
   */
  async submit(
    id: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'submit', id, user_id, tenant_id, version },
      PhysicalCountService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'physical-count.submit', service: 'physical-count' },
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
   * Add a comment to a physical count detail via microservice
   * เพิ่มความคิดเห็นในรายละเอียดการตรวจนับสินค้าผ่านไมโครเซอร์วิส
   * @param detailId - Physical count detail ID / รหัสรายละเอียดการตรวจนับ
   * @param data - Comment content / เนื้อหาความคิดเห็น
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param tenant_id - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Created comment / ความคิดเห็นที่สร้างขึ้น
   */
  async createComment(
    detailId: string,
    data: { comment: string },
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'createComment', detailId, data, user_id, tenant_id, version },
      PhysicalCountService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'physical-count-detail.create-comment', service: 'physical-count' },
      { detail_id: detailId, data, user_id, tenant_id, version, ...getGatewayRequestContext() },
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
   * Get the count of pending physical counts for the current user
   * ดึงจำนวนการตรวจนับสินค้าที่รอดำเนินการของผู้ใช้ปัจจุบัน
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param version - API version / เวอร์ชัน API
   * @returns Pending count number / จำนวนที่รอดำเนินการ
   */
   async findAllPendingPhysicalCountCount(
    user_id: string,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'findAllPendingPhysicalCountCount',
        version,
        user_id,
      },
      PhysicalCountService.name,
    );

    // const res: Observable<MicroserviceResponse> = this.inventoryService.send(
    //   { cmd: 'physical-count.find-all.count', service: 'physical-count' },
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
        function: 'findAllPendingPhysicalCountCount',
        version,
        user_id,
        response,
      },
      PhysicalCountService.name,
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
   * Print a physical count via FastReport viewer (micro-report)
   * พิมพ์ใบนับสินค้าผ่าน FastReport viewer (micro-report)
   */
  async printToReport(
    id: string,
    user_id: string,
    bu_code: string,
  ): Promise<Result<{ viewer_url: string }>> {
    this.logger.debug(
      { function: 'printToReport', id },
      PhysicalCountService.name,
    );

    const response = await firstValueFrom(
      this.inventoryService.send(
        { cmd: 'physical-count.printToReport', service: 'physical-count' },
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
