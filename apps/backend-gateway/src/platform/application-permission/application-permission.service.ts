import {
  Inject,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { CreateApplicationPermissionDto, UpdateApplicationPermissionDto } from './dto/application-permission.dto';
import { Result, MicroserviceResponse } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class ApplicationPermissionService {
  private readonly logger: BackendLogger = new BackendLogger(
    ApplicationPermissionService.name,
  );

  constructor(
    @Inject('BUSINESS_SERVICE') private readonly authService: ClientProxy,
  ) {}

  /**
   * Retrieve all application permissions
   * ค้นหารายการสิทธิ์การเข้าถึงทั้งหมด
   * @param version - API version / เวอร์ชัน API
   * @returns Permission list with pagination / รายการสิทธิ์การเข้าถึงพร้อมการแบ่งหน้า
   */
  async findAll(version: string): Promise<unknown> {
    this.logger.debug(
      {
        function: 'findAll',
        version,
      },
      ApplicationPermissionService.name,
    );

    const res: Observable<MicroserviceResponse> = this.authService.send(
      { cmd: 'permission.findAll', service: 'permission' },
      { version, ...getGatewayRequestContext() },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok({ data: response.data, paginate: response.paginate });
  }

  /**
   * Retrieve a single application permission by ID
   * ค้นหาสิทธิ์การเข้าถึงเดียวตาม ID
   * @param id - Permission ID / รหัสสิทธิ์การเข้าถึง
   * @param version - API version / เวอร์ชัน API
   * @returns Permission details / รายละเอียดสิทธิ์การเข้าถึง
   */
  async findOne(id: string, version: string): Promise<unknown> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        version,
      },
      ApplicationPermissionService.name,
    );

    const res: Observable<MicroserviceResponse> = this.authService.send(
      { cmd: 'permission.findOne', service: 'permission' },
      { id, version, ...getGatewayRequestContext() },
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
   * Create a new application permission via microservice
   * สร้างสิทธิ์การเข้าถึงใหม่ผ่านไมโครเซอร์วิส
   * @param createApplicationPermissionDto - Permission creation data / ข้อมูลสำหรับสร้างสิทธิ์การเข้าถึง
   * @param version - API version / เวอร์ชัน API
   * @returns Created permission / สิทธิ์การเข้าถึงที่ถูกสร้าง
   */
  async create(
    createApplicationPermissionDto: CreateApplicationPermissionDto,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'create',
        createApplicationPermissionDto,
        version,
      },
      ApplicationPermissionService.name,
    );

    const res: Observable<MicroserviceResponse> = this.authService.send(
      { cmd: 'permission.create', service: 'permission' },
      { data: createApplicationPermissionDto, version, ...getGatewayRequestContext() },
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
   * Update an existing application permission via microservice
   * อัปเดตสิทธิ์การเข้าถึงที่มีอยู่ผ่านไมโครเซอร์วิส
   * @param id - Permission ID / รหัสสิทธิ์การเข้าถึง
   * @param updateApplicationPermissionDto - Permission update data / ข้อมูลสำหรับอัปเดตสิทธิ์การเข้าถึง
   * @param version - API version / เวอร์ชัน API
   * @returns Updated permission / สิทธิ์การเข้าถึงที่ถูกอัปเดต
   */
  async update(
    id: string,
    updateApplicationPermissionDto: UpdateApplicationPermissionDto,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateApplicationPermissionDto,
        version,
      },
      ApplicationPermissionService.name,
    );

    const res: Observable<MicroserviceResponse> = this.authService.send(
      { cmd: 'permission.update', service: 'permission' },
      { id, data: updateApplicationPermissionDto, version, ...getGatewayRequestContext() },
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
   * Delete an application permission via microservice
   * ลบสิทธิ์การเข้าถึงผ่านไมโครเซอร์วิส
   * @param id - Permission ID / รหัสสิทธิ์การเข้าถึง
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  async delete(id: string, version: string): Promise<unknown> {
    this.logger.debug(
      {
        function: 'delete',
        id,
        version,
      },
      ApplicationPermissionService.name,
    );

    const res: Observable<MicroserviceResponse> = this.authService.send(
      { cmd: 'permission.remove', service: 'permission' },
      { id, version, ...getGatewayRequestContext() },
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
