import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { firstValueFrom, Observable } from 'rxjs';
import { IAssignUserApplicationRole, IRemoveUserApplicationRole, IUpdateUserApplicationRole } from './dto/user_application_role.dto';
import { Result, MicroserviceResponse } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class ConfigUserApplicationRoleService {
  private readonly logger: BackendLogger = new BackendLogger(
    ConfigUserApplicationRoleService.name,
  );

  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly authService: ClientProxy,
  ) { }

  /**
   * Find application roles assigned to a user via microservice
   * ค้นหาบทบาทแอปพลิเคชันที่กำหนดให้ผู้ใช้ผ่านไมโครเซอร์วิส
   * @param targetUserId - Target user ID / รหัสผู้ใช้เป้าหมาย
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns User role assignments or error / การกำหนดบทบาทผู้ใช้หรือข้อผิดพลาด
   */
  async findByUser(targetUserId: string, bu_code: string, version: string) {
    this.logger.debug(
      {
        function: 'findByUser',
        targetUserId,
        bu_code,
      },
      ConfigUserApplicationRoleService.name,
    );

    const res: Observable<MicroserviceResponse> = this.authService.send(
      { cmd: 'user_application_role.find-by-user', service: 'user_application_role' },
      {
        user_id: targetUserId,
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
   * Assign application roles to a user via microservice
   * กำหนดบทบาทแอปพลิเคชันให้ผู้ใช้ผ่านไมโครเซอร์วิส
   * @param data - Role assignment data / ข้อมูลการกำหนดบทบาท
   * @param requestUserId - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Assignment result or error / ผลการกำหนดบทบาทหรือข้อผิดพลาด
   */
  async assign(data: IAssignUserApplicationRole, requestUserId: string, bu_code: string, version: string) {
    this.logger.debug(
      {
        function: 'assign',
        data,
        requestUserId,
        bu_code,
      },
      ConfigUserApplicationRoleService.name,
    );

    const res: Observable<MicroserviceResponse> = this.authService.send(
      { cmd: 'user_application_role.assign', service: 'user_application_role' },
      {
        data,
        user_id: requestUserId,
        bu_code,
        version, ...getGatewayRequestContext() },
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
   * Update user application role assignments via microservice
   * อัปเดตการกำหนดบทบาทแอปพลิเคชันของผู้ใช้ผ่านไมโครเซอร์วิส
   * @param data - Update data / ข้อมูลสำหรับอัปเดต
   * @param requestUserId - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Update result or error / ผลการอัปเดตหรือข้อผิดพลาด
   */
  async update(data: IUpdateUserApplicationRole, requestUserId: string, bu_code: string, version: string) {
    this.logger.debug(
      {
        function: 'update',
        data,
        requestUserId,
        bu_code,
      },
      ConfigUserApplicationRoleService.name,
    );

    const res: Observable<MicroserviceResponse> = this.authService.send(
      { cmd: 'user_application_role.update', service: 'user_application_role' },
      {
        data,
        user_id: requestUserId,
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
   * Remove application roles from a user via microservice
   * เพิกถอนบทบาทแอปพลิเคชันจากผู้ใช้ผ่านไมโครเซอร์วิส
   * @param data - Removal data / ข้อมูลสำหรับเพิกถอน
   * @param requestUserId - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Removal result or error / ผลการเพิกถอนหรือข้อผิดพลาด
   */
  async remove(data: IRemoveUserApplicationRole, requestUserId: string, bu_code: string, version: string) {
    this.logger.debug(
      {
        function: 'remove',
        data,
        requestUserId,
        bu_code,
      },
      ConfigUserApplicationRoleService.name,
    );

    const res: Observable<MicroserviceResponse> = this.authService.send(
      { cmd: 'user_application_role.remove', service: 'user_application_role' },
      {
        data,
        user_id: requestUserId,
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
