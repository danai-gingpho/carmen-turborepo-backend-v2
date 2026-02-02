import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { Result } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { BackendLogger } from 'src/common/helpers/backend.logger';

@Injectable()
export class UserBusinessUnitService {
  private readonly logger: BackendLogger = new BackendLogger(
    UserBusinessUnitService.name,
  );

  constructor(
    @Inject('CLUSTER_SERVICE') private readonly clusterService: ClientProxy,
  ) {}

  async setDefaultTenant(
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'setDefaultTenant',
        user_id,
        tenant_id,
        version,
      },
      UserBusinessUnitService.name,
    );

    const res: Observable<any> = this.clusterService.send(
      { cmd: 'business-unit.set-default-tenant', service: 'business-unit' },
      { user_id: user_id, tenant_id: tenant_id, version: version },
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

  async getBusinessUnit(user_id: string, version: string): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'getBusinessUnit',
        user_id,
        version,
      },
      UserBusinessUnitService.name,
    );

    const res: Observable<any> = this.clusterService.send(
      { cmd: 'business-unit.get-by-user-id', service: 'business-unit' },
      { user_id: user_id, version: version },
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
