import { Body, Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InventoryTransactionService } from './inventory-transaction.service';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController, MicroservicePayload, MicroserviceResponse } from '@/common';

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

  private createAuditContext(payload: MicroservicePayload): AuditContext {
    return {
      tenant_id: payload.tenant_id || payload.bu_code,
      user_id: payload.user_id,
      request_id: payload.request_id,
      ip_address: payload.ip_address,
      user_agent: payload.user_agent,
    };
  }

  // ==================== Query Handlers ====================

  @MessagePattern({
    cmd: 'inventory-transaction.findAll',
    service: 'inventory-transaction',
  })
  async findAll(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findAll', payload }, InventoryTransactionController.name);
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.inventoryTransactionService.findAll(user_id, tenant_id, payload.paginate),
    );
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'inventory-transaction.find-all-by-ids',
    service: 'inventory-transaction',
  })
  async findAllByIds(@Body() body: MicroservicePayload): Promise<MicroserviceResponse> {
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

  @MessagePattern({
    cmd: 'inventory-transaction.get-cost-layers',
    service: 'inventory-transaction',
  })
  async getCostLayers(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'getCostLayers', payload }, InventoryTransactionController.name);
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.inventoryTransactionService.getCostLayers(
        { bu_code: tenant_id, product_id: payload.product_id, location_id: payload.location_id },
        user_id,
        tenant_id,
        payload.paginate,
      )
    );
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'inventory-transaction.get-stock-balance',
    service: 'inventory-transaction',
  })
  async getStockBalance(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'getStockBalance', payload }, InventoryTransactionController.name);
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.inventoryTransactionService.getStockBalance(
        { bu_code: tenant_id, product_id: payload.product_id },
        user_id,
        tenant_id,
        payload.paginate,
      )
    );
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'inventory-transaction.get-locations',
    service: 'inventory-transaction',
  })
  async getLocations(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'getLocations', payload }, InventoryTransactionController.name);
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.inventoryTransactionService.getLocations(user_id, tenant_id, payload.paginate)
    );
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'inventory-transaction.get-products',
    service: 'inventory-transaction',
  })
  async getProducts(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'getProducts', payload }, InventoryTransactionController.name);
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.inventoryTransactionService.getProducts(user_id, tenant_id, payload.paginate)
    );
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'inventory-transaction.get-products-by-location',
    service: 'inventory-transaction',
  })
  async getProductsByLocation(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'getProductsByLocation', payload }, InventoryTransactionController.name);
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.inventoryTransactionService.getProductsByLocation(
        payload.location_id,
        user_id,
        tenant_id,
        payload.paginate,
      )
    );
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'inventory-transaction.get-calculation-method',
    service: 'inventory-transaction',
  })
  async getCalculationMethod(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'getCalculationMethod', payload }, InventoryTransactionController.name);
    const tenant_id = payload.tenant_id || payload.bu_code;
    const result = await this.inventoryTransactionService.getCalculationMethodResult(tenant_id);
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'inventory-transaction.backfill-zero-cost-layers',
    service: 'inventory-transaction',
  })
  async backfillZeroCostLayers(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'backfillZeroCostLayers', payload }, InventoryTransactionController.name);
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.inventoryTransactionService.backfillZeroCostLayers(user_id, tenant_id),
    );
    return this.handleResult(result);
  }
}
