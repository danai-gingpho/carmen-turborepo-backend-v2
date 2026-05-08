import { HttpStatus, Injectable } from '@nestjs/common';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { Observable } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { Result, MicroserviceResponse } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { IPeriodCreate, IPeriodUpdate } from 'src/common/dto/period/period.dto';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class PeriodService {
  private readonly logger: BackendLogger = new BackendLogger(
    PeriodService.name,
  );
  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly inventoryService: ClientProxy,
  ) {}

  /**
   * Find a period by ID via the business microservice
   * ค้นหางวด/รอบบัญชีรายการเดียวตาม ID ผ่านไมโครเซอร์วิสธุรกิจ
   * @param id - Period ID / รหัสงวด
   * @param user_id - User ID / รหัสผู้ใช้
   * @param tenant_id - Tenant ID / รหัส tenant
   * @param version - API version / เวอร์ชัน API
   * @returns Period details / รายละเอียดงวด/รอบบัญชี
   */
  async findOne(
    id: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findOne', id, user_id, tenant_id, version },
      PeriodService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'inventory-period.findOne', service: 'inventory-period' },
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

  /**
   * List all periods in the business unit
   * ค้นหารายการงวด/รอบบัญชีทั้งหมดในหน่วยธุรกิจ
   * @param user_id - User ID / รหัสผู้ใช้
   * @param tenant_id - Tenant ID / รหัส tenant
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated list of periods / รายการงวดแบบแบ่งหน้า
   */
  async findAll(
    user_id: string,
    tenant_id: string,
    paginate: IPaginate,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findAll', user_id, tenant_id, paginate, version },
      PeriodService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'inventory-period.findAll', service: 'inventory-period' },
      { user_id, tenant_id, paginate, version, ...getGatewayRequestContext() },
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
   * Create a new fiscal/accounting period
   * สร้างงวด/รอบบัญชีใหม่
   * @param data - Period creation data / ข้อมูลสำหรับสร้างงวด
   * @param user_id - User ID / รหัสผู้ใช้
   * @param tenant_id - Tenant ID / รหัส tenant
   * @param version - API version / เวอร์ชัน API
   * @returns Created period / งวดที่สร้างแล้ว
   */
  async create(
    data: IPeriodCreate,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'create', data, user_id, tenant_id, version },
      PeriodService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'inventory-period.create', service: 'inventory-period' },
      { data, user_id, tenant_id, version, ...getGatewayRequestContext() },
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
   * Update an existing fiscal/accounting period
   * อัปเดตงวด/รอบบัญชีที่มีอยู่
   * @param id - Period ID / รหัสงวด
   * @param data - Period update data / ข้อมูลสำหรับอัปเดตงวด
   * @param user_id - User ID / รหัสผู้ใช้
   * @param tenant_id - Tenant ID / รหัส tenant
   * @param version - API version / เวอร์ชัน API
   * @returns Updated period / งวดที่อัปเดตแล้ว
   */
  async update(
    id: string,
    data: IPeriodUpdate,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'update', id, data, user_id, tenant_id, version },
      PeriodService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'inventory-period.update', service: 'inventory-period' },
      { id, data, user_id, tenant_id, version, ...getGatewayRequestContext() },
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
   * Bulk-generate the next N fiscal periods
   * สร้างงวด/รอบบัญชีถัดไปจำนวน N งวดแบบกลุ่ม
   * @param count - Number of periods to generate / จำนวนงวดที่จะสร้าง
   * @param start_day - Start day of each period / วันเริ่มต้นของแต่ละงวด
   * @param user_id - User ID / รหัสผู้ใช้
   * @param tenant_id - Tenant ID / รหัส tenant
   * @param version - API version / เวอร์ชัน API
   * @returns Generated periods / งวดที่สร้างแล้ว
   */
  async generateNext(
    count: number,
    start_day: number,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'generateNext', count, start_day, user_id, tenant_id, version },
      PeriodService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'inventory-period.generateNext', service: 'inventory-period' },
      { count, start_day, user_id, tenant_id, version, ...getGatewayRequestContext() },
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
   * Find the current period (open or locked)
   * ค้นหางวดปัจจุบัน (สถานะเปิดหรือล็อค)
   * @param user_id - User ID / รหัสผู้ใช้
   * @param tenant_id - Tenant ID / รหัส tenant
   * @param version - API version / เวอร์ชัน API
   * @returns Current period / งวดปัจจุบัน
   */
  async findCurrent(
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findCurrent', user_id, tenant_id, version },
      PeriodService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'inventory-period.findCurrent', service: 'inventory-period' },
      { user_id, tenant_id, version, ...getGatewayRequestContext() },
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
   * Delete a fiscal/accounting period
   * ลบงวด/รอบบัญชี
   * @param id - Period ID / รหัสงวด
   * @param user_id - User ID / รหัสผู้ใช้
   * @param tenant_id - Tenant ID / รหัส tenant
   * @param version - API version / เวอร์ชัน API
   * @returns Delete result / ผลลัพธ์การลบ
   */
  async delete(
    id: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'delete', id, user_id, tenant_id, version },
      PeriodService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'inventory-period.delete', service: 'inventory-period' },
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
