import { HttpStatus, Injectable } from '@nestjs/common';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { Observable } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { Result } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { BackendLogger } from 'src/common/helpers/backend.logger';

@Injectable()
export class StockOutDetailService {
  private readonly logger: BackendLogger = new BackendLogger(StockOutDetailService.name);

  constructor(
    @Inject('INVENTORY_SERVICE')
    private readonly inventoryService: ClientProxy,
  ) {}

  async findAll(
    user_id: string,
    tenant_id: string,
    paginate: IPaginate,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findAll', user_id, tenant_id, paginate, version },
      StockOutDetailService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'stock-out-detail.findAll', service: 'stock-out-detail' },
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

  async findOne(
    id: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findOne', id, user_id, tenant_id, version },
      StockOutDetailService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'stock-out-detail.findOne', service: 'stock-out-detail' },
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

  async create(
    data: any,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'create', data, user_id, tenant_id, version },
      StockOutDetailService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'stock-out-detail.createStandalone', service: 'stock-out-detail' },
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
    id: string,
    data: any,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'update', id, data, user_id, tenant_id, version },
      StockOutDetailService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'stock-out-detail.updateStandalone', service: 'stock-out-detail' },
      { id, data, user_id, tenant_id, version },
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
      StockOutDetailService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'stock-out-detail.deleteStandalone', service: 'stock-out-detail' },
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
}
