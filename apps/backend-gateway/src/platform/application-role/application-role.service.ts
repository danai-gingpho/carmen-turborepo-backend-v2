import {
  Inject,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { CreateApplicationRoleDto, UpdateApplicationRoleDto } from './dto/application-role.dto';
import { Result, MicroserviceResponse } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class ApplicationRoleService {
  private readonly logger: BackendLogger = new BackendLogger(
    ApplicationRoleService.name,
  );

  constructor(
    @Inject('BUSINESS_SERVICE') private readonly authService: ClientProxy,
  ) { }

  /**
   * Retrieve all application roles
   * ค้นหารายการบทบาทแอปพลิเคชันทั้งหมด
   * @param version - API version / เวอร์ชัน API
   * @returns Role list with pagination / รายการบทบาทพร้อมการแบ่งหน้า
   */
  async findAll(version: string): Promise<unknown> {
    this.logger.debug(
      {
        function: 'findAll',
        version,
      },
      ApplicationRoleService.name,
    );

    const res: Observable<MicroserviceResponse> = this.authService.send(
      { cmd: 'role.findAll', service: 'role' },
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
   * Retrieve a single application role by ID
   * ค้นหาบทบาทแอปพลิเคชันเดียวตาม ID
   * @param id - Role ID / รหัสบทบาท
   * @param version - API version / เวอร์ชัน API
   * @returns Role details / รายละเอียดบทบาท
   */
  async findOne(id: string, version: string): Promise<unknown> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        version,
      },
      ApplicationRoleService.name,
    );

    const res: Observable<MicroserviceResponse> = this.authService.send(
      { cmd: 'role.findOne', service: 'role' },
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
   * Create a new application role via microservice
   * สร้างบทบาทแอปพลิเคชันใหม่ผ่านไมโครเซอร์วิส
   * @param createApplicationRoleDto - Role creation data / ข้อมูลสำหรับสร้างบทบาท
   * @param version - API version / เวอร์ชัน API
   * @returns Created role / บทบาทที่ถูกสร้าง
   */
  async create(
    createApplicationRoleDto: CreateApplicationRoleDto,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'create',
        createApplicationRoleDto,
        version,
      },
      ApplicationRoleService.name,
    );

    const res: Observable<MicroserviceResponse> = this.authService.send(
      { cmd: 'role.create', service: 'role' },
      { data: createApplicationRoleDto, version, ...getGatewayRequestContext() },
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
   * Update an existing application role via microservice
   * อัปเดตบทบาทแอปพลิเคชันที่มีอยู่ผ่านไมโครเซอร์วิส
   * @param id - Role ID / รหัสบทบาท
   * @param updateApplicationRoleDto - Role update data / ข้อมูลสำหรับอัปเดตบทบาท
   * @param version - API version / เวอร์ชัน API
   * @returns Updated role / บทบาทที่ถูกอัปเดต
   */
  async update(
    id: string,
    updateApplicationRoleDto: UpdateApplicationRoleDto,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateApplicationRoleDto,
        version,
      },
      ApplicationRoleService.name,
    );

    const res: Observable<MicroserviceResponse> = this.authService.send(
      { cmd: 'role.update', service: 'role' },
      { id, data: updateApplicationRoleDto, version, ...getGatewayRequestContext() },
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
   * Delete an application role via microservice
   * ลบบทบาทแอปพลิเคชันผ่านไมโครเซอร์วิส
   * @param id - Role ID / รหัสบทบาท
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
      ApplicationRoleService.name,
    );

    const res: Observable<MicroserviceResponse> = this.authService.send(
      { cmd: 'role.remove', service: 'role' },
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
