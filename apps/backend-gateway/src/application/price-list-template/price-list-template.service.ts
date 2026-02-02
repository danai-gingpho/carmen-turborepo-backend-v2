import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Observable } from 'rxjs';
import { Result } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';

@Injectable()
export class PriceListTemplateService {
  private readonly logger: BackendLogger = new BackendLogger(
    PriceListTemplateService.name,
  );

  constructor(
    @Inject('MASTER_SERVICE') private readonly masterService: ClientProxy,
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
      PriceListTemplateService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'price-list-template.findOne', service: 'price-list-template' },
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
      PriceListTemplateService.name,
    );
    const res: Observable<any> = this.masterService.send(
      { cmd: 'price-list-template.findAll', service: 'price-list-template' },
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
      PriceListTemplateService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'price-list-template.create', service: 'price-list-template' },
      { data: data, user_id: user_id, bu_code: bu_code, version: version },
    );

    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.CREATED) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response);
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
      PriceListTemplateService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'price-list-template.update', service: 'price-list-template' },
      { data: data, user_id: user_id, bu_code: bu_code, version: version },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response);
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
      PriceListTemplateService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'price-list-template.remove', service: 'price-list-template' },
      { id: id, user_id: user_id, bu_code: bu_code, version: version },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response);
  }

  async updateStatus(
    id: string,
    status: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'updateStatus',
        id,
        status,
        user_id,
        bu_code,
        version,
      },
      PriceListTemplateService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'price-list-template.updateStatus', service: 'price-list-template' },
      { id: id, status: status, user_id: user_id, bu_code: bu_code, version: version },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response);
  }
}
