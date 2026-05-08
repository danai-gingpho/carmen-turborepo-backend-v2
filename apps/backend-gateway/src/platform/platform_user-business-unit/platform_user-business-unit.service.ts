import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import {
  IUserBusinessUnit,
  IUserBusinessUnitUpdate,
} from './dto/platform_user-business-unit.dto';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { Result, MicroserviceResponse } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class Platform_UserBusinessUnitService {
  private readonly logger: BackendLogger = new BackendLogger(
    Platform_UserBusinessUnitService.name,
  );

  constructor(
    @Inject('CLUSTER_SERVICE') private readonly clusterService: ClientProxy,
  ) { }

  /**
   * Retrieve a single user-business unit mapping by ID
   * ค้นหาการเชื่อมโยงผู้ใช้กับหน่วยธุรกิจเดียวตาม ID
   * @param id - Mapping ID / รหัสการเชื่อมโยง
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param version - API version / เวอร์ชัน API
   * @returns Mapping details / รายละเอียดการเชื่อมโยง
   */
  async findOne(id: string, user_id: string, version: string): Promise<unknown> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        user_id,
        version,
      },
      Platform_UserBusinessUnitService.name,
    );
    const res: Observable<MicroserviceResponse> = this.clusterService.send(
      { cmd: 'user-business-unit.findOne', service: 'business-unit' },
      { id: id, user_id: user_id, version: version, ...getGatewayRequestContext() },
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
   * Retrieve all user-business unit mappings with pagination
   * ค้นหารายการการเชื่อมโยงผู้ใช้กับหน่วยธุรกิจทั้งหมดพร้อมการแบ่งหน้า
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated mapping list / รายการการเชื่อมโยงแบบแบ่งหน้า
   */
  async findAll(
    user_id: string,
    paginate: IPaginate,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'findAll',
        user_id,
        paginate,
        version,
      },
      Platform_UserBusinessUnitService.name,
    );
    const res: Observable<MicroserviceResponse> = this.clusterService.send(
      { cmd: 'user-business-unit.findAll', service: 'business-unit' },
      {
        user_id: user_id,
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
   * Create a new user-business unit mapping via microservice
   * สร้างการเชื่อมโยงผู้ใช้กับหน่วยธุรกิจใหม่ผ่านไมโครเซอร์วิส
   * @param data - Mapping creation data / ข้อมูลสำหรับสร้างการเชื่อมโยง
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param version - API version / เวอร์ชัน API
   * @returns Created mapping / การเชื่อมโยงที่ถูกสร้าง
   */
  async create(
    data: IUserBusinessUnit,
    user_id: string,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'create',
        data,
        user_id,
        version,
      },
      Platform_UserBusinessUnitService.name,
    );
    const res: Observable<MicroserviceResponse> = this.clusterService.send(
      { cmd: 'user-business-unit.create', service: 'business-unit' },
      { data: data, user_id: user_id, version: version, ...getGatewayRequestContext() },
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
   * Update an existing user-business unit mapping via microservice
   * อัปเดตการเชื่อมโยงผู้ใช้กับหน่วยธุรกิจที่มีอยู่ผ่านไมโครเซอร์วิส
   * @param data - Mapping update data / ข้อมูลสำหรับอัปเดตการเชื่อมโยง
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param version - API version / เวอร์ชัน API
   * @returns Updated mapping / การเชื่อมโยงที่ถูกอัปเดต
   */
  async update(
    data: IUserBusinessUnitUpdate,
    user_id: string,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'update',
        data,
        user_id,
        version,
      },
      Platform_UserBusinessUnitService.name,
    );
    const res: Observable<MicroserviceResponse> = this.clusterService.send(
      { cmd: 'user-business-unit.update', service: 'business-unit' },
      { data: data, user_id: user_id, version: version, ...getGatewayRequestContext() },
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
   * Delete a user-business unit mapping via microservice
   * ลบการเชื่อมโยงผู้ใช้กับหน่วยธุรกิจผ่านไมโครเซอร์วิส
   * @param id - Mapping ID / รหัสการเชื่อมโยง
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  async delete(id: string, user_id: string, version: string): Promise<unknown> {
    this.logger.debug(
      {
        function: 'delete',
        id,
        user_id,
        version,
      },
      Platform_UserBusinessUnitService.name,
    );
    const res: Observable<MicroserviceResponse> = this.clusterService.send(
      { cmd: 'user-business-unit.delete', service: 'business-unit' },
      { id: id, user_id: user_id, version: version, ...getGatewayRequestContext() },
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
