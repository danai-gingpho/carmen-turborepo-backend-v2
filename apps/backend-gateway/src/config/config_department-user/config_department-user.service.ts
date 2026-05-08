import { HttpStatus, Inject, Injectable, NotImplementedException } from '@nestjs/common';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { ClientProxy } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';
import { Result, MicroserviceResponse } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class Config_DepartmentUserService {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_DepartmentUserService.name,
  );

  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly _masterService: ClientProxy,
  ) {}

  /**
   * Find a department-user assignment by ID via microservice
   * ค้นหารายการเดียวตาม ID ของการกำหนดแผนก-ผู้ใช้ผ่านไมโครเซอร์วิส
   * @param id - Department-user assignment ID / รหัสการกำหนดแผนก-ผู้ใช้
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Department-user assignment detail / รายละเอียดการกำหนดแผนก-ผู้ใช้
   */
  async findOne(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        version,
      },
      Config_DepartmentUserService.name,
    );
    throw new NotImplementedException('Not implemented');
  }

  /**
   * Find all department-user assignments with pagination via microservice
   * ค้นหารายการทั้งหมดของการกำหนดแผนก-ผู้ใช้พร้อมการแบ่งหน้าผ่านไมโครเซอร์วิส
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param query - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated department-user assignments / รายการการกำหนดแผนก-ผู้ใช้แบบแบ่งหน้า
   */
  async findAll(
    user_id: string,
    bu_code: string,
    query: IPaginate,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'findAll',
        query,
        version,
      },
      Config_DepartmentUserService.name,
    );
    throw new NotImplementedException('Not implemented');
  }

  /**
   * Create a new department-user assignment via microservice
   * สร้างการกำหนดแผนก-ผู้ใช้ใหม่ผ่านไมโครเซอร์วิส
   * @param createDto - Department-user assignment creation data / ข้อมูลสำหรับสร้างการกำหนดแผนก-ผู้ใช้
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Created department-user assignment / การกำหนดแผนก-ผู้ใช้ที่สร้างแล้ว
   */
  async create(
    createDto: Record<string, unknown>,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      Config_DepartmentUserService.name,
    );
    throw new NotImplementedException('Not implemented');
  }

  /**
   * Update an existing department-user assignment via microservice
   * อัปเดตการกำหนดแผนก-ผู้ใช้ที่มีอยู่ผ่านไมโครเซอร์วิส
   * @param id - Department-user assignment ID / รหัสการกำหนดแผนก-ผู้ใช้
   * @param updateDto - Department-user assignment update data / ข้อมูลสำหรับอัปเดตการกำหนดแผนก-ผู้ใช้
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Updated department-user assignment / การกำหนดแผนก-ผู้ใช้ที่อัปเดตแล้ว
   */
  async update(
    id: string,
    updateDto: Record<string, unknown>,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateDto,
        version,
      },
      Config_DepartmentUserService.name,
    );
    throw new NotImplementedException('Not implemented');
  }

  /**
   * Delete a department-user assignment via microservice
   * ลบการกำหนดแผนก-ผู้ใช้ผ่านไมโครเซอร์วิส
   * @param id - Department-user assignment ID / รหัสการกำหนดแผนก-ผู้ใช้
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  async delete(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'delete',
        id,
        version,
      },
      Config_DepartmentUserService.name,
    );
    throw new NotImplementedException('Not implemented');
  }

  /**
   * Find a user's member department and HOD departments via microservice
   * ค้นหาแผนกที่ user เป็นสมาชิก และแผนกที่ user เป็น HOD ผ่านไมโครเซอร์วิส
   * @param target_user_id - User ID to look up / รหัสผู้ใช้ที่ต้องการค้นหา
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Result with member department + HOD departments / ผลลัพธ์ที่มีแผนกสมาชิก + รายการแผนก HOD
   */
  async findByUserId(
    target_user_id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findByUserId', target_user_id, version },
      Config_DepartmentUserService.name,
    );

    const res: Observable<MicroserviceResponse> = this._masterService.send(
      { cmd: 'department-users.find-by-user-id', service: 'department-users' },
      {
        target_user_id,
        user_id,
        bu_code,
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
}
