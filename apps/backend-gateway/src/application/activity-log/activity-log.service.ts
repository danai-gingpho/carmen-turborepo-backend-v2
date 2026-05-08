import { HttpStatus, Injectable } from '@nestjs/common';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { Observable } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { Result, MicroserviceResponse } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { BackendLogger } from 'src/common/helpers/backend.logger';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
export interface IActivityLogFilter {
  entity_type?: string;
  entity_id?: string;
  actor_id?: string;
  action?: string;
  start_date?: string;
  end_date?: string;
}

@Injectable()
export class ActivityLogService {
  private readonly logger: BackendLogger = new BackendLogger(
    ActivityLogService.name,
  );

  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly logService: ClientProxy,
  ) {}

  /**
   * List all activity logs with optional filters
   * ค้นหารายการบันทึกกิจกรรมทั้งหมดพร้อมตัวกรอง
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param filters - Optional activity log filters / ตัวกรองบันทึกกิจกรรม (ไม่บังคับ)
   * @returns Paginated activity logs / รายการบันทึกกิจกรรมแบบแบ่งหน้า
   */
  async findAll(
    user_id: string,
    bu_code: string,
    paginate: IPaginate,
    filters?: IActivityLogFilter,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'findAll',
        user_id,
        bu_code,
        paginate,
        filters,
      },
      ActivityLogService.name,
    );

    const res: Observable<MicroserviceResponse> = this.logService.send(
      { cmd: 'activity-log.findAll', service: 'activity-log' },
      {
        user_id,
        bu_code,
        paginate,
        filters, ...getGatewayRequestContext() },
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
   * List activity logs filtered by entity type
   * ค้นหารายการบันทึกกิจกรรมตามประเภทเอกสาร
   * @param entity_type - Entity type to filter / ประเภทเอกสารที่จะกรอง
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @returns Paginated activity logs by entity / รายการบันทึกกิจกรรมตามประเภทเอกสารแบบแบ่งหน้า
   */
  async findByEntity(
    entity_type: string,
    user_id: string,
    bu_code: string,
    paginate: IPaginate,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'findByEntity',
        entity_type,
        user_id,
        bu_code,
        paginate,
      },
      ActivityLogService.name,
    );

    const res: Observable<MicroserviceResponse> = this.logService.send(
      { cmd: 'activity-log.findByEntity', service: 'activity-log' },
      {
        entity_type,
        user_id,
        bu_code,
        paginate, ...getGatewayRequestContext() },
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
   * Find an activity log entry by ID
   * ค้นหารายการบันทึกกิจกรรมรายการเดียวตาม ID
   * @param id - Activity log ID / รหัสบันทึกกิจกรรม
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @returns Activity log details / รายละเอียดบันทึกกิจกรรม
   */
  async findOne(
    id: string,
    user_id: string,
    bu_code: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        user_id,
        bu_code,
      },
      ActivityLogService.name,
    );

    const res: Observable<MicroserviceResponse> = this.logService.send(
      { cmd: 'activity-log.findOne', service: 'activity-log' },
      { id, user_id, bu_code, ...getGatewayRequestContext() },
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
   * Soft-delete an activity log entry
   * ลบบันทึกกิจกรรมแบบ soft delete
   * @param id - Activity log ID / รหัสบันทึกกิจกรรม
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @returns Delete result / ผลลัพธ์การลบ
   */
  async delete(
    id: string,
    user_id: string,
    bu_code: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'delete',
        id,
        user_id,
        bu_code,
      },
      ActivityLogService.name,
    );

    const res: Observable<MicroserviceResponse> = this.logService.send(
      { cmd: 'activity-log.delete', service: 'activity-log' },
      { id, user_id, bu_code, ...getGatewayRequestContext() },
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
   * Batch soft-delete multiple activity log entries
   * ลบบันทึกกิจกรรมหลายรายการแบบ soft delete เป็นชุด
   * @param ids - Activity log IDs / รหัสบันทึกกิจกรรม
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @returns Batch delete result / ผลลัพธ์การลบเป็นชุด
   */
  async deleteMany(
    ids: string[],
    user_id: string,
    bu_code: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'deleteMany',
        ids,
        user_id,
        bu_code,
      },
      ActivityLogService.name,
    );

    const res: Observable<MicroserviceResponse> = this.logService.send(
      { cmd: 'activity-log.deleteMany', service: 'activity-log' },
      { ids, user_id, bu_code, ...getGatewayRequestContext() },
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
   * Permanently delete an activity log entry (hard delete)
   * ลบบันทึกกิจกรรมอย่างถาวร (hard delete)
   * @param id - Activity log ID / รหัสบันทึกกิจกรรม
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @returns Hard delete result / ผลลัพธ์การลบถาวร
   */
  async hardDelete(
    id: string,
    user_id: string,
    bu_code: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'hardDelete',
        id,
        user_id,
        bu_code,
      },
      ActivityLogService.name,
    );

    const res: Observable<MicroserviceResponse> = this.logService.send(
      { cmd: 'activity-log.hardDelete', service: 'activity-log' },
      { id, user_id, bu_code, ...getGatewayRequestContext() },
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
   * Batch permanently delete multiple activity log entries (hard delete)
   * ลบบันทึกกิจกรรมหลายรายการอย่างถาวร (hard delete) เป็นชุด
   * @param ids - Activity log IDs / รหัสบันทึกกิจกรรม
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @returns Batch hard delete result / ผลลัพธ์การลบถาวรเป็นชุด
   */
  async hardDeleteMany(
    ids: string[],
    user_id: string,
    bu_code: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'hardDeleteMany',
        ids,
        user_id,
        bu_code,
      },
      ActivityLogService.name,
    );

    const res: Observable<MicroserviceResponse> = this.logService.send(
      { cmd: 'activity-log.hardDeleteMany', service: 'activity-log' },
      { ids, user_id, bu_code, ...getGatewayRequestContext() },
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
