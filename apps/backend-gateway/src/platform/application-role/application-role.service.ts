import {
  Inject,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { CreateApplicationRoleDto, UpdateApplicationRoleDto } from './dto/application-role.dto';
import { Result } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';

@Injectable()
export class ApplicationRoleService {
  private readonly logger: BackendLogger = new BackendLogger(
    ApplicationRoleService.name,
  );

  constructor(
    @Inject('AUTH_SERVICE') private readonly authService: ClientProxy,
  ) { }

  /**
   * Get all application roles
   * @param version
   * @returns
   */
  async findAll(version: string): Promise<any> {
    this.logger.debug(
      {
        function: 'findAll',
        version,
      },
      ApplicationRoleService.name,
    );

    const res: Observable<any> = this.authService.send(
      { cmd: 'get-all-application-roles', service: 'auth' },
      { version },
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

  /**
   * Get application role by ID
   * @param id
   * @param version
   * @returns
   */
  async findOne(id: string, version: string): Promise<any> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        version,
      },
      ApplicationRoleService.name,
    );

    const res: Observable<any> = this.authService.send(
      { cmd: 'get-application-role-by-id', service: 'auth' },
      { id, version },
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

  /**
   * Create new application role
   * @param createApplicationRoleDto
   * @param version
   * @returns
   */
  async create(
    createApplicationRoleDto: CreateApplicationRoleDto,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'create',
        createApplicationRoleDto,
        version,
      },
      ApplicationRoleService.name,
    );

    const res: Observable<any> = this.authService.send(
      { cmd: 'create-application-role', service: 'auth' },
      { data: createApplicationRoleDto, version },
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

  /**
   * Update application role
   * @param id
   * @param updateApplicationRoleDto
   * @param version
   * @returns
   */
  async update(
    id: string,
    updateApplicationRoleDto: UpdateApplicationRoleDto,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateApplicationRoleDto,
        version,
      },
      ApplicationRoleService.name,
    );

    const res: Observable<any> = this.authService.send(
      { cmd: 'update-application-role', service: 'auth' },
      { id, data: updateApplicationRoleDto, version },
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

  /**
   * Delete application role
   * @param id
   * @param version
   * @returns
   */
  async delete(id: string, version: string): Promise<any> {
    this.logger.debug(
      {
        function: 'delete',
        id,
        version,
      },
      ApplicationRoleService.name,
    );

    const res: Observable<any> = this.authService.send(
      { cmd: 'delete-application-role', service: 'auth' },
      { id, version },
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
