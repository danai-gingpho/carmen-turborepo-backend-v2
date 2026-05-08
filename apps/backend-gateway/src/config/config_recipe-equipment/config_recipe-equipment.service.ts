import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { Result, MicroserviceResponse } from '@/common';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { ICreateRecipeEquipment, IUpdateRecipeEquipment } from './dto/recipe-equipment.dto';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class Config_RecipeEquipmentService {
  private readonly logger: BackendLogger = new BackendLogger(Config_RecipeEquipmentService.name);

  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly masterService: ClientProxy,
  ) { }

  /**
   * Find a recipe equipment by ID via microservice
   * ค้นหาอุปกรณ์ครัวเดียวตาม ID ผ่านไมโครเซอร์วิส
   * @param id - Recipe equipment ID / รหัสอุปกรณ์ครัว
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Recipe equipment data or error / ข้อมูลอุปกรณ์ครัวหรือข้อผิดพลาด
   */
  async findOne(id: string, user_id: string, bu_code: string, version: string): Promise<Result<unknown>> {
    this.logger.debug({ function: 'findOne', id, version }, Config_RecipeEquipmentService.name);
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'recipe-equipment.findOne', service: 'recipe-equipment' },
      { id, user_id, bu_code, version, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.OK) {
      return Result.error(response.response.message, httpStatusToErrorCode(response.response.status));
    }
    return Result.ok(response.data);
  }

  /**
   * Find all recipe equipment with pagination via microservice
   * ค้นหาอุปกรณ์ครัวทั้งหมดพร้อมการแบ่งหน้าผ่านไมโครเซอร์วิส
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated recipe equipment data or error / ข้อมูลอุปกรณ์ครัวพร้อมการแบ่งหน้าหรือข้อผิดพลาด
   */
  async findAll(user_id: string, bu_code: string, paginate: IPaginate, version: string): Promise<Result<unknown>> {
    this.logger.debug({ function: 'findAll', paginate, version }, Config_RecipeEquipmentService.name);
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'recipe-equipment.findAll', service: 'recipe-equipment' },
      { user_id, paginate, bu_code, version, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.OK) {
      return Result.error(response.response.message, httpStatusToErrorCode(response.response.status));
    }
    return Result.ok({ data: response.data, paginate: response.paginate });
  }

  /**
   * Create a new recipe equipment via microservice
   * สร้างอุปกรณ์ครัวใหม่ผ่านไมโครเซอร์วิส
   * @param createDto - Recipe equipment creation data / ข้อมูลสำหรับสร้างอุปกรณ์ครัว
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Created recipe equipment or error / อุปกรณ์ครัวที่สร้างแล้วหรือข้อผิดพลาด
   */
  async create(createDto: ICreateRecipeEquipment, user_id: string, bu_code: string, version: string): Promise<Result<unknown>> {
    this.logger.debug({ function: 'create', createDto, version }, Config_RecipeEquipmentService.name);
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'recipe-equipment.create', service: 'recipe-equipment' },
      { data: createDto, user_id, bu_code, version, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.CREATED) {
      return Result.error(response.response.message, httpStatusToErrorCode(response.response.status));
    }
    return Result.ok(response.data);
  }

  /**
   * Update an existing recipe equipment via microservice
   * อัปเดตอุปกรณ์ครัวที่มีอยู่ผ่านไมโครเซอร์วิส
   * @param updateDto - Recipe equipment update data / ข้อมูลสำหรับอัปเดตอุปกรณ์ครัว
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Updated recipe equipment or error / อุปกรณ์ครัวที่อัปเดตแล้วหรือข้อผิดพลาด
   */
  async update(updateDto: IUpdateRecipeEquipment, user_id: string, bu_code: string, version: string): Promise<Result<unknown>> {
    this.logger.debug({ function: 'update', updateDto, version }, Config_RecipeEquipmentService.name);
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'recipe-equipment.update', service: 'recipe-equipment' },
      { data: updateDto, user_id, bu_code, version, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.OK) {
      return Result.error(response.response.message, httpStatusToErrorCode(response.response.status));
    }
    return Result.ok(response.data);
  }

  /**
   * Partially update a recipe equipment via microservice
   * อัปเดตอุปกรณ์ครัวบางส่วนผ่านไมโครเซอร์วิส
   * @param updateDto - Partial update data / ข้อมูลสำหรับอัปเดตบางส่วน
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Patched recipe equipment or error / อุปกรณ์ครัวที่อัปเดตบางส่วนแล้วหรือข้อผิดพลาด
   */
  async patch(updateDto: IUpdateRecipeEquipment, user_id: string, bu_code: string, version: string): Promise<Result<unknown>> {
    this.logger.debug({ function: 'patch', updateDto, version }, Config_RecipeEquipmentService.name);
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'recipe-equipment.patch', service: 'recipe-equipment' },
      { data: updateDto, user_id, bu_code, version, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.OK) {
      return Result.error(response.response.message, httpStatusToErrorCode(response.response.status));
    }
    return Result.ok(response.data);
  }

  /**
   * Delete a recipe equipment by ID via microservice
   * ลบอุปกรณ์ครัวตาม ID ผ่านไมโครเซอร์วิส
   * @param id - Recipe equipment ID / รหัสอุปกรณ์ครัว
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result or error / ผลการลบหรือข้อผิดพลาด
   */
  async delete(id: string, user_id: string, bu_code: string, version: string): Promise<Result<unknown>> {
    this.logger.debug({ function: 'delete', id, version }, Config_RecipeEquipmentService.name);
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'recipe-equipment.delete', service: 'recipe-equipment' },
      { id, user_id, bu_code, version, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.OK) {
      return Result.error(response.response.message, httpStatusToErrorCode(response.response.status));
    }
    return Result.ok(response.data);
  }
}
