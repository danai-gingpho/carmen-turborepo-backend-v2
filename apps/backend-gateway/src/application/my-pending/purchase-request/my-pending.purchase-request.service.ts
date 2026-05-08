import {
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { CreatePurchaseRequestDto, Result, MicroserviceResponse } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { BackendLogger } from 'src/common/helpers/backend.logger';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class MyPendingPurchaseRequestService {
  private readonly logger: BackendLogger = new BackendLogger(
    MyPendingPurchaseRequestService.name,
  );

  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly procurementService: ClientProxy,
  ) { }

  /**
   * Find a purchase request by ID
   * ค้นหาใบขอซื้อรายการเดียวตาม ID
   * @param id - Purchase request ID / รหัสใบขอซื้อ
   * @param user_id - User ID / รหัสผู้ใช้
   * @param tenant_id - Tenant ID / รหัส tenant
   * @param version - API version / เวอร์ชัน API
   * @returns Purchase request details / รายละเอียดใบขอซื้อ
   */
  async findById(
    id: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'findById',
        id,
        version,
      },
      MyPendingPurchaseRequestService.name,
    );

    const res: Observable<MicroserviceResponse> = this.procurementService.send(
      { cmd: 'purchase-request.find-by-id', service: 'purchase-request' },
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
   * List all pending purchase requests for the user
   * ค้นหารายการใบขอซื้อที่รอดำเนินการทั้งหมดของผู้ใช้
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit codes / รหัสหน่วยธุรกิจ
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated list of pending purchase requests / รายการใบขอซื้อที่รอดำเนินการแบบแบ่งหน้า
   */
  async findAll(
    user_id: string,
    bu_code: string[],
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
      MyPendingPurchaseRequestService.name,
    );

    const res: Observable<MicroserviceResponse> = this.procurementService.send(
      { cmd: 'my-pending.purchase-request.find-all', service: 'my-pending' },
      {
        user_id: user_id,
        bu_code: bu_code,
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
   * Create a new purchase request
   * สร้างใบขอซื้อใหม่
   * @param createDto - Purchase request data / ข้อมูลใบขอซื้อ
   * @param user_id - User ID / รหัสผู้ใช้
   * @param tenant_id - Tenant ID / รหัส tenant
   * @param version - API version / เวอร์ชัน API
   * @returns Created purchase request / ใบขอซื้อที่สร้างแล้ว
   */
  async create(
    createDto: CreatePurchaseRequestDto,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      MyPendingPurchaseRequestService.name,
    );

    const res: Observable<MicroserviceResponse> = this.procurementService.send(
      {
        cmd: 'purchase-request.create',
        service: 'purchase-request',
      },
      {
        data: createDto,
        user_id: user_id,
        tenant_id: tenant_id,
        version: version, ...getGatewayRequestContext() },
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
   * Update a draft purchase request
   * อัปเดตใบขอซื้อฉบับร่าง
   * @param id - Purchase request ID / รหัสใบขอซื้อ
   * @param updateDto - Updated request data / ข้อมูลใบขอที่อัปเดต
   * @param user_id - User ID / รหัสผู้ใช้
   * @param tenant_id - Tenant ID / รหัส tenant
   * @param version - API version / เวอร์ชัน API
   * @returns Updated purchase request / ใบขอซื้อที่อัปเดตแล้ว
   */
  async update(
    id: string,
    updateDto: Record<string, unknown>,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateDto,
        version,
      },
      MyPendingPurchaseRequestService.name,
    );

    const res: Observable<MicroserviceResponse> = this.procurementService.send(
      { cmd: 'purchase-request.update', service: 'purchase-request' },
      {
        data: { id, ...updateDto },
        user_id: user_id,
        tenant_id: tenant_id,
        version: version, ...getGatewayRequestContext() },
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
   * Submit a purchase request for approval
   * ส่งใบขอซื้อเพื่อขออนุมัติ
   * @param id - Purchase request ID / รหัสใบขอซื้อ
   * @param user_id - User ID / รหัสผู้ใช้
   * @param tenant_id - Tenant ID / รหัส tenant
   * @param version - API version / เวอร์ชัน API
   * @returns Submitted purchase request / ใบขอซื้อที่ส่งแล้ว
   */
  async submit(
    id: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'submit',
        id,
        version,
      },
      MyPendingPurchaseRequestService.name,
    );

    const res: Observable<MicroserviceResponse> = this.procurementService.send(
      { cmd: 'purchase-request.submit', service: 'purchase-request' },
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
   * Approve a purchase request at the current workflow stage
   * อนุมัติใบขอซื้อในขั้นตอนการทำงานปัจจุบัน
   * @param id - Purchase request ID / รหัสใบขอซื้อ
   * @param payload - Approval payload / ข้อมูลการอนุมัติ
   * @param user_id - User ID / รหัสผู้ใช้
   * @param tenant_id - Tenant ID / รหัส tenant
   * @param version - API version / เวอร์ชัน API
   * @returns Approved purchase request / ใบขอซื้อที่อนุมัติแล้ว
   */
  async approve(
    id: string,
    payload: Record<string, unknown>,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'approve',
        id,
        payload,
        version,
      },
      MyPendingPurchaseRequestService.name,
    );

    const res: Observable<MicroserviceResponse> = this.procurementService.send(
      { cmd: 'purchase-request.approve', service: 'purchase-request' },
      {
        id: id,
        body: payload,
        user_id: user_id,
        tenant_id: tenant_id,
        version: version, ...getGatewayRequestContext() },
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
   * Reject a purchase request at the current workflow stage
   * ปฏิเสธใบขอซื้อในขั้นตอนการทำงานปัจจุบัน
   * @param id - Purchase request ID / รหัสใบขอซื้อ
   * @param user_id - User ID / รหัสผู้ใช้
   * @param tenant_id - Tenant ID / รหัส tenant
   * @param version - API version / เวอร์ชัน API
   * @returns Rejected purchase request / ใบขอซื้อที่ปฏิเสธแล้ว
   */
  async reject(
    id: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'reject',
        id,
        version,
      },
      MyPendingPurchaseRequestService.name,
    );

    const res: Observable<MicroserviceResponse> = this.procurementService.send(
      { cmd: 'purchase-request.reject', service: 'purchase-request' },
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
   * Review a purchase request before final decision
   * ตรวจสอบใบขอซื้อก่อนตัดสินใจขั้นสุดท้าย
   * @param id - Purchase request ID / รหัสใบขอซื้อ
   * @param body - Review payload / ข้อมูลการตรวจสอบ
   * @param user_id - User ID / รหัสผู้ใช้
   * @param tenant_id - Tenant ID / รหัส tenant
   * @param version - API version / เวอร์ชัน API
   * @returns Reviewed purchase request / ใบขอซื้อที่ตรวจสอบแล้ว
   */
  async review(
    id: string,
    body: Record<string, unknown>,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'review',
        id,
        version,
      },
      MyPendingPurchaseRequestService.name,
    );

    const res: Observable<MicroserviceResponse> = this.procurementService.send(
      { cmd: 'purchase-request.review', service: 'purchase-request' },
      {
        id: id,
        body,
        user_id: user_id,
        tenant_id: tenant_id,
        version: version, ...getGatewayRequestContext() },
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
   * Delete a purchase request
   * ลบใบขอซื้อ
   * @param id - Purchase request ID / รหัสใบขอซื้อ
   * @param user_id - User ID / รหัสผู้ใช้
   * @param tenant_id - Tenant ID / รหัส tenant
   * @param version - API version / เวอร์ชัน API
   * @returns Delete result / ผลลัพธ์การลบ
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
        version,
      },
      MyPendingPurchaseRequestService.name,
    );

    const res: Observable<MicroserviceResponse> = this.procurementService.send(
      { cmd: 'purchase-request.delete', service: 'purchase-request' },
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
   * List purchase requests filtered by status
   * ค้นหารายการใบขอซื้อตามสถานะ
   * @param status - Request status / สถานะใบขอซื้อ
   * @param user_id - User ID / รหัสผู้ใช้
   * @param tenant_id - Tenant ID / รหัส tenant
   * @param version - API version / เวอร์ชัน API
   * @returns Purchase requests by status / รายการใบขอซื้อตามสถานะ
   */
  async findAllByStatus(
    status: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'findAllByStatus',
        status,
        version,
      },
      MyPendingPurchaseRequestService.name,
    );

    const res: Observable<MicroserviceResponse> = this.procurementService.send(
      {
        cmd: 'purchase-request.find-all-by-status',
        service: 'purchase-request',
      },
      {
        status: status,
        user_id: user_id,
        tenant_id: tenant_id,
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
   * Get workflow stages for purchase requests
   * ดึงขั้นตอนการทำงานสำหรับใบขอซื้อ
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Workflow stages / ขั้นตอนการทำงาน
   */
  async findAllMyPendingStages(
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'findAllMyPendingStages',
        version,
        user_id,
        bu_code
      },
      MyPendingPurchaseRequestService.name,
    );
    const res: Observable<MicroserviceResponse> = this.procurementService.send(
      {
        cmd: 'purchase-request.find-all-my-pending-stages',
        service: 'purchase-request',
      },
      {
        user_id,
        bu_code,
        version: version, ...getGatewayRequestContext() },
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
   * Get count of pending purchase requests for the user
   * ดึงจำนวนใบขอซื้อที่รอดำเนินการของผู้ใช้
   * @param user_id - User ID / รหัสผู้ใช้
   * @param version - API version / เวอร์ชัน API
   * @returns Pending purchase request count / จำนวนใบขอซื้อที่รอดำเนินการ
   */
  async findAllMyPendingPurchaseRequestsCount(
    user_id: string,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'findAllMyPendingPurchaseRequestsCount',
        version,
        user_id,
      },
      MyPendingPurchaseRequestService.name,
    );
    const res: Observable<MicroserviceResponse> = this.procurementService.send(
      { cmd: 'my-pending.purchase-request.find-all.count', service: 'my-pending' },
      {
        user_id,
        version: version, ...getGatewayRequestContext() },
    );

    const response = await firstValueFrom(res);

    this.logger.debug(
      {
        function: 'findAllMyPendingPurchaseRequestsCount',
        version,
        user_id,
        response,
      },
      MyPendingPurchaseRequestService.name,
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
