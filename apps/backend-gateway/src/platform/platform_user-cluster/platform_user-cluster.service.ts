import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { IUserCluster, IUserClusterUpdate } from './dto/user-cluster.dto';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { Result } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';

@Injectable()
export class Platform_UserClusterService {
  private readonly logger: BackendLogger = new BackendLogger(
    Platform_UserClusterService.name,
  );

  constructor(
    @Inject('CLUSTER_SERVICE') private readonly clusterService: ClientProxy,
  ) { }

  async getUserCluster(
    cluster_id: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'getUserCluster',
        cluster_id,
        user_id,
        tenant_id,
        version,
      },
      Platform_UserClusterService.name,
    );
    const res: Observable<any> = this.clusterService.send(
      { cmd: 'cluster.get-user-by-id', service: 'cluster' },
      {
        cluster_id: cluster_id,
        user_id: user_id,
        tenant_id: tenant_id,
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

  async getUserClusterAll(
    user_id: string,
    tenant_id: string,
    paginate: IPaginate,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'getUserClusterAll',
        user_id,
        tenant_id,
        paginate,
        version,
      },
      Platform_UserClusterService.name,
    );
    const res: Observable<any> = this.clusterService.send(
      { cmd: 'cluster.get-all-user', service: 'cluster' },
      {
        data: null,
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

  async createUserCluster(
    data: IUserCluster,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'createUserCluster',
        data,
        user_id,
        tenant_id,
        version,
      },
      Platform_UserClusterService.name,
    );
    const res: Observable<any> = this.clusterService.send(
      { cmd: 'cluster.create-user', service: 'cluster' },
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

  async updateUserCluster(
    data: IUserClusterUpdate,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'updateUserCluster',
        data,
        user_id,
        tenant_id,
        version,
      },
      Platform_UserClusterService.name,
    );
    const res: Observable<any> = this.clusterService.send(
      {
        cmd: 'cluster.update-user',
        service: 'cluster',
      },
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

  async deleteUserCluster(
    id: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'deleteUserCluster',
        id,
        user_id,
        tenant_id,
        version,
      },
      Platform_UserClusterService.name,
    );
    const res: Observable<any> = this.clusterService.send(
      { cmd: 'cluster.delete-user', service: 'cluster' },
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
