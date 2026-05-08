import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { MicroserviceResponse } from '@/common';
import {
  ICreateVendorBusinessType,
  IUpdateVendorBusinessType,
} from './dto/vendor_business_type.dto';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { ResponseLib } from 'src/libs/response.lib';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class Config_VendorBusinessTypeService {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_VendorBusinessTypeService.name,
  );

  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly masterService: ClientProxy,
  ) {}

  /**
   * Find a vendor business type by ID via microservice
   * ค้นหาประเภทธุรกิจผู้ขายเดียวตาม ID ผ่านไมโครเซอร์วิส
   * @param id - Vendor business type ID / รหัสประเภทธุรกิจผู้ขาย
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Vendor business type data or error / ข้อมูลประเภทธุรกิจผู้ขายหรือข้อผิดพลาด
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
      Config_VendorBusinessTypeService.name,
    );
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'vendor-business-type.findOne', service: 'vendor-business-type' },
      { id: id, user_id: user_id, bu_code: bu_code, version: version, ...getGatewayRequestContext() },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return ResponseLib.error(
        response.response.status,
        response.response.message,
      );
    }

    return ResponseLib.success(response.data);
  }

  /**
   * Find all vendor business types with pagination via microservice
   * ค้นหาประเภทธุรกิจผู้ขายทั้งหมดพร้อมการแบ่งหน้าผ่านไมโครเซอร์วิส
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param query - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated vendor business type data or error / ข้อมูลประเภทธุรกิจผู้ขายพร้อมการแบ่งหน้าหรือข้อผิดพลาด
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
        user_id,
        bu_code,
        query,
        version,
      },
      Config_VendorBusinessTypeService.name,
    );
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'vendor-business-type.findAll', service: 'vendor-business-type' },
      {
        user_id: user_id,
        paginate: query,
        bu_code: bu_code,
        version: version, ...getGatewayRequestContext() },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return ResponseLib.error(
        response.response.status,
        response.response.message,
      );
    }

    return ResponseLib.successWithPaginate(response.data, response.paginate);
  }

  /**
   * Create a new vendor business type via microservice
   * สร้างประเภทธุรกิจผู้ขายใหม่ผ่านไมโครเซอร์วิส
   * @param createDto - Creation data / ข้อมูลสำหรับสร้าง
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Created vendor business type or error / ประเภทธุรกิจผู้ขายที่สร้างแล้วหรือข้อผิดพลาด
   */
  async create(
    createDto: ICreateVendorBusinessType,
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
      Config_VendorBusinessTypeService.name,
    );
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'vendor-business-type.create', service: 'vendor-business-type' },
      {
        data: createDto,
        user_id: user_id,
        bu_code: bu_code,
        version: version, ...getGatewayRequestContext() },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.CREATED) {
      return ResponseLib.error(
        response.response.status,
        response.response.message,
      );
    }

    return ResponseLib.created(response.data);
  }

  /**
   * Update an existing vendor business type via microservice
   * อัปเดตประเภทธุรกิจผู้ขายที่มีอยู่ผ่านไมโครเซอร์วิส
   * @param updateDto - Update data / ข้อมูลสำหรับอัปเดต
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Updated vendor business type or error / ประเภทธุรกิจผู้ขายที่อัปเดตแล้วหรือข้อผิดพลาด
   */
  async update(
    updateDto: IUpdateVendorBusinessType,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'update',
        updateDto,
        version,
      },
      Config_VendorBusinessTypeService.name,
    );
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'vendor-business-type.update', service: 'vendor-business-type' },
      {
        data: updateDto,
        user_id: user_id,
        bu_code: bu_code,
        version: version, ...getGatewayRequestContext() },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return ResponseLib.error(
        response.response.status,
        response.response.message,
      );
    }

    return ResponseLib.success(response.data);
  }

  /**
   * Delete a vendor business type by ID via microservice
   * ลบประเภทธุรกิจผู้ขายตาม ID ผ่านไมโครเซอร์วิส
   * @param id - Vendor business type ID / รหัสประเภทธุรกิจผู้ขาย
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
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'delete',
        id,
        version,
      },
      Config_VendorBusinessTypeService.name,
    );
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'vendor-business-type.delete', service: 'vendor-business-type' },
      { id: id, user_id: user_id, bu_code: bu_code, version: version, ...getGatewayRequestContext() },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return ResponseLib.error(
        response.response.status,
        response.response.message,
      );
    }

    return ResponseLib.success(response.data);
  }
}
