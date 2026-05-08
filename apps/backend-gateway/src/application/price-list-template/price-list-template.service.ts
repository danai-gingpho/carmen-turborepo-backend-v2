import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Observable } from 'rxjs';
import { Result, MicroserviceResponse, PriceListTemplateCreateDto, PriceListTemplateUpdateDto } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class PriceListTemplateService {
  private readonly logger: BackendLogger = new BackendLogger(
    PriceListTemplateService.name,
  );

  constructor(
    @Inject('BUSINESS_SERVICE') private readonly masterService: ClientProxy,
  ) {}

  /**
   * Find a specific price list template by ID via microservice
   * ค้นหาเทมเพลตรายการราคาเดียวตาม ID ผ่านไมโครเซอร์วิส
   * @param id - Price list template ID / รหัสเทมเพลตรายการราคา
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Price list template details / รายละเอียดเทมเพลตรายการราคา
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
      PriceListTemplateService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'price-list-template.findOne', service: 'price-list-template' },
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
   * Find all price list templates for a business unit via microservice
   * ค้นหาเทมเพลตรายการราคาทั้งหมดของหน่วยธุรกิจผ่านไมโครเซอร์วิส
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated list of price list templates / รายการเทมเพลตรายการราคาแบบแบ่งหน้า
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
      PriceListTemplateService.name,
    );
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'price-list-template.findAll', service: 'price-list-template' },
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
   * Create a new price list template via microservice
   * สร้างเทมเพลตรายการราคาใหม่ผ่านไมโครเซอร์วิส
   * @param data - Price list template creation data / ข้อมูลสำหรับสร้างเทมเพลตรายการราคา
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Created price list template / เทมเพลตรายการราคาที่สร้างแล้ว
   */
  async create(
    data: PriceListTemplateCreateDto,
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
      PriceListTemplateService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'price-list-template.create', service: 'price-list-template' },
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
   * Update an existing price list template via microservice
   * อัปเดตเทมเพลตรายการราคาที่มีอยู่ผ่านไมโครเซอร์วิส
   * @param data - Price list template update data / ข้อมูลสำหรับอัปเดตเทมเพลตรายการราคา
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Updated price list template / เทมเพลตรายการราคาที่อัปเดตแล้ว
   */
  async update(
    data: PriceListTemplateUpdateDto,
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
      PriceListTemplateService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'price-list-template.update', service: 'price-list-template' },
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
   * Delete a price list template by ID via microservice
   * ลบเทมเพลตรายการราคาตาม ID ผ่านไมโครเซอร์วิส
   * @param id - Price list template ID / รหัสเทมเพลตรายการราคา
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
      PriceListTemplateService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'price-list-template.remove', service: 'price-list-template' },
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
   * Update the status of a price list template via microservice
   * อัปเดตสถานะของเทมเพลตรายการราคาผ่านไมโครเซอร์วิส
   * @param id - Price list template ID / รหัสเทมเพลตรายการราคา
   * @param status - New status value / ค่าสถานะใหม่
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Updated template status / สถานะเทมเพลตที่อัปเดตแล้ว
   */
  async updateStatus(
    id: string,
    status: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'updateStatus',
        id,
        status,
        user_id,
        bu_code,
        version,
      },
      PriceListTemplateService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'price-list-template.updateStatus', service: 'price-list-template' },
      { id: id, status: status, user_id: user_id, bu_code: bu_code, version: version, ...getGatewayRequestContext() },
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
