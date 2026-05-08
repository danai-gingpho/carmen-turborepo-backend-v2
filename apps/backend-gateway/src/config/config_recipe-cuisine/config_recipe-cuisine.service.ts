import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { Result, MicroserviceResponse } from '@/common';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { ICreateRecipeCuisine, IUpdateRecipeCuisine } from './dto/recipe-cuisine.dto';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class Config_RecipeCuisineService {
  private readonly logger: BackendLogger = new BackendLogger(Config_RecipeCuisineService.name);

  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly masterService: ClientProxy,
  ) { }

  /**
   * Find a recipe cuisine by ID via microservice
   * ค้นหาประเภทอาหารเดียวตาม ID ผ่านไมโครเซอร์วิส
   * @param id - Recipe cuisine ID / รหัสประเภทอาหาร
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Recipe cuisine data or error / ข้อมูลประเภทอาหารหรือข้อผิดพลาด
   */
  async findOne(id: string, user_id: string, bu_code: string, version: string): Promise<Result<unknown>> {
    this.logger.debug({ function: 'findOne', id, version }, Config_RecipeCuisineService.name);
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'recipe-cuisine.findOne', service: 'recipe-cuisine' },
      { id, user_id, bu_code, version, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.OK) {
      return Result.error(response.response.message, httpStatusToErrorCode(response.response.status));
    }
    return Result.ok(response.data);
  }

  /**
   * Find all recipe cuisines with pagination via microservice
   * ค้นหาประเภทอาหารทั้งหมดพร้อมการแบ่งหน้าผ่านไมโครเซอร์วิส
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated recipe cuisine data or error / ข้อมูลประเภทอาหารพร้อมการแบ่งหน้าหรือข้อผิดพลาด
   */
  async findAll(user_id: string, bu_code: string, paginate: IPaginate, version: string): Promise<Result<unknown>> {
    this.logger.debug({ function: 'findAll', paginate, version }, Config_RecipeCuisineService.name);
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'recipe-cuisine.findAll', service: 'recipe-cuisine' },
      { user_id, paginate, bu_code, version, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.OK) {
      return Result.error(response.response.message, httpStatusToErrorCode(response.response.status));
    }
    return Result.ok({ data: response.data, paginate: response.paginate });
  }

  /**
   * Create a new recipe cuisine via microservice
   * สร้างประเภทอาหารใหม่ผ่านไมโครเซอร์วิส
   * @param createDto - Recipe cuisine creation data / ข้อมูลสำหรับสร้างประเภทอาหาร
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Created recipe cuisine or error / ประเภทอาหารที่สร้างแล้วหรือข้อผิดพลาด
   */
  async create(createDto: ICreateRecipeCuisine, user_id: string, bu_code: string, version: string): Promise<Result<unknown>> {
    this.logger.debug({ function: 'create', createDto, version }, Config_RecipeCuisineService.name);
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'recipe-cuisine.create', service: 'recipe-cuisine' },
      { data: createDto, user_id, bu_code, version, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.CREATED) {
      return Result.error(response.response.message, httpStatusToErrorCode(response.response.status));
    }
    return Result.ok(response.data);
  }

  /**
   * Update an existing recipe cuisine via microservice
   * อัปเดตประเภทอาหารที่มีอยู่ผ่านไมโครเซอร์วิส
   * @param updateDto - Recipe cuisine update data / ข้อมูลสำหรับอัปเดตประเภทอาหาร
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Updated recipe cuisine or error / ประเภทอาหารที่อัปเดตแล้วหรือข้อผิดพลาด
   */
  async update(updateDto: IUpdateRecipeCuisine, user_id: string, bu_code: string, version: string): Promise<Result<unknown>> {
    this.logger.debug({ function: 'update', updateDto, version }, Config_RecipeCuisineService.name);
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'recipe-cuisine.update', service: 'recipe-cuisine' },
      { data: updateDto, user_id, bu_code, version, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.OK) {
      return Result.error(response.response.message, httpStatusToErrorCode(response.response.status));
    }
    return Result.ok(response.data);
  }

  /**
   * Partially update a recipe cuisine via microservice
   * อัปเดตประเภทอาหารบางส่วนผ่านไมโครเซอร์วิส
   * @param updateDto - Partial update data / ข้อมูลสำหรับอัปเดตบางส่วน
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Patched recipe cuisine or error / ประเภทอาหารที่อัปเดตบางส่วนแล้วหรือข้อผิดพลาด
   */
  async patch(updateDto: IUpdateRecipeCuisine, user_id: string, bu_code: string, version: string): Promise<Result<unknown>> {
    this.logger.debug({ function: 'patch', updateDto, version }, Config_RecipeCuisineService.name);
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'recipe-cuisine.patch', service: 'recipe-cuisine' },
      { data: updateDto, user_id, bu_code, version, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.OK) {
      return Result.error(response.response.message, httpStatusToErrorCode(response.response.status));
    }
    return Result.ok(response.data);
  }

  /**
   * Delete a recipe cuisine by ID via microservice
   * ลบประเภทอาหารตาม ID ผ่านไมโครเซอร์วิส
   * @param id - Recipe cuisine ID / รหัสประเภทอาหาร
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result or error / ผลการลบหรือข้อผิดพลาด
   */
  async delete(id: string, user_id: string, bu_code: string, version: string): Promise<Result<unknown>> {
    this.logger.debug({ function: 'delete', id, version }, Config_RecipeCuisineService.name);
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'recipe-cuisine.delete', service: 'recipe-cuisine' },
      { id, user_id, bu_code, version, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.OK) {
      return Result.error(response.response.message, httpStatusToErrorCode(response.response.status));
    }
    return Result.ok(response.data);
  }
}
