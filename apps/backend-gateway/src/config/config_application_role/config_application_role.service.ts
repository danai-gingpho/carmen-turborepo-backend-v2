import { HttpStatus, Inject, Injectable } from '@nestjs/common'
import { ICreateConfigApplicationRole, IUpdateConfigApplicationRole } from './dto/application_role.dto'
import { ClientProxy } from '@nestjs/microservices'
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { firstValueFrom, Observable } from 'rxjs';
import { Result, MicroserviceResponse } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class ConfigApplicationRoleService {
  private readonly logger: BackendLogger = new BackendLogger(
    ConfigApplicationRoleService.name,
  );
  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly authService: ClientProxy,
  ) { }
  /**
   * Find all application roles with pagination via microservice
   * ค้นหาบทบาทแอปพลิเคชันทั้งหมดพร้อมการแบ่งหน้าผ่านไมโครเซอร์วิส
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated application role data or error / ข้อมูลบทบาทแอปพลิเคชันพร้อมการแบ่งหน้าหรือข้อผิดพลาด
   */
  async findAll(paginate, user_id: string, bu_code: string, version: string) {
    this.logger.debug(
      {
        function: 'findAll',
        user_id,
        bu_code
      },
      ConfigApplicationRoleService.name,
    );

    const res: Observable<MicroserviceResponse> = this.authService.send(
      { cmd: 'role_permission.find-all', service: 'role_permission' },
      {
        paginate,
        user_id,
        bu_code,
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
   * Find an application role by ID via microservice
   * ค้นหาบทบาทแอปพลิเคชันเดียวตาม ID ผ่านไมโครเซอร์วิส
   * @param id - Application role ID / รหัสบทบาทแอปพลิเคชัน
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Application role data or error / ข้อมูลบทบาทแอปพลิเคชันหรือข้อผิดพลาด
   */
  async findOne(id: string, user_id: string, bu_code: string, version: string) {
    this.logger.debug(
      {
        function: 'findOne',
        user_id,
        bu_code
      },
      ConfigApplicationRoleService.name,
    );

    const res: Observable<MicroserviceResponse> = this.authService.send(
      { cmd: 'role_permission.find-one', service: 'role_permission' },
      {
        id,
        user_id,
        bu_code,
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
   * Create a new application role via microservice
   * สร้างบทบาทแอปพลิเคชันใหม่ผ่านไมโครเซอร์วิส
   * @param createConfigApplicationRoleDto - Creation data / ข้อมูลสำหรับสร้าง
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Created application role or error / บทบาทแอปพลิเคชันที่สร้างแล้วหรือข้อผิดพลาด
   */
  async create(createConfigApplicationRoleDto: ICreateConfigApplicationRole, user_id: string, bu_code: string, version: string) {
    this.logger.debug(
      {
        function: 'create',
        user_id,
        bu_code
      },
      ConfigApplicationRoleService.name,
    );

    const res: Observable<MicroserviceResponse> = this.authService.send(
      { cmd: 'role_permission.create', service: 'role_permission' },
      {
        data: createConfigApplicationRoleDto,
        user_id,
        bu_code,
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
   * Update an existing application role via microservice
   * อัปเดตบทบาทแอปพลิเคชันที่มีอยู่ผ่านไมโครเซอร์วิส
   * @param updateConfigApplicationRoleDto - Update data / ข้อมูลสำหรับอัปเดต
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Updated application role or error / บทบาทแอปพลิเคชันที่อัปเดตแล้วหรือข้อผิดพลาด
   */
  async update(updateConfigApplicationRoleDto: IUpdateConfigApplicationRole, user_id: string, bu_code: string, version: string) {
    this.logger.debug(
      {
        function: 'update',
        user_id,
        bu_code
      },
      ConfigApplicationRoleService.name,
    );

    const res: Observable<MicroserviceResponse> = this.authService.send(
      { cmd: 'role_permission.update', service: 'role_permission' },
      {
        data: updateConfigApplicationRoleDto,
        user_id,
        bu_code,
        version, ...getGatewayRequestContext() },
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
   * Remove an application role by ID via microservice
   * ลบบทบาทแอปพลิเคชันตาม ID ผ่านไมโครเซอร์วิส
   * @param id - Application role ID / รหัสบทบาทแอปพลิเคชัน
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result or error / ผลการลบหรือข้อผิดพลาด
   */
  async remove(id: string, user_id: string, bu_code: string, version: string) {
    this.logger.debug(
      {
        function: 'remove',
        user_id,
        bu_code
      },
      ConfigApplicationRoleService.name,
    );

    const res: Observable<MicroserviceResponse> = this.authService.send(
      { cmd: 'role_permission.remove', service: 'role_permission' },
      {
        id,
        user_id,
        bu_code,
        version, ...getGatewayRequestContext() },
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
