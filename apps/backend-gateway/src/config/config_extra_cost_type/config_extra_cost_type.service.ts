import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import {
  ICreateExtraCostType,
  IUpdateExtraCostType,
  Result,
} from '@/common';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';

@Injectable()
export class Config_ExtraCostTypeService {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_ExtraCostTypeService.name,
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
      Config_ExtraCostTypeService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'extra-cost-type.findOne', service: 'extra-cost-type' },
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
      Config_ExtraCostTypeService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'extra-cost-type.findAll', service: 'extra-cost-type' },
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
    createDto: ICreateExtraCostType,
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
      Config_ExtraCostTypeService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'extra-cost-type.create', service: 'extra-cost-type' },
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
    updateDto: IUpdateExtraCostType,
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
      Config_ExtraCostTypeService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'extra-cost-type.update', service: 'extra-cost-type' },
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
      Config_ExtraCostTypeService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'extra-cost-type.delete', service: 'extra-cost-type' },
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
