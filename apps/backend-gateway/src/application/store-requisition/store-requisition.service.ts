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
  RejectStoreRequisitionDto,
  SubmitStoreRequisitionDto,
  ReviewStoreRequisitionDto,
  MicroserviceResponse,
} from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { BackendLogger } from 'src/common/helpers/backend.logger';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class StoreRequisitionService {
  private readonly logger: BackendLogger = new BackendLogger(
    StoreRequisitionService.name,
  );

  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly inventoryService: ClientProxy,
  ) { }

  /**
   * Find a store requisition by ID via microservice.
   * ค้นหาใบเบิกสินค้าเดียวตาม ID ผ่านไมโครเซอร์วิส
   * @param id - Store requisition ID / รหัสใบเบิกสินค้า
   * @param user_id - Current user ID / รหัสผู้ใช้ปัจจุบัน
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param userData - User business unit data / ข้อมูลหน่วยธุรกิจของผู้ใช้
   * @param version - API version / เวอร์ชัน API
   * @returns Store requisition or error / ใบเบิกสินค้าหรือข้อผิดพลาด
   */
  async findOne(
    id: string,
    user_id: string,
    bu_code: string,
    userData: {
      bu_id: string;
      bu_code: string;
      role: string;
      permissions: Record<string, string[]>;
    },
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        version,
      },
      StoreRequisitionService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'store-requisition.find-by-id', service: 'store-requisition' },
      {
        id: id,
        user_id: user_id,
        bu_code: bu_code,
        userData: userData,
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
   * Find all store requisitions with pagination via microservice.
   * ค้นหาใบเบิกสินค้าทั้งหมดพร้อมการแบ่งหน้าผ่านไมโครเซอร์วิส
   * @param user_id - Current user ID / รหัสผู้ใช้ปัจจุบัน
   * @param bu_code - Business unit code(s) / รหัสหน่วยธุรกิจ
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param userDatas - User business unit data list / รายการข้อมูลหน่วยธุรกิจของผู้ใช้
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated store requisitions or error / ใบเบิกสินค้าพร้อมการแบ่งหน้าหรือข้อผิดพลาด
   */
  async findAll(
    user_id: string,
    bu_code: string[],
    paginate: IPaginate,
    userDatas: {
      bu_id: string;
      bu_code: string;
      role: string;
      permissions: Record<string, string[]>;
    }[],
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
      StoreRequisitionService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'store-requisition.find-all', service: 'store-requisition' },
      {
        user_id: user_id,
        bu_code: bu_code,
        paginate: paginate,
        userDatas: userDatas,
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
   * Create a new store requisition via microservice.
   * สร้างใบเบิกสินค้าใหม่ผ่านไมโครเซอร์วิส
   * @param createDto - Store requisition creation data / ข้อมูลสำหรับสร้างใบเบิกสินค้า
   * @param user_id - Current user ID / รหัสผู้ใช้ปัจจุบัน
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Created store requisition or error / ใบเบิกสินค้าที่สร้างแล้วหรือข้อผิดพลาด
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
      StoreRequisitionService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      {
        cmd: 'store-requisition.create',
        service: 'store-requisition',
      },
      {
        data: createDto,
        user_id: user_id,
        bu_code: bu_code,
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
   * Save (persist) a store requisition via microservice.
   * บันทึกใบเบิกสินค้าผ่านไมโครเซอร์วิส
   * @param id - Store requisition ID / รหัสใบเบิกสินค้า
   * @param updateDto - Store requisition data / ข้อมูลใบเบิกสินค้า
   * @param user_id - Current user ID / รหัสผู้ใช้ปัจจุบัน
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Saved store requisition or error / ใบเบิกสินค้าที่บันทึกแล้วหรือข้อผิดพลาด
   */
  async save(
    id: string,
    updateDto: Record<string, unknown>,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'save',
        id,
        updateDto,
        version,
      },
      StoreRequisitionService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'store-requisition.save', service: 'store-requisition' },
      {
        id,
        data: updateDto,
        user_id: user_id,
        bu_code: bu_code,
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
   * Submit a store requisition into the approval workflow via microservice.
   * ส่งใบเบิกสินค้าเข้าสู่ขั้นตอนการอนุมัติผ่านไมโครเซอร์วิส
   * @param id - Store requisition ID / รหัสใบเบิกสินค้า
   * @param payload - Submission data / ข้อมูลการส่ง
   * @param user_id - Current user ID / รหัสผู้ใช้ปัจจุบัน
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Submitted store requisition or error / ใบเบิกสินค้าที่ส่งแล้วหรือข้อผิดพลาด
   */
  async submit(
    id: string,
    payload: SubmitStoreRequisitionDto,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'submit',
        id,
        version,
      },
      StoreRequisitionService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'store-requisition.submit', service: 'store-requisition' },
      { id: id, payload, user_id: user_id, bu_code: bu_code, version: version, ...getGatewayRequestContext() },
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
   * Approve a store requisition at the current workflow stage via microservice.
   * อนุมัติใบเบิกสินค้าในขั้นตอนปัจจุบันผ่านไมโครเซอร์วิส
   * @param id - Store requisition ID / รหัสใบเบิกสินค้า
   * @param payload - Approval data / ข้อมูลการอนุมัติ
   * @param user_id - Current user ID / รหัสผู้ใช้ปัจจุบัน
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Approved store requisition or error / ใบเบิกสินค้าที่อนุมัติแล้วหรือข้อผิดพลาด
   */
  async approve(
    id: string,
    payload: Record<string, unknown>,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'approve',
        id,
        payload,
        version,
      },
      StoreRequisitionService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'store-requisition.approve', service: 'store-requisition' },
      {
        id: id,
        body: payload,
        user_id: user_id,
        bu_code: bu_code,
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
   * Reject a store requisition via microservice.
   * ปฏิเสธใบเบิกสินค้าผ่านไมโครเซอร์วิส
   * @param id - Store requisition ID / รหัสใบเบิกสินค้า
   * @param body - Rejection data with reason / ข้อมูลการปฏิเสธพร้อมเหตุผล
   * @param user_id - Current user ID / รหัสผู้ใช้ปัจจุบัน
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Rejected store requisition or error / ใบเบิกสินค้าที่ปฏิเสธแล้วหรือข้อผิดพลาด
   */
  async reject(
    id: string,
    body: RejectStoreRequisitionDto,
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
      StoreRequisitionService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'store-requisition.reject', service: 'store-requisition' },
      { id: id, body, user_id: user_id, bu_code: bu_code, version: version, ...getGatewayRequestContext() },
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
   * Send a store requisition back for review via microservice.
   * ส่งใบเบิกสินค้ากลับไปตรวจสอบผ่านไมโครเซอร์วิส
   * @param id - Store requisition ID / รหัสใบเบิกสินค้า
   * @param body - Review data / ข้อมูลการตรวจสอบ
   * @param user_id - Current user ID / รหัสผู้ใช้ปัจจุบัน
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Reviewed store requisition or error / ใบเบิกสินค้าที่ส่งกลับตรวจสอบหรือข้อผิดพลาด
   */
  async review(
    id: string,
    body: ReviewStoreRequisitionDto,
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
      StoreRequisitionService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'store-requisition.review', service: 'store-requisition' },
      { id: id, body, user_id: user_id, bu_code: bu_code, version: version, ...getGatewayRequestContext() },
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
   * Update a store requisition by delegating to save via microservice.
   * อัปเดตใบเบิกสินค้าโดยส่งต่อไปยังการบันทึกผ่านไมโครเซอร์วิส
   * @param id - Store requisition ID / รหัสใบเบิกสินค้า
   * @param updateDto - Store requisition update data / ข้อมูลสำหรับอัปเดตใบเบิกสินค้า
   * @param user_id - Current user ID / รหัสผู้ใช้ปัจจุบัน
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Updated store requisition or error / ใบเบิกสินค้าที่อัปเดตแล้วหรือข้อผิดพลาด
   */
  async update(
    id: string,
    updateDto: Record<string, unknown>,
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
      StoreRequisitionService.name,
    );

    return this.save(id, updateDto, user_id, bu_code, version);
  }

  /**
   * Delete a store requisition via microservice.
   * ลบใบเบิกสินค้าผ่านไมโครเซอร์วิส
   * @param id - Store requisition ID / รหัสใบเบิกสินค้า
   * @param user_id - Current user ID / รหัสผู้ใช้ปัจจุบัน
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result or error / ผลลัพธ์การลบหรือข้อผิดพลาด
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
      StoreRequisitionService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'store-requisition.delete', service: 'store-requisition' },
      { id: id, user_id: user_id, bu_code: bu_code, version: version, ...getGatewayRequestContext() },
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
   * Find all store requisitions filtered by status via microservice.
   * ค้นหาใบเบิกสินค้าทั้งหมดตามสถานะผ่านไมโครเซอร์วิส
   * @param status - Requisition status filter / ตัวกรองสถานะใบเบิกสินค้า
   * @param user_id - Current user ID / รหัสผู้ใช้ปัจจุบัน
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Filtered store requisitions or error / ใบเบิกสินค้าตามสถานะหรือข้อผิดพลาด
   */
  async findAllByStatus(
    status: string,
    user_id: string,
    bu_code: string,
    paginate: IPaginate,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'findAllByStatus',
        status,
        version,
      },
      StoreRequisitionService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      {
        cmd: 'store-requisition.find-all-by-status',
        service: 'store-requisition',
      },
      {
        status: status,
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
   * Find all store requisitions pending the current user's action via microservice.
   * ค้นหาใบเบิกสินค้าทั้งหมดที่รอการดำเนินการของผู้ใช้ปัจจุบันผ่านไมโครเซอร์วิส
   * @param user_id - Current user ID / รหัสผู้ใช้ปัจจุบัน
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Pending store requisitions or error / ใบเบิกสินค้าที่รอดำเนินการหรือข้อผิดพลาด
   */
  async findAllMyPending(
    user_id: string,
    bu_code: string,
    paginate: IPaginate,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'findAllMyPending',
        user_id,
        bu_code,
        paginate,
        version,
      },
      StoreRequisitionService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      {
        cmd: 'my-pending.store-requisition.find-all',
        service: 'my-pending',
      },
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

  // ==================== Mobile-specific endpoints ====================

  /**
   * Get workflow permissions for a store requisition via microservice.
   * ดึงสิทธิ์เวิร์กโฟลว์สำหรับใบเบิกสินค้าผ่านไมโครเซอร์วิส
   * @param id - Store requisition ID / รหัสใบเบิกสินค้า
   * @param user_id - Current user ID / รหัสผู้ใช้ปัจจุบัน
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Workflow permissions or error / สิทธิ์เวิร์กโฟลว์หรือข้อผิดพลาด
   */
  async getWorkflowPermission(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'getWorkflowPermission',
        id,
        version,
      },
      StoreRequisitionService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'store-requisition.get-workflow-permission', service: 'store-requisition' },
      { id: id, user_id: user_id, bu_code: bu_code, version: version, ...getGatewayRequestContext() },
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
   * Get the list of previous workflow steps for a store requisition via microservice.
   * ดึงรายการขั้นตอนเวิร์กโฟลว์ก่อนหน้าสำหรับใบเบิกสินค้าผ่านไมโครเซอร์วิส
   * @param id - Store requisition ID / รหัสใบเบิกสินค้า
   * @param user_id - Current user ID / รหัสผู้ใช้ปัจจุบัน
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Previous workflow steps or error / ขั้นตอนเวิร์กโฟลว์ก่อนหน้าหรือข้อผิดพลาด
   */
  async getWorkflowPreviousStepList(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'getWorkflowPreviousStepList',
        id,
        version,
      },
      StoreRequisitionService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'store-requisition.get-workflow-previous-step-list', service: 'store-requisition' },
      { id: id, user_id: user_id, bu_code: bu_code, version: version, ...getGatewayRequestContext() },
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

  async findAllWorkflowStagesBySr(
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findAllWorkflowStagesBySr', user_id, bu_code, version },
      StoreRequisitionService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      {
        cmd: 'store-requisition.find-all-workflow-stages-by-sr',
        service: 'store-requisition',
      },
      { user_id, bu_code, version, ...getGatewayRequestContext() },
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
   * Print a store requisition via FastReport viewer (micro-report)
   * พิมพ์ใบเบิกสินค้าผ่าน FastReport viewer (micro-report)
   */
  async printToReport(
    id: string,
    user_id: string,
    bu_code: string,
  ): Promise<Result<{ viewer_url: string }>> {
    this.logger.debug(
      { function: 'printToReport', id },
      StoreRequisitionService.name,
    );

    const response = await firstValueFrom(
      this.inventoryService.send(
        { cmd: 'store-requisition.printToReport', service: 'store-requisition' },
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
