import { Module } from '@nestjs/common';
import { UserApplicationRoleController } from './user_application_role.controller';
import { UserApplicationRoleService } from './user_application_role.service';
import { TenantModule } from '@/tenant/tenant.module';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';


@Module({
  imports: [
    TenantModule
  ],
  controllers: [UserApplicationRoleController],
  providers: [
    UserApplicationRoleService,
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
    {
      provide: 'PRISMA_TENANT',
      useValue: PrismaClient_TENANT,
    }
  ],
  exports: [UserApplicationRoleService],
})
export class UserApplicationRoleModule { }
