import { HttpStatus, Injectable } from '@nestjs/common';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { Observable } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import {
  IStockOutCreate,
  IStockOutUpdate,
  Result,
} from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { BackendLogger } from 'src/common/helpers/backend.logger';

@Injectable()
export class StockOutService {
  private readonly logger: BackendLogger = new BackendLogger(StockOutService.name);

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
      StockOutService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'stock-out.findOne', service: 'stock-out' },
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
      StockOutService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'stock-out.findAll', service: 'stock-out' },
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
    data: IStockOutCreate,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'create', data, user_id, tenant_id, version },
      StockOutService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'stock-out.create', service: 'stock-out' },
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
    data: IStockOutUpdate,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'update', data, user_id, tenant_id, version },
      StockOutService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'stock-out.update', service: 'stock-out' },
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
      StockOutService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'stock-out.delete', service: 'stock-out' },
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

  // ==================== Stock Out Detail CRUD ====================

  async findDetailById(
    detailId: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findDetailById', detailId, user_id, tenant_id, version },
      StockOutService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'stock-out-detail.find-by-id', service: 'stock-out' },
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

  async findDetailsByStockOutId(
    stockOutId: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findDetailsByStockOutId', stockOutId, user_id, tenant_id, version },
      StockOutService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'stock-out-detail.find-all', service: 'stock-out' },
      { stock_out_id: stockOutId, user_id, tenant_id, version },
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
    stockOutId: string,
    data: any,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'createDetail', stockOutId, data, user_id, tenant_id, version },
      StockOutService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'stock-out-detail.create', service: 'stock-out' },
      { stock_out_id: stockOutId, data, user_id, tenant_id, version },
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
      StockOutService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'stock-out-detail.update', service: 'stock-out' },
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
      StockOutService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'stock-out-detail.delete', service: 'stock-out' },
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
