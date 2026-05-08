import { Controller, HttpStatus } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ApplicationRoleService } from './role.service';
import { IApplicationRoleCreate, IApplicationRoleUpdate } from './interface/role.interface';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController, MicroservicePayload, MicroserviceResponse } from '@/common';

@Controller()
export class ApplicationRoleController extends BaseMicroserviceController {
  private readonly logger = new BackendLogger(ApplicationRoleController.name);

  constructor(private readonly roleService: ApplicationRoleService) {
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
   * Find a role by ID
   * ค้นหาบทบาทรายการเดียวตาม ID
   * @param payload - Contains id, user_id, tenant_id / ประกอบด้วย id, user_id, tenant_id
   * @returns Role detail / รายละเอียดบทบาท
   */
  @MessagePattern({ cmd: 'role.findOne', service: 'role' })
  async findOne(@Payload() payload: MicroservicePayload) {
    this.logger.debug(
      { function: 'findOne', payload: payload },
      ApplicationRoleController.name,
    );
    const id = payload.id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.roleService.findOne(id, user_id, tenant_id));
    return this.handleResult(result);
  }

  /**
   * Find all roles with pagination
   * ค้นหาบทบาททั้งหมดพร้อมการแบ่งหน้า
   * @param payload - Contains user_id, tenant_id, paginate / ประกอบด้วย user_id, tenant_id, paginate
   * @returns Paginated list of roles / รายการบทบาทแบบแบ่งหน้า
   */
  @MessagePattern({ cmd: 'role.findAll', service: 'role' })
  async findAll(@Payload() payload: MicroservicePayload) {
    this.logger.debug(
      { function: 'findAll', payload: payload },
      ApplicationRoleController.name,
    );
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const paginate = payload.paginate;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.roleService.findAll(user_id, tenant_id, paginate));
    return this.handlePaginatedResult(result);
  }

  /**
   * Create a new role
   * สร้างบทบาทใหม่
   * @param payload - Contains data, user_id, tenant_id / ประกอบด้วย data, user_id, tenant_id
   * @returns Created role / บทบาทที่สร้างแล้ว
   */
  @MessagePattern({ cmd: 'role.create', service: 'role' })
  async create(@Payload() payload: MicroservicePayload) {
    this.logger.debug(
      { function: 'create', payload: payload },
      ApplicationRoleController.name,
    );
    const data: IApplicationRoleCreate = payload.data;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.roleService.create(data, user_id, tenant_id));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  /**
   * Update a role
   * แก้ไขบทบาท
   * @param payload - Contains data, user_id, tenant_id / ประกอบด้วย data, user_id, tenant_id
   * @returns Updated role / บทบาทที่แก้ไขแล้ว
   */
  @MessagePattern({ cmd: 'role.update', service: 'role' })
  async update(@Payload() payload: MicroservicePayload) {
    this.logger.debug(
      { function: 'update', payload: payload },
      ApplicationRoleController.name,
    );
    const data: IApplicationRoleUpdate = payload.data;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.roleService.update(data, user_id, tenant_id));
    return this.handleResult(result);
  }

  /**
   * Remove a role
   * ลบบทบาท
   * @param payload - Contains id, user_id, tenant_id / ประกอบด้วย id, user_id, tenant_id
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @MessagePattern({ cmd: 'role.remove', service: 'role' })
  async remove(@Payload() payload: MicroservicePayload) {
    this.logger.debug(
      { function: 'delete', payload: payload },
      ApplicationRoleController.name,
    );
    const id = payload.id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.roleService.remove(id, user_id, tenant_id));
    return this.handleResult(result);
  }
}
