import { Body, Controller } from "@nestjs/common";
import { CreditNoteReasonService } from "./credit-note-reason.service";
import { MessagePattern } from "@nestjs/microservices";
import { BackendLogger } from "@/common/helpers/backend.logger";
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController } from '@/common';

@Controller()
export class CreditNoteReasonController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(CreditNoteReasonController.name);
  constructor(private readonly creditNoteReasonService: CreditNoteReasonService) {
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
    cmd: 'credit-note-reason.find-all',
    service: 'credit-note-reason',
  })
  async findAll(@Body() payload: any): Promise<any> {
    this.logger.debug({ function: 'findAll', payload }, CreditNoteReasonController.name);
    await this.creditNoteReasonService.initializePrismaService(payload.tenant_id || payload.bu_code, payload.user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.creditNoteReasonService.findAll(payload.paginate));
    return this.handlePaginatedResult(result);
  }
}