import {
  Inject,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { CreateApplicationPermissionDto, UpdateApplicationPermissionDto } from './dto/application-permission.dto';
import { Result } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';

@Injectable()
export class ApplicationPermissionService {
  private readonly logger: BackendLogger = new BackendLogger(
    ApplicationPermissionService.name,
  );

  constructor(
    @Inject('AUTH_SERVICE') private readonly authService: ClientProxy,
  ) {}

  /**
   * Get all application permissions
   * @param version
   * @returns
   */
  async findAll(version: string): Promise<any> {
    this.logger.debug(
      {
        function: 'findAll',
        version,
      },
      ApplicationPermissionService.name,
    );

    const res: Observable<any> = this.authService.send(
      { cmd: 'get-all-application-permissions', service: 'auth' },
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
   * Get application permission by ID
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
      ApplicationPermissionService.name,
    );

    const res: Observable<any> = this.authService.send(
      { cmd: 'get-application-permission-by-id', service: 'auth' },
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
   * Create new application permission
   * @param createApplicationPermissionDto
   * @param version
   * @returns
   */
  async create(
    createApplicationPermissionDto: CreateApplicationPermissionDto,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'create',
        createApplicationPermissionDto,
        version,
      },
      ApplicationPermissionService.name,
    );

    const res: Observable<any> = this.authService.send(
      { cmd: 'create-application-permission', service: 'auth' },
      { data: createApplicationPermissionDto, version },
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
   * Update application permission
   * @param id
   * @param updateApplicationPermissionDto
   * @param version
   * @returns
   */
  async update(
    id: string,
    updateApplicationPermissionDto: UpdateApplicationPermissionDto,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateApplicationPermissionDto,
        version,
      },
      ApplicationPermissionService.name,
    );

    const res: Observable<any> = this.authService.send(
      { cmd: 'update-application-permission', service: 'auth' },
      { id, data: updateApplicationPermissionDto, version },
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
   * Delete application permission
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
      ApplicationPermissionService.name,
    );

    const res: Observable<any> = this.authService.send(
      { cmd: 'delete-application-permission', service: 'auth' },
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
