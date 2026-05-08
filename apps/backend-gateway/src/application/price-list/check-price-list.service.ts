import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { Result, MicroserviceResponse } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { BackendLogger } from 'src/common/helpers/backend.logger';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class CheckPriceListService {
  private readonly logger: BackendLogger = new BackendLogger(
    CheckPriceListService.name,
  );

  constructor(
    @Inject('BUSINESS_SERVICE') private readonly masterService: ClientProxy,
  ) {}

  /**
   * Validate a URL token and retrieve price list data via microservice
   * ตรวจสอบโทเค็น URL และดึงข้อมูลรายการราคาผ่านไมโครเซอร์วิส
   * @param urlToken - Secure URL token / โทเค็น URL ที่ปลอดภัย
   * @param version - API version / เวอร์ชัน API
   * @param decodedToken - Decoded token payload / ข้อมูลโทเค็นที่ถอดรหัสแล้ว
   * @returns Price list data associated with the token / ข้อมูลรายการราคาที่เชื่อมโยงกับโทเค็น
   */
  async checkPriceList(urlToken: string, version: string, decodedToken: Record<string, unknown>): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'checkPriceList',
        url_token: urlToken,
        version,
        decodedToken,
      },
      CheckPriceListService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'check-price-list.check', service: 'check-price-list' },
      { url_token: urlToken, version, decodedToken, ...getGatewayRequestContext() },
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
