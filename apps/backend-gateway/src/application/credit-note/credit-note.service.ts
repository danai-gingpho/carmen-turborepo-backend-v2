import { HttpStatus, Injectable } from '@nestjs/common';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { Observable } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { CreateCreditNoteDto, UpdateCreditNoteDto, Result } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { BackendLogger } from 'src/common/helpers/backend.logger';

@Injectable()
export class CreditNoteService {
  private readonly logger: BackendLogger = new BackendLogger(
    CreditNoteService.name,
  );

  constructor(
    @Inject('PROCUREMENT_SERVICE')
    private readonly procurementService: ClientProxy,
  ) {}

  async findOne(
    id: string,
    user_id: string,
    bu_code: string,
    version: string = 'latest',
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        user_id,
        bu_code,
        version,
      },
      CreditNoteService.name,
    );

    const res: Observable<any> = this.procurementService.send(
      { cmd: 'credit-note.find-one', service: 'credit-note' },
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

  async findAll(
    user_id: string,
    bu_code: string,
    query: IPaginate,
    version: string = 'latest',
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'findAll',
        user_id,
        bu_code,
        query,
        version,
      },
      CreditNoteService.name,
    );

    const res: Observable<any> = this.procurementService.send(
      { cmd: 'credit-note.find-all', service: 'credit-note' },
      {
        user_id: user_id,
        bu_code: bu_code,
        paginate: query,
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

  async create(
    createDto: CreateCreditNoteDto,
    user_id: string,
    bu_code: string,
    version: string = 'latest',
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        user_id,
        bu_code,
        version,
      },
      CreditNoteService.name,
    );

    const res: Observable<any> = this.procurementService.send(
      { cmd: 'credit-note.create', service: 'credit-note' },
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

  async update(
    updateDto: UpdateCreditNoteDto,
    user_id: string,
    bu_code: string,
    version: string = 'latest',
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'update',
        updateDto,
        user_id,
        bu_code,
        version,
      },
      CreditNoteService.name,
    );

    const res: Observable<any> = this.procurementService.send(
      { cmd: 'credit-note.update', service: 'credit-note' },
      {
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

  async delete(
    id: string,
    user_id: string,
    bu_code: string,
    version: string = 'latest',
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'delete',
        id,
        user_id,
        bu_code,
        version,
      },
      CreditNoteService.name,
    );

    const res: Observable<any> = this.procurementService.send(
      { cmd: 'credit-note.delete', service: 'credit-note' },
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
