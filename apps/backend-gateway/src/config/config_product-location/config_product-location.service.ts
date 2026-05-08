import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';
import { Result, MicroserviceResponse } from '@/common';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class Config_ProductLocationService {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_ProductLocationService.name,
  );

  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly _masterService: ClientProxy,
  ) {}

  /**
   * ค้นหา product_location ตาม product_id ผ่านไมโครเซอร์วิส
   * @param productId - Product ID / รหัสสินค้า
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns รายการ product_location ที่ผูกกับสินค้า
   */
  async getLocationsByProductId(
    productId: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'getLocationsByProductId',
        productId,
        user_id,
        bu_code,
        version,
      },
      Config_ProductLocationService.name,
    );

    const res: Observable<MicroserviceResponse> = this._masterService.send(
      { cmd: 'productLocation.findByProductId', service: 'product-location' },
      {
        product_id: productId,
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
}
