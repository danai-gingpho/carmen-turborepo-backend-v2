import { BackendLogger } from '@/common/helpers/backend.logger'
import { Controller, HttpStatus } from '@nestjs/common'
import { DepartmentUserService } from './department-user.service'
import { MessagePattern, Payload } from '@nestjs/microservices';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController } from '@/common';

@Controller()
export class DepartmentUserController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    DepartmentUserController.name,
  );
  constructor(private readonly departmentUserService: DepartmentUserService) {
    super();
  }

  private createAuditContext(payload: any): AuditContext {
    return {
      tenant_id: payload.bu_code,
      user_id: payload.user_id,
      request_id: payload.request_id,
      ip_address: payload.ip_address,
      user_agent: payload.user_agent,
    };
  }

  @MessagePattern({ cmd: 'department-users.find-by-department', service: 'department-users' })
  async findAllUserInDepartment(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findOne', payload }, DepartmentUserController.name);
    const department_id = payload.department_id;
    this.departmentUserService.userId = payload.user_id;
    this.departmentUserService.bu_code = payload.bu_code;
    await this.departmentUserService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.departmentUserService.findAllUserInDepartment(department_id));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'department-users.has-hod-in-department', service: 'department-users' })
  async hasHodInDepartment(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'hasHodInDepartment', payload }, DepartmentUserController.name);
    const department_id = payload.department_id;
    this.departmentUserService.userId = payload.user_id;
    this.departmentUserService.bu_code = payload.bu_code;
    await this.departmentUserService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.departmentUserService.hasHodInDepartment(department_id));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'department-users.get-hod-in-department', service: 'department-users' })
  async getHodInDepartment(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'getHodInDepartment', payload }, DepartmentUserController.name);
    const department_id = payload.department_id;
    this.departmentUserService.userId = payload.user_id;
    this.departmentUserService.bu_code = payload.bu_code;
    await this.departmentUserService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.departmentUserService.getHodInDepartment(department_id));
    return this.handleResult(result);
  }
}
