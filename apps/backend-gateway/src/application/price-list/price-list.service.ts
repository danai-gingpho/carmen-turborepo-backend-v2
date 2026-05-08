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
export class PriceListService {
  private readonly logger: BackendLogger = new BackendLogger(
    PriceListService.name,
  );

  constructor(
    @Inject('BUSINESS_SERVICE') private readonly masterService: ClientProxy,
  ) { }

  /**
   * Find a specific price list by ID via microservice
   * ค้นหารายการราคาเดียวตาม ID ผ่านไมโครเซอร์วิส
   * @param id - Price list ID / รหัสรายการราคา
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Price list details / รายละเอียดรายการราคา
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
      PriceListService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'price-list.findOne', service: 'price-list' },
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
   * Find all price lists for a business unit via microservice
   * ค้นหารายการราคาทั้งหมดของหน่วยธุรกิจผ่านไมโครเซอร์วิส
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated list of price lists / รายการราคาแบบแบ่งหน้า
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
      PriceListService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'price-list.findAll', service: 'price-list' },
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
   * Compare vendor prices for a product across active price lists
   * เปรียบเทียบราคาสินค้าจากผู้ขายข้ามรายการราคาที่ใช้งานอยู่
   * @param data - Comparison criteria (product_id, due_date, unit_id, currency_id) / เกณฑ์การเปรียบเทียบ
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Price comparison results / ผลลัพธ์การเปรียบเทียบราคา
   */
  async priceCompare(
    data: { product_id: string; due_date: string, unit_id?: string; currency_id: string },
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'priceCompare',
        data,
        user_id,
        bu_code,
        version,
      },
      PriceListService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'price-list.price-compare', service: 'price-list' },
      { data: data, user_id: user_id, bu_code: bu_code, version: version, ...getGatewayRequestContext() },
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
   * Create a new price list via microservice
   * สร้างรายการราคาใหม่ผ่านไมโครเซอร์วิส
   * @param data - Price list creation data / ข้อมูลสำหรับสร้างรายการราคา
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Created price list / รายการราคาที่สร้างแล้ว
   */
  async create(
    data: Record<string, unknown>,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'create',
        data,
        user_id,
        bu_code,
        version,
      },
      PriceListService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'price-list.create', service: 'price-list' },
      { data: data, user_id: user_id, bu_code: bu_code, version: version, ...getGatewayRequestContext() },
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
   * Update an existing price list via microservice
   * อัปเดตรายการราคาที่มีอยู่ผ่านไมโครเซอร์วิส
   * @param data - Price list update data / ข้อมูลสำหรับอัปเดตรายการราคา
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Updated price list / รายการราคาที่อัปเดตแล้ว
   */
  async update(
    data: Record<string, unknown>,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'update',
        data,
        user_id,
        bu_code,
        version,
      },
      PriceListService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'price-list.update', service: 'price-list' },
      { data: data, user_id: user_id, bu_code: bu_code, version: version, ...getGatewayRequestContext() },
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
   * Delete a price list by ID via microservice
   * ลบรายการราคาตาม ID ผ่านไมโครเซอร์วิส
   * @param id - Price list ID / รหัสรายการราคา
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  async remove(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'remove',
        id,
        user_id,
        bu_code,
        version,
      },
      PriceListService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'price-list.remove', service: 'price-list' },
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
