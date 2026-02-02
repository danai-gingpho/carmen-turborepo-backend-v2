import { HttpStatus, Injectable } from '@nestjs/common';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { Observable } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import {
  ITransferCreate,
  ITransferUpdate,
  Result,
} from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { BackendLogger } from 'src/common/helpers/backend.logger';

@Injectable()
export class TransferService {
  private readonly logger: BackendLogger = new BackendLogger(TransferService.name);

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
      TransferService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'transfer.findOne', service: 'transfer' },
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
      TransferService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'transfer.findAll', service: 'transfer' },
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
    data: ITransferCreate,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'create', data, user_id, tenant_id, version },
      TransferService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'transfer.create', service: 'transfer' },
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
    data: ITransferUpdate,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'update', data, user_id, tenant_id, version },
      TransferService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'transfer.update', service: 'transfer' },
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
      TransferService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'transfer.delete', service: 'transfer' },
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

  // ==================== Transfer Detail CRUD ====================

  async findDetailById(
    detailId: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findDetailById', detailId, user_id, tenant_id, version },
      TransferService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'transfer-detail.find-by-id', service: 'transfer' },
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

  async findDetailsByTransferId(
    transferId: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findDetailsByTransferId', transferId, user_id, tenant_id, version },
      TransferService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'transfer-detail.find-all', service: 'transfer' },
      { transfer_id: transferId, user_id, tenant_id, version },
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
    transferId: string,
    data: any,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'createDetail', transferId, data, user_id, tenant_id, version },
      TransferService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'transfer-detail.create', service: 'transfer' },
      { transfer_id: transferId, data, user_id, tenant_id, version },
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
      TransferService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'transfer-detail.update', service: 'transfer' },
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
      TransferService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'transfer-detail.delete', service: 'transfer' },
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
