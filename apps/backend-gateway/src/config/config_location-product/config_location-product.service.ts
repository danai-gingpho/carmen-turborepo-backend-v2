import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';
import { Result, MicroserviceResponse } from '@/common';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class Config_LocationProductService {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_LocationProductService.name,
  );

  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly _masterService: ClientProxy,
  ) {}

  /**
   * ค้นหา product_location ตาม location_id ผ่านไมโครเซอร์วิส
   * @param locationId - Location ID / รหัสสถานที่
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns รายการ product_location ที่ผูกกับสถานที่
   */
  /**
   * ค้นหา location ทั้งหมดพร้อม products ในแต่ละ location ผ่านไมโครเซอร์วิส
   */
  async findAllLocationsWithProducts(
    user_id: string,
    bu_code: string,
    paginate: IPaginate,
    version: string,
    search?: string,
    category_id?: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findAllLocationsWithProducts', user_id, bu_code, paginate, version, search, category_id },
      Config_LocationProductService.name,
    );

    const res: Observable<MicroserviceResponse> = this._masterService.send(
      { cmd: 'productLocation.findAllLocationsWithProducts', service: 'product-location' },
      { user_id, bu_code, paginate, version, search, category_id, ...getGatewayRequestContext() },
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

  async getProductByLocationId(
    locationId: string,
    user_id: string,
    bu_code: string,
    paginate: IPaginate,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'getProductByLocationId',
        locationId,
        user_id,
        bu_code,
        paginate,
        version,
      },
      Config_LocationProductService.name,
    );

    const res: Observable<MicroserviceResponse> = this._masterService.send(
      { cmd: 'productLocation.findByLocationId', service: 'product-location' },
      {
        location_id: locationId,
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
   * เปรียบเทียบสินค้าระหว่าง 2 สถานที่ ผ่านไมโครเซอร์วิส
   */
  async compareLocations(
    location_id_1: string,
    location_id_2: string,
    user_id: string,
    bu_code: string,
    paginate: IPaginate,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'compareLocations', location_id_1, location_id_2, user_id, bu_code, paginate, version },
      Config_LocationProductService.name,
    );

    const res: Observable<MicroserviceResponse> = this._masterService.send(
      { cmd: 'productLocation.compare', service: 'product-location' },
      { location_id_1, location_id_2, user_id, bu_code, paginate, version, ...getGatewayRequestContext() },
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
   * Refresh denormalized fields ใน tb_product_location ผ่านไมโครเซอร์วิส
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @returns จำนวนรายการที่อัปเดต
   */
  async refreshProductLocations(
    user_id: string,
    bu_code: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'refreshProductLocations',
        user_id,
        bu_code,
      },
      Config_LocationProductService.name,
    );

    const res: Observable<MicroserviceResponse> = this._masterService.send(
      { cmd: 'productLocation.refresh', service: 'product-location' },
      {
        user_id: user_id,
        bu_code: bu_code, ...getGatewayRequestContext() },
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
