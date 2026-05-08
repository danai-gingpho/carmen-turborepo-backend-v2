import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import {
  ICreateTaxProfile,
  IUpdateTaxProfile,
  Result,
  MicroserviceResponse,
} from '@/common';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class Config_TaxProfileService {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_TaxProfileService.name,
  );

  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly masterService: ClientProxy,
  ) { }

  /**
   * Find a single tax profile by ID via microservice
   * ค้นหาโปรไฟล์ภาษีเดียวตาม ID ผ่านไมโครเซอร์วิส
   * @param id - Tax profile ID / รหัสโปรไฟล์ภาษี
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Tax profile detail or error / รายละเอียดโปรไฟล์ภาษีหรือข้อผิดพลาด
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
      Config_TaxProfileService.name,
    );
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'tax-profile.findOne', service: 'tax-profile' },
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
   * Find all tax profiles with pagination via microservice
   * ค้นหารายการโปรไฟล์ภาษีทั้งหมดพร้อมการแบ่งหน้าผ่านไมโครเซอร์วิส
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param query - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated tax profiles or error / รายการโปรไฟล์ภาษีพร้อมการแบ่งหน้าหรือข้อผิดพลาด
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
        user_id,
        bu_code,
        query,
        version,
      },
      Config_TaxProfileService.name,
    );
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'tax-profile.findAll', service: 'tax-profile' },
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
   * Create a new tax profile via microservice
   * สร้างโปรไฟล์ภาษีใหม่ผ่านไมโครเซอร์วิส
   * @param createDto - Tax profile creation data / ข้อมูลสำหรับสร้างโปรไฟล์ภาษี
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Created tax profile or error / โปรไฟล์ภาษีที่สร้างแล้วหรือข้อผิดพลาด
   */
  async create(
    createDto: ICreateTaxProfile,
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
      Config_TaxProfileService.name,
    );
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'tax-profile.create', service: 'tax-profile' },
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
   * Update a tax profile via microservice
   * อัปเดตโปรไฟล์ภาษีผ่านไมโครเซอร์วิส
   * @param id - Tax profile ID / รหัสโปรไฟล์ภาษี
   * @param updateDto - Tax profile update data / ข้อมูลสำหรับอัปเดตโปรไฟล์ภาษี
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Updated tax profile or error / โปรไฟล์ภาษีที่อัปเดตแล้วหรือข้อผิดพลาด
   */
  async update(
    id: string,
    updateDto: IUpdateTaxProfile,
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
      Config_TaxProfileService.name,
    );
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'tax-profile.update', service: 'tax-profile' },
      {
        id: id,
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
   * Delete a tax profile via microservice
   * ลบโปรไฟล์ภาษีผ่านไมโครเซอร์วิส
   * @param id - Tax profile ID / รหัสโปรไฟล์ภาษี
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
      Config_TaxProfileService.name,
    );
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'tax-profile.delete', service: 'tax-profile' },
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
