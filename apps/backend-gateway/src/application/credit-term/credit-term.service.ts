import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { Result } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { IPaginateQuery } from 'src/shared-dto/paginate.dto';

@Injectable()
export class CreditTermService {
  private readonly logger: BackendLogger = new BackendLogger(
    CreditTermService.name,
  );

  constructor(
    @Inject('MASTER_SERVICE')
    private readonly masterService: ClientProxy,
  ) {}

  async findOne(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        user_id,
        bu_code,
        version,
      },
      CreditTermService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'credit-term.findOne', service: 'credit-term' },
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
    bu_code: string,
    paginate: IPaginateQuery,
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
      CreditTermService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'credit-term.findAll', service: 'credit-term' },
      { user_id, bu_code, paginate, version },
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
