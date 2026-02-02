import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';
import { ICreateLocation, IUpdateLocation, Result } from '@/common';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';

@Injectable()
export class Config_LocationsService {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_LocationsService.name,
  );

  constructor(
    @Inject('MASTER_SERVICE')
    private readonly masterService: ClientProxy,
  ) { }

  async findOne(
    id: string,
    user_id: string,
    bu_code: string,
    withUser: boolean = true,
    withProducts: boolean = true,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        version,
        withUser,
        withProducts,
      },
      Config_LocationsService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'locations.findOne', service: 'locations' },
      {
        id: id,
        user_id: user_id,
        bu_code: bu_code,
        withUser: withUser,
        withProducts: withProducts,
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
    bu_code: string,
    paginate: IPaginate,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'findAll',
        paginate,
        version,
      },
      Config_LocationsService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'locations.findAll', service: 'locations' },
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

    console.log('response:', response)
    return Result.ok({ data: response.data, paginate: response.paginate });
  }

  async create(
    createDto: ICreateLocation,
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
      Config_LocationsService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'locations.create', service: 'locations' },
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
    updateDto: IUpdateLocation,
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
      Config_LocationsService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'locations.update', service: 'locations' },
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
      Config_LocationsService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'locations.delete', service: 'locations' },
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
