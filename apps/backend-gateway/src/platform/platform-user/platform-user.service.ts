import {
  Inject,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { Result } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { IPaginate } from 'src/shared-dto/paginate.dto';

@Injectable()
export class PlatformUserService {
  private readonly logger: BackendLogger = new BackendLogger(
    PlatformUserService.name,
  );

  constructor(
    @Inject('AUTH_SERVICE') private readonly authService: ClientProxy,
    @Inject('CLUSTER_SERVICE') private readonly clusterService: ClientProxy,
  ) {}

  /**
   * Fetch users from Keycloak realm and sync to tb_user and tb_user_profile
   * @param version
   * @returns
   */
  async fetchUsers(version: string): Promise<any> {
    this.logger.debug(
      {
        function: 'fetchUsers',
        version,
      },
      PlatformUserService.name,
    );

    const res: Observable<any> = this.authService.send(
      { cmd: 'sync-realm-users', service: 'auth' },
      { data: {}, version },
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

  async getUserList(
    user_id: string,
    tenant_id: string,
    paginate: IPaginate,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'getUserList',
        user_id,
        tenant_id,
        paginate,
        version,
      },
      PlatformUserService.name,
    );

    const res: Observable<any> = this.clusterService.send(
      { cmd: 'user.list', service: 'user' },
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

    return Result.ok({
      data: response.data,
      paginate: response.paginate,
    });
  }

  async getUser(
    user_id: string,
    tenant_id: string,
    id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'getUser',
        user_id,
        tenant_id,
        id,
        version,
      },
      PlatformUserService.name,
    );

    const res: Observable<any> = this.clusterService.send(
      { cmd: 'user.get', service: 'user' },
      {
        id,
        user_id,
        tenant_id,
        version,
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

  async createUser(
    user_id: string,
    tenant_id: string,
    data: any,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'createUser',
        user_id,
        tenant_id,
        data,
        version,
      },
      PlatformUserService.name,
    );

    const res: Observable<any> = this.clusterService.send(
      { cmd: 'user.create', service: 'user' },
      {
        data,
        user_id,
        tenant_id,
        version,
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

  async updateUser(
    user_id: string,
    tenant_id: string,
    id: string,
    data: any,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'updateUser',
        user_id,
        tenant_id,
        id,
        data,
        version,
      },
      PlatformUserService.name,
    );

    const res: Observable<any> = this.clusterService.send(
      { cmd: 'user.update', service: 'user' },
      {
        id,
        data,
        user_id,
        tenant_id,
        version,
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

  async deleteUser(
    user_id: string,
    tenant_id: string,
    id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'deleteUser',
        user_id,
        tenant_id,
        id,
        version,
      },
      PlatformUserService.name,
    );

    const res: Observable<any> = this.clusterService.send(
      { cmd: 'user.delete', service: 'user' },
      {
        id,
        user_id,
        tenant_id,
        version,
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
}
