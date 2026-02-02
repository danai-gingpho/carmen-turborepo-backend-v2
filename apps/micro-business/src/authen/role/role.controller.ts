import { Controller, HttpStatus } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ApplicationRoleService } from './role.service';
import { IApplicationRoleCreate, IApplicationRoleUpdate } from './interface/role.interface';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController } from '@/common';

@Controller()
export class ApplicationRoleController extends BaseMicroserviceController {
  private readonly logger = new BackendLogger(ApplicationRoleController.name);

  constructor(private readonly roleService: ApplicationRoleService) {
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

  @MessagePattern({ cmd: 'role.findOne', service: 'role' })
  async findOne(@Payload() payload: any) {
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

  @MessagePattern({ cmd: 'role.findAll', service: 'role' })
  async findAll(@Payload() payload: any) {
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

  @MessagePattern({ cmd: 'role.create', service: 'role' })
  async create(@Payload() payload: any) {
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

  @MessagePattern({ cmd: 'role.update', service: 'role' })
  async update(@Payload() payload: any) {
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

  @MessagePattern({ cmd: 'role.remove', service: 'role' })
  async remove(@Payload() payload: any) {
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
