import { Controller, HttpStatus } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ApplicationRolePermissionService } from './role_permission.service';
import {
  IApplicationRolePermissionCreate,
  IApplicationRolePermissionUpdate,
} from './interface/role_permission.interface';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController, MicroservicePayload, MicroserviceResponse } from '@/common';

@Controller()
export class ApplicationRolePermissionController extends BaseMicroserviceController {
  private readonly logger = new BackendLogger(
    ApplicationRolePermissionController.name,
  );

  constructor(
    private readonly rolePermissionService: ApplicationRolePermissionService,
  ) {
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
   * Find a role-permission mapping by ID
   * ค้นหาการเชื่อมโยงบทบาท-สิทธิ์ตาม ID
   * @param payload - Contains id, user_id, bu_code / ประกอบด้วย id, user_id, bu_code
   * @returns Role-permission detail / รายละเอียดการเชื่อมโยงบทบาท-สิทธิ์
   */
  @MessagePattern({ cmd: 'role_permission.find-one', service: 'role_permission' })
  async findOne(@Payload() payload: MicroservicePayload) {
    this.logger.debug(
      { function: 'findOne', payload: payload },
      ApplicationRolePermissionController.name,
    );
    const id = payload.id;
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.rolePermissionService.findOne(id, user_id, bu_code));
    return this.handleResult(result);
  }

  /**
   * Find all role-permission mappings with pagination
   * ค้นหาการเชื่อมโยงบทบาท-สิทธิ์ทั้งหมดพร้อมการแบ่งหน้า
   * @param payload - Contains user_id, bu_code, paginate / ประกอบด้วย user_id, bu_code, paginate
   * @returns Paginated list of role-permission mappings / รายการเชื่อมโยงบทบาท-สิทธิ์แบบแบ่งหน้า
   */
  @MessagePattern({ cmd: 'role_permission.find-all', service: 'role_permission' })
  async findAll(@Payload() payload: MicroservicePayload) {
    this.logger.debug(
      { function: 'findAll', payload: payload },
      ApplicationRolePermissionController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;
    const paginate = payload.paginate

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.rolePermissionService.findAll(paginate, user_id, bu_code));
    return this.handlePaginatedResult(result);
  }

  /**
   * Create a new role-permission mapping
   * สร้างการเชื่อมโยงบทบาท-สิทธิ์ใหม่
   * @param payload - Contains data, user_id, bu_code / ประกอบด้วย data, user_id, bu_code
   * @returns Created role-permission mapping / การเชื่อมโยงบทบาท-สิทธิ์ที่สร้างแล้ว
   */
  @MessagePattern({ cmd: 'role_permission.create', service: 'role_permission' })
  async create(@Payload() payload: MicroservicePayload) {
    this.logger.debug(
      { function: 'create', payload: payload },
      ApplicationRolePermissionController.name,
    );
    const data: IApplicationRolePermissionCreate = payload.data;
    const user_id = payload.user_id;
    const bu_code = payload.bu_code

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.rolePermissionService.create(data, user_id, bu_code));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  /**
   * Update a role-permission mapping
   * แก้ไขการเชื่อมโยงบทบาท-สิทธิ์
   * @param payload - Contains data, user_id, bu_code / ประกอบด้วย data, user_id, bu_code
   * @returns Updated role-permission mapping / การเชื่อมโยงบทบาท-สิทธิ์ที่แก้ไขแล้ว
   */
  @MessagePattern({ cmd: 'role_permission.update', service: 'role_permission' })
  async update(@Payload() payload: MicroservicePayload) {
    this.logger.debug(
      { function: 'update', payload: payload },
      ApplicationRolePermissionController.name,
    );
    const data: IApplicationRolePermissionUpdate = payload.data;
    const user_id = payload.user_id;
    const bu_code = payload.bu_code

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.rolePermissionService.update(data, user_id, bu_code));
    return this.handleResult(result);
  }

  /**
   * Remove a role-permission mapping
   * ลบการเชื่อมโยงบทบาท-สิทธิ์
   * @param payload - Contains id, user_id, bu_code / ประกอบด้วย id, user_id, bu_code
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @MessagePattern({ cmd: 'role_permission.remove', service: 'role_permission' })
  async remove(@Payload() payload: MicroservicePayload) {
    this.logger.debug(
      { function: 'delete', payload: payload },
      ApplicationRolePermissionController.name,
    );
    const id = payload.id;
    const user_id = payload.user_id;
    const bu_code = payload.bu_code

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.rolePermissionService.remove(id, user_id, bu_code));
    return this.handleResult(result);
  }
}
