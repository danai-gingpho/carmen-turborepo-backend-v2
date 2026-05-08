import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import {
  ICreateCreditTerm,
  IUpdateCreditTerm,
  Result,
  MicroserviceResponse,
} from '@/common';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class Config_CreditTermService {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_CreditTermService.name,
  );

  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly masterService: ClientProxy,
  ) {}

  /**
   * Find a single credit term by ID via microservice
   * ค้นหาเงื่อนไขการชำระเงินเดียวตาม ID ผ่านไมโครเซอร์วิส
   * @param id - Credit term ID / รหัสเงื่อนไขการชำระเงิน
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Credit term detail or error / รายละเอียดเงื่อนไขการชำระเงินหรือข้อผิดพลาด
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
      Config_CreditTermService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'credit-term.findOne', service: 'credit-term' },
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
   * Find all credit terms with pagination via microservice
   * ค้นหารายการเงื่อนไขการชำระเงินทั้งหมดพร้อมการแบ่งหน้าผ่านไมโครเซอร์วิส
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param query - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated credit terms or error / รายการเงื่อนไขการชำระเงินพร้อมการแบ่งหน้าหรือข้อผิดพลาด
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
      Config_CreditTermService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'credit-term.findAll', service: 'credit-term' },
      {
        user_id: user_id,
        paginate: query,
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

    return Result.ok({ data: response.data, paginate: response.paginate });
  }

  /**
   * Create a new credit term via microservice
   * สร้างเงื่อนไขการชำระเงินใหม่ผ่านไมโครเซอร์วิส
   * @param createDto - Credit term creation data / ข้อมูลสำหรับสร้างเงื่อนไขการชำระเงิน
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Created credit term or error / เงื่อนไขการชำระเงินที่สร้างแล้วหรือข้อผิดพลาด
   */
  async create(
    createDto: ICreateCreditTerm,
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
      Config_CreditTermService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'credit-term.create', service: 'credit-term' },
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
   * Update a credit term via microservice
   * อัปเดตเงื่อนไขการชำระเงินผ่านไมโครเซอร์วิส
   * @param updateDto - Credit term update data / ข้อมูลสำหรับอัปเดตเงื่อนไขการชำระเงิน
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Updated credit term or error / เงื่อนไขการชำระเงินที่อัปเดตแล้วหรือข้อผิดพลาด
   */
  async update(
    updateDto: IUpdateCreditTerm,
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
      Config_CreditTermService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'credit-term.update', service: 'credit-term' },
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
   * Delete a credit term via microservice
   * ลบเงื่อนไขการชำระเงินผ่านไมโครเซอร์วิส
   * @param id - Credit term ID / รหัสเงื่อนไขการชำระเงิน
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
      Config_CreditTermService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'credit-term.delete', service: 'credit-term' },
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
