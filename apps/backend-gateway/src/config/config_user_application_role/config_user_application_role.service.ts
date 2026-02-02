import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { firstValueFrom, Observable } from 'rxjs';
import { IAssignUserApplicationRole, IRemoveUserApplicationRole, IUpdateUserApplicationRole } from './dto/user_application_role.dto';
import { Result } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';

@Injectable()
export class ConfigUserApplicationRoleService {
  private readonly logger: BackendLogger = new BackendLogger(
    ConfigUserApplicationRoleService.name,
  );

  constructor(
    @Inject('AUTH_SERVICE')
    private readonly authService: ClientProxy,
  ) { }

  async findByUser(targetUserId: string, bu_code: string, version: string) {
    this.logger.debug(
      {
        function: 'findByUser',
        targetUserId,
        bu_code,
      },
      ConfigUserApplicationRoleService.name,
    );

    const res: Observable<any> = this.authService.send(
      { cmd: 'user_application_role.find-by-user', service: 'user_application_role' },
      {
        user_id: targetUserId,
        bu_code,
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

  async assign(data: IAssignUserApplicationRole, requestUserId: string, bu_code: string, version: string) {
    this.logger.debug(
      {
        function: 'assign',
        data,
        requestUserId,
        bu_code,
      },
      ConfigUserApplicationRoleService.name,
    );

    const res: Observable<any> = this.authService.send(
      { cmd: 'user_application_role.assign', service: 'user_application_role' },
      {
        data,
        user_id: requestUserId,
        bu_code,
        version,
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

  async update(data: IUpdateUserApplicationRole, requestUserId: string, bu_code: string, version: string) {
    this.logger.debug(
      {
        function: 'update',
        data,
        requestUserId,
        bu_code,
      },
      ConfigUserApplicationRoleService.name,
    );

    const res: Observable<any> = this.authService.send(
      { cmd: 'user_application_role.update', service: 'user_application_role' },
      {
        data,
        user_id: requestUserId,
        bu_code,
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

  async remove(data: IRemoveUserApplicationRole, requestUserId: string, bu_code: string, version: string) {
    this.logger.debug(
      {
        function: 'remove',
        data,
        requestUserId,
        bu_code,
      },
      ConfigUserApplicationRoleService.name,
    );

    const res: Observable<any> = this.authService.send(
      { cmd: 'user_application_role.remove', service: 'user_application_role' },
      {
        data,
        user_id: requestUserId,
        bu_code,
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
