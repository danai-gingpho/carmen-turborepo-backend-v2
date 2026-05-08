import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { Result, MicroserviceResponse } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { IPaginateQuery } from 'src/shared-dto/paginate.dto';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class CreditTermService {
  private readonly logger: BackendLogger = new BackendLogger(
    CreditTermService.name,
  );

  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly masterService: ClientProxy,
  ) {}

  /**
   * Find a credit term by ID via microservice
   * ค้นหาเงื่อนไขการชำระเงินเดียวตาม ID ผ่านไมโครเซอร์วิส
   * @param id - Credit term ID / รหัสเงื่อนไขการชำระเงิน
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Credit term details / รายละเอียดเงื่อนไขการชำระเงิน
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
        user_id,
        bu_code,
        version,
      },
      CreditTermService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'credit-term.findOne', service: 'credit-term' },
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
   * Find all credit terms with pagination via microservice
   * ค้นหาเงื่อนไขการชำระเงินทั้งหมดพร้อมการแบ่งหน้าผ่านไมโครเซอร์วิส
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated credit term list / รายการเงื่อนไขการชำระเงินแบบแบ่งหน้า
   */
  async findAll(
    user_id: string,
    bu_code: string,
    paginate: IPaginateQuery,
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
      CreditTermService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'credit-term.findAll', service: 'credit-term' },
      { user_id, bu_code, paginate, version, ...getGatewayRequestContext() },
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
}
