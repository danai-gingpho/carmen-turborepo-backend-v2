import { Body, Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { InventoryTransactionService } from './inventory-transaction.service';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController } from '@/common';

@Controller()
export class InventoryTransactionController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    InventoryTransactionController.name,
  );
  constructor(
    private readonly inventoryTransactionService: InventoryTransactionService,
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
    cmd: 'inventory-transaction.find-all-by-ids',
    service: 'inventory-transaction',
  })
  async findAllByIds(@Body() body: any): Promise<any> {
    this.logger.debug({ function: 'findAllByIds', body }, InventoryTransactionController.name);
    const auditContext = this.createAuditContext(body);
    const result = await runWithAuditContext(auditContext, () =>
      this.inventoryTransactionService.findAllByIds(
        body.ids,
        body.user_id,
        body.tenant_id,
      )
    );
    return this.handleResult(result);
  }
}
