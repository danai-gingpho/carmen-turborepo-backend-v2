import { Injectable, Inject, HttpStatus } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';
import {
  ICreateProductItemGroup,
  IUpdateProductItemGroup,
  Result,
  MicroserviceResponse,
} from '@/common';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class Config_ProductItemGroupService {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_ProductItemGroupService.name,
  );

  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly masterService: ClientProxy,
  ) {}

  /**
   * Find a product item group by ID via microservice
   * ค้นหารายการเดียวตาม ID ของกลุ่มสินค้าผ่านไมโครเซอร์วิส
   * @param id - Product item group ID / รหัสกลุ่มสินค้า
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Product item group detail or error / รายละเอียดกลุ่มสินค้าหรือข้อผิดพลาด
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
        version,
      },
      Config_ProductItemGroupService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'product-item-group.findOne', service: 'product-item-group' },
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
   * Find all product item groups with pagination via microservice
   * ค้นหารายการทั้งหมดของกลุ่มสินค้าพร้อมการแบ่งหน้าผ่านไมโครเซอร์วิส
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated product item groups or error / รายการกลุ่มสินค้าแบบแบ่งหน้าหรือข้อผิดพลาด
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
      Config_ProductItemGroupService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'product-item-group.findAll', service: 'product-item-group' },
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
   * Create a new product item group via microservice
   * สร้างกลุ่มสินค้าใหม่ผ่านไมโครเซอร์วิส
   * @param createDto - Product item group creation data / ข้อมูลสำหรับสร้างกลุ่มสินค้า
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Created product item group or error / กลุ่มสินค้าที่สร้างแล้วหรือข้อผิดพลาด
   */
  async create(
    createDto: ICreateProductItemGroup,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      Config_ProductItemGroupService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'product-item-group.create', service: 'product-item-group' },
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
   * Update an existing product item group via microservice
   * อัปเดตกลุ่มสินค้าที่มีอยู่ผ่านไมโครเซอร์วิส
   * @param updateDto - Product item group update data / ข้อมูลสำหรับอัปเดตกลุ่มสินค้า
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Updated product item group or error / กลุ่มสินค้าที่อัปเดตแล้วหรือข้อผิดพลาด
   */
  async update(
    updateDto: IUpdateProductItemGroup,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'update',
        updateDto,
        version,
      },
      Config_ProductItemGroupService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'product-item-group.update', service: 'product-item-group' },
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
   * Delete a product item group via microservice
   * ลบกลุ่มสินค้าผ่านไมโครเซอร์วิส
   * @param id - Product item group ID / รหัสกลุ่มสินค้า
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
        version,
      },
      Config_ProductItemGroupService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'product-item-group.delete', service: 'product-item-group' },
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
