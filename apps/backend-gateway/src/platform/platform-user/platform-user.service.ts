import {
  Inject,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { Result, MicroserviceResponse } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { IPaginate } from 'src/shared-dto/paginate.dto';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class PlatformUserService {
  private readonly logger: BackendLogger = new BackendLogger(
    PlatformUserService.name,
  );

  constructor(
    @Inject('BUSINESS_SERVICE') private readonly authService: ClientProxy,
    @Inject('CLUSTER_SERVICE') private readonly clusterService: ClientProxy,
    @Inject('KEYCLOAK_SERVICE') private readonly keycloakService: ClientProxy,
  ) {}

  /**
   * Reset a platform user's password via Keycloak
   * รีเซ็ตรหัสผ่านผู้ใช้ผ่าน Keycloak
   */
  async resetUserPassword(
    user_id: string,
    tenant_id: string,
    id: string,
    password: string,
    temporary: boolean,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'resetUserPassword', user_id, tenant_id, id, version },
      PlatformUserService.name,
    );

    const res: Observable<MicroserviceResponse> = this.keycloakService.send(
      { cmd: 'keycloak.users.resetPassword', service: 'keycloak' },
      {
        userId: id,
        password,
        temporary,
        user_id,
        tenant_id,
        version,
        ...getGatewayRequestContext(),
      },
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
   * Fetch and sync users from Keycloak realm into the platform database
   * ดึงและซิงค์ข้อมูลผู้ใช้จาก Keycloak realm เข้าสู่ฐานข้อมูลแพลตฟอร์ม
   * @param version - API version / เวอร์ชัน API
   * @returns Sync result / ผลลัพธ์การซิงค์
   */
  async fetchUsers(version: string): Promise<unknown> {
    this.logger.debug(
      {
        function: 'fetchUsers',
        version,
      },
      PlatformUserService.name,
    );

    const res: Observable<MicroserviceResponse> = this.authService.send(
      { cmd: 'sync-realm-users', service: 'auth' },
      { data: {}, version, ...getGatewayRequestContext() },
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
   * Retrieve all platform users with pagination
   * ค้นหารายการผู้ใช้ระบบทั้งหมดพร้อมการแบ่งหน้า
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param tenant_id - Tenant ID / รหัสผู้เช่า
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated user list / รายการผู้ใช้แบบแบ่งหน้า
   */
  async getUserList(
    user_id: string,
    tenant_id: string,
    paginate: IPaginate,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'getUserList',
        user_id,
        tenant_id,
        paginate,
        version,
      },
      PlatformUserService.name,
    );

    const res: Observable<MicroserviceResponse> = this.clusterService.send(
      { cmd: 'user.list', service: 'user' },
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
   * Retrieve a single platform user by ID
   * ค้นหารายการผู้ใช้ระบบเดียวตาม ID
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param tenant_id - Tenant ID / รหัสผู้เช่า
   * @param id - Target user ID / รหัสผู้ใช้เป้าหมาย
   * @param version - API version / เวอร์ชัน API
   * @returns User details / รายละเอียดผู้ใช้
   */
  async getUser(
    user_id: string,
    tenant_id: string,
    id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'getUser',
        user_id,
        tenant_id,
        id,
        version,
      },
      PlatformUserService.name,
    );

    const res: Observable<MicroserviceResponse> = this.clusterService.send(
      { cmd: 'user.get', service: 'user' },
      {
        id,
        user_id,
        tenant_id,
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
   * Create a new platform user via microservice
   * สร้างผู้ใช้ระบบใหม่ผ่านไมโครเซอร์วิส
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param tenant_id - Tenant ID / รหัสผู้เช่า
   * @param data - User creation data / ข้อมูลสำหรับสร้างผู้ใช้
   * @param version - API version / เวอร์ชัน API
   * @returns Created user / ผู้ใช้ที่ถูกสร้าง
   */
  async createUser(
    user_id: string,
    tenant_id: string,
    data: Record<string, unknown>,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'createUser',
        user_id,
        tenant_id,
        data,
        version,
      },
      PlatformUserService.name,
    );

    const res: Observable<MicroserviceResponse> = this.clusterService.send(
      { cmd: 'user.create', service: 'user' },
      {
        data,
        user_id,
        tenant_id,
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
   * Update an existing platform user via microservice
   * อัปเดตข้อมูลผู้ใช้ระบบที่มีอยู่ผ่านไมโครเซอร์วิส
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param tenant_id - Tenant ID / รหัสผู้เช่า
   * @param id - Target user ID / รหัสผู้ใช้เป้าหมาย
   * @param data - User update data / ข้อมูลสำหรับอัปเดตผู้ใช้
   * @param version - API version / เวอร์ชัน API
   * @returns Updated user / ผู้ใช้ที่ถูกอัปเดต
   */
  async updateUser(
    user_id: string,
    tenant_id: string,
    id: string,
    data: Record<string, unknown>,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'updateUser',
        user_id,
        tenant_id,
        id,
        data,
        version,
      },
      PlatformUserService.name,
    );

    const res: Observable<MicroserviceResponse> = this.clusterService.send(
      { cmd: 'user.update', service: 'user' },
      {
        id,
        data,
        user_id,
        tenant_id,
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
   * Delete a platform user via microservice
   * ลบผู้ใช้ระบบผ่านไมโครเซอร์วิส
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param tenant_id - Tenant ID / รหัสผู้เช่า
   * @param id - Target user ID / รหัสผู้ใช้เป้าหมาย
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  async deleteUser(
    user_id: string,
    tenant_id: string,
    id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'deleteUser',
        user_id,
        tenant_id,
        id,
        version,
      },
      PlatformUserService.name,
    );

    const res: Observable<MicroserviceResponse> = this.clusterService.send(
      { cmd: 'user.delete', service: 'user' },
      {
        id,
        user_id,
        tenant_id,
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
   * Hard delete a user (permanently remove from DB and Keycloak)
   * ลบผู้ใช้แบบถาวร (ลบจากฐานข้อมูลและ Keycloak)
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param tenant_id - Tenant ID / รหัสผู้เช่า
   * @param id - Target user ID / รหัสผู้ใช้เป้าหมาย
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  async hardDeleteUser(
    user_id: string,
    tenant_id: string,
    id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'hardDeleteUser', user_id, tenant_id, id, version },
      PlatformUserService.name,
    );

    const res: Observable<MicroserviceResponse> = this.clusterService.send(
      { cmd: 'user.hard-delete', service: 'user' },
      { id, user_id, tenant_id, version, ...getGatewayRequestContext() },
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
