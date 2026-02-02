import {
  ConsoleLogger,
  HttpStatus,
  Inject,
  Injectable,
  NotImplementedException,
} from '@nestjs/common';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { CreatePurchaseRequestDto, Result } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { BackendLogger } from 'src/common/helpers/backend.logger';

@Injectable()
export class MyPendingPurchaseRequestService {
  private readonly logger: BackendLogger = new BackendLogger(
    MyPendingPurchaseRequestService.name,
  );

  constructor(
    @Inject('PROCUREMENT_SERVICE')
    private readonly procurementService: ClientProxy,
  ) { }

  async findById(
    id: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'findById',
        id,
        version,
      },
      MyPendingPurchaseRequestService.name,
    );

    const res: Observable<any> = this.procurementService.send(
      { cmd: 'purchase-request.find-by-id', service: 'purchase-request' },
      { id: id, user_id: user_id, tenant_id: tenant_id, version: version },
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
      MyPendingPurchaseRequestService.name,
    );

    const res: Observable<any> = this.procurementService.send(
      { cmd: 'my-pending.purchase-request.find-all', service: 'my-pending' },
      {
        user_id: user_id,
        bu_code: bu_code,
        paginate: paginate,
        version: version,
      },
    );

    const response = await firstValueFrom(res);

    console.log('Response from procurement service:', response);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  async create(
    createDto: CreatePurchaseRequestDto,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      MyPendingPurchaseRequestService.name,
    );

    const res: Observable<any> = this.procurementService.send(
      {
        cmd: 'purchase-request.create',
        service: 'purchase-request',
      },
      {
        data: createDto,
        user_id: user_id,
        tenant_id: tenant_id,
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

  async update(
    id: string,
    updateDto: any,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateDto,
        version,
      },
      MyPendingPurchaseRequestService.name,
    );

    const res: Observable<any> = this.procurementService.send(
      { cmd: 'purchase-request.update', service: 'purchase-request' },
      {
        data: { id, ...updateDto },
        user_id: user_id,
        tenant_id: tenant_id,
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
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'submit',
        id,
        version,
      },
      MyPendingPurchaseRequestService.name,
    );

    const res: Observable<any> = this.procurementService.send(
      { cmd: 'purchase-request.submit', service: 'purchase-request' },
      { id: id, user_id: user_id, tenant_id: tenant_id, version: version },
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
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'approve',
        id,
        payload,
        version,
      },
      MyPendingPurchaseRequestService.name,
    );

    const res: Observable<any> = this.procurementService.send(
      { cmd: 'purchase-request.approve', service: 'purchase-request' },
      {
        id: id,
        body: payload,
        user_id: user_id,
        tenant_id: tenant_id,
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
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'reject',
        id,
        version,
      },
      MyPendingPurchaseRequestService.name,
    );

    const res: Observable<any> = this.procurementService.send(
      { cmd: 'purchase-request.reject', service: 'purchase-request' },
      { id: id, user_id: user_id, tenant_id: tenant_id, version: version },
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
    body: any,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'review',
        id,
        version,
      },
      MyPendingPurchaseRequestService.name,
    );

    const res: Observable<any> = this.procurementService.send(
      { cmd: 'purchase-request.review', service: 'purchase-request' },
      {
        id: id,
        body,
        user_id: user_id,
        tenant_id: tenant_id,
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

  async delete(
    id: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'delete',
        id,
        version,
      },
      MyPendingPurchaseRequestService.name,
    );

    const res: Observable<any> = this.procurementService.send(
      { cmd: 'purchase-request.delete', service: 'purchase-request' },
      { id: id, user_id: user_id, tenant_id: tenant_id, version: version },
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
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'findAllByStatus',
        status,
        version,
      },
      MyPendingPurchaseRequestService.name,
    );

    const res: Observable<any> = this.procurementService.send(
      {
        cmd: 'purchase-request.find-all-by-status',
        service: 'purchase-request',
      },
      {
        status: status,
        user_id: user_id,
        tenant_id: tenant_id,
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
        bu_code
      },
      MyPendingPurchaseRequestService.name,
    );
    const res: Observable<any> = this.procurementService.send(
      {
        cmd: 'purchase-request.find-all-my-pending-stages',
        service: 'purchase-request',
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

  async findAllMyPendingPurchaseRequestsCount(
    user_id: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'findAllMyPendingPurchaseRequestsCount',
        version,
        user_id,
      },
      MyPendingPurchaseRequestService.name,
    );
    const res: Observable<any> = this.procurementService.send(
      { cmd: 'my-pending.purchase-request.find-all.count', service: 'my-pending' },
      {
        user_id,
        version: version,
      },
    );

    const response = await firstValueFrom(res);

    this.logger.debug(
      {
        function: 'findAllMyPendingPurchaseRequestsCount',
        version,
        user_id,
        response,
      },
      MyPendingPurchaseRequestService.name,
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
