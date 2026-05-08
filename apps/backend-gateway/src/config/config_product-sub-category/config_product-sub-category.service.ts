import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';
import {
  ICreateProductSubCategory,
  IUpdateProductSubCategory,
  Result,
  MicroserviceResponse,
} from '@/common';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class Config_ProductSubCategoryService {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_ProductSubCategoryService.name,
  );

  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly masterService: ClientProxy,
  ) {}

  /**
   * Find a product sub-category by ID via microservice
   * ค้นหารายการเดียวตาม ID ของหมวดหมู่ย่อยสินค้าผ่านไมโครเซอร์วิส
   * @param id - Product sub-category ID / รหัสหมวดหมู่ย่อยสินค้า
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Product sub-category detail or error / รายละเอียดหมวดหมู่ย่อยสินค้าหรือข้อผิดพลาด
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
      Config_ProductSubCategoryService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'product-sub-category.findOne', service: 'product-sub-category' },
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
   * Find all product sub-categories with pagination via microservice
   * ค้นหารายการทั้งหมดของหมวดหมู่ย่อยสินค้าพร้อมการแบ่งหน้าผ่านไมโครเซอร์วิส
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated product sub-categories or error / รายการหมวดหมู่ย่อยสินค้าแบบแบ่งหน้าหรือข้อผิดพลาด
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
      Config_ProductSubCategoryService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'product-sub-category.findAll', service: 'product-sub-category' },
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

  /**
   * Create a new product sub-category via microservice
   * สร้างหมวดหมู่ย่อยสินค้าใหม่ผ่านไมโครเซอร์วิส
   * @param createDto - Product sub-category creation data / ข้อมูลสำหรับสร้างหมวดหมู่ย่อยสินค้า
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Created product sub-category or error / หมวดหมู่ย่อยสินค้าที่สร้างแล้วหรือข้อผิดพลาด
   */
  async create(
    createDto: ICreateProductSubCategory,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        user_id,
        bu_code,
        version,
      },
      Config_ProductSubCategoryService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'product-sub-category.create', service: 'product-sub-category' },
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
   * Update an existing product sub-category via microservice
   * อัปเดตหมวดหมู่ย่อยสินค้าที่มีอยู่ผ่านไมโครเซอร์วิส
   * @param updateDto - Product sub-category update data / ข้อมูลสำหรับอัปเดตหมวดหมู่ย่อยสินค้า
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Updated product sub-category or error / หมวดหมู่ย่อยสินค้าที่อัปเดตแล้วหรือข้อผิดพลาด
   */
  async update(
    updateDto: IUpdateProductSubCategory,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'update',
        updateDto,
        user_id,
        bu_code,
        version,
      },
      Config_ProductSubCategoryService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'product-sub-category.update', service: 'product-sub-category' },
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
   * Delete a product sub-category via microservice
   * ลบหมวดหมู่ย่อยสินค้าผ่านไมโครเซอร์วิส
   * @param id - Product sub-category ID / รหัสหมวดหมู่ย่อยสินค้า
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
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'delete',
        id,
        user_id,
        bu_code,
        version,
      },
      Config_ProductSubCategoryService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'product-sub-category.delete', service: 'product-sub-category' },
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
