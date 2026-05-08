import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import {
  ICreateExtraCostType,
  IUpdateExtraCostType,
  Result,
  MicroserviceResponse,
} from '@/common';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class Config_ExtraCostTypeService {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_ExtraCostTypeService.name,
  );

  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly masterService: ClientProxy,
  ) {}

  /**
   * Find an extra cost type by ID via microservice
   * ค้นหาประเภทค่าใช้จ่ายเพิ่มเติมเดียวตาม ID ผ่านไมโครเซอร์วิส
   * @param id - Extra cost type ID / รหัสประเภทค่าใช้จ่ายเพิ่มเติม
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Extra cost type data or error / ข้อมูลประเภทค่าใช้จ่ายเพิ่มเติมหรือข้อผิดพลาด
   */
  async findOne(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        version,
      },
      Config_ExtraCostTypeService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'extra-cost-type.findOne', service: 'extra-cost-type' },
      { id: id, user_id: user_id, bu_code: bu_code, version: version, ...getGatewayRequestContext() },
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
   * Find all extra cost types with pagination via microservice
   * ค้นหาประเภทค่าใช้จ่ายเพิ่มเติมทั้งหมดพร้อมการแบ่งหน้าผ่านไมโครเซอร์วิส
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param query - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated extra cost type data or error / ข้อมูลประเภทค่าใช้จ่ายเพิ่มเติมพร้อมการแบ่งหน้าหรือข้อผิดพลาด
   */
  async findAll(
    user_id: string,
    bu_code: string,
    query: IPaginate,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'findAll',
        query,
        version,
      },
      Config_ExtraCostTypeService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'extra-cost-type.findAll', service: 'extra-cost-type' },
      {
        user_id: user_id,
        paginate: query,
        bu_code: bu_code,
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
   * Create a new extra cost type via microservice
   * สร้างประเภทค่าใช้จ่ายเพิ่มเติมใหม่ผ่านไมโครเซอร์วิส
   * @param createDto - Creation data / ข้อมูลสำหรับสร้าง
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Created extra cost type or error / ประเภทค่าใช้จ่ายเพิ่มเติมที่สร้างแล้วหรือข้อผิดพลาด
   */
  async create(
    createDto: ICreateExtraCostType,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      Config_ExtraCostTypeService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'extra-cost-type.create', service: 'extra-cost-type' },
      {
        data: createDto,
        user_id: user_id,
        bu_code: bu_code,
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
   * Update an existing extra cost type via microservice
   * อัปเดตประเภทค่าใช้จ่ายเพิ่มเติมที่มีอยู่ผ่านไมโครเซอร์วิส
   * @param updateDto - Update data / ข้อมูลสำหรับอัปเดต
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Updated extra cost type or error / ประเภทค่าใช้จ่ายเพิ่มเติมที่อัปเดตแล้วหรือข้อผิดพลาด
   */
  async update(
    updateDto: IUpdateExtraCostType,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'update',
        updateDto,
        version,
      },
      Config_ExtraCostTypeService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'extra-cost-type.update', service: 'extra-cost-type' },
      {
        data: updateDto,
        user_id: user_id,
        bu_code: bu_code,
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
   * Delete an extra cost type by ID via microservice
   * ลบประเภทค่าใช้จ่ายเพิ่มเติมตาม ID ผ่านไมโครเซอร์วิส
   * @param id - Extra cost type ID / รหัสประเภทค่าใช้จ่ายเพิ่มเติม
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result or error / ผลการลบหรือข้อผิดพลาด
   */
  async delete(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'delete',
        id,
        version,
      },
      Config_ExtraCostTypeService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'extra-cost-type.delete', service: 'extra-cost-type' },
      { id: id, user_id: user_id, bu_code: bu_code, version: version, ...getGatewayRequestContext() },
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
