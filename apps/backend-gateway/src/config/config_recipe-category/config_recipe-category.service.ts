import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { Result, MicroserviceResponse } from '@/common';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { ICreateRecipeCategory, IUpdateRecipeCategory } from './dto/recipe-category.dto';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class Config_RecipeCategoryService {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_RecipeCategoryService.name,
  );

  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly masterService: ClientProxy,
  ) { }

  /**
   * Find a recipe category by ID via microservice
   * ค้นหาหมวดหมู่สูตรอาหารเดียวตาม ID ผ่านไมโครเซอร์วิส
   * @param id - Recipe category ID / รหัสหมวดหมู่สูตรอาหาร
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Recipe category data or error / ข้อมูลหมวดหมู่สูตรอาหารหรือข้อผิดพลาด
   */
  async findOne(id: string, user_id: string, bu_code: string, version: string): Promise<Result<unknown>> {
    this.logger.debug({ function: 'findOne', id, version }, Config_RecipeCategoryService.name);
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'recipe-category.findOne', service: 'recipe-category' },
      { id, user_id, bu_code, version, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.OK) {
      return Result.error(response.response.message, httpStatusToErrorCode(response.response.status));
    }
    return Result.ok(response.data);
  }

  /**
   * Find all recipe categories with pagination via microservice
   * ค้นหาหมวดหมู่สูตรอาหารทั้งหมดพร้อมการแบ่งหน้าผ่านไมโครเซอร์วิส
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated recipe category data or error / ข้อมูลหมวดหมู่สูตรอาหารพร้อมการแบ่งหน้าหรือข้อผิดพลาด
   */
  async findAll(user_id: string, bu_code: string, paginate: IPaginate, version: string): Promise<Result<unknown>> {
    this.logger.debug({ function: 'findAll', paginate, version }, Config_RecipeCategoryService.name);
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'recipe-category.findAll', service: 'recipe-category' },
      { user_id, paginate, bu_code, version, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.OK) {
      return Result.error(response.response.message, httpStatusToErrorCode(response.response.status));
    }
    return Result.ok({ data: response.data, paginate: response.paginate });
  }

  /**
   * Create a new recipe category via microservice
   * สร้างหมวดหมู่สูตรอาหารใหม่ผ่านไมโครเซอร์วิส
   * @param createDto - Recipe category creation data / ข้อมูลสำหรับสร้างหมวดหมู่สูตรอาหาร
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Created recipe category or error / หมวดหมู่สูตรอาหารที่สร้างแล้วหรือข้อผิดพลาด
   */
  async create(createDto: ICreateRecipeCategory, user_id: string, bu_code: string, version: string): Promise<Result<unknown>> {
    this.logger.debug({ function: 'create', createDto, version }, Config_RecipeCategoryService.name);
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'recipe-category.create', service: 'recipe-category' },
      { data: createDto, user_id, bu_code, version, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.CREATED) {
      return Result.error(response.response.message, httpStatusToErrorCode(response.response.status));
    }
    return Result.ok(response.data);
  }

  /**
   * Update an existing recipe category via microservice
   * อัปเดตหมวดหมู่สูตรอาหารที่มีอยู่ผ่านไมโครเซอร์วิส
   * @param updateDto - Recipe category update data / ข้อมูลสำหรับอัปเดตหมวดหมู่สูตรอาหาร
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Updated recipe category or error / หมวดหมู่สูตรอาหารที่อัปเดตแล้วหรือข้อผิดพลาด
   */
  async update(updateDto: IUpdateRecipeCategory, user_id: string, bu_code: string, version: string): Promise<Result<unknown>> {
    this.logger.debug({ function: 'update', updateDto, version }, Config_RecipeCategoryService.name);
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'recipe-category.update', service: 'recipe-category' },
      { data: updateDto, user_id, bu_code, version, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.OK) {
      return Result.error(response.response.message, httpStatusToErrorCode(response.response.status));
    }
    return Result.ok(response.data);
  }

  /**
   * Partially update a recipe category via microservice
   * อัปเดตหมวดหมู่สูตรอาหารบางส่วนผ่านไมโครเซอร์วิส
   * @param updateDto - Partial update data / ข้อมูลสำหรับอัปเดตบางส่วน
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Patched recipe category or error / หมวดหมู่สูตรอาหารที่อัปเดตบางส่วนแล้วหรือข้อผิดพลาด
   */
  async patch(updateDto: IUpdateRecipeCategory, user_id: string, bu_code: string, version: string): Promise<Result<unknown>> {
    this.logger.debug({ function: 'patch', updateDto, version }, Config_RecipeCategoryService.name);
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'recipe-category.patch', service: 'recipe-category' },
      { data: updateDto, user_id, bu_code, version, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.OK) {
      return Result.error(response.response.message, httpStatusToErrorCode(response.response.status));
    }
    return Result.ok(response.data);
  }

  /**
   * Delete a recipe category by ID via microservice
   * ลบหมวดหมู่สูตรอาหารตาม ID ผ่านไมโครเซอร์วิส
   * @param id - Recipe category ID / รหัสหมวดหมู่สูตรอาหาร
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result or error / ผลการลบหรือข้อผิดพลาด
   */
  async delete(id: string, user_id: string, bu_code: string, version: string): Promise<Result<unknown>> {
    this.logger.debug({ function: 'delete', id, version }, Config_RecipeCategoryService.name);
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'recipe-category.delete', service: 'recipe-category' },
      { id, user_id, bu_code, version, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.OK) {
      return Result.error(response.response.message, httpStatusToErrorCode(response.response.status));
    }
    return Result.ok(response.data);
  }
}
