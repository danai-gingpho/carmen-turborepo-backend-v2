import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { Result, MicroserviceResponse } from '@/common';
import { ICreateCreditNoteReason } from 'src/common/dto/credit-note-reason';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class CreditNoteReasonService {
  private readonly logger: BackendLogger = new BackendLogger(
    CreditNoteReasonService.name,
  );

  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly procurementService: ClientProxy,
  ) { }

  /**
   * Find all credit note reasons with pagination via microservice
   * ค้นหาเหตุผลใบลดหนี้ทั้งหมดพร้อมการแบ่งหน้าผ่านไมโครเซอร์วิส
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated credit note reason list / รายการเหตุผลใบลดหนี้แบบแบ่งหน้า
   */
  async findAll(
    user_id: string,
    bu_code: string,
    paginate: IPaginate,
    version: string,
  ): Promise<Result<unknown>> {
    const res: Observable<MicroserviceResponse> = this.procurementService.send(
      {
        cmd: 'credit-note-reason.find-all',
        service: 'credit-note-reason',
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

  async create(
    createDto: ICreateCreditNoteReason,
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
      CreditNoteReasonService.name,
    );

    const res: Observable<MicroserviceResponse> = this.procurementService.send(
      {
        cmd: 'credit-note-reason.create',
        service: 'credit-note-reason',
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
}
