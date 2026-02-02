import { HttpStatus, Inject, Injectable } from '@nestjs/common'
import { ICreateConfigApplicationRole, IUpdateConfigApplicationRole } from './dto/application_role.dto'
import { ClientProxy } from '@nestjs/microservices'
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { firstValueFrom, Observable } from 'rxjs';
import { Result } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';

@Injectable()
export class ConfigApplicationRoleService {
  private readonly logger: BackendLogger = new BackendLogger(
    ConfigApplicationRoleService.name,
  );
  constructor(
    @Inject('AUTH_SERVICE')
    private readonly authService: ClientProxy,
  ) { }
  async findAll(paginate, user_id: string, bu_code: string, version: string) {
    this.logger.debug(
      {
        function: 'findAll',
        user_id,
        bu_code
      },
      ConfigApplicationRoleService.name,
    );

    const res: Observable<any> = this.authService.send(
      { cmd: 'role_permission.find-all', service: 'role_permission' },
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

  async findOne(id: string, user_id: string, bu_code: string, version: string) {
    this.logger.debug(
      {
        function: 'findOne',
        user_id,
        bu_code
      },
      ConfigApplicationRoleService.name,
    );

    const res: Observable<any> = this.authService.send(
      { cmd: 'role_permission.find-one', service: 'role_permission' },
      {
        id,
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

  async create(createConfigApplicationRoleDto: ICreateConfigApplicationRole, user_id: string, bu_code: string, version: string) {
    this.logger.debug(
      {
        function: 'create',
        user_id,
        bu_code
      },
      ConfigApplicationRoleService.name,
    );

    const res: Observable<any> = this.authService.send(
      { cmd: 'role_permission.create', service: 'role_permission' },
      {
        data: createConfigApplicationRoleDto,
        user_id,
        bu_code,
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

  async update(updateConfigApplicationRoleDto: IUpdateConfigApplicationRole, user_id: string, bu_code: string, version: string) {
    this.logger.debug(
      {
        function: 'update',
        user_id,
        bu_code
      },
      ConfigApplicationRoleService.name,
    );

    const res: Observable<any> = this.authService.send(
      { cmd: 'role_permission.update', service: 'role_permission' },
      {
        data: updateConfigApplicationRoleDto,
        user_id,
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

  async remove(id: string, user_id: string, bu_code: string, version: string) {
    this.logger.debug(
      {
        function: 'remove',
        user_id,
        bu_code
      },
      ConfigApplicationRoleService.name,
    );

    const res: Observable<any> = this.authService.send(
      { cmd: 'role_permission.remove', service: 'role_permission' },
      {
        id,
        user_id,
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
