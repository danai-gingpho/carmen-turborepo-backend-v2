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

@Injectable()
export class PlatformUserService {
  private readonly logger: BackendLogger = new BackendLogger(
    PlatformUserService.name,
  );

  constructor(
    @Inject('AUTH_SERVICE') private readonly authService: ClientProxy,
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
}
