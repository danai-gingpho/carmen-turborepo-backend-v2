import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { Result } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';

@Injectable()
export class ConfigPermissionService {
  private readonly logger: BackendLogger = new BackendLogger(
    ConfigPermissionService.name,
  );

  constructor(
    @Inject('AUTH_SERVICE')
    private readonly authService: ClientProxy,
  ) { }

  async findAll(paginate, user_id: string, bu_code: string, version: string): Promise<any> {
    this.logger.debug(
      {
        function: 'findAll',
        user_id,
        bu_code
      },
      ConfigPermissionService.name,
    );

    const res: Observable<any> = this.authService.send(
      { cmd: 'permission.findAll', service: 'permission' },
      {
        paginate,
        user_id,
        bu_code,
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
}
