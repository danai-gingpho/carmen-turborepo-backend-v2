import { Controller, HttpStatus } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ApplicationRolePermissionService } from './role_permission.service';
import {
  IApplicationRolePermissionCreate,
  IApplicationRolePermissionUpdate,
} from './interface/role_permission.interface';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController } from '@/common';

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

  private createAuditContext(payload: any): AuditContext {
    return {
      tenant_id: payload.tenant_id || payload.bu_code,
      user_id: payload.user_id,
      request_id: payload.request_id,
      ip_address: payload.ip_address,
      user_agent: payload.user_agent,
    };
  }

  @MessagePattern({ cmd: 'role_permission.find-one', service: 'role_permission' })
  async findOne(@Payload() payload: any) {
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

  @MessagePattern({ cmd: 'role_permission.find-all', service: 'role_permission' })
  async findAll(@Payload() payload: any) {
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

  @MessagePattern({ cmd: 'role_permission.create', service: 'role_permission' })
  async create(@Payload() payload: any) {
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

  @MessagePattern({ cmd: 'role_permission.update', service: 'role_permission' })
  async update(@Payload() payload: any) {
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

  @MessagePattern({ cmd: 'role_permission.remove', service: 'role_permission' })
  async remove(@Payload() payload: any) {
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
