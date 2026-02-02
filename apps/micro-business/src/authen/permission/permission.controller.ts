import { Controller, HttpStatus } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import {
  IPermissionCreate,
  IPermissionUpdate,
} from './interface/permission.interface';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController } from '@/common';

@Controller()
export class PermissionController extends BaseMicroserviceController {
  private readonly logger = new BackendLogger(PermissionController.name);

  constructor(private readonly permissionService: PermissionService) {
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

  @MessagePattern({ cmd: 'permission.findOne', service: 'permission' })
  async findOne(@Payload() payload: any) {
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

  @MessagePattern({ cmd: 'permission.findAll', service: 'permission' })
  async findAll(@Payload() payload: any) {
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

  @MessagePattern({ cmd: 'permission.create', service: 'permission' })
  async create(@Payload() payload: any) {
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

  @MessagePattern({ cmd: 'permission.update', service: 'permission' })
  async update(@Payload() payload: any) {
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

  @MessagePattern({ cmd: 'permission.remove', service: 'permission' })
  async remove(@Payload() payload: any) {
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
