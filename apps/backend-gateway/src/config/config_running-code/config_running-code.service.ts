import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';
import { MicroserviceResponse } from '@/common';
import {
  IRunningCodeCreate,
  IRunningCodeUpdate,
} from './dto/config_running-code.dto';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { ResponseLib } from 'src/libs/response.lib';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class Config_RunningCodeService {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_RunningCodeService.name,
  );
  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly masterService: ClientProxy,
  ) {}

  /**
   * Find a running code by ID via microservice
   * ค้นหารหัสรันนิ่งเดียวตาม ID ผ่านไมโครเซอร์วิส
   * @param id - Running code ID / รหัสรหัสรันนิ่ง
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Running code data or error / ข้อมูลรหัสรันนิ่งหรือข้อผิดพลาด
   */
  async findOne(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<unknown> {
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'running-code.findOne', service: 'running-codes' },
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
   * Find all running codes with pagination via microservice
   * ค้นหารหัสรันนิ่งทั้งหมดพร้อมการแบ่งหน้าผ่านไมโครเซอร์วิส
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated running code data or error / ข้อมูลรหัสรันนิ่งพร้อมการแบ่งหน้าหรือข้อผิดพลาด
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
      Config_RunningCodeService.name,
    );
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'running-code.findAll', service: 'running-codes' },
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
   * Initialize all default running codes via microservice
   * สร้างรหัสรันนิ่งเริ่มต้นทั้งหมดผ่านไมโครเซอร์วิส
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Initialized running codes or error / รหัสรันนิ่งที่สร้างขึ้นหรือข้อผิดพลาด
   */
  async init(
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'init',
        version,
      },
      Config_RunningCodeService.name,
    );
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'running-code.init', service: 'running-codes' },
      {
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
   * Create a new running code via microservice
   * สร้างรหัสรันนิ่งใหม่ผ่านไมโครเซอร์วิส
   * @param createDto - Creation data / ข้อมูลสำหรับสร้าง
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Created running code or error / รหัสรันนิ่งที่สร้างแล้วหรือข้อผิดพลาด
   */
  async create(
    createDto: IRunningCodeCreate,
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
      Config_RunningCodeService.name,
    );
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'running-code.create', service: 'running-codes' },
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
   * Update an existing running code via microservice
   * อัปเดตรหัสรันนิ่งที่มีอยู่ผ่านไมโครเซอร์วิส
   * @param updateDto - Update data / ข้อมูลสำหรับอัปเดต
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Updated running code or error / รหัสรันนิ่งที่อัปเดตแล้วหรือข้อผิดพลาด
   */
  async update(
    updateDto: IRunningCodeUpdate,
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
      Config_RunningCodeService.name,
    );
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'running-code.update', service: 'running-codes' },
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
   * Delete a running code by ID via microservice
   * ลบรหัสรันนิ่งตาม ID ผ่านไมโครเซอร์วิส
   * @param id - Running code ID / รหัสรหัสรันนิ่ง
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
      Config_RunningCodeService.name,
    );
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'running-code.delete', service: 'running-codes' },
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
   * Find a running code by document type via microservice
   * ค้นหารหัสรันนิ่งตามประเภทเอกสารผ่านไมโครเซอร์วิส
   * @param type - Document type / ประเภทเอกสาร
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Running code for the type or error / รหัสรันนิ่งสำหรับประเภทนั้นหรือข้อผิดพลาด
   */
  async findByType(
    type: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'findByType',
        type,
        version,
      },
      Config_RunningCodeService.name,
    );
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'running-code.findByType', service: 'running-codes' },
      { type: type, user_id: user_id, bu_code: bu_code, version: version, ...getGatewayRequestContext() },
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
