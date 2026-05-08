import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { Result, MicroserviceResponse } from '@/common';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { ICreateRecipeEquipmentCategory, IUpdateRecipeEquipmentCategory } from './dto/recipe-equipment-category.dto';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class Config_RecipeEquipmentCategoryService {
  private readonly logger: BackendLogger = new BackendLogger(Config_RecipeEquipmentCategoryService.name);

  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly masterService: ClientProxy,
  ) { }

  async findOne(id: string, user_id: string, bu_code: string, version: string): Promise<Result<unknown>> {
    this.logger.debug({ function: 'findOne', id, version }, Config_RecipeEquipmentCategoryService.name);
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'recipe-equipment-category.findOne', service: 'recipe-equipment-category' },
      { id, user_id, bu_code, version, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.OK) {
      return Result.error(response.response.message, httpStatusToErrorCode(response.response.status));
    }
    return Result.ok(response.data);
  }

  async findAll(user_id: string, bu_code: string, paginate: IPaginate, version: string): Promise<Result<unknown>> {
    this.logger.debug({ function: 'findAll', paginate, version }, Config_RecipeEquipmentCategoryService.name);
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'recipe-equipment-category.findAll', service: 'recipe-equipment-category' },
      { user_id, paginate, bu_code, version, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.OK) {
      return Result.error(response.response.message, httpStatusToErrorCode(response.response.status));
    }
    return Result.ok({ data: response.data, paginate: response.paginate });
  }

  async create(createDto: ICreateRecipeEquipmentCategory, user_id: string, bu_code: string, version: string): Promise<Result<unknown>> {
    this.logger.debug({ function: 'create', createDto, version }, Config_RecipeEquipmentCategoryService.name);
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'recipe-equipment-category.create', service: 'recipe-equipment-category' },
      { data: createDto, user_id, bu_code, version, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.CREATED) {
      return Result.error(response.response.message, httpStatusToErrorCode(response.response.status));
    }
    return Result.ok(response.data);
  }

  async update(updateDto: IUpdateRecipeEquipmentCategory, user_id: string, bu_code: string, version: string): Promise<Result<unknown>> {
    this.logger.debug({ function: 'update', updateDto, version }, Config_RecipeEquipmentCategoryService.name);
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'recipe-equipment-category.update', service: 'recipe-equipment-category' },
      { data: updateDto, user_id, bu_code, version, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.OK) {
      return Result.error(response.response.message, httpStatusToErrorCode(response.response.status));
    }
    return Result.ok(response.data);
  }

  async patch(updateDto: IUpdateRecipeEquipmentCategory, user_id: string, bu_code: string, version: string): Promise<Result<unknown>> {
    this.logger.debug({ function: 'patch', updateDto, version }, Config_RecipeEquipmentCategoryService.name);
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'recipe-equipment-category.patch', service: 'recipe-equipment-category' },
      { data: updateDto, user_id, bu_code, version, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.OK) {
      return Result.error(response.response.message, httpStatusToErrorCode(response.response.status));
    }
    return Result.ok(response.data);
  }

  async delete(id: string, user_id: string, bu_code: string, version: string): Promise<Result<unknown>> {
    this.logger.debug({ function: 'delete', id, version }, Config_RecipeEquipmentCategoryService.name);
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'recipe-equipment-category.delete', service: 'recipe-equipment-category' },
      { id, user_id, bu_code, version, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.OK) {
      return Result.error(response.response.message, httpStatusToErrorCode(response.response.status));
    }
    return Result.ok(response.data);
  }
}
