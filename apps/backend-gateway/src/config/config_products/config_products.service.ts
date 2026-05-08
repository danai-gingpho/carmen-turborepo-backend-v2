import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ICreateProduct, IUpdateProduct, Result, MicroserviceResponse } from '@/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class Config_ProductsService {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_ProductsService.name,
  );
  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly masterService: ClientProxy,
  ) { }

  /**
   * Find a single product by ID via microservice
   * ค้นหาสินค้าเดียวตาม ID ผ่านไมโครเซอร์วิส
   * @param id - Product ID / รหัสสินค้า
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Product detail or error / รายละเอียดสินค้าหรือข้อผิดพลาด
   */
  async findOne(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        user_id,
        bu_code,
        version,
      },
      Config_ProductsService.name,
    );
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'products.findOne', service: 'products' },
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
   * Find all products with pagination via microservice
   * ค้นหารายการสินค้าทั้งหมดพร้อมการแบ่งหน้าผ่านไมโครเซอร์วิส
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated products or error / รายการสินค้าพร้อมการแบ่งหน้าหรือข้อผิดพลาด
   */
  async findAll(
    user_id: string,
    bu_code: string,
    paginate: IPaginate,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'findAll',
        user_id,
        bu_code,
        paginate,
        version,
      },
      Config_ProductsService.name,
    );
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'products.findAll', service: 'products' },
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
   * Create a new product via microservice
   * สร้างสินค้าใหม่ผ่านไมโครเซอร์วิส
   * @param createDto - Product creation data / ข้อมูลสำหรับสร้างสินค้า
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Created product or error / สินค้าที่สร้างแล้วหรือข้อผิดพลาด
   */
  async create(
    createDto: ICreateProduct,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        user_id,
        bu_code,
        version,
      },
      Config_ProductsService.name,
    );
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'products.create', service: 'products' },
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
   * Update a product via microservice
   * อัปเดตสินค้าผ่านไมโครเซอร์วิส
   * @param updateDto - Product update data / ข้อมูลสำหรับอัปเดตสินค้า
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Updated product or error / สินค้าที่อัปเดตแล้วหรือข้อผิดพลาด
   */
  async update(
    updateDto: IUpdateProduct,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'update',
        updateDto,
        user_id,
        bu_code,
        version,
      },
      Config_ProductsService.name,
    );
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'products.update', service: 'products' },
      {
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
   * Delete a product via microservice
   * ลบสินค้าผ่านไมโครเซอร์วิส
   * @param id - Product ID / รหัสสินค้า
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result or error / ผลลัพธ์การลบหรือข้อผิดพลาด
   */
  async delete(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'delete',
        id,
        user_id,
        bu_code,
        version,
      },
      Config_ProductsService.name,
    );
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'products.delete', service: 'products' },
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
   * Find item group for a product via microservice
   * ค้นหากลุ่มสินค้าตามรหัสสินค้าผ่านไมโครเซอร์วิส
   * @param id - Product ID / รหัสสินค้า
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Product item group or error / กลุ่มสินค้าหรือข้อผิดพลาด
   */
  async findItemGroup(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'findItemGroup',
        id,
        user_id,
        bu_code,
        version,
      },
      Config_ProductsService.name,
    );
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'products.findItemGroup', service: 'products' },
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

}
