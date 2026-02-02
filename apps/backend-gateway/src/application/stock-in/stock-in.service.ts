import { HttpStatus, Injectable } from '@nestjs/common';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { Observable } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import {
  IStockInCreate,
  IStockInUpdate,
  Result,
} from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { BackendLogger } from 'src/common/helpers/backend.logger';

@Injectable()
export class StockInService {
  private readonly logger: BackendLogger = new BackendLogger(StockInService.name);

  constructor(
    @Inject('INVENTORY_SERVICE')
    private readonly inventoryService: ClientProxy,
  ) {}

  async findOne(
    id: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findOne', id, user_id, tenant_id, version },
      StockInService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'stock-in.findOne', service: 'stock-in' },
      { id, user_id, tenant_id, version },
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

  async findAll(
    user_id: string,
    tenant_id: string,
    paginate: IPaginate,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findAll', user_id, tenant_id, paginate, version },
      StockInService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'stock-in.findAll', service: 'stock-in' },
      { user_id, tenant_id, paginate, version },
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

  async create(
    data: IStockInCreate,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'create', data, user_id, tenant_id, version },
      StockInService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'stock-in.create', service: 'stock-in' },
      { data, user_id, tenant_id, version },
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

  async update(
    data: IStockInUpdate,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'update', data, user_id, tenant_id, version },
      StockInService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'stock-in.update', service: 'stock-in' },
      { data, user_id, tenant_id, version },
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

  async delete(
    id: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'delete', id, user_id, tenant_id, version },
      StockInService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'stock-in.delete', service: 'stock-in' },
      { id, user_id, tenant_id, version },
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

  // ==================== Stock In Detail CRUD ====================

  async findDetailById(
    detailId: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findDetailById', detailId, user_id, tenant_id, version },
      StockInService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'stock-in-detail.find-by-id', service: 'stock-in' },
      { detail_id: detailId, user_id, tenant_id, version },
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

  async findDetailsByStockInId(
    stockInId: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findDetailsByStockInId', stockInId, user_id, tenant_id, version },
      StockInService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'stock-in-detail.find-all', service: 'stock-in' },
      { stock_in_id: stockInId, user_id, tenant_id, version },
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

  async createDetail(
    stockInId: string,
    data: any,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'createDetail', stockInId, data, user_id, tenant_id, version },
      StockInService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'stock-in-detail.create', service: 'stock-in' },
      { stock_in_id: stockInId, data, user_id, tenant_id, version },
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

  async updateDetail(
    detailId: string,
    data: any,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'updateDetail', detailId, data, user_id, tenant_id, version },
      StockInService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'stock-in-detail.update', service: 'stock-in' },
      { detail_id: detailId, data, user_id, tenant_id, version },
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

  async deleteDetail(
    detailId: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'deleteDetail', detailId, user_id, tenant_id, version },
      StockInService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'stock-in-detail.delete', service: 'stock-in' },
      { detail_id: detailId, user_id, tenant_id, version },
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
