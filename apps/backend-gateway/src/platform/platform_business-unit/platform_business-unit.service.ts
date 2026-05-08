import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  IBusinessUnitCreate,
  IBusinessUnitUpdate,
} from './dto/business-unit.dto';
import { firstValueFrom, Observable } from 'rxjs';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { Result, MicroserviceResponse } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { BackendLogger } from 'src/common/helpers/backend.logger';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class Platform_BusinessUnitService {
  private readonly logger: BackendLogger = new BackendLogger(
    Platform_BusinessUnitService.name,
  );

  constructor(
    @Inject('CLUSTER_SERVICE')
    private readonly businessUnitService: ClientProxy,
  ) { }

  /**
   * Create a new business unit via microservice
   * สร้างหน่วยธุรกิจใหม่ผ่านไมโครเซอร์วิส
   * @param data - Business unit creation data / ข้อมูลสำหรับสร้างหน่วยธุรกิจ
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param tenant_id - Tenant ID / รหัสผู้เช่า
   * @param version - API version / เวอร์ชัน API
   * @returns Created business unit / หน่วยธุรกิจที่ถูกสร้าง
   */
  async createBusinessUnit(
    data: IBusinessUnitCreate,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'createBusinessUnit',
        data,
        user_id,
        tenant_id,
        version,
      },
      Platform_BusinessUnitService.name,
    );
    const res: Observable<MicroserviceResponse> = this.businessUnitService.send(
      { cmd: 'business-unit.create', service: 'business-unit' },
      { data: data, user_id: user_id, tenant_id: tenant_id, version: version, ...getGatewayRequestContext() },
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
   * Update an existing business unit via microservice
   * อัปเดตข้อมูลหน่วยธุรกิจที่มีอยู่ผ่านไมโครเซอร์วิส
   * @param data - Business unit update data / ข้อมูลสำหรับอัปเดตหน่วยธุรกิจ
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param tenant_id - Tenant ID / รหัสผู้เช่า
   * @param version - API version / เวอร์ชัน API
   * @returns Updated business unit / หน่วยธุรกิจที่ถูกอัปเดต
   */
  async updateBusinessUnit(
    data: IBusinessUnitUpdate,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'updateBusinessUnit',
        data,
        user_id,
        tenant_id,
        version,
      },
      Platform_BusinessUnitService.name,
    );
    const res: Observable<MicroserviceResponse> = this.businessUnitService.send(
      { cmd: 'business-unit.update', service: 'business-unit' },
      { data: data, user_id: user_id, tenant_id: tenant_id, version: version, ...getGatewayRequestContext() },
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
   * Delete a business unit via microservice
   * ลบหน่วยธุรกิจผ่านไมโครเซอร์วิส
   * @param id - Business unit ID / รหัสหน่วยธุรกิจ
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param tenant_id - Tenant ID / รหัสผู้เช่า
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  async deleteBusinessUnit(
    id: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'deleteBusinessUnit',
        id,
        user_id,
        tenant_id,
        version,
      },
      Platform_BusinessUnitService.name,
    );
    const res: Observable<MicroserviceResponse> = this.businessUnitService.send(
      { cmd: 'business-unit.delete', service: 'business-unit' },
      { id: id, user_id: user_id, tenant_id: tenant_id, version: version, ...getGatewayRequestContext() },
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
   * Retrieve all business units with pagination
   * ค้นหารายการหน่วยธุรกิจทั้งหมดพร้อมการแบ่งหน้า
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param tenant_id - Tenant ID / รหัสผู้เช่า
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated business unit list / รายการหน่วยธุรกิจแบบแบ่งหน้า
   */
  async getBusinessUnitList(
    user_id: string,
    tenant_id: string,
    paginate: IPaginate,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'getBusinessUnitList',
        user_id,
        tenant_id,
        paginate,
        version,
      },
      Platform_BusinessUnitService.name,
    );
    const res: Observable<MicroserviceResponse> = this.businessUnitService.send(
      { cmd: 'business-unit.list', service: 'business-unit' },
      {
        data: null,
        user_id: user_id,
        tenant_id: tenant_id,
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

    return Result.ok({
      data: response.data,
      paginate: response.paginate,
    });
  }

  /**
   * Retrieve a single business unit by ID
   * ค้นหาหน่วยธุรกิจเดียวตาม ID
   * @param id - Business unit ID / รหัสหน่วยธุรกิจ
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param tenant_id - Tenant ID / รหัสผู้เช่า
   * @param version - API version / เวอร์ชัน API
   * @returns Business unit details / รายละเอียดหน่วยธุรกิจ
   */
  async getBusinessUnitById(
    id: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'getBusinessUnitById',
        id,
        user_id,
        tenant_id,
        version,
      },
      Platform_BusinessUnitService.name,
    );
    const res: Observable<MicroserviceResponse> = this.businessUnitService.send(
      { cmd: 'business-unit.get-by-id', service: 'business-unit' },
      { id: id, user_id: user_id, tenant_id: tenant_id, version: version, ...getGatewayRequestContext() },
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
