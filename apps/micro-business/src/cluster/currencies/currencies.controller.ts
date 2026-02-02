import { Controller } from '@nestjs/common';
import { CurrenciesService } from './currencies.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController } from '@/common';

@Controller()
export class CurrenciesController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    CurrenciesController.name,
  );
  constructor(private readonly currenciesService: CurrenciesService) {
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

  @MessagePattern({ cmd: 'currencies.findAllISO', service: 'currencies' })
  async findAllISO(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'findAllISO', payload: payload },
      CurrenciesController.name,
    );
    const paginate = payload.paginate;
    const user_id = payload.user_id;
    const version = payload.version;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.currenciesService.findAllISO(
        user_id,
        paginate,
        version,
      )
    );
    return this.handlePaginatedResult(result);
  }
}
