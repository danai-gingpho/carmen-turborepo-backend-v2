import { BackendLogger } from '@/common/helpers/backend.logger'
import { Controller, HttpStatus } from '@nestjs/common'
import { DepartmentUserService } from './department-user.service'
import { MessagePattern, Payload } from '@nestjs/microservices';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController, MicroservicePayload, MicroserviceResponse } from '@/common';

@Controller()
export class DepartmentUserController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    DepartmentUserController.name,
  );
  constructor(private readonly departmentUserService: DepartmentUserService) {
    super();
  }

  private createAuditContext(payload: MicroservicePayload): AuditContext {
    return {
      tenant_id: payload.bu_code,
      user_id: payload.user_id,
      request_id: payload.request_id,
      ip_address: payload.ip_address,
      user_agent: payload.user_agent,
    };
  }

  /**
   * Find all users in a department
   * ค้นหาผู้ใช้ทั้งหมดในแผนก
   * @param payload - Microservice payload containing department ID / ข้อมูล payload ที่มี ID ของแผนก
   * @returns List of users in the department / รายการผู้ใช้ในแผนก
   */
  @MessagePattern({ cmd: 'department-users.find-by-department', service: 'department-users' })
  async findAllUserInDepartment(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findOne', payload }, DepartmentUserController.name);
    const department_id = payload.department_id;
    this.departmentUserService.userId = payload.user_id;
    this.departmentUserService.bu_code = payload.bu_code;
    await this.departmentUserService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.departmentUserService.findAllUserInDepartment(department_id));
    return this.handleResult(result);
  }

  /**
   * Check if a department has a Head of Department (HOD)
   * ตรวจสอบว่าแผนกมีหัวหน้าแผนก (HOD) หรือไม่
   * @param payload - Microservice payload containing department ID / ข้อมูล payload ที่มี ID ของแผนก
   * @returns Boolean indicating HOD existence / ค่าบูลีนที่ระบุว่ามี HOD หรือไม่
   */
  @MessagePattern({ cmd: 'department-users.has-hod-in-department', service: 'department-users' })
  async hasHodInDepartment(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'hasHodInDepartment', payload }, DepartmentUserController.name);
    const department_id = payload.department_id;
    this.departmentUserService.userId = payload.user_id;
    this.departmentUserService.bu_code = payload.bu_code;
    await this.departmentUserService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.departmentUserService.hasHodInDepartment(department_id));
    return this.handleResult(result);
  }

  /**
   * Get the Head of Department (HOD) for a department
   * ดึงข้อมูลหัวหน้าแผนก (HOD) ของแผนก
   * @param payload - Microservice payload containing department ID / ข้อมูล payload ที่มี ID ของแผนก
   * @returns HOD user detail / รายละเอียดผู้ใช้หัวหน้าแผนก
   */
  @MessagePattern({ cmd: 'department-users.get-hod-in-department', service: 'department-users' })
  async getHodInDepartment(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'getHodInDepartment', payload }, DepartmentUserController.name);
    const department_id = payload.department_id;
    this.departmentUserService.userId = payload.user_id;
    this.departmentUserService.bu_code = payload.bu_code;
    await this.departmentUserService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.departmentUserService.getHodInDepartment(department_id));
    return this.handleResult(result);
  }

  /**
   * Find a user's member department and HOD departments by user_id
   * ค้นหาแผนกที่ user เป็นสมาชิก และแผนกที่ user เป็น HOD ตาม user_id
   * @param payload - Microservice payload with target_user_id / payload ที่มี target_user_id
   * @returns Member department + HOD departments / แผนกที่เป็นสมาชิก + รายการแผนกที่เป็น HOD
   */
  @MessagePattern({ cmd: 'department-users.find-by-user-id', service: 'department-users' })
  async findByUserId(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findByUserId', payload }, DepartmentUserController.name);
    const target_user_id = payload.target_user_id as string;
    this.departmentUserService.userId = payload.user_id;
    this.departmentUserService.bu_code = payload.bu_code;
    await this.departmentUserService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.departmentUserService.findByUserId(target_user_id),
    );
    return this.handleResult(result);
  }
}
