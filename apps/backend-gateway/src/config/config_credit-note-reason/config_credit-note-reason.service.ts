import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import {
  ICreateCreditNoteReason,
  IUpdateCreditNoteReason,
  Result,
  MicroserviceResponse,
} from '@/common';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class Config_CreditNoteReasonService {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_CreditNoteReasonService.name,
  );

  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly masterService: ClientProxy,
  ) {}

  async findOne(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'credit-note-reason.find-one', service: 'credit-note-reason' },
      { id, user_id, bu_code, version, ...getGatewayRequestContext() },
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
    bu_code: string,
    paginate: IPaginate,
    version: string,
  ): Promise<Result<unknown>> {
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'credit-note-reason.find-all', service: 'credit-note-reason' },
      { user_id, paginate, bu_code, version, ...getGatewayRequestContext() },
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
    createDto: ICreateCreditNoteReason,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'credit-note-reason.create', service: 'credit-note-reason' },
      { data: createDto, user_id, bu_code, version, ...getGatewayRequestContext() },
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
    updateDto: IUpdateCreditNoteReason,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'credit-note-reason.update', service: 'credit-note-reason' },
      { data: updateDto, user_id, bu_code, version, ...getGatewayRequestContext() },
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

  async patch(
    updateDto: IUpdateCreditNoteReason,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'credit-note-reason.patch', service: 'credit-note-reason' },
      { data: updateDto, user_id, bu_code, version, ...getGatewayRequestContext() },
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
  ): Promise<Result<unknown>> {
    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'credit-note-reason.delete', service: 'credit-note-reason' },
      { id, user_id, bu_code, version, ...getGatewayRequestContext() },
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
