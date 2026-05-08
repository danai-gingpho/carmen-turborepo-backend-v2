import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { Result, MicroserviceResponse } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class ConfigPermissionService {
  private readonly logger: BackendLogger = new BackendLogger(
    ConfigPermissionService.name,
  );

  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly authService: ClientProxy,
  ) { }

  /**
   * Find all permissions with pagination via microservice
   * ค้นหารายการสิทธิ์การเข้าถึงทั้งหมดพร้อมการแบ่งหน้าผ่านไมโครเซอร์วิส
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated permissions or error / รายการสิทธิ์การเข้าถึงพร้อมการแบ่งหน้าหรือข้อผิดพลาด
   */
  async findAll(paginate, user_id: string, bu_code: string, version: string): Promise<unknown> {
    this.logger.debug(
      {
        function: 'findAll',
        user_id,
        bu_code
      },
      ConfigPermissionService.name,
    );

    const res: Observable<MicroserviceResponse> = this.authService.send(
      { cmd: 'permission.findAll', service: 'permission' },
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
}
