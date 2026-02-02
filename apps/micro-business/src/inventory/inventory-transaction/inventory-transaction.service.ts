import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy, MessagePattern } from '@nestjs/microservices';
import { TenantService } from '@/tenant/tenant.service';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';
import { BackendLogger } from '@/common/helpers/backend.logger';
import {
  InventoryTransactionListItemResponseSchema,
  Result,
  ErrorCode,
  TryCatch,
} from '@/common';

@Injectable()
export class InventoryTransactionService {
  private readonly logger: BackendLogger = new BackendLogger(
    InventoryTransactionService.name,
  );
  constructor(
    @Inject('PRISMA_TENANT')
    private readonly prismaTenant: typeof PrismaClient_TENANT,

    private readonly tenantService: TenantService,
  ) {}

  @TryCatch
  async findAllByIds(
    ids: string[],
    user_id: string,
    tenant_id: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findAllByIds', ids, user_id, tenant_id },
      InventoryTransactionService.name,
    );
    const tenant = await this.tenantService.getdb_connection(
      user_id,
      tenant_id,
    );

    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(
      tenant.tenant_id,
      tenant.db_connection,
    );

    const inventoryTransactions =
      await prisma.tb_inventory_transaction.findMany({
        where: {
          id: { in: ids },
        },
      });

    const serializedInventoryTransactions = inventoryTransactions.map((item) =>
      InventoryTransactionListItemResponseSchema.parse(item)
    );

    return Result.ok(serializedInventoryTransactions);
  }
}
