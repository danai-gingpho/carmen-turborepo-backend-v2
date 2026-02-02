import { Controller, HttpStatus } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserApplicationRoleService } from './user_application_role.service';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController } from '@/common';

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

  private createAuditContext(payload: any): AuditContext {
    return {
      tenant_id: payload.tenant_id || payload.bu_code,
      user_id: payload.user_id,
      request_id: payload.request_id,
      ip_address: payload.ip_address,
      user_agent: payload.user_agent,
    };
  }

  @MessagePattern({ cmd: 'user_application_role.find-by-user', service: 'user_application_role' })
  async findByUser(@Payload() payload: any) {
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

  @MessagePattern({ cmd: 'user_application_role.assign', service: 'user_application_role' })
  async assign(@Payload() payload: any) {
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

  @MessagePattern({ cmd: 'user_application_role.update', service: 'user_application_role' })
  async update(@Payload() payload: any) {
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

  @MessagePattern({ cmd: 'user_application_role.remove', service: 'user_application_role' })
  async remove(@Payload() payload: any) {
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
