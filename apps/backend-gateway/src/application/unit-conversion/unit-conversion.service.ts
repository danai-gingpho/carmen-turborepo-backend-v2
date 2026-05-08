import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { Result, MicroserviceResponse } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { BackendLogger } from 'src/common/helpers/backend.logger';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class UnitConversionService {
  private readonly logger: BackendLogger = new BackendLogger(
    UnitConversionService.name,
  );

  constructor(
    @Inject('BUSINESS_SERVICE') private readonly masterService: ClientProxy,
  ) { }

  /**
   * Get available ordering units for a product via microservice
   * ดึงหน่วยสั่งซื้อที่ใช้ได้สำหรับสินค้าผ่านไมโครเซอร์วิส
   * @param productId - Product ID / รหัสสินค้า
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns List of order units / รายการหน่วยสั่งซื้อ
   */
  async getOrderUnitProduct(
    productId: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'getOrderUnitProduct',
        productId,
        version,
      },
      UnitConversionService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'unit.get-order-unit-by-product-id', service: 'unit-conversion' },
      { productId, user_id, bu_code, version, ...getGatewayRequestContext() },
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
   * Get available ingredient units for a product via microservice
   * ดึงหน่วยส่วนผสมที่ใช้ได้สำหรับสินค้าผ่านไมโครเซอร์วิส
   * @param productId - Product ID / รหัสสินค้า
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns List of ingredient units / รายการหน่วยส่วนผสม
   */
  async getIngredientUnitProduct(
    productId: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'getIngredientUnitProduct',
        productId,
        version,
      },
      UnitConversionService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'unit.get-ingredient-unit-by-product-id', service: 'unit-conversion' },
      { productId, user_id, bu_code, version, ...getGatewayRequestContext() },
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
   * Get all available unit conversions for a product via microservice
   * ดึงการแปลงหน่วยทั้งหมดที่ใช้ได้สำหรับสินค้าผ่านไมโครเซอร์วิส
   * @param productId - Product ID / รหัสสินค้า
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns List of available unit conversions / รายการการแปลงหน่วยที่ใช้ได้
   */
  async getAvailableUnitProduct(
    productId: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'getAvailableUnitProduct',
        productId,
        version,
      },
      UnitConversionService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'unit.get-available-unit-by-product-id', service: 'unit-conversion' },
      { productId, user_id, bu_code, version, ...getGatewayRequestContext() },
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