import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';
import {
  ICreateExchangeRate,
  IUpdateExchangeRate,
  Result,
  MicroserviceResponse,
} from '@/common';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class Config_ExchangeRateService {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_ExchangeRateService.name,
  );

  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly masterService: ClientProxy,
  ) {}

  /**
   * Find an exchange rate by ID via microservice
   * ค้นหาอัตราแลกเปลี่ยนเดียวตาม ID ผ่านไมโครเซอร์วิส
   * @param id - Exchange rate ID / รหัสอัตราแลกเปลี่ยน
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Exchange rate data or error / ข้อมูลอัตราแลกเปลี่ยนหรือข้อผิดพลาด
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
      Config_ExchangeRateService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'exchange-rate.findOne', service: 'exchange-rate' },
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
   * Find all exchange rates with pagination via microservice
   * ค้นหาอัตราแลกเปลี่ยนทั้งหมดพร้อมการแบ่งหน้าผ่านไมโครเซอร์วิส
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param query - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated exchange rate data or error / ข้อมูลอัตราแลกเปลี่ยนพร้อมการแบ่งหน้าหรือข้อผิดพลาด
   */
  async findAll(
    user_id: string,
    bu_code: string,
    query: IPaginate,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'findAll',
        query,
        version,
      },
      Config_ExchangeRateService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'exchange-rate.findAll', service: 'exchange-rate' },
      {
        user_id: user_id,
        bu_code: bu_code,
        paginate: query,
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
   * Find exchange rate by date and currency code via microservice
   * ค้นหาอัตราแลกเปลี่ยนตามวันที่และรหัสสกุลเงินผ่านไมโครเซอร์วิส
   * @param date - Exchange rate date / วันที่ของอัตราแลกเปลี่ยน
   * @param currency_code - Currency code / รหัสสกุลเงิน
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Exchange rate data or error / ข้อมูลอัตราแลกเปลี่ยนหรือข้อผิดพลาด
   */
  async findByDateAndCurrency(
    date: string,
    currency_code: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'findByDateAndCurrency',
        date,
        currency_code,
        version,
      },
      Config_ExchangeRateService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'exchange-rate.findByDateAndCurrency', service: 'exchange-rate' },
      { date, currency_code, user_id, bu_code, version, ...getGatewayRequestContext() },
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
   * Create a new exchange rate via microservice
   * สร้างอัตราแลกเปลี่ยนใหม่ผ่านไมโครเซอร์วิส
   * @param createDto - Exchange rate creation data (single or bulk) / ข้อมูลสำหรับสร้างอัตราแลกเปลี่ยน (เดี่ยวหรือจำนวนมาก)
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Created exchange rate or error / อัตราแลกเปลี่ยนที่สร้างแล้วหรือข้อผิดพลาด
   */
  async create(
    createDto: ICreateExchangeRate | ICreateExchangeRate[],
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
      Config_ExchangeRateService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'exchange-rate.create', service: 'exchange-rate' },
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
   * Update an existing exchange rate via microservice
   * อัปเดตอัตราแลกเปลี่ยนที่มีอยู่ผ่านไมโครเซอร์วิส
   * @param updateDto - Update data / ข้อมูลสำหรับอัปเดต
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Updated exchange rate or error / อัตราแลกเปลี่ยนที่อัปเดตแล้วหรือข้อผิดพลาด
   */
  async update(
    updateDto: IUpdateExchangeRate,
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
      Config_ExchangeRateService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'exchange-rate.update', service: 'exchange-rate' },
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
   * Delete an exchange rate by ID via microservice
   * ลบอัตราแลกเปลี่ยนตาม ID ผ่านไมโครเซอร์วิส
   * @param id - Exchange rate ID / รหัสอัตราแลกเปลี่ยน
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result or error / ผลการลบหรือข้อผิดพลาด
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
      Config_ExchangeRateService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'exchange-rate.delete', service: 'exchange-rate' },
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
