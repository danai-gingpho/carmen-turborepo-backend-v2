import {
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import {
  Result,
} from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { BackendLogger } from 'src/common/helpers/backend.logger';

@Injectable()
export class MyPendingStoreRequisitionService {
  private readonly logger: BackendLogger = new BackendLogger(
    MyPendingStoreRequisitionService.name,
  );

  constructor(
    @Inject('INVENTORY_SERVICE')
    private readonly inventoryService: ClientProxy,
  ) {}

  async findById(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'findById',
        id,
        user_id,
        bu_code,
        version,
      },
      MyPendingStoreRequisitionService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'store-requisition.find-by-id', service: 'store-requisition' },
      { id, user_id, bu_code, version },
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
    bu_code: string[],
    paginate: IPaginate,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'findAll',
        user_id,
        bu_code,
        paginate,
        version,
      },
      MyPendingStoreRequisitionService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'my-pending.store-requisition.find-all', service: 'my-pending' },
      {
        user_id: user_id,
        bu_code: bu_code,
        paginate: paginate,
        version: version,
      },
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
    body: any,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'create',
        body,
        user_id,
        bu_code,
        version,
      },
      MyPendingStoreRequisitionService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'store-requisition.create', service: 'store-requisition' },
      { data: body, user_id, bu_code, version },
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
    body: any,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'update',
        id,
        body,
        user_id,
        bu_code,
        version,
      },
      MyPendingStoreRequisitionService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'store-requisition.update', service: 'store-requisition' },
      { data: { id, ...body }, user_id, bu_code, version },
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

  async submit(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'submit',
        id,
        user_id,
        bu_code,
        version,
      },
      MyPendingStoreRequisitionService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'store-requisition.submit', service: 'store-requisition' },
      { id, user_id, bu_code, version },
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

  async approve(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'approve',
        id,
        user_id,
        bu_code,
        version,
      },
      MyPendingStoreRequisitionService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'store-requisition.approve', service: 'store-requisition' },
      { id, user_id, bu_code, version },
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

  async reject(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'reject',
        id,
        user_id,
        bu_code,
        version,
      },
      MyPendingStoreRequisitionService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'store-requisition.reject', service: 'store-requisition' },
      { id, user_id, bu_code, version },
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

  async review(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'review',
        id,
        user_id,
        bu_code,
        version,
      },
      MyPendingStoreRequisitionService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'store-requisition.review', service: 'store-requisition' },
      { id, user_id, bu_code, version },
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
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'delete',
        id,
        user_id,
        bu_code,
        version,
      },
      MyPendingStoreRequisitionService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'store-requisition.delete', service: 'store-requisition' },
      { id, user_id, bu_code, version },
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

  async findAllByStatus(
    status: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'findAllByStatus',
        status,
        user_id,
        bu_code,
        version,
      },
      MyPendingStoreRequisitionService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      {
        cmd: 'store-requisition.find-all-by-status',
        service: 'store-requisition',
      },
      { status, user_id, bu_code, version },
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

  async findAllMyPendingStages(
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'findAllMyPendingStages',
        version,
        user_id,
        bu_code,
      },
      MyPendingStoreRequisitionService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      {
        cmd: 'store-requisition.find-all-my-pending-stages',
        service: 'store-requisition',
      },
      {
        user_id,
        bu_code,
        version: version,
      },
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

  async findAllMyPendingStoreRequisitionsCount(
    user_id: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'findAllMyPendingStoreRequisitionsCount',
        version,
        user_id,
      },
      MyPendingStoreRequisitionService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      {
        cmd: 'my-pending.store-requisition.find-all.count',
        service: 'my-pending',
      },
      {
        user_id,
        version: version,
      },
    );

    const response = await firstValueFrom(res);

    this.logger.debug(
      {
        function: 'findAllMyPendingStoreRequisitionsCount',
        version,
        user_id,
        response,
      },
      MyPendingStoreRequisitionService.name,
    );

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }
}
