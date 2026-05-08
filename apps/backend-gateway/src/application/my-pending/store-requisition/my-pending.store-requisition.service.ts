import {
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import {
  Result,
  MicroserviceResponse,
  CreateStoreRequisitionDto,
  UpdateStoreRequisitionDto,
} from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { BackendLogger } from 'src/common/helpers/backend.logger';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class MyPendingStoreRequisitionService {
  private readonly logger: BackendLogger = new BackendLogger(
    MyPendingStoreRequisitionService.name,
  );

  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly inventoryService: ClientProxy,
  ) {}

  /**
   * Find a store requisition by ID
   * ค้นหาใบเบิกสินค้ารายการเดียวตาม ID
   * @param id - Store requisition ID / รหัสใบเบิกสินค้า
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Store requisition details / รายละเอียดใบเบิกสินค้า
   */
  async findById(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'findById',
        id,
        user_id,
        bu_code,
        version,
      },
      MyPendingStoreRequisitionService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'store-requisition.find-by-id', service: 'store-requisition' },
      { id, user_id, bu_code, version, ...getGatewayRequestContext() },
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
   * List all pending store requisitions for the user
   * ค้นหารายการใบเบิกสินค้าที่รอดำเนินการทั้งหมดของผู้ใช้
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit codes / รหัสหน่วยธุรกิจ
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated list of pending store requisitions / รายการใบเบิกสินค้าที่รอดำเนินการแบบแบ่งหน้า
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
      MyPendingStoreRequisitionService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'my-pending.store-requisition.find-all', service: 'my-pending' },
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
   * Create a new store requisition
   * สร้างใบเบิกสินค้าใหม่
   * @param body - Store requisition data / ข้อมูลใบเบิกสินค้า
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Created store requisition / ใบเบิกสินค้าที่สร้างแล้ว
   */
  async create(
    body: CreateStoreRequisitionDto,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'create',
        body,
        user_id,
        bu_code,
        version,
      },
      MyPendingStoreRequisitionService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'store-requisition.create', service: 'store-requisition' },
      { data: body, user_id, bu_code, version, ...getGatewayRequestContext() },
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
   * Update a draft store requisition
   * อัปเดตใบเบิกสินค้าฉบับร่าง
   * @param id - Store requisition ID / รหัสใบเบิกสินค้า
   * @param body - Updated requisition data / ข้อมูลใบเบิกที่อัปเดต
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Updated store requisition / ใบเบิกสินค้าที่อัปเดตแล้ว
   */
  async update(
    id: string,
    body: UpdateStoreRequisitionDto,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'update',
        id,
        body,
        user_id,
        bu_code,
        version,
      },
      MyPendingStoreRequisitionService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'store-requisition.update', service: 'store-requisition' },
      { data: { id, ...body }, user_id, bu_code, version, ...getGatewayRequestContext() },
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
   * Submit a store requisition for approval
   * ส่งใบเบิกสินค้าเพื่อขออนุมัติ
   * @param id - Store requisition ID / รหัสใบเบิกสินค้า
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Submitted store requisition / ใบเบิกสินค้าที่ส่งแล้ว
   */
  async submit(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'submit',
        id,
        user_id,
        bu_code,
        version,
      },
      MyPendingStoreRequisitionService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'store-requisition.submit', service: 'store-requisition' },
      { id, user_id, bu_code, version, ...getGatewayRequestContext() },
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
   * Approve a store requisition at the current workflow stage
   * อนุมัติใบเบิกสินค้าในขั้นตอนการทำงานปัจจุบัน
   * @param id - Store requisition ID / รหัสใบเบิกสินค้า
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Approved store requisition / ใบเบิกสินค้าที่อนุมัติแล้ว
   */
  async approve(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'approve',
        id,
        user_id,
        bu_code,
        version,
      },
      MyPendingStoreRequisitionService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'store-requisition.approve', service: 'store-requisition' },
      { id, user_id, bu_code, version, ...getGatewayRequestContext() },
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
   * Reject a store requisition at the current workflow stage
   * ปฏิเสธใบเบิกสินค้าในขั้นตอนการทำงานปัจจุบัน
   * @param id - Store requisition ID / รหัสใบเบิกสินค้า
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Rejected store requisition / ใบเบิกสินค้าที่ปฏิเสธแล้ว
   */
  async reject(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'reject',
        id,
        user_id,
        bu_code,
        version,
      },
      MyPendingStoreRequisitionService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'store-requisition.reject', service: 'store-requisition' },
      { id, user_id, bu_code, version, ...getGatewayRequestContext() },
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
   * Review a store requisition before final decision
   * ตรวจสอบใบเบิกสินค้าก่อนตัดสินใจขั้นสุดท้าย
   * @param id - Store requisition ID / รหัสใบเบิกสินค้า
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Reviewed store requisition / ใบเบิกสินค้าที่ตรวจสอบแล้ว
   */
  async review(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'review',
        id,
        user_id,
        bu_code,
        version,
      },
      MyPendingStoreRequisitionService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'store-requisition.review', service: 'store-requisition' },
      { id, user_id, bu_code, version, ...getGatewayRequestContext() },
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
   * Delete a store requisition
   * ลบใบเบิกสินค้า
   * @param id - Store requisition ID / รหัสใบเบิกสินค้า
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Delete result / ผลลัพธ์การลบ
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
        user_id,
        bu_code,
        version,
      },
      MyPendingStoreRequisitionService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'store-requisition.delete', service: 'store-requisition' },
      { id, user_id, bu_code, version, ...getGatewayRequestContext() },
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
   * List store requisitions filtered by status
   * ค้นหารายการใบเบิกสินค้าตามสถานะ
   * @param status - Requisition status / สถานะใบเบิก
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Store requisitions by status / รายการใบเบิกสินค้าตามสถานะ
   */
  async findAllByStatus(
    status: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'findAllByStatus',
        status,
        user_id,
        bu_code,
        version,
      },
      MyPendingStoreRequisitionService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      {
        cmd: 'store-requisition.find-all-by-status',
        service: 'store-requisition',
      },
      { status, user_id, bu_code, version, ...getGatewayRequestContext() },
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
   * Get workflow stages for store requisitions
   * ดึงขั้นตอนการทำงานสำหรับใบเบิกสินค้า
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
        bu_code,
      },
      MyPendingStoreRequisitionService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      {
        cmd: 'store-requisition.find-all-my-pending-stages',
        service: 'store-requisition',
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
   * Get count of pending store requisitions for the user
   * ดึงจำนวนใบเบิกสินค้าที่รอดำเนินการของผู้ใช้
   * @param user_id - User ID / รหัสผู้ใช้
   * @param version - API version / เวอร์ชัน API
   * @returns Pending store requisition count / จำนวนใบเบิกสินค้าที่รอดำเนินการ
   */
  async findAllMyPendingStoreRequisitionsCount(
    user_id: string,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'findAllMyPendingStoreRequisitionsCount',
        version,
        user_id,
      },
      MyPendingStoreRequisitionService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      {
        cmd: 'my-pending.store-requisition.find-all.count',
        service: 'my-pending',
      },
      {
        user_id,
        version: version, ...getGatewayRequestContext() },
    );

    const response = await firstValueFrom(res);

    this.logger.debug(
      {
        function: 'findAllMyPendingStoreRequisitionsCount',
        version,
        user_id,
        response,
      },
      MyPendingStoreRequisitionService.name,
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
