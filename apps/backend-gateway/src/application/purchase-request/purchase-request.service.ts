import {
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { CreatePurchaseRequestDto, RejectPurchaseRequestDto, Result, SubmitPurchaseRequest, MicroserviceResponse, ErrorCode } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { ResponseLib } from 'src/libs/response.lib';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { CalculatePurchaseRequestDetail } from './dto/CalculatePurchaseRequestDetail.dto';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class PurchaseRequestService {
  private readonly logger: BackendLogger = new BackendLogger(
    PurchaseRequestService.name,
  );

  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly procurementService: ClientProxy,
  ) {}

  /**
   * Find a purchase request by ID via microservice
   * ค้นหารายการเดียวตาม ID ของใบขอซื้อผ่านไมโครเซอร์วิส
   * @param id - Purchase request ID / รหัสใบขอซื้อ
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param userData - User context data / ข้อมูลบริบทผู้ใช้
   * @param version - API version / เวอร์ชัน API
   * @returns Purchase request data / ข้อมูลใบขอซื้อ
   */
  async findById(
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
        function: 'findById',
        id,
        version,
      },
      PurchaseRequestService.name,
    );

    const res: Observable<MicroserviceResponse> = this.procurementService.send(
      { cmd: 'purchase-request.find-by-id', service: 'purchase-request' },
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
   * Find all purchase requests with pagination via microservice
   * ค้นหารายการทั้งหมดของใบขอซื้อพร้อมการแบ่งหน้าผ่านไมโครเซอร์วิส
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit codes / รหัสหน่วยธุรกิจ
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param userDatas - User context data / ข้อมูลบริบทผู้ใช้
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated purchase request list / รายการใบขอซื้อแบบแบ่งหน้า
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
    },
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'findAll',
        user_id,
        bu_code,
        paginate,
        userDatas,
        version,
      },
      PurchaseRequestService.name,
    );

    const res: Observable<MicroserviceResponse> = this.procurementService.send(
      { cmd: 'purchase-request.find-all', service: 'purchase-request' },
      {
        user_id: user_id,
        bu_code: bu_code,
        paginate: paginate,
        userDatas: userDatas,
        version: version, ...getGatewayRequestContext() },
    );

    try {
      const response = await firstValueFrom(res);

      if (response.response.status !== HttpStatus.OK) {
        return Result.error(
          response.response.message,
          httpStatusToErrorCode(response.response.status),
        );
      }

      return Result.ok({ data: response.data, paginate: response.paginate });
    } catch (error) {
      const message = error instanceof Error && error.message
        ? error.message
        : 'An error occurred while retrieving purchase requests';
      return Result.error(message, ErrorCode.INTERNAL);
    }
  }

  /**
   * Find all workflow stages for purchase requests via microservice
   * ค้นหารายการทั้งหมดของขั้นตอนเวิร์กโฟลว์สำหรับใบขอซื้อผ่านไมโครเซอร์วิส
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns List of workflow stages / รายการขั้นตอนเวิร์กโฟลว์
   */
  async findAllWorkflowStagesByPr(
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'findAll',
        user_id,
        bu_code,
        version,
      },
      PurchaseRequestService.name,
    );

    const res: Observable<MicroserviceResponse> = this.procurementService.send(
      {
        cmd: 'purchase-request.find-all-workflow-stages-by-pr',
        service: 'purchase-request',
      },
      {
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
   * Create a new purchase request via microservice
   * สร้างใบขอซื้อใหม่ผ่านไมโครเซอร์วิส
   * @param createDto - Purchase request creation data / ข้อมูลสำหรับสร้างใบขอซื้อ
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Created purchase request / ใบขอซื้อที่สร้างแล้ว
   */
  async create(
    createDto: CreatePurchaseRequestDto,
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
      PurchaseRequestService.name,
    );

    const res: Observable<MicroserviceResponse> = this.procurementService.send(
      {
        cmd: 'purchase-request.create',
        service: 'purchase-request',
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
   * Duplicate purchase requests via microservice
   * ทำสำเนาใบขอซื้อผ่านไมโครเซอร์วิส
   * @param body - IDs of purchase requests to duplicate / รหัสใบขอซื้อที่ต้องการทำสำเนา
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Duplicated purchase requests / ใบขอซื้อที่ทำสำเนาแล้ว
   */
  async duplicatePr(
    body: { ids: string[] },
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'duplicatePr',
        body,
      },
      PurchaseRequestService.name,
    );

    const res: Observable<MicroserviceResponse> = this.procurementService.send(
      {
        cmd: 'purchase-request.duplicate-pr',
        service: 'purchase-request',
      },
      {
        body: body,
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
   * Split a purchase request into a new one via microservice
   * แยกใบขอซื้อเป็นใบใหม่ผ่านไมโครเซอร์วิส
   * @param id - Original purchase request ID / รหัสใบขอซื้อต้นฉบับ
   * @param body - Detail IDs to split / รหัสรายละเอียดที่ต้องการแยก
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Split result / ผลลัพธ์การแยก
   */
  async splitPr(
    id: string,
    body: { detail_ids: string[] },
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'splitPr',
        id,
        body,
      },
      PurchaseRequestService.name,
    );

    const res: Observable<MicroserviceResponse> = this.procurementService.send(
      {
        cmd: 'purchase-request.split',
        service: 'purchase-request',
      },
      {
        id: id,
        body: body,
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
   * Save changes to a purchase request via microservice
   * บันทึกการเปลี่ยนแปลงใบขอซื้อผ่านไมโครเซอร์วิส
   * @param id - Purchase request ID / รหัสใบขอซื้อ
   * @param updateDto - Updated data / ข้อมูลที่อัปเดต
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Updated purchase request / ใบขอซื้อที่อัปเดตแล้ว
   */
  async save(
    id: string,
    updateDto: Record<string, unknown> | object,
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
      PurchaseRequestService.name,
    );

    const res: Observable<MicroserviceResponse> = this.procurementService.send(
      { cmd: 'purchase-request.save', service: 'purchase-request' },
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
   * Submit a purchase request for approval via microservice
   * ส่งใบขอซื้อเข้าสู่การอนุมัติผ่านไมโครเซอร์วิส
   * @param id - Purchase request ID / รหัสใบขอซื้อ
   * @param payload - Submit payload / ข้อมูลการส่ง
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Submitted purchase request / ใบขอซื้อที่ส่งแล้ว
   */
  async submit(
    id: string,
    payload: SubmitPurchaseRequest,
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
      PurchaseRequestService.name,
    );

    const res: Observable<MicroserviceResponse> = this.procurementService.send(
      { cmd: 'purchase-request.submit', service: 'purchase-request' },
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
   * Approve a purchase request via microservice
   * อนุมัติใบขอซื้อผ่านไมโครเซอร์วิส
   * @param id - Purchase request ID / รหัสใบขอซื้อ
   * @param payload - Approval payload / ข้อมูลการอนุมัติ
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Approved purchase request / ใบขอซื้อที่อนุมัติแล้ว
   */
  async approve(
    id: string,
    payload: Record<string, unknown> | object,
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
      PurchaseRequestService.name,
    );

    const res: Observable<MicroserviceResponse> = this.procurementService.send(
      { cmd: 'purchase-request.approve', service: 'purchase-request' },
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

  async swipeApprove(
    pr_ids: string[],
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'swipeApprove', pr_ids, user_id, bu_code, version },
      PurchaseRequestService.name,
    );

    const res: Observable<MicroserviceResponse> = this.procurementService.send(
      { cmd: 'purchase-request.swipe-approve', service: 'purchase-request' },
      {
        body: { pr_ids },
        user_id,
        bu_code,
        version, ...getGatewayRequestContext() },
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

  async swipeReject(
    pr_ids: string[],
    reject_message: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'swipeReject', pr_ids, user_id, bu_code, version },
      PurchaseRequestService.name,
    );

    const res: Observable<MicroserviceResponse> = this.procurementService.send(
      { cmd: 'purchase-request.swipe-reject', service: 'purchase-request' },
      {
        body: { pr_ids, reject_message },
        user_id,
        bu_code,
        version, ...getGatewayRequestContext() },
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
   * Reject a purchase request via microservice
   * ปฏิเสธใบขอซื้อผ่านไมโครเซอร์วิส
   * @param id - Purchase request ID / รหัสใบขอซื้อ
   * @param body - Rejection payload / ข้อมูลการปฏิเสธ
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Rejected purchase request / ใบขอซื้อที่ถูกปฏิเสธ
   */
  async reject(
    id: string,
    body: RejectPurchaseRequestDto,
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
      PurchaseRequestService.name,
    );

    const res: Observable<MicroserviceResponse> = this.procurementService.send(
      { cmd: 'purchase-request.reject', service: 'purchase-request' },
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
   * Send a purchase request back for review via microservice
   * ส่งใบขอซื้อกลับเพื่อตรวจสอบผ่านไมโครเซอร์วิส
   * @param id - Purchase request ID / รหัสใบขอซื้อ
   * @param body - Review payload / ข้อมูลการตรวจสอบ
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Reviewed purchase request / ใบขอซื้อที่ส่งกลับตรวจสอบ
   */
  async review(
    id: string,
    body: Record<string, unknown> | object,
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
      PurchaseRequestService.name,
    );

    const res: Observable<MicroserviceResponse> = this.procurementService.send(
      { cmd: 'purchase-request.review', service: 'purchase-request' },
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
   * Delete a purchase request via microservice
   * ลบใบขอซื้อผ่านไมโครเซอร์วิส
   * @param id - Purchase request ID / รหัสใบขอซื้อ
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
      PurchaseRequestService.name,
    );

    const res: Observable<MicroserviceResponse> = this.procurementService.send(
      { cmd: 'purchase-request.delete', service: 'purchase-request' },
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
   * Find all purchase requests by status via microservice
   * ค้นหาใบขอซื้อตามสถานะผ่านไมโครเซอร์วิส
   * @param status - Workflow status / สถานะเวิร์กโฟลว์
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Filtered purchase request list / รายการใบขอซื้อที่กรองแล้ว
   */
  async findAllByStatus(
    status: string,
    user_id: string,
    bu_code: string,
    paginate: IPaginate,
    version: string,
    options?: { excludeWorkflowHistory?: boolean },
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'findAllByStatus',
        status,
        paginate,
        version,
      },
      PurchaseRequestService.name,
    );

    const res: Observable<MicroserviceResponse> = this.procurementService.send(
      {
        cmd: 'purchase-request.find-all-by-status',
        service: 'purchase-request',
      },
      {
        status: status,
        user_id: user_id,
        bu_code: bu_code,
        paginate: paginate,
        version: version,
        options: options, ...getGatewayRequestContext() },
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
   * Export a purchase request to Excel via microservice
   * ส่งออกใบขอซื้อเป็นไฟล์ Excel ผ่านไมโครเซอร์วิส
   * @param id - Purchase request ID / รหัสใบขอซื้อ
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
      PurchaseRequestService.name,
    );

    const response = await firstValueFrom(
      this.procurementService.send(
      { cmd: 'purchase-request.export', service: 'purchase-request' },
      { id, user_id, bu_code, version, ...getGatewayRequestContext() },
    ),
    );

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    const data = response.data;
    if (data && data.buffer && data.buffer.type === 'Buffer') {
      data.buffer = Buffer.from(data.buffer.data);
    }

    return Result.ok(data);
  }

  /**
   * Print a purchase request to PDF via microservice
   * พิมพ์ใบขอซื้อเป็นไฟล์ PDF ผ่านไมโครเซอร์วิส
   * @param id - Purchase request ID / รหัสใบขอซื้อ
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
      PurchaseRequestService.name,
    );

    const response = await firstValueFrom(
      this.procurementService.send(
      { cmd: 'purchase-request.print', service: 'purchase-request' },
      { id, user_id, bu_code, version, ...getGatewayRequestContext() },
    ),
    );

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    const data = response.data;
    if (data && data.buffer && data.buffer.type === 'Buffer') {
      data.buffer = Buffer.from(data.buffer.data);
    }

    return Result.ok(data);
  }

  /**
   * Find cost allocation dimensions for a PR detail via microservice
   * ค้นหามิติการจัดสรรต้นทุนของรายละเอียดใบขอซื้อผ่านไมโครเซอร์วิส
   * @param detail_id - Purchase request detail ID / รหัสรายละเอียดใบขอซื้อ
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Dimension data / ข้อมูลมิติ
   */
  async findDimensionsByDetailId(
    detail_id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'findDimensionsByDetailId',
        detail_id,
        version,
      },
      PurchaseRequestService.name,
    );

    const res: Observable<MicroserviceResponse> = this.procurementService.send(
      {
        cmd: 'purchase-request.find-dimensions-by-detail-id',
        service: 'purchase-request',
      },
      {
        detail_id: detail_id,
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

    return ResponseLib.success(response.data);
  }

  /**
   * Find change history for a PR detail via microservice
   * ค้นหาประวัติการเปลี่ยนแปลงของรายละเอียดใบขอซื้อผ่านไมโครเซอร์วิส
   * @param detail_id - Purchase request detail ID / รหัสรายละเอียดใบขอซื้อ
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Change history / ประวัติการเปลี่ยนแปลง
   */
  async findHistoryByDetailId(
    detail_id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'findHistoryByDetailId',
        detail_id,
        version,
      },
      PurchaseRequestService.name,
    );

    const res: Observable<MicroserviceResponse> = this.procurementService.send(
      {
        cmd: 'purchase-request.find-history-by-detail-id',
        service: 'purchase-request',
      },
      {
        detail_id: detail_id,
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

    return ResponseLib.success(response.data);
  }

  /**
   * Calculate price breakdown for a PR detail via microservice
   * คำนวณรายละเอียดราคาของรายการใบขอซื้อผ่านไมโครเซอร์วิส
   * @param detail_id - Purchase request detail ID / รหัสรายละเอียดใบขอซื้อ
   * @param data - Calculation parameters / พารามิเตอร์การคำนวณ
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Price calculation result / ผลลัพธ์การคำนวณราคา
   */
  async getCalculatePriceInfoByDetailId(
    detail_id: string,
    data: CalculatePurchaseRequestDetail,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'getCalculatePriceInfoByDetailId',
        detail_id,
        version,
      },
      PurchaseRequestService.name,
    );

    const res: Observable<MicroserviceResponse> = this.procurementService.send(
      {
        cmd: 'purchase-request.get-calculate-price-info-by-detail-id',
        service: 'purchase-request',
      },
      {
        detail_id: detail_id,
        data: data,
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

    return ResponseLib.success(response.data);
  }

  /**
   * Get previous workflow stages for a purchase request
   * ดึงขั้นตอนอนุมัติก่อนหน้าของใบขอซื้อ
   */
  async getPreviousStages(
    pr_id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'getPreviousStages', pr_id, user_id, bu_code, version },
      PurchaseRequestService.name,
    );

    const res: Observable<MicroserviceResponse> = this.procurementService.send(
      { cmd: 'purchase-request.get-previous-stages', service: 'purchase-request' },
      { pr_id, user_id, bu_code, version, ...getGatewayRequestContext() },
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
   * Print a purchase request via FastReport viewer (micro-report)
   * พิมพ์ใบขอซื้อผ่าน FastReport viewer (micro-report)
   * @param id - Purchase request ID / รหัสใบขอซื้อ
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @returns { viewer_url } / URL ของ report viewer
   */
  async printToReport(
    id: string,
    user_id: string,
    bu_code: string,
  ): Promise<Result<{ viewer_url: string }>> {
    this.logger.debug(
      { function: 'printToReport', id },
      PurchaseRequestService.name,
    );

    const response = await firstValueFrom(
      this.procurementService.send(
        { cmd: 'purchase-request.printToReport', service: 'purchase-request' },
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

  /**
   * Regenerate denormalized totals on tb_purchase_request via microservice.
   * Pass id to scope to a single PR; omit to recompute all non-deleted PRs.
   */
  async regenerateTotals(
    user_id: string,
    bu_code: string,
    id?: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'regenerateTotals', user_id, bu_code, id },
      PurchaseRequestService.name,
    );

    const res: Observable<MicroserviceResponse> = this.procurementService.send(
      { cmd: 'purchase-request.regenerate-totals', service: 'purchase-request' },
      { user_id, tenant_id: bu_code, bu_code, id, ...getGatewayRequestContext() },
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
}
