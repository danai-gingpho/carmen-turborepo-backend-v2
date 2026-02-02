import { Body, Controller } from "@nestjs/common";
import { IssueService } from "./issue.service";
import { MessagePattern } from "@nestjs/microservices";
import { BackendLogger } from "@/common/helpers/backend.logger";
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController } from '@/common';

@Controller()
export class IssueController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(IssueController.name);
  constructor(private readonly issueService: IssueService) {
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

  @MessagePattern({
    cmd: 'issue.find-all',
    service: 'issue',
  })
  async findAll(@Body() payload: any): Promise<any> {
    this.logger.debug({ function: 'findAll', payload }, IssueController.name);
    await this.issueService.initializePrismaService(payload.tenant_id || payload.bu_code, payload.user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.issueService.findAll(payload.paginate));
    return this.handlePaginatedResult(result);
  }

  @MessagePattern({
    cmd: 'issue.find-one',
    service: 'issue',
  })
  async findOne(@Body() payload: any): Promise<any> {
    this.logger.debug({ function: 'findOne', payload }, IssueController.name);
    await this.issueService.initializePrismaService(payload.tenant_id || payload.bu_code, payload.user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.issueService.findOne(payload.id));
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'issue.create',
    service: 'issue',
  })
  async create(@Body() payload: any): Promise<any> {
    this.logger.debug({ function: 'create', payload }, IssueController.name);
    await this.issueService.initializePrismaService(payload.tenant_id || payload.bu_code, payload.user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.issueService.create(payload.data));
    return this.handleResultCrate(result);
  }

  @MessagePattern({
    cmd: 'issue.update',
    service: 'issue',
  })
  async update(@Body() payload: any): Promise<any> {
    this.logger.debug({ function: 'update', payload }, IssueController.name);
    await this.issueService.initializePrismaService(payload.tenant_id || payload.bu_code, payload.user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.issueService.update(payload.id, payload.data));
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'issue.delete',
    service: 'issue',
  })
  async delete(@Body() payload: any): Promise<any> {
    this.logger.debug({ function: 'delete', payload }, IssueController.name);
    await this.issueService.initializePrismaService(payload.tenant_id || payload.bu_code, payload.user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.issueService.delete(payload.id));
    return this.handleResult(result);
  }
}
