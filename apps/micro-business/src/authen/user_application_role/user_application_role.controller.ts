import { Controller, HttpStatus } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserApplicationRoleService } from './user_application_role.service';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController, MicroservicePayload, MicroserviceResponse } from '@/common';

@Controller()
export class UserApplicationRoleController extends BaseMicroserviceController {
  private readonly logger = new BackendLogger(
    UserApplicationRoleController.name,
  );

  constructor(
    private readonly userApplicationRoleService: UserApplicationRoleService,
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
   * Find application roles assigned to a user
   * ค้นหาบทบาทแอปพลิเคชันที่กำหนดให้ผู้ใช้
   * @param payload - Contains user_id, bu_code / ประกอบด้วย user_id, bu_code
   * @returns User's application roles / บทบาทแอปพลิเคชันของผู้ใช้
   */
  @MessagePattern({ cmd: 'user_application_role.find-by-user', service: 'user_application_role' })
  async findByUser(@Payload() payload: MicroservicePayload) {
    this.logger.debug(
      { function: 'findByUser', payload },
      UserApplicationRoleController.name,
    );

    const user_id = payload.user_id;
    const bu_code = payload.bu_code;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.userApplicationRoleService.findByUser(user_id, bu_code));
    return this.handleResult(result);
  }

  /**
   * Assign application roles to a user
   * กำหนดบทบาทแอปพลิเคชันให้ผู้ใช้
   * @param payload - Contains data with user_id and role IDs to add / ประกอบด้วย data ที่มี user_id และ ID บทบาทที่จะเพิ่ม
   * @returns Assignment result / ผลลัพธ์การกำหนดบทบาท
   */
  @MessagePattern({ cmd: 'user_application_role.assign', service: 'user_application_role' })
  async assign(@Payload() payload: MicroservicePayload) {
    this.logger.debug(
      { function: 'assign', payload },
      UserApplicationRoleController.name,
    );

    const data: {
      user_id: string; application_role_id: {
        add: string[];
      }
    } = payload.data;
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.userApplicationRoleService.assign(data, user_id, bu_code));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  /**
   * Update user application role assignments (add/remove)
   * แก้ไขการกำหนดบทบาทแอปพลิเคชันของผู้ใช้ (เพิ่ม/ลบ)
   * @param payload - Contains data with user_id and role IDs to add/remove / ประกอบด้วย data ที่มี user_id และ ID บทบาทที่จะเพิ่ม/ลบ
   * @returns Update result / ผลลัพธ์การแก้ไข
   */
  @MessagePattern({ cmd: 'user_application_role.update', service: 'user_application_role' })
  async update(@Payload() payload: MicroservicePayload) {
    this.logger.debug(
      { function: 'update', payload },
      UserApplicationRoleController.name,
    );

    const data: {
      user_id: string;
      application_role_id: {
        add?: string[];
        remove?: string[];
      };
    } = payload.data;
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.userApplicationRoleService.update(data, user_id, bu_code));
    return this.handleResult(result);
  }

  /**
   * Remove a user application role assignment
   * ลบการกำหนดบทบาทแอปพลิเคชันของผู้ใช้
   * @param payload - Contains data with user_id and application_role_id / ประกอบด้วย data ที่มี user_id และ application_role_id
   * @returns Removal result / ผลลัพธ์การลบ
   */
  @MessagePattern({ cmd: 'user_application_role.remove', service: 'user_application_role' })
  async remove(@Payload() payload: MicroservicePayload) {
    this.logger.debug(
      { function: 'remove', payload },
      UserApplicationRoleController.name,
    );

    const data: { user_id: string; application_role_id: string } = payload.data;
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.userApplicationRoleService.remove(data, user_id, bu_code));
    return this.handleResult(result);
  }
}
