import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { Result } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { IPaginate } from 'src/shared-dto/paginate.dto';

@Injectable()
export class CurrenciesService {
  private readonly logger: BackendLogger = new BackendLogger(
    CurrenciesService.name,
  );

  constructor(
    @Inject('MASTER_SERVICE')
    private readonly masterService: ClientProxy,
    @Inject('CLUSTER_SERVICE')
    private readonly clusterService: ClientProxy,
  ) { }

  async findAllActive(
    user_id: string,
    bu_code: string,
    paginate: IPaginate,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'findAllActive',
        user_id,
        bu_code,
        paginate,
        version,
      },
      CurrenciesService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'currencies.findAllActive', service: 'currencies' },
      { user_id, bu_code, paginate, version },
    );
    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }
    return Result.ok({
      data: response.data.data,
      paginate: response.data.paginate,
    });
  }

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
      CurrenciesService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'currencies.findOne', service: 'currencies' },
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

  async findAllISO(
    user_id: string,
    paginate: IPaginate,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'findAllISO',
        user_id,
        paginate,
        version,
      },
      CurrenciesService.name,
    );

    const res: Observable<any> = this.clusterService.send(
      { cmd: 'currencies.findAllISO', service: 'currencies' },
      { user_id, paginate, version },
    );

    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }
    return Result.ok({
      data: response.data.data,
      paginate: response.data.paginate,
    });
  }

  async getDefault(
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'getDefault',
        user_id,
        bu_code,
        version,
      },
      CurrenciesService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'currencies.getDefault', service: 'currencies' },
      { user_id, bu_code, version },
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
