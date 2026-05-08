import { Module } from '@nestjs/common';
import { TenantModule } from '@/tenant/tenant.module';
import { CommonModule } from '@/common/common.module';
import { DepartmentUserController } from './department-user.controller';
import { DepartmentUserService } from './department-user.service';

@Module({
  imports: [TenantModule, CommonModule],
  controllers: [DepartmentUserController],
  providers: [DepartmentUserService],
  exports: [DepartmentUserService],
})
export class DepartmentUserModule {}
