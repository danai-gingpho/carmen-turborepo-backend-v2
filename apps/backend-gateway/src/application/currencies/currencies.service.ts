import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { Result, MicroserviceResponse } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { IPaginate } from 'src/shared-dto/paginate.dto';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class CurrenciesService {
  private readonly logger: BackendLogger = new BackendLogger(
    CurrenciesService.name,
  );

  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly masterService: ClientProxy,
    @Inject('CLUSTER_SERVICE')
    private readonly clusterService: ClientProxy,
  ) { }

  /**
   * Find all active currencies for a business unit via microservice
   * ค้นหารายการสกุลเงินที่ใช้งานอยู่ทั้งหมดของหน่วยธุรกิจผ่านไมโครเซอร์วิส
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated list of active currencies / รายการสกุลเงินที่ใช้งานอยู่แบบแบ่งหน้า
   */
  async findAllActive(
    user_id: string,
    bu_code: string,
    paginate: IPaginate,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'findAllActive',
        user_id,
        bu_code,
        paginate,
        version,
      },
      CurrenciesService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'currencies.findAllActive', service: 'currencies' },
      { user_id, bu_code, paginate, version, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }
    const responseData = response.data as { data: unknown[]; paginate: unknown };
    return Result.ok({
      data: responseData.data,
      paginate: responseData.paginate,
    });
  }

  /**
   * Find a specific currency by ID
   * ค้นหารายการสกุลเงินเดียวตาม ID
   * @param id - Currency ID / รหัสสกุลเงิน
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Currency details / รายละเอียดสกุลเงิน
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
      CurrenciesService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'currencies.findOne', service: 'currencies' },
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
   * Find all ISO 4217 standard currencies
   * ค้นหารายการสกุลเงินมาตรฐาน ISO 4217 ทั้งหมด
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated list of ISO currencies / รายการสกุลเงิน ISO แบบแบ่งหน้า
   */
  async findAllISO(
    user_id: string,
    paginate: IPaginate,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'findAllISO',
        user_id,
        paginate,
        version,
      },
      CurrenciesService.name,
    );

    const res: Observable<MicroserviceResponse> = this.clusterService.send(
      { cmd: 'currencies.findAllISO', service: 'currencies' },
      { user_id, paginate, version, ...getGatewayRequestContext() },
    );

    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }
    const responseData = response.data as { data: unknown[]; paginate: unknown };
    return Result.ok({
      data: responseData.data,
      paginate: responseData.paginate,
    });
  }

  /**
   * Get the default currency for a business unit
   * ดึงข้อมูลสกุลเงินเริ่มต้นของหน่วยธุรกิจ
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Default currency details / รายละเอียดสกุลเงินเริ่มต้น
   */
  async getDefault(
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'getDefault',
        user_id,
        bu_code,
        version,
      },
      CurrenciesService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'currencies.getDefault', service: 'currencies' },
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
}
