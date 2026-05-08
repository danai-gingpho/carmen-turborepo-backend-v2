import { Controller, HttpStatus } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import {
  IPermissionCreate,
  IPermissionUpdate,
} from './interface/permission.interface';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController, MicroservicePayload, MicroserviceResponse } from '@/common';

@Controller()
export class PermissionController extends BaseMicroserviceController {
  private readonly logger = new BackendLogger(PermissionController.name);

  constructor(private readonly permissionService: PermissionService) {
    super();
  }

  /**
   * Create audit context from payload
   * สร้างบริบทการตรวจสอบจาก payload
   * @param payload - Microservice payload / ข้อมูล payload จากไมโครเซอร์วิส
   * @returns Audit context object / ออบเจกต์บริบทการตรวจสอบ
   */
  private createAuditContext(payload: MicroservicePayload): AuditContext {
    return {
      tenant_id: payload.tenant_id || payload.bu_code,
      user_id: payload.user_id,
      request_id: payload.request_id,
      ip_address: payload.ip_address,
      user_agent: payload.user_agent,
    };
  }

  /**
   * Find a permission by ID
   * ค้นหาสิทธิ์รายการเดียวตาม ID
   * @param payload - Contains id, user_id, tenant_id / ประกอบด้วย id, user_id, tenant_id
   * @returns Permission detail / รายละเอียดสิทธิ์
   */
  @MessagePattern({ cmd: 'permission.findOne', service: 'permission' })
  async findOne(@Payload() payload: MicroservicePayload) {
    this.logger.debug(
      { function: 'findOne', payload: payload },
      PermissionController.name,
    );
    const id = payload.id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.permissionService.findOne(id, user_id, tenant_id));
    return this.handleResult(result);
  }

  /**
   * Find all permissions with pagination
   * ค้นหาสิทธิ์ทั้งหมดพร้อมการแบ่งหน้า
   * @param payload - Contains user_id, tenant_id, paginate / ประกอบด้วย user_id, tenant_id, paginate
   * @returns Paginated list of permissions / รายการสิทธิ์แบบแบ่งหน้า
   */
  @MessagePattern({ cmd: 'permission.findAll', service: 'permission' })
  async findAll(@Payload() payload: MicroservicePayload) {
    this.logger.debug(
      { function: 'findAll', payload: payload },
      PermissionController.name,
    );
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const paginate = payload.paginate;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.permissionService.findAll(user_id, tenant_id, paginate));
    return this.handlePaginatedResult(result);
  }

  /**
   * Create a new permission
   * สร้างสิทธิ์ใหม่
   * @param payload - Contains data, user_id, tenant_id / ประกอบด้วย data, user_id, tenant_id
   * @returns Created permission / สิทธิ์ที่สร้างแล้ว
   */
  @MessagePattern({ cmd: 'permission.create', service: 'permission' })
  async create(@Payload() payload: MicroservicePayload) {
    this.logger.debug(
      { function: 'create', payload: payload },
      PermissionController.name,
    );
    const data: IPermissionCreate = payload.data;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.permissionService.create(data, user_id, tenant_id));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  /**
   * Update a permission
   * แก้ไขสิทธิ์
   * @param payload - Contains data, user_id, tenant_id / ประกอบด้วย data, user_id, tenant_id
   * @returns Updated permission / สิทธิ์ที่แก้ไขแล้ว
   */
  @MessagePattern({ cmd: 'permission.update', service: 'permission' })
  async update(@Payload() payload: MicroservicePayload) {
    this.logger.debug(
      { function: 'update', payload: payload },
      PermissionController.name,
    );
    const data: IPermissionUpdate = payload.data;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.permissionService.update(data, user_id, tenant_id));
    return this.handleResult(result);
  }

  /**
   * Remove a permission
   * ลบสิทธิ์
   * @param payload - Contains id, user_id, tenant_id / ประกอบด้วย id, user_id, tenant_id
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @MessagePattern({ cmd: 'permission.remove', service: 'permission' })
  async remove(@Payload() payload: MicroservicePayload) {
    this.logger.debug(
      { function: 'delete', payload: payload },
      PermissionController.name,
    );
    const id = payload.id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.permissionService.remove(id, user_id, tenant_id));
    return this.handleResult(result);
  }
}
