import { Inject, HttpStatus, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { Result, MicroserviceResponse } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { AuthService } from 'src/auth/auth.service';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { sendToService } from 'src/common/helpers/microservice.helper';
import { IPaginate } from 'src/shared-dto/paginate.dto';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class UserService implements OnModuleInit {
  private readonly logger: BackendLogger = new BackendLogger(UserService.name);

  constructor(
    @Inject('BUSINESS_SERVICE') private readonly authService: ClientProxy,
  ) {}

  async onModuleInit() {
    const maxRetries = 5;
    const delayMs = 3000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.authService.connect();
        this.logger.log('AUTH_SERVICE TCP client connected (UserService)');
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : error;
        if (attempt < maxRetries) {
          this.logger.warn(`AUTH_SERVICE connection attempt ${attempt}/${maxRetries} failed: ${message}. Retrying in ${delayMs / 1000}s...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        } else {
          this.logger.error(`AUTH_SERVICE connection failed after ${maxRetries} attempts: ${message}. Will reconnect on first request.`);
        }
      }
    }
  }

  /**
   * Retrieve user profile from the business microservice
   * ดึงข้อมูลโปรไฟล์ผู้ใช้จากไมโครเซอร์วิสธุรกิจ
   * @param id - User ID / รหัสผู้ใช้
   * @param version - API version / เวอร์ชัน API
   * @returns User profile data / ข้อมูลโปรไฟล์ผู้ใช้
   */
  async getUserProfile(id: string, version: string): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'getUserProfile',
        id,
        version,
      },
      UserService.name,
    );

    const response = await sendToService<MicroserviceResponse>(
      this.authService,
      { cmd: 'get-user-profile', service: 'auth' },
      { id: id, version: version },
    );

    this.logger.log({
      file: AuthService.name,
      function: this.getUserProfile.name,
      res: response,
    });

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  /**
   * List all users in the specified business unit
   * ค้นหารายการผู้ใช้ทั้งหมดในหน่วยธุรกิจที่ระบุ
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated list of users / รายการผู้ใช้แบบแบ่งหน้า
   */
  async getAllUserInTenant(
    user_id: string,
    bu_code: string,
    paginate: IPaginate,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'getAllUserInTenant',
        user_id,
        bu_code,
        paginate,
        version,
      },
      UserService.name,
    );

    const res: Observable<MicroserviceResponse> = this.authService.send(
      { cmd: 'get-all-user-in-tenant', service: 'auth' },
      { user_id: user_id, bu_code: bu_code, paginate: paginate, version: version, ...getGatewayRequestContext() },
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
   * Update a user's profile by ID
   * อัปเดตข้อมูลโปรไฟล์ผู้ใช้ตาม ID
   * @param userId - Target user ID / รหัสผู้ใช้เป้าหมาย
   * @param updateData - Profile fields to update / ฟิลด์โปรไฟล์ที่จะอัปเดต
   * @param version - API version / เวอร์ชัน API
   * @returns Updated user profile / ข้อมูลโปรไฟล์ผู้ใช้ที่อัปเดตแล้ว
   */
  async updateUserById(
    userId: string,
    updateData: {
      alias_name?: string;
      firstname?: string;
      middlename?: string;
      lastname?: string;
      telephone?: string;
    },
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'updateUserById',
        userId,
        updateData,
        version,
      },
      UserService.name,
    );

    const res: Observable<MicroserviceResponse> = this.authService.send(
      { cmd: 'update-user-profile', service: 'auth' },
      { user_id: userId, data: updateData, version: version, ...getGatewayRequestContext() },
    );

    const response = await firstValueFrom(res);

    this.logger.log({
      file: UserService.name,
      function: this.updateUserById.name,
      res: response,
    });

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  /**
   * Retrieve user permissions from the business microservice
   * ดึงข้อมูลสิทธิ์การใช้งานของผู้ใช้จากไมโครเซอร์วิสธุรกิจ
   * @param user_id - User ID / รหัสผู้ใช้
   * @param version - API version / เวอร์ชัน API
   * @returns User permission set / ชุดสิทธิ์การใช้งานของผู้ใช้
   */
  async getPermission(user_id: string, version: string): Promise<unknown> {
    this.logger.debug(
      {
        function: 'getPermission',
        user_id,
        version,
      },
      UserService.name,
    );

    const res: Observable<MicroserviceResponse> = this.authService.send(
      { cmd: 'get-permission', service: 'auth' },
      { user_id: user_id, version: version, ...getGatewayRequestContext() },
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
