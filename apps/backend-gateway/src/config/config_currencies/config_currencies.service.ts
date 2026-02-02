import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import {
  ICreateCurrencies,
  IUpdateCurrencies,
  Result,
} from '@/common';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';

@Injectable()
export class Config_CurrenciesService {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_CurrenciesService.name,
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
        version,
      },
      Config_CurrenciesService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'currencies.findOne', service: 'currencies' },
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
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'findAll',
        query,
        version,
      },
      Config_CurrenciesService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'currencies.findAll', service: 'currencies' },
      {
        user_id: user_id,
        paginate: query,
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

  async create(
    createDto: ICreateCurrencies,
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
      Config_CurrenciesService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'currencies.create', service: 'currencies' },
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
    updateDto: IUpdateCurrencies,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'update',
        updateDto,
        version,
      },
      Config_CurrenciesService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'currencies.update', service: 'currencies' },
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

  async patch(
    updateDto: IUpdateCurrencies,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'patch',
        updateDto,
        version,
      },
      Config_CurrenciesService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'currencies.patch', service: 'currencies' },
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
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'delete',
        id,
        version,
      },
      Config_CurrenciesService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'currencies.delete', service: 'currencies' },
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
