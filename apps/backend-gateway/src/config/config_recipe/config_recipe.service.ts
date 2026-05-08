import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { Result, MicroserviceResponse } from '@/common';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { ICreateRecipe, IUpdateRecipe } from './dto/recipe.dto';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class Config_RecipeService {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_RecipeService.name,
  );

  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly masterService: ClientProxy,
  ) { }

  /**
   * Find a recipe by ID via microservice
   * ค้นหาสูตรอาหารเดียวตาม ID ผ่านไมโครเซอร์วิส
   * @param id - Recipe ID / รหัสสูตรอาหาร
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Recipe data or error / ข้อมูลสูตรอาหารหรือข้อผิดพลาด
   */
  async findOne(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findOne', id, version },
      Config_RecipeService.name,
    );
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'recipe.findOne', service: 'recipe' },
      { id, user_id, bu_code, version, ...getGatewayRequestContext() },
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
   * Find all recipes with pagination via microservice
   * ค้นหาสูตรอาหารทั้งหมดพร้อมการแบ่งหน้าผ่านไมโครเซอร์วิส
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated recipe data or error / ข้อมูลสูตรอาหารพร้อมการแบ่งหน้าหรือข้อผิดพลาด
   */
  async findAll(
    user_id: string,
    bu_code: string,
    paginate: IPaginate,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findAll', paginate, version },
      Config_RecipeService.name,
    );
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'recipe.findAll', service: 'recipe' },
      { user_id, paginate, bu_code, version, ...getGatewayRequestContext() },
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
   * Create a new recipe via microservice
   * สร้างสูตรอาหารใหม่ผ่านไมโครเซอร์วิส
   * @param createDto - Recipe creation data / ข้อมูลสำหรับสร้างสูตรอาหาร
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Created recipe or error / สูตรอาหารที่สร้างแล้วหรือข้อผิดพลาด
   */
  async create(
    createDto: ICreateRecipe,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'create', createDto, version },
      Config_RecipeService.name,
    );
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'recipe.create', service: 'recipe' },
      { data: createDto, user_id, bu_code, version, ...getGatewayRequestContext() },
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
   * Update an existing recipe via microservice
   * อัปเดตสูตรอาหารที่มีอยู่ผ่านไมโครเซอร์วิส
   * @param updateDto - Recipe update data / ข้อมูลสำหรับอัปเดตสูตรอาหาร
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Updated recipe or error / สูตรอาหารที่อัปเดตแล้วหรือข้อผิดพลาด
   */
  async update(
    updateDto: IUpdateRecipe,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'update', updateDto, version },
      Config_RecipeService.name,
    );
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'recipe.update', service: 'recipe' },
      { data: updateDto, user_id, bu_code, version, ...getGatewayRequestContext() },
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
   * Partially update a recipe via microservice
   * อัปเดตสูตรอาหารบางส่วนผ่านไมโครเซอร์วิส
   * @param updateDto - Partial recipe update data / ข้อมูลสำหรับอัปเดตสูตรอาหารบางส่วน
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Patched recipe or error / สูตรอาหารที่อัปเดตบางส่วนแล้วหรือข้อผิดพลาด
   */
  async patch(
    updateDto: IUpdateRecipe,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'patch', updateDto, version },
      Config_RecipeService.name,
    );
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'recipe.patch', service: 'recipe' },
      { data: updateDto, user_id, bu_code, version, ...getGatewayRequestContext() },
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
   * Delete a recipe by ID via microservice
   * ลบสูตรอาหารตาม ID ผ่านไมโครเซอร์วิส
   * @param id - Recipe ID / รหัสสูตรอาหาร
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
      { function: 'delete', id, version },
      Config_RecipeService.name,
    );
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'recipe.delete', service: 'recipe' },
      { id, user_id, bu_code, version, ...getGatewayRequestContext() },
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
