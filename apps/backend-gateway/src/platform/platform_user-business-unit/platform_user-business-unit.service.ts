import { ConsoleLogger, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import {
  IUserBusinessUnit,
  IUserBusinessUnitUpdate,
} from './dto/platform_user-business-unit.dto';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { anthropicAIIntegration } from '@sentry/node';
import { Result } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';

@Injectable()
export class Platform_UserBusinessUnitService {
  private readonly logger: BackendLogger = new BackendLogger(
    Platform_UserBusinessUnitService.name,
  );

  constructor(
    @Inject('CLUSTER_SERVICE') private readonly clusterService: ClientProxy,
  ) { }

  async findOne(id: string, user_id: string, version: string): Promise<any> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        user_id,
        version,
      },
      Platform_UserBusinessUnitService.name,
    );
    const res: Observable<any> = this.clusterService.send(
      { cmd: 'user-business-unit.findOne', service: 'business-unit' },
      { id: id, user_id: user_id, version: version },
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
    paginate: IPaginate,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'findAll',
        user_id,
        paginate,
        version,
      },
      Platform_UserBusinessUnitService.name,
    );
    const res: Observable<any> = this.clusterService.send(
      { cmd: 'user-business-unit.findAll', service: 'business-unit' },
      {
        user_id: user_id,
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

    return Result.ok(response.data);
  }

  async create(
    data: IUserBusinessUnit,
    user_id: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'create',
        data,
        user_id,
        version,
      },
      Platform_UserBusinessUnitService.name,
    );
    const res: Observable<any> = this.clusterService.send(
      { cmd: 'user-business-unit.create', service: 'business-unit' },
      { data: data, user_id: user_id, version: version },
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
    data: IUserBusinessUnitUpdate,
    user_id: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'update',
        data,
        user_id,
        version,
      },
      Platform_UserBusinessUnitService.name,
    );
    const res: Observable<any> = this.clusterService.send(
      { cmd: 'user-business-unit.update', service: 'business-unit' },
      { data: data, user_id: user_id, version: version },
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

  async delete(id: string, user_id: string, version: string): Promise<any> {
    this.logger.debug(
      {
        function: 'delete',
        id,
        user_id,
        version,
      },
      Platform_UserBusinessUnitService.name,
    );
    const res: Observable<any> = this.clusterService.send(
      { cmd: 'user-business-unit.delete', service: 'business-unit' },
      { id: id, user_id: user_id, version: version },
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
