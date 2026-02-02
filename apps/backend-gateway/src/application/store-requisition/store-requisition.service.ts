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
  RejectStoreRequisitionDto,
  SubmitStoreRequisitionDto,
  ReviewStoreRequisitionDto,
} from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { BackendLogger } from 'src/common/helpers/backend.logger';

@Injectable()
export class StoreRequisitionService {
  private readonly logger: BackendLogger = new BackendLogger(
    StoreRequisitionService.name,
  );

  constructor(
    @Inject('INVENTORY_SERVICE')
    private readonly inventoryService: ClientProxy,
  ) { }

  async findOne(
    id: string,
    user_id: string,
    bu_code: string,
    userData: {
      bu_id: string;
      bu_code: string;
      role: string;
      permissions: any;
    },
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        version,
      },
      StoreRequisitionService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'store-requisition.find-by-id', service: 'store-requisition' },
      {
        id: id,
        user_id: user_id,
        bu_code: bu_code,
        userData: userData,
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

  async findAll(
    user_id: string,
    bu_code: string[],
    paginate: IPaginate,
    userDatas: {
      bu_id: string;
      bu_code: string;
      role: string;
      permissions: any;
    }[],
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
      StoreRequisitionService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'store-requisition.find-all', service: 'store-requisition' },
      {
        user_id: user_id,
        bu_code: bu_code,
        paginate: paginate,
        userDatas: userDatas,
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
    createDto: any,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      StoreRequisitionService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      {
        cmd: 'store-requisition.create',
        service: 'store-requisition',
      },
      {
        data: createDto,
        user_id: user_id,
        bu_code: bu_code,
        version: version,
      },
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

  async save(
    id: string,
    updateDto: any,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'save',
        id,
        updateDto,
        version,
      },
      StoreRequisitionService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'store-requisition.save', service: 'store-requisition' },
      {
        id,
        data: updateDto,
        user_id: user_id,
        bu_code: bu_code,
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

  async submit(
    id: string,
    payload: SubmitStoreRequisitionDto,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'submit',
        id,
        version,
      },
      StoreRequisitionService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'store-requisition.submit', service: 'store-requisition' },
      { id: id, payload, user_id: user_id, bu_code: bu_code, version: version },
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
    payload: any,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'approve',
        id,
        payload,
        version,
      },
      StoreRequisitionService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'store-requisition.approve', service: 'store-requisition' },
      {
        id: id,
        body: payload,
        user_id: user_id,
        bu_code: bu_code,
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

  async reject(
    id: string,
    body: RejectStoreRequisitionDto,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'reject',
        id,
        version,
      },
      StoreRequisitionService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'store-requisition.reject', service: 'store-requisition' },
      { id: id, body, user_id: user_id, bu_code: bu_code, version: version },
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
    body: ReviewStoreRequisitionDto,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'review',
        id,
        version,
      },
      StoreRequisitionService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'store-requisition.review', service: 'store-requisition' },
      { id: id, body, user_id: user_id, bu_code: bu_code, version: version },
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

  async update(
    id: string,
    updateDto: any,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateDto,
        version,
      },
      StoreRequisitionService.name,
    );

    return this.save(id, updateDto, user_id, bu_code, version);
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
        version,
      },
      StoreRequisitionService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'store-requisition.delete', service: 'store-requisition' },
      { id: id, user_id: user_id, bu_code: bu_code, version: version },
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
    paginate: IPaginate,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'findAllByStatus',
        status,
        version,
      },
      StoreRequisitionService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      {
        cmd: 'store-requisition.find-all-by-status',
        service: 'store-requisition',
      },
      {
        status: status,
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

    return Result.ok({ data: response.data, paginate: response.paginate });
  }

  async findAllMyPending(
    user_id: string,
    bu_code: string,
    paginate: IPaginate,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'findAllMyPending',
        user_id,
        bu_code,
        paginate,
        version,
      },
      StoreRequisitionService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      {
        cmd: 'my-pending.store-requisition.find-all',
        service: 'my-pending',
      },
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

    return Result.ok({ data: response.data, paginate: response.paginate });
  }

  // ==================== Mobile-specific endpoints ====================

  async getWorkflowPermission(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'getWorkflowPermission',
        id,
        version,
      },
      StoreRequisitionService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'store-requisition.get-workflow-permission', service: 'store-requisition' },
      { id: id, user_id: user_id, bu_code: bu_code, version: version },
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

  async getWorkflowPreviousStepList(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'getWorkflowPreviousStepList',
        id,
        version,
      },
      StoreRequisitionService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'store-requisition.get-workflow-previous-step-list', service: 'store-requisition' },
      { id: id, user_id: user_id, bu_code: bu_code, version: version },
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
