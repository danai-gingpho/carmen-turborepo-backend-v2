import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Observable } from 'rxjs';
import { Result, MicroserviceResponse } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class ProductsService {
  private readonly logger: BackendLogger = new BackendLogger(
    ProductsService.name,
  );

  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly masterService: ClientProxy,
  ) { }

  /**
   * Get all products assigned to a specific location via microservice
   * ค้นหารายการสินค้าทั้งหมดที่ผูกกับสถานที่ผ่านไมโครเซอร์วิส
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param location_id - Location ID / รหัสสถานที่
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated list of products at the location / รายการสินค้าที่สถานที่แบบแบ่งหน้า
   */
  async getByLocation(
    user_id: string,
    bu_code: string,
    location_id: string,
    paginate: IPaginate,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'getByLocation',
        user_id,
        bu_code,
        location_id,
        paginate,
        version,
      },
      ProductsService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'products.getByLocationId', service: 'products' },
      {
        user_id: user_id,
        bu_code: bu_code,
        location_id: location_id,
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

  async getLastPurchase(
    product_id: string,
    date: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'getLastPurchase', product_id, date, user_id, bu_code, version },
      ProductsService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'product.get-last-purchase', service: 'product' },
      { product_id, date, user_id, bu_code, version, ...getGatewayRequestContext() },
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

  async getOnHand(
    product_id: string,
    user_id: string,
    bu_code: string,
    version: string,
    location_id?: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'getOnHand', product_id, location_id, user_id, bu_code, version },
      ProductsService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'product.get-on-hand', service: 'product' },
      { product_id, location_id, user_id, bu_code, version, ...getGatewayRequestContext() },
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

  async getProductCost(
    product_id: string,
    location_id: string,
    quantity: number,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'getProductCost', product_id, location_id, quantity, user_id, bu_code, version },
      ProductsService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'product.get-cost', service: 'product' },
      { product_id, location_id, quantity, user_id, bu_code, version, ...getGatewayRequestContext() },
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

  async getOnOrder(
    product_id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'getOnOrder', product_id, user_id, bu_code, version },
      ProductsService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'product.get-on-order', service: 'product' },
      { product_id, user_id, bu_code, version, ...getGatewayRequestContext() },
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

  async getInventoryMovement(
    product_id: string,
    start_at: string,
    end_at: string,
    user_id: string,
    bu_code: string,
    version: string,
    location_id?: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'getInventoryMovement', product_id, start_at, end_at, location_id, user_id, bu_code, version },
      ProductsService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'product.get-inventory-movement', service: 'product' },
      { product_id, start_at, end_at, location_id, user_id, bu_code, version, ...getGatewayRequestContext() },
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

  async listProductsWithMovement(
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'listProductsWithMovement', user_id, bu_code, version },
      ProductsService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'product.list-with-movement', service: 'product' },
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

  async listLocationsWithMovement(
    product_id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'listLocationsWithMovement', product_id, user_id, bu_code, version },
      ProductsService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'product.list-locations-with-movement', service: 'product' },
      { product_id, user_id, bu_code, version, ...getGatewayRequestContext() },
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

  async listLocationsWithAnyMovement(
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'listLocationsWithAnyMovement', user_id, bu_code, version },
      ProductsService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'product.list-locations-with-any-movement', service: 'product' },
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

  async listProductsWithMovementAtLocation(
    location_id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'listProductsWithMovementAtLocation', location_id, user_id, bu_code, version },
      ProductsService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'product.list-products-with-movement-at-location', service: 'product' },
      { location_id, user_id, bu_code, version, ...getGatewayRequestContext() },
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
