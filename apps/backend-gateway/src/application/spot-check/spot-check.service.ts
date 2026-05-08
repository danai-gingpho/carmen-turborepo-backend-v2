import { HttpStatus, Injectable } from '@nestjs/common';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { Observable } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { Result, MicroserviceResponse } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { ISpotCheckCreate, ISpotCheckUpdate } from 'src/common/dto/spot-check/spot-check.dto';


import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class SpotCheckService {
  private readonly logger: BackendLogger = new BackendLogger(
    SpotCheckService.name,
  );
  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly inventoryService: ClientProxy,
  ) {}

  /**
   * Get the count of pending spot checks for the current user
   * ดึงจำนวนการตรวจสอบแบบสุ่มที่รอดำเนินการของผู้ใช้ปัจจุบัน
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param version - API version / เวอร์ชัน API
   * @returns Pending count number / จำนวนที่รอดำเนินการ
   */
  async findAllPendingSpotCheckCount(
    user_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findAllPendingSpotCheckCount', version, user_id },
      SpotCheckService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'spot-check.find-all-pending-count', service: 'spot-check' },
      { user_id, version, ...getGatewayRequestContext() },
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
   * Find a spot check by ID via microservice
   * ค้นหาการตรวจสอบแบบสุ่มเดียวตาม ID ผ่านไมโครเซอร์วิส
   * @param id - Spot check ID / รหัสการตรวจสอบแบบสุ่ม
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param tenant_id - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Spot check details / รายละเอียดการตรวจสอบแบบสุ่ม
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
      SpotCheckService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'spot-check.findOne', service: 'spot-check' },
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
   * Find all spot checks with pagination via microservice
   * ค้นหารายการตรวจสอบแบบสุ่มทั้งหมดพร้อมการแบ่งหน้าผ่านไมโครเซอร์วิส
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param tenant_id - Business unit code / รหัสหน่วยธุรกิจ
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated spot check list / รายการตรวจสอบแบบสุ่มแบบแบ่งหน้า
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
      SpotCheckService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'spot-check.findAll', service: 'spot-check' },
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
   * Create a new spot check via microservice
   * สร้างการตรวจสอบแบบสุ่มใหม่ผ่านไมโครเซอร์วิส
   * @param data - Spot check creation data / ข้อมูลสำหรับสร้างการตรวจสอบแบบสุ่ม
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param tenant_id - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Created spot check / การตรวจสอบแบบสุ่มที่สร้างขึ้น
   */
  async create(
    data: ISpotCheckCreate,
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
      SpotCheckService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'spot-check.create', service: 'spot-check' },
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
   * Update a spot check via microservice
   * อัปเดตการตรวจสอบแบบสุ่มผ่านไมโครเซอร์วิส
   * @param id - Spot check ID / รหัสการตรวจสอบแบบสุ่ม
   * @param data - Fields to update / ข้อมูลที่ต้องการอัปเดต
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param tenant_id - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Updated spot check / การตรวจสอบแบบสุ่มที่อัปเดตแล้ว
   */
  async update(
    id: string,
    data: ISpotCheckUpdate,
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
      SpotCheckService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'spot-check.update', service: 'spot-check' },
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
   * Delete a spot check via microservice
   * ลบการตรวจสอบแบบสุ่มผ่านไมโครเซอร์วิส
   * @param id - Spot check ID / รหัสการตรวจสอบแบบสุ่ม
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
      SpotCheckService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'spot-check.delete', service: 'spot-check' },
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

  // ==================== Spot Check Detail CRUD ====================

  /**
   * Find a spot check detail by ID via microservice
   * ค้นหารายละเอียดการตรวจสอบแบบสุ่มเดียวตาม ID ผ่านไมโครเซอร์วิส
   * @param detailId - Spot check detail ID / รหัสรายละเอียดการตรวจสอบ
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param tenant_id - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Spot check detail / รายละเอียดการตรวจสอบแบบสุ่ม
   */
  async findDetailById(
    detailId: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findDetailById', detailId, user_id, tenant_id, version },
      SpotCheckService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'spot-check-detail.find-by-id', service: 'spot-check' },
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
   * Find all details for a spot check via microservice
   * ค้นหารายละเอียดทั้งหมดของการตรวจสอบแบบสุ่มผ่านไมโครเซอร์วิส
   * @param spotCheckId - Spot check ID / รหัสการตรวจสอบแบบสุ่ม
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param tenant_id - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Spot check detail items / รายการรายละเอียดการตรวจสอบแบบสุ่ม
   */
  async findDetailsBySpotCheckId(
    spotCheckId: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findDetailsBySpotCheckId', spotCheckId, user_id, tenant_id, version },
      SpotCheckService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'spot-check-detail.find-all', service: 'spot-check' },
      { spot_check_id: spotCheckId, user_id, tenant_id, version, ...getGatewayRequestContext() },
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
   * Delete a spot check detail item via microservice
   * ลบรายละเอียดการตรวจสอบแบบสุ่มผ่านไมโครเซอร์วิส
   * @param detailId - Spot check detail ID / รหัสรายละเอียดการตรวจสอบ
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
      SpotCheckService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'spot-check-detail.delete', service: 'spot-check' },
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
   * @param id - Spot check ID / รหัสการตรวจสอบแบบสุ่ม
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
      SpotCheckService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'spot-check.save-items', service: 'spot-check' },
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
   * Calculate variances for spot check items via microservice
   * คำนวณผลต่างสำหรับรายการตรวจสอบแบบสุ่มผ่านไมโครเซอร์วิส
   * @param id - Spot check ID / รหัสการตรวจสอบแบบสุ่ม
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
      SpotCheckService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'spot-check.review-items', service: 'spot-check' },
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
   * Get the variance report for a spot check via microservice
   * ดึงรายงานผลต่างของการตรวจสอบแบบสุ่มผ่านไมโครเซอร์วิส
   * @param id - Spot check ID / รหัสการตรวจสอบแบบสุ่ม
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
      SpotCheckService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'spot-check.get-review', service: 'spot-check' },
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
   * Submit a spot check and finalize results via microservice
   * ส่งการตรวจสอบแบบสุ่มและสรุปผลลัพธ์ผ่านไมโครเซอร์วิส
   * @param id - Spot check ID / รหัสการตรวจสอบแบบสุ่ม
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
      SpotCheckService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'spot-check.submit', service: 'spot-check' },
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
   * Reset a spot check to draft state via microservice
   * รีเซ็ตการตรวจสอบแบบสุ่มกลับเป็นสถานะร่างผ่านไมโครเซอร์วิส
   * @param id - Spot check ID / รหัสการตรวจสอบแบบสุ่ม
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param tenant_id - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Reset result / ผลลัพธ์การรีเซ็ต
   */
  async reset(
    id: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'reset', id, user_id, tenant_id, version },
      SpotCheckService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'spot-check.reset', service: 'spot-check' },
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
   * Get products at a specific location via microservice
   * ดึงรายการสินค้าในสถานที่จัดเก็บเฉพาะผ่านไมโครเซอร์วิส
   * @param locationId - Location ID / รหัสสถานที่จัดเก็บ
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param tenant_id - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Products at location / สินค้าในสถานที่จัดเก็บ
   */
  async getProductsByLocationId(
    locationId: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'getProductsByLocationId', locationId, user_id, tenant_id, version },
      SpotCheckService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'spot-check.get-products-by-location', service: 'spot-check' },
      { location_id: locationId, user_id, tenant_id, version, ...getGatewayRequestContext() },
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
   * Find current period spot checks grouped by location
   * ค้นหาการตรวจสอบจุดในงวดปัจจุบันจัดกลุ่มตามสถานที่
   */
  async findCurrentByLocation(
    user_id: string,
    tenant_id: string,
    version: string,
    include_not_count?: boolean,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findCurrentByLocation', user_id, tenant_id, version, include_not_count },
      SpotCheckService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'spot-check.current', service: 'spot-check' },
      { user_id, tenant_id, version, include_not_count, ...getGatewayRequestContext() },
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
   * Print a spot check via FastReport viewer (micro-report)
   * พิมพ์ใบสุ่มตรวจสินค้าผ่าน FastReport viewer (micro-report)
   */
  async printToReport(
    id: string,
    user_id: string,
    bu_code: string,
  ): Promise<Result<{ viewer_url: string }>> {
    this.logger.debug(
      { function: 'printToReport', id },
      SpotCheckService.name,
    );

    const response = await firstValueFrom(
      this.inventoryService.send(
        { cmd: 'spot-check.printToReport', service: 'spot-check' },
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
