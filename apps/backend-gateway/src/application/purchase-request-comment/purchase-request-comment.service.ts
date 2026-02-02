import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { ResponseLib } from 'src/libs/response.lib';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { Result } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';

@Injectable()
export class PurchaseRequestCommentService {
  private readonly logger: BackendLogger = new BackendLogger(
    PurchaseRequestCommentService.name,
  );

  constructor(
    @Inject('PROCUREMENT_SERVICE')
    private readonly procurementService: ClientProxy,
  ) {}

  async findById(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'findById',
        id,
        version,
      },
      PurchaseRequestCommentService.name,
    );

    const res: Observable<any> = this.procurementService.send(
      {
        cmd: 'purchase-request-comment.find-by-id',
        service: 'purchase-request-comment',
      },
      { id, user_id, bu_code, version },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return ResponseLib.success(response.data);
  }

  async findAllByPurchaseRequestId(
    purchase_request_id: string,
    user_id: string,
    bu_code: string,
    paginate: IPaginate,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'findAllByPurchaseRequestId',
        purchase_request_id,
        paginate,
        version,
      },
      PurchaseRequestCommentService.name,
    );

    const res: Observable<any> = this.procurementService.send(
      {
        cmd: 'purchase-request-comment.find-all-by-purchase-request-id',
        service: 'purchase-request-comment',
      },
      { purchase_request_id, user_id, bu_code, paginate, version },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return ResponseLib.successWithPaginate(response.data, response.paginate);
  }

  async create(
    data: any,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'create',
        data,
        version,
      },
      PurchaseRequestCommentService.name,
    );

    const res: Observable<any> = this.procurementService.send(
      {
        cmd: 'purchase-request-comment.create',
        service: 'purchase-request-comment',
      },
      { data, user_id, bu_code, version },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.CREATED) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return ResponseLib.created(response.data);
  }

  async update(
    id: string,
    data: any,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'update',
        id,
        data,
        version,
      },
      PurchaseRequestCommentService.name,
    );

    const res: Observable<any> = this.procurementService.send(
      {
        cmd: 'purchase-request-comment.update',
        service: 'purchase-request-comment',
      },
      { id, data, user_id, bu_code, version },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return ResponseLib.success(response.data);
  }

  async delete(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'delete',
        id,
        version,
      },
      PurchaseRequestCommentService.name,
    );

    const res: Observable<any> = this.procurementService.send(
      {
        cmd: 'purchase-request-comment.delete',
        service: 'purchase-request-comment',
      },
      { id, user_id, bu_code, version },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return ResponseLib.success(response.data);
  }

  async addAttachment(
    id: string,
    attachment: any,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'addAttachment',
        id,
        attachment,
        version,
      },
      PurchaseRequestCommentService.name,
    );

    const res: Observable<any> = this.procurementService.send(
      {
        cmd: 'purchase-request-comment.add-attachment',
        service: 'purchase-request-comment',
      },
      { id, attachment, user_id, bu_code, version },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return ResponseLib.success(response.data);
  }

  async removeAttachment(
    id: string,
    fileToken: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'removeAttachment',
        id,
        fileToken,
        version,
      },
      PurchaseRequestCommentService.name,
    );

    const res: Observable<any> = this.procurementService.send(
      {
        cmd: 'purchase-request-comment.remove-attachment',
        service: 'purchase-request-comment',
      },
      { id, fileToken, user_id, bu_code, version },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return ResponseLib.success(response.data);
  }
}
