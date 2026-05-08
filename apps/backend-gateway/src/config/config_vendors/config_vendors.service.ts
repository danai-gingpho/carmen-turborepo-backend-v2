import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';
import { ICreateVendor, IUpdateVendor, MicroserviceResponse } from '@/common';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { ResponseLib } from 'src/libs/response.lib';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class Config_VendorsService {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_VendorsService.name,
  );

  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly masterService: ClientProxy,
  ) {}

  /**
   * Find a single vendor by ID via microservice
   * ค้นหาผู้ขายเดียวตาม ID ผ่านไมโครเซอร์วิส
   * @param id - Vendor ID / รหัสผู้ขาย
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Vendor detail or error / รายละเอียดผู้ขายหรือข้อผิดพลาด
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
      Config_VendorsService.name,
    );
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'vendors.findOne', service: 'vendors' },
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
   * Find all vendors with pagination via microservice
   * ค้นหารายการผู้ขายทั้งหมดพร้อมการแบ่งหน้าผ่านไมโครเซอร์วิส
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated vendors or error / รายการผู้ขายพร้อมการแบ่งหน้าหรือข้อผิดพลาด
   */
  async findAll(
    user_id: string,
    bu_code: string,
    paginate: IPaginate,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'findAll',
        user_id,
        bu_code,
        paginate,
        version,
      },
      Config_VendorsService.name,
    );
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'vendors.findAll', service: 'vendors' },
      {
        user_id: user_id,
        bu_code: bu_code,
        paginate: paginate,
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
   * Create a new vendor via microservice
   * สร้างผู้ขายใหม่ผ่านไมโครเซอร์วิส
   * @param createDto - Vendor creation data / ข้อมูลสำหรับสร้างผู้ขาย
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Created vendor or error / ผู้ขายที่สร้างแล้วหรือข้อผิดพลาด
   */
  async create(
    createDto: ICreateVendor,
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
      Config_VendorsService.name,
    );
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'vendors.create', service: 'vendors' },
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
   * Update a vendor via microservice
   * อัปเดตผู้ขายผ่านไมโครเซอร์วิส
   * @param updateDto - Vendor update data / ข้อมูลสำหรับอัปเดตผู้ขาย
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Updated vendor or error / ผู้ขายที่อัปเดตแล้วหรือข้อผิดพลาด
   */
  async update(
    updateDto: IUpdateVendor,
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
      Config_VendorsService.name,
    );
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'vendors.update', service: 'vendors' },
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
   * Delete a vendor via microservice
   * ลบผู้ขายผ่านไมโครเซอร์วิส
   * @param id - Vendor ID / รหัสผู้ขาย
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result or error / ผลลัพธ์การลบหรือข้อผิดพลาด
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
      Config_VendorsService.name,
    );
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'vendors.delete', service: 'vendors' },
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
