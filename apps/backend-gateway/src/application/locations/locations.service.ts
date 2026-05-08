import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { Result, MicroserviceResponse } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { IPaginate } from 'src/shared-dto/paginate.dto';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class LocationsService {
  private readonly logger: BackendLogger = new BackendLogger(
    LocationsService.name,
  );
  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly masterService: ClientProxy,
  ) { }

  /**
   * Find a specific location by ID via microservice
   * ค้นหารายการสถานที่เดียวตาม ID ผ่านไมโครเซอร์วิส
   * @param id - Location ID / รหัสสถานที่
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param withUser - Include assigned users / รวมผู้ใช้ที่ผูกไว้
   * @param withProducts - Include stocked products / รวมสินค้าที่มีในสต็อก
   * @param version - API version / เวอร์ชัน API
   * @returns Location details / รายละเอียดสถานที่
   */
  async findOne(
    id: string,
    user_id: string,
    bu_code: string,
    withUser: boolean,
    withProducts: boolean,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        user_id,
        bu_code,
        version,
        withUser,
        withProducts,
      },
      LocationsService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'locations.findOne', service: 'locations' },
      { id: id, user_id: user_id, bu_code: bu_code, withUser: withUser, withProducts: withProducts, version: version, ...getGatewayRequestContext() },
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
   * Find all locations for a business unit via microservice
   * ค้นหารายการสถานที่ทั้งหมดของหน่วยธุรกิจผ่านไมโครเซอร์วิส
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated list of locations / รายการสถานที่แบบแบ่งหน้า
   */
  async findAll(
    user_id: string,
    bu_code: string,
    paginate: IPaginate,
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
      LocationsService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'locations.findAll', service: 'locations' },
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

    // console.log("response:", response);
    return Result.ok({ data: response.data, paginate: response.paginate });
  }

  /**
   * Find all locations accessible by a specific user
   * ค้นหารายการสถานที่ทั้งหมดที่ผู้ใช้เข้าถึงได้
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns List of locations for the user / รายการสถานที่ของผู้ใช้
   */
  async findByUserId(
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'findByUserId',
        user_id,
        bu_code,
        version,
      },
      LocationsService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'locations.findAllByUser', service: 'locations' },
      { user_id: user_id, bu_code: bu_code, version: version, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    // return response.data;
    return Result.ok({ data: response.data, paginate: response.paginate });
  }
  /**
   * Find all locations assigned to a specific product
   * ค้นหารายการสถานที่ทั้งหมดที่มอบหมายให้สินค้าที่ระบุ
   * @param product_id - Product ID / รหัสสินค้า
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns List of locations for the product / รายการสถานที่ของสินค้า
   */
  async findByProductId(
    product_id: string,
    user_id: string,
    bu_code: string,
    paginate: IPaginate,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'findByProductId',
        product_id,
        user_id,
        bu_code,
        paginate,
        version,
      },
      LocationsService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'locations.findAllByProductId', service: 'locations' },
      { product_id, user_id, bu_code, paginate, version, ...getGatewayRequestContext() },
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
   * Get product inventory levels at a specific location
   * ดึงข้อมูลระดับสินค้าคงคลังของสินค้าที่สถานที่เฉพาะ
   * @param location_id - Location ID / รหัสสถานที่
   * @param product_id - Product ID / รหัสสินค้า
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Product inventory info / ข้อมูลสินค้าคงคลัง
   */
  async getProductInventory(location_id: string, product_id: string, user_id: string, bu_code: string, version: string): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'getProductInventory',
        location_id,
        product_id,
        user_id,
        bu_code,
        version,
      },
      LocationsService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'locations-product.getProductInventory', service: 'locations-product-inventory' },
      { location_id: location_id, product_id: product_id, user_id: user_id, bu_code: bu_code, version: version, ...getGatewayRequestContext() },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    // return response.data;
    return Result.ok(response.data);
  }
}
