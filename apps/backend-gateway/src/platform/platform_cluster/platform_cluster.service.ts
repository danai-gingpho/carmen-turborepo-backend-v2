import { ConsoleLogger, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { IClusterCreate, IClusterUpdate } from './dto/cluster.dto';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { Result } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';

@Injectable()
export class Platform_ClusterService {
  private readonly logger: BackendLogger = new BackendLogger(
    Platform_ClusterService.name,
  );

  constructor(
    @Inject('CLUSTER_SERVICE') private readonly clusterService: ClientProxy,
  ) {}

  async createCluster(
    data: IClusterCreate,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'createCluster',
        data,
        user_id,
        tenant_id,
        version,
      },
      Platform_ClusterService.name,
    );
    const res: Observable<any> = this.clusterService.send(
      { cmd: 'cluster.create', service: 'cluster' },
      { data: data, user_id: user_id, tenant_id: tenant_id, version: version },
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

  async updateCluster(
    data: IClusterUpdate,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'updateCluster',
        data,
        user_id,
        tenant_id,
        version,
      },
      Platform_ClusterService.name,
    );
    const res: Observable<any> = this.clusterService.send(
      { cmd: 'cluster.update', service: 'cluster' },
      { data: data, user_id: user_id, tenant_id: tenant_id, version: version },
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

  async deleteCluster(
    id: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'deleteCluster',
        id,
        user_id,
        tenant_id,
        version,
      },
      Platform_ClusterService.name,
    );
    const res: Observable<any> = this.clusterService.send(
      { cmd: 'cluster.delete', service: 'cluster' },
      { id: id, user_id: user_id, tenant_id: tenant_id, version: version },
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

  async getlistCluster(
    user_id: string,
    tenant_id: string,
    paginate: IPaginate,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'getlistCluster',
        user_id,
        tenant_id,
        paginate,
        version,
      },
      Platform_ClusterService.name,
    );
    const res: Observable<any> = this.clusterService.send(
      { cmd: 'cluster.list', service: 'cluster' },
      {
        user_id: user_id,
        tenant_id: tenant_id,
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

  async getClusterById(
    id: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'getClusterById',
        id,
        user_id,
        tenant_id,
        version,
      },
      Platform_ClusterService.name,
    );
    const res: Observable<any> = this.clusterService.send(
      { cmd: 'cluster.get-by-id', service: 'cluster' },
      { id: id, user_id: user_id, tenant_id: tenant_id, version: version },
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
