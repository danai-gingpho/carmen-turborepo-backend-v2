import { HttpStatus, Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { Result, MicroserviceResponse } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { IPaginate } from 'src/shared-dto/paginate.dto';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class InventoryTransactionService {
  private readonly logger: BackendLogger = new BackendLogger(
    InventoryTransactionService.name,
  );

  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly inventoryService: ClientProxy,
  ) { }

  private async sendCommand(
    cmd: string,
    payload: Record<string, unknown>,
  ): Promise<Result<unknown>> {
    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd, service: 'inventory-transaction' },
      { ...payload, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }
    return Result.ok(response.data);
  }

  // ==================== Query Endpoints ====================

  async findAll(
    user_id: string,
    bu_code: string,
    paginate: IPaginate,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug({ function: 'findAll', user_id, bu_code, version }, InventoryTransactionService.name);
    return this.sendCommand('inventory-transaction.findAll', { user_id, tenant_id: bu_code, paginate, version });
  }

  async getCostLayers(product_id: string | undefined, location_id: string | undefined, user_id: string, tenant_id: string, paginate: IPaginate): Promise<Result<unknown>> {
    this.logger.debug({ function: 'getCostLayers', user_id, tenant_id }, InventoryTransactionService.name);
    return this.sendCommand('inventory-transaction.get-cost-layers', { product_id, location_id, user_id, tenant_id, paginate });
  }

  async getStockBalance(product_id: string | undefined, user_id: string, tenant_id: string, paginate: IPaginate): Promise<Result<unknown>> {
    this.logger.debug({ function: 'getStockBalance', user_id, tenant_id }, InventoryTransactionService.name);
    return this.sendCommand('inventory-transaction.get-stock-balance', { product_id, user_id, tenant_id, paginate });
  }

  async getLocations(user_id: string, tenant_id: string, paginate: IPaginate): Promise<Result<unknown>> {
    this.logger.debug({ function: 'getLocations', user_id, tenant_id }, InventoryTransactionService.name);
    return this.sendCommand('inventory-transaction.get-locations', { user_id, tenant_id, paginate });
  }

  async getProducts(user_id: string, tenant_id: string, paginate: IPaginate): Promise<Result<unknown>> {
    this.logger.debug({ function: 'getProducts', user_id, tenant_id }, InventoryTransactionService.name);
    return this.sendCommand('inventory-transaction.get-products', { user_id, tenant_id, paginate });
  }

  async getProductsByLocation(location_id: string, user_id: string, tenant_id: string, paginate: IPaginate): Promise<Result<unknown>> {
    this.logger.debug({ function: 'getProductsByLocation', user_id, tenant_id }, InventoryTransactionService.name);
    return this.sendCommand('inventory-transaction.get-products-by-location', { location_id, user_id, tenant_id, paginate });
  }

  async getCalculationMethod(user_id: string, tenant_id: string): Promise<Result<unknown>> {
    this.logger.debug({ function: 'getCalculationMethod', user_id, tenant_id }, InventoryTransactionService.name);
    return this.sendCommand('inventory-transaction.get-calculation-method', { user_id, tenant_id });
  }

  async backfillZeroCostLayers(user_id: string, tenant_id: string): Promise<Result<unknown>> {
    this.logger.debug({ function: 'backfillZeroCostLayers', user_id, tenant_id }, InventoryTransactionService.name);
    return this.sendCommand('inventory-transaction.backfill-zero-cost-layers', { user_id, tenant_id });
  }
}
