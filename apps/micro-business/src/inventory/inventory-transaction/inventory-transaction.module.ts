import { Module } from "@nestjs/common";
import { InventoryTransactionService } from "./inventory-transaction.service";
import { PrismaClient_SYSTEM } from "@repo/prisma-shared-schema-platform";
import { PrismaClient_TENANT } from "@repo/prisma-shared-schema-tenant";
import { TenantModule } from "@/tenant/tenant.module";
import { InventoryTransactionController } from "./inventory-transaction.controller";

@Module({
  imports: [
    TenantModule,
  ],
  controllers: [InventoryTransactionController],
  providers: [
    InventoryTransactionService,
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
    {
      provide: 'PRISMA_TENANT',
      useValue: PrismaClient_TENANT,
    },
  ],
  exports: [InventoryTransactionService],
})
export class InventoryTransactionModule {}