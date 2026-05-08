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
@Injectable()
export class PhysicalCountPeriodService {
  private readonly logger: BackendLogger = new BackendLogger(
    PhysicalCountPeriodService.name,
  );
  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly inventoryService: ClientProxy,
  ) {}

  /**
   * Find a physical count period by ID via microservice
   * ค้นหารอบการตรวจนับสินค้าเดียวตาม ID ผ่านไมโครเซอร์วิส
   * @param id - Physical count period ID / รหัสรอบการตรวจนับสินค้า
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param tenant_id - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Physical count period details / รายละเอียดรอบการตรวจนับสินค้า
   */
  async findOne(
    id: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findOne', id, user_id, tenant_id, version },
      PhysicalCountPeriodService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      {
        cmd: 'physical-count-period.findOne',
        service: 'physical-count-period',
      },
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
   * Find all physical count periods with pagination via microservice
   * ค้นหารอบการตรวจนับสินค้าทั้งหมดพร้อมการแบ่งหน้าผ่านไมโครเซอร์วิส
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param tenant_id - Business unit code / รหัสหน่วยธุรกิจ
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated physical count period list / รายการรอบการตรวจนับสินค้าแบบแบ่งหน้า
   */
  async findAll(
    user_id: string,
    tenant_id: string,
    paginate: IPaginate,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findAll', user_id, tenant_id, paginate, version },
      PhysicalCountPeriodService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      {
        cmd: 'physical-count-period.findAll',
        service: 'physical-count-period',
      },
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

  // async findNearest(
  //   user_id: string,
  //   tenant_id: string,
  //   version: string,
  // ): Promise<Result<unknown>> {
  //   this.logger.debug(
  //     { function: 'findNearest', user_id, tenant_id, version },
  //     PhysicalCountPeriodService.name,
  //   );

  //   const res: Observable<MicroserviceResponse> = this.inventoryService.send(
  //     { cmd: 'physical-count-period.nearest', service: 'physical-count-period' },
  //     { user_id, tenant_id, version },
  //   );

  //   const response = await firstValueFrom(res);

  //   if (response.response.status !== HttpStatus.OK) {
  //     return Result.error(
  //       response.response.message,
  //       httpStatusToErrorCode(response.response.status),
  //     );
  //   }

  //   return Result.ok(response.data);
  // }

  /**
   * Find the currently active physical count period via microservice
   * ค้นหารอบการตรวจนับสินค้าที่กำลังดำเนินอยู่ผ่านไมโครเซอร์วิส
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param tenant_id - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Current physical count period / รอบการตรวจนับสินค้าปัจจุบัน
   */
  async findCurrent(
    user_id: string,
    tenant_id: string,
    version: string,
    include_not_count?: boolean,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findCurrent', user_id, tenant_id, version, include_not_count },
      PhysicalCountPeriodService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      {
        cmd: 'physical-count-period.current',
        service: 'physical-count-period',
      },
      { user_id, tenant_id, version, include_not_count, ...getGatewayRequestContext() },
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
   * Create a new physical count period via microservice
   * สร้างรอบการตรวจนับสินค้าใหม่ผ่านไมโครเซอร์วิส
   * @param data - Period creation data / ข้อมูลสำหรับสร้างรอบการตรวจนับ
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param tenant_id - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Created physical count period / รอบการตรวจนับสินค้าที่สร้างขึ้น
   */
  async create(
    data: Record<string, unknown>,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'create', data, user_id, tenant_id, version },
      PhysicalCountPeriodService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'physical-count-period.create', service: 'physical-count-period' },
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
   * Update a physical count period via microservice
   * อัปเดตรอบการตรวจนับสินค้าผ่านไมโครเซอร์วิส
   * @param id - Physical count period ID / รหัสรอบการตรวจนับสินค้า
   * @param data - Fields to update / ข้อมูลที่ต้องการอัปเดต
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param tenant_id - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Updated physical count period / รอบการตรวจนับสินค้าที่อัปเดตแล้ว
   */
  async update(
    id: string,
    data: Record<string, unknown>,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'update', id, data, user_id, tenant_id, version },
      PhysicalCountPeriodService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'physical-count-period.update', service: 'physical-count-period' },
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
   * Delete a physical count period via microservice
   * ลบรอบการตรวจนับสินค้าผ่านไมโครเซอร์วิส
   * @param id - Physical count period ID / รหัสรอบการตรวจนับสินค้า
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param tenant_id - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  async delete(
    id: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'delete', id, user_id, tenant_id, version },
      PhysicalCountPeriodService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'physical-count-period.delete', service: 'physical-count-period' },
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
