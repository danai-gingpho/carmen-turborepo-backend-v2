import { Body, Controller, HttpStatus } from '@nestjs/common';
import { CreditNoteService } from './credit-note.service';
import { MessagePattern } from '@nestjs/microservices';
import { CreditNoteLogic } from './credit-note.logic';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController } from '@/common';

@Controller()
export class CreditNoteController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    CreditNoteController.name,
  );
  constructor(
    private readonly creditNoteService: CreditNoteService,
    private readonly creditNoteLogic: CreditNoteLogic,
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

  @MessagePattern({
    cmd: 'credit-note.find-one',
    service: 'credit-note',
  })
  async findOne(@Body() payload: any): Promise<any> {
    this.logger.debug({ function: 'findOne', payload }, CreditNoteController.name);
    await this.creditNoteService.initializePrismaService(payload.tenant_id || payload.bu_code, payload.user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.creditNoteService.findOne(payload.id));
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'credit-note.find-all',
    service: 'credit-note',
  })
  async findAll(@Body() payload: any): Promise<any> {
    this.logger.debug({ function: 'findAll', payload }, CreditNoteController.name);
    const paginate = payload.paginate;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;

    await this.creditNoteService.initializePrismaService(tenant_id, user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.creditNoteService.findAll(paginate));
    return this.handlePaginatedResult(result);
  }

  @MessagePattern({
    cmd: 'credit-note.create',
    service: 'credit-note',
  })
  async create(@Body() payload: any): Promise<any> {
    this.logger.debug({ function: 'create', payload }, CreditNoteController.name);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.creditNoteLogic.create(
        payload.data,
        payload.user_id,
        payload.tenant_id || payload.bu_code,
      )
    );
    return this.handleResult(result, HttpStatus.CREATED);
  }

  @MessagePattern({
    cmd: 'credit-note.update',
    service: 'credit-note',
  })
  async update(@Body() payload: any): Promise<any> {
    this.logger.debug({ function: 'update', payload }, CreditNoteController.name);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.creditNoteLogic.update(
        payload.data,
        payload.user_id,
        payload.tenant_id || payload.bu_code,
      )
    );
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'credit-note.delete',
    service: 'credit-note',
  })
  async delete(@Body() payload: any): Promise<any> {
    this.logger.debug({ function: 'delete', payload }, CreditNoteController.name);
    await this.creditNoteService.initializePrismaService(payload.tenant_id || payload.bu_code, payload.user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.creditNoteService.delete(payload.id));
    return this.handleResult(result);
  }
}
