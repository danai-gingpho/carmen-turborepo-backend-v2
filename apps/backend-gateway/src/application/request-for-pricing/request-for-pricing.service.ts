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
export class RequestForPricingService {
  private readonly logger: BackendLogger = new BackendLogger(
    RequestForPricingService.name,
  );

  constructor(
    @Inject('BUSINESS_SERVICE') private readonly masterService: ClientProxy,
  ) {}

  /**
   * Find a Request for Pricing by ID via microservice
   * ค้นหารายการเดียวตาม ID ของเอกสารขอราคาผ่านไมโครเซอร์วิส
   * @param id - Request for Pricing ID / รหัสเอกสารขอราคา
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Request for Pricing data / ข้อมูลเอกสารขอราคา
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
      RequestForPricingService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'request-for-pricing.findOne', service: 'request-for-pricing' },
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
   * Find all Requests for Pricing with pagination via microservice
   * ค้นหารายการทั้งหมดของเอกสารขอราคาพร้อมการแบ่งหน้าผ่านไมโครเซอร์วิส
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated RFP list / รายการเอกสารขอราคาแบบแบ่งหน้า
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
      RequestForPricingService.name,
    );
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'request-for-pricing.findAll', service: 'request-for-pricing' },
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
   * Create a new Request for Pricing via microservice
   * สร้างเอกสารขอราคาใหม่ผ่านไมโครเซอร์วิส
   * @param data - RFP creation data / ข้อมูลสำหรับสร้างเอกสารขอราคา
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Created Request for Pricing / เอกสารขอราคาที่สร้างแล้ว
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
      RequestForPricingService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'request-for-pricing.create', service: 'request-for-pricing' },
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
   * Update a Request for Pricing via microservice
   * อัปเดตเอกสารขอราคาผ่านไมโครเซอร์วิส
   * @param data - Updated RFP data / ข้อมูลเอกสารขอราคาที่อัปเดต
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Updated Request for Pricing / เอกสารขอราคาที่อัปเดตแล้ว
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
      RequestForPricingService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'request-for-pricing.update', service: 'request-for-pricing' },
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
   * Delete a Request for Pricing via microservice
   * ลบเอกสารขอราคาผ่านไมโครเซอร์วิส
   * @param id - Request for Pricing ID / รหัสเอกสารขอราคา
   * @param user_id - User ID / รหัสผู้ใช้
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
      RequestForPricingService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'request-for-pricing.remove', service: 'request-for-pricing' },
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
   * Print a request-for-pricing via FastReport viewer (micro-report)
   * พิมพ์ใบขอราคาผ่าน FastReport viewer (micro-report)
   */
  async printToReport(
    id: string,
    user_id: string,
    bu_code: string,
  ): Promise<Result<{ viewer_url: string }>> {
    this.logger.debug(
      { function: 'printToReport', id },
      RequestForPricingService.name,
    );

    const response = await firstValueFrom(
      this.masterService.send(
        { cmd: 'request-for-pricing.printToReport', service: 'request-for-pricing' },
        { id, user_id, bu_code, ...getGatewayRequestContext() },
      ),
    );

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }
}
