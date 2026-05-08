import { Controller, HttpStatus } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController, MicroservicePayload, MicroserviceResponse } from '@/common';

@Controller()
export class DashboardController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    DashboardController.name,
  );
  constructor(private readonly dashboardService: DashboardService) {
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

  @MessagePattern({ cmd: 'dashboard.findAll', service: 'dashboard' })
  async findAll(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findAll', payload }, DashboardController.name);
    this.dashboardService.userId = payload.user_id;
    this.dashboardService.bu_code = payload.bu_code;
    await this.dashboardService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.dashboardService.findAll());
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'dashboard.findOne', service: 'dashboard' })
  async findOne(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findOne', payload }, DashboardController.name);
    const id = payload.id;
    this.dashboardService.userId = payload.user_id;
    this.dashboardService.bu_code = payload.bu_code;
    await this.dashboardService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.dashboardService.findOne(id));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'dashboard.create', service: 'dashboard' })
  async create(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'create', payload }, DashboardController.name);
    const data = payload.data;
    this.dashboardService.userId = payload.user_id;
    this.dashboardService.bu_code = payload.bu_code;
    await this.dashboardService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.dashboardService.create(data));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  @MessagePattern({ cmd: 'dashboard.update', service: 'dashboard' })
  async update(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'update', payload }, DashboardController.name);
    const data = payload.data;
    this.dashboardService.userId = payload.user_id;
    this.dashboardService.bu_code = payload.bu_code;
    await this.dashboardService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.dashboardService.update(data));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'dashboard.delete', service: 'dashboard' })
  async delete(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'delete', payload }, DashboardController.name);
    const id = payload.id;
    this.dashboardService.userId = payload.user_id;
    this.dashboardService.bu_code = payload.bu_code;
    await this.dashboardService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.dashboardService.delete(id));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'dashboard.updateLayout', service: 'dashboard' })
  async updateLayout(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'updateLayout', payload }, DashboardController.name);
    const data = payload.data;
    const id = payload.id;
    this.dashboardService.userId = payload.user_id;
    this.dashboardService.bu_code = payload.bu_code;
    await this.dashboardService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.dashboardService.updateLayout(id, data));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'dashboard.addWidget', service: 'dashboard' })
  async addWidget(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'addWidget', payload }, DashboardController.name);
    const data = payload.data;
    const dashboardId = payload.id;
    this.dashboardService.userId = payload.user_id;
    this.dashboardService.bu_code = payload.bu_code;
    await this.dashboardService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.dashboardService.addWidget(dashboardId, data));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  @MessagePattern({ cmd: 'dashboard.updateWidget', service: 'dashboard' })
  async updateWidget(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'updateWidget', payload }, DashboardController.name);
    const data = payload.data;
    const widgetId = payload.widget_id;
    this.dashboardService.userId = payload.user_id;
    this.dashboardService.bu_code = payload.bu_code;
    await this.dashboardService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.dashboardService.updateWidget(widgetId, data));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'dashboard.deleteWidget', service: 'dashboard' })
  async deleteWidget(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'deleteWidget', payload }, DashboardController.name);
    const widgetId = payload.widget_id;
    this.dashboardService.userId = payload.user_id;
    this.dashboardService.bu_code = payload.bu_code;
    await this.dashboardService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.dashboardService.deleteWidget(widgetId));
    return this.handleResult(result);
  }
}
