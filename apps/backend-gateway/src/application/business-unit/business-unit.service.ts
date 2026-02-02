import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { Result } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { BackendLogger } from 'src/common/helpers/backend.logger';

@Injectable()
export class BusinessUnitService {
  private readonly logger: BackendLogger = new BackendLogger(
    BusinessUnitService.name,
  );

  constructor(
    @Inject('CLUSTER_SERVICE') private readonly clusterService: ClientProxy,
  ) { }

  async getSystemConfigs(user_id: string, bu_code: string): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'getSystemConfigs',
        user_id,
        bu_code,
      },
      BusinessUnitService.name,
    );

    const res: Observable<any> = this.clusterService.send(
      { cmd: 'business-unit.get-system-configs', service: 'business-unit' },
      { user_id: user_id, bu_code: bu_code, version: 'latest' },
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

  async findCurrentConfigByKey(
    key: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'findCurrentConfigByKey',
        key,
        user_id,
        bu_code,
        version,
      },
      BusinessUnitService.name,
    );

    const res: Observable<any> = this.clusterService.send(
      {
        cmd: 'business-unit.find-current-tenant-config-by-key',
        service: 'business-unit',
      },
      { key: key, user_id: user_id, bu_code, version: version },
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
