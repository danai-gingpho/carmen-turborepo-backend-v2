import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Observable } from 'rxjs';
import { Result } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { IPaginate, IPaginateQuery } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';

@Injectable()
export class PriceListService {
  private readonly logger: BackendLogger = new BackendLogger(
    PriceListService.name,
  );

  constructor(
    @Inject('MASTER_SERVICE') private readonly masterService: ClientProxy,
  ) { }

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
      PriceListService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'price-list.findOne', service: 'price-list' },
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
      PriceListService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'price-list.findAll', service: 'price-list' },
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

  async priceCompare(
    data: { product_id: string; due_date: string, unit_id?: string; currency_id: string },
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'priceCompare',
        data,
        user_id,
        bu_code,
        version,
      },
      PriceListService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'price-list.price-compare', service: 'price-list' },
      { data: data, user_id: user_id, bu_code: bu_code, version: version },
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
    data: any,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'create',
        data,
        user_id,
        bu_code,
        version,
      },
      PriceListService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'price-list.create', service: 'price-list' },
      { data: data, user_id: user_id, bu_code: bu_code, version: version },
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
    data: any,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'update',
        data,
        user_id,
        bu_code,
        version,
      },
      PriceListService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'price-list.update', service: 'price-list' },
      { data: data, user_id: user_id, bu_code: bu_code, version: version },
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

  async remove(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'remove',
        id,
        user_id,
        bu_code,
        version,
      },
      PriceListService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'price-list.remove', service: 'price-list' },
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
