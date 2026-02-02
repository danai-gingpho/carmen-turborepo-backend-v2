import { Module } from '@nestjs/common';
import { ClusterService } from './cluster.service';
import { ClusterController } from './cluster.controller';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';
import { BackendLogger } from '@/common/helpers/backend.logger';

@Module({
  controllers: [ClusterController],
  providers: [
    ClusterService,
    BackendLogger,
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
    {
      provide: 'PRISMA_TENANT',
      useValue: PrismaClient_TENANT,
    },
  ],
  exports: [ClusterService],
})
export class ClusterModule {}
