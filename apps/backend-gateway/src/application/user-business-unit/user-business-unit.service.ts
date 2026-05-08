import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { Result, MicroserviceResponse } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { BackendLogger } from 'src/common/helpers/backend.logger';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class UserBusinessUnitService {
  private readonly logger: BackendLogger = new BackendLogger(
    UserBusinessUnitService.name,
  );

  constructor(
    @Inject('CLUSTER_SERVICE') private readonly clusterService: ClientProxy,
  ) {}

  /**
   * Set the user's default business unit (tenant)
   * ตั้งค่าหน่วยธุรกิจเริ่มต้นของผู้ใช้ (tenant)
   * @param user_id - User ID / รหัสผู้ใช้
   * @param tenant_id - Tenant ID to set as default / รหัส tenant ที่จะตั้งเป็นค่าเริ่มต้น
   * @param version - API version / เวอร์ชัน API
   * @returns Updated default tenant result / ผลลัพธ์การตั้งค่า tenant เริ่มต้น
   */
  async setDefaultTenant(
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'setDefaultTenant',
        user_id,
        tenant_id,
        version,
      },
      UserBusinessUnitService.name,
    );

    const res: Observable<MicroserviceResponse> = this.clusterService.send(
      { cmd: 'business-unit.set-default-tenant', service: 'business-unit' },
      { user_id: user_id, tenant_id: tenant_id, version: version, ...getGatewayRequestContext() },
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
   * Retrieve business units assigned to a user
   * ดึงข้อมูลหน่วยธุรกิจที่กำหนดให้ผู้ใช้
   * @param user_id - User ID / รหัสผู้ใช้
   * @param version - API version / เวอร์ชัน API
   * @returns User's business units / หน่วยธุรกิจของผู้ใช้
   */
  async getBusinessUnit(user_id: string, version: string): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'getBusinessUnit',
        user_id,
        version,
      },
      UserBusinessUnitService.name,
    );

    const res: Observable<MicroserviceResponse> = this.clusterService.send(
      { cmd: 'business-unit.get-by-user-id', service: 'business-unit' },
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
