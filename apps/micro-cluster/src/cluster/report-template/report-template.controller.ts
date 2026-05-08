import { Controller, HttpStatus } from '@nestjs/common';
import { ReportTemplateService } from './report-template.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController, MicroservicePayload, MicroserviceResponse } from '@/common';

@Controller()
export class ReportTemplateController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    ReportTemplateController.name,
  );

  constructor(private readonly reportTemplateService: ReportTemplateService) {
    super();
  }

  private createAuditContext(payload: MicroservicePayload): AuditContext {
    return {
      tenant_id: payload.tenant_id || payload.bu_code,
      user_id: payload.user_id,
      request_id: payload.request_id,
      ip_address: payload.ip_address,
      user_agent: payload.user_agent,
    };
  }

  @MessagePattern({ cmd: 'report-template.findAll', service: 'report-template' })
  async findAll(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'findAll', payload: payload },
      ReportTemplateController.name,
    );

    const paginate = payload.paginate;
    const user_id = payload.user_id;
    const version = payload.version;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.reportTemplateService.findAll(user_id, paginate, version),
    );

    return this.handleResult(result, HttpStatus.OK);
  }

  @MessagePattern({ cmd: 'report-template.findOne', service: 'report-template' })
  async findOne(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'findOne', payload: payload },
      ReportTemplateController.name,
    );

    const id = payload.id;
    const user_id = payload.user_id;
    const version = payload.version;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.reportTemplateService.findOne(id, user_id, version),
    );

    return this.handleResult(result, HttpStatus.OK);
  }

  @MessagePattern({ cmd: 'report-template.create', service: 'report-template' })
  async create(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'create', payload: payload },
      ReportTemplateController.name,
    );

    const data = payload.data;
    const user_id = payload.user_id;
    const version = payload.version;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.reportTemplateService.create(data, user_id, version),
    );

    return this.handleResult(result, HttpStatus.CREATED);
  }

  @MessagePattern({ cmd: 'report-template.update', service: 'report-template' })
  async update(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'update', payload: payload },
      ReportTemplateController.name,
    );

    const id = payload.id;
    const data = payload.data;
    const user_id = payload.user_id;
    const version = payload.version;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.reportTemplateService.update(id, data, user_id, version),
    );

    return this.handleResult(result, HttpStatus.OK);
  }

  @MessagePattern({ cmd: 'report-template.delete', service: 'report-template' })
  async delete(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'delete', payload: payload },
      ReportTemplateController.name,
    );

    const id = payload.id;
    const user_id = payload.user_id;
    const version = payload.version;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.reportTemplateService.delete(id, user_id, version),
    );

    return this.handleResult(result, HttpStatus.OK);
  }
}
