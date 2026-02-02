import { de } from 'zod/v4/locales';
import {
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable, of } from 'rxjs';
import { CreatePurchaseRequestDto, RejectPurchaseRequestDto, Result, SubmitPurchaseRequest } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { ResponseLib } from 'src/libs/response.lib';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { CalculatePurchaseRequestDetail } from './dto/CalculatePurchaseRequestDetail.dto';

@Injectable()
export class PurchaseRequestService {
  private readonly logger: BackendLogger = new BackendLogger(
    PurchaseRequestService.name,
  );

  constructor(
    @Inject('PROCUREMENT_SERVICE')
    private readonly procurementService: ClientProxy,
  ) {}

  async findById(
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
        function: 'findById',
        id,
        version,
      },
      PurchaseRequestService.name,
    );

    const res: Observable<any> = this.procurementService.send(
      { cmd: 'purchase-request.find-by-id', service: 'purchase-request' },
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
    },
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'findAll',
        user_id,
        bu_code,
        paginate,
        userDatas,
        version,
      },
      PurchaseRequestService.name,
    );

    const res: Observable<any> = this.procurementService.send(
      { cmd: 'purchase-request.find-all', service: 'purchase-request' },
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

  async findAllWorkflowStagesByPr(
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'findAll',
        user_id,
        bu_code,
        version,
      },
      PurchaseRequestService.name,
    );

    const res: Observable<any> = this.procurementService.send(
      {
        cmd: 'purchase-request.find-all-workflow-stages-by-pr',
        service: 'purchase-request',
      },
      {
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

  async create(
    createDto: CreatePurchaseRequestDto,
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
      PurchaseRequestService.name,
    );

    const res: Observable<any> = this.procurementService.send(
      {
        cmd: 'purchase-request.create',
        service: 'purchase-request',
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

  async duplicatePr(
    body: { ids: string[] },
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'duplicatePr',
        body,
      },
      PurchaseRequestService.name,
    );

    const res: Observable<any> = this.procurementService.send(
      {
        cmd: 'purchase-request.duplicate-pr',
        service: 'purchase-request',
      },
      {
        body: body,
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

  async splitPr(
    id: string,
    body: { detail_ids: string[] },
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'splitPr',
        id,
        body,
      },
      PurchaseRequestService.name,
    );

    const res: Observable<any> = this.procurementService.send(
      {
        cmd: 'purchase-request.split',
        service: 'purchase-request',
      },
      {
        id: id,
        body: body,
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
      PurchaseRequestService.name,
    );

    const res: Observable<any> = this.procurementService.send(
      { cmd: 'purchase-request.save', service: 'purchase-request' },
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
    payload: SubmitPurchaseRequest,
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
      PurchaseRequestService.name,
    );

    const res: Observable<any> = this.procurementService.send(
      { cmd: 'purchase-request.submit', service: 'purchase-request' },
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
      PurchaseRequestService.name,
    );

    const res: Observable<any> = this.procurementService.send(
      { cmd: 'purchase-request.approve', service: 'purchase-request' },
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
    body: RejectPurchaseRequestDto,
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
      PurchaseRequestService.name,
    );

    const res: Observable<any> = this.procurementService.send(
      { cmd: 'purchase-request.reject', service: 'purchase-request' },
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
    body: any,
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
      PurchaseRequestService.name,
    );

    const res: Observable<any> = this.procurementService.send(
      { cmd: 'purchase-request.review', service: 'purchase-request' },
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
      PurchaseRequestService.name,
    );

    const res: Observable<any> = this.procurementService.send(
      { cmd: 'purchase-request.delete', service: 'purchase-request' },
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
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'findAllByStatus',
        status,
        version,
      },
      PurchaseRequestService.name,
    );

    const res: Observable<any> = this.procurementService.send(
      {
        cmd: 'purchase-request.find-all-by-status',
        service: 'purchase-request',
      },
      {
        status: status,
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

    return Result.ok({ data: response.data, paginate: response.paginate });
  }

  async exportToExcel(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<{ buffer: Buffer; filename: string }>> {
    this.logger.debug(
      {
        function: 'exportToExcel',
        id,
        version,
      },
      PurchaseRequestService.name,
    );

    const response = await firstValueFrom(
      this.procurementService.send(
        { cmd: 'purchase-request.export', service: 'purchase-request' },
        { id, user_id, bu_code, version },
      ),
    );

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    const data = response.data;
    if (data && data.buffer && data.buffer.type === 'Buffer') {
      data.buffer = Buffer.from(data.buffer.data);
    }

    return Result.ok(data);
  }

  async printToPdf(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<{ buffer: Buffer; filename: string }>> {
    this.logger.debug(
      {
        function: 'printToPdf',
        id,
        version,
      },
      PurchaseRequestService.name,
    );

    const response = await firstValueFrom(
      this.procurementService.send(
        { cmd: 'purchase-request.print', service: 'purchase-request' },
        { id, user_id, bu_code, version },
      ),
    );

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    const data = response.data;
    if (data && data.buffer && data.buffer.type === 'Buffer') {
      data.buffer = Buffer.from(data.buffer.data);
    }

    return Result.ok(data);
  }

  async findDimensionsByDetailId(
    detail_id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'findDimensionsByDetailId',
        detail_id,
        version,
      },
      PurchaseRequestService.name,
    );

    const res: Observable<any> = this.procurementService.send(
      {
        cmd: 'purchase-request.find-dimensions-by-detail-id',
        service: 'purchase-request',
      },
      {
        detail_id: detail_id,
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

    return ResponseLib.success(response.data);
  }

  async findHistoryByDetailId(
    detail_id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'findHistoryByDetailId',
        detail_id,
        version,
      },
      PurchaseRequestService.name,
    );

    const res: Observable<any> = this.procurementService.send(
      {
        cmd: 'purchase-request.find-history-by-detail-id',
        service: 'purchase-request',
      },
      {
        detail_id: detail_id,
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

    return ResponseLib.success(response.data);
  }

  async getCalculatePriceInfoByDetailId(
    detail_id: string,
    data: CalculatePurchaseRequestDetail,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'getCalculatePriceInfoByDetailId',
        detail_id,
        version,
      },
      PurchaseRequestService.name,
    );

    const res: Observable<any> = this.procurementService.send(
      {
        cmd: 'purchase-request.get-calculate-price-info-by-detail-id',
        service: 'purchase-request',
      },
      {
        detail_id: detail_id,
        data: data,
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

    return ResponseLib.success(response.data);
  }
}
