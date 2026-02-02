import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ActivityLogService } from './activity-log.service';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController } from '@/common';

@Controller()
export class ActivityLogController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    ActivityLogController.name,
  );

  constructor(private readonly activityLogService: ActivityLogService) {
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

  @MessagePattern({ cmd: 'activity-log.findAll', service: 'activity-log' })
  async findAll(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'findAll', payload },
      ActivityLogController.name,
    );

    this.activityLogService.userId = payload.user_id;
    this.activityLogService.bu_code = payload.bu_code;
    await this.activityLogService.initializePrismaService(
      payload.bu_code,
      payload.user_id,
    );

    const paginate = payload.paginate || {};
    const filters = payload.filters || {};

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.activityLogService.findAll(paginate, filters),
    );

    return this.handlePaginatedResult(result);
  }

  @MessagePattern({ cmd: 'activity-log.findOne', service: 'activity-log' })
  async findOne(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'findOne', payload },
      ActivityLogController.name,
    );

    this.activityLogService.userId = payload.user_id;
    this.activityLogService.bu_code = payload.bu_code;
    await this.activityLogService.initializePrismaService(
      payload.bu_code,
      payload.user_id,
    );

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.activityLogService.findOne(payload.id),
    );

    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'activity-log.delete', service: 'activity-log' })
  async delete(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'delete', payload },
      ActivityLogController.name,
    );

    this.activityLogService.userId = payload.user_id;
    this.activityLogService.bu_code = payload.bu_code;
    await this.activityLogService.initializePrismaService(
      payload.bu_code,
      payload.user_id,
    );

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.activityLogService.delete(payload.id, payload.user_id),
    );

    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'activity-log.deleteMany', service: 'activity-log' })
  async deleteMany(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'deleteMany', payload },
      ActivityLogController.name,
    );

    this.activityLogService.userId = payload.user_id;
    this.activityLogService.bu_code = payload.bu_code;
    await this.activityLogService.initializePrismaService(
      payload.bu_code,
      payload.user_id,
    );

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.activityLogService.deleteMany(payload.ids, payload.user_id),
    );

    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'activity-log.hardDelete', service: 'activity-log' })
  async hardDelete(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'hardDelete', payload },
      ActivityLogController.name,
    );

    this.activityLogService.userId = payload.user_id;
    this.activityLogService.bu_code = payload.bu_code;
    await this.activityLogService.initializePrismaService(
      payload.bu_code,
      payload.user_id,
    );

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.activityLogService.hardDelete(payload.id),
    );

    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'activity-log.hardDeleteMany', service: 'activity-log' })
  async hardDeleteMany(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'hardDeleteMany', payload },
      ActivityLogController.name,
    );

    this.activityLogService.userId = payload.user_id;
    this.activityLogService.bu_code = payload.bu_code;
    await this.activityLogService.initializePrismaService(
      payload.bu_code,
      payload.user_id,
    );

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.activityLogService.hardDeleteMany(payload.ids),
    );

    return this.handleResult(result);
  }
}
