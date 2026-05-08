import { Module } from '@nestjs/common';
import { SqlQueryController } from './sql-query.controller';
import { SqlQueryService } from './sql-query.service';
import { TenantModule } from '@/tenant/tenant.module';

@Module({
  imports: [TenantModule],
  controllers: [SqlQueryController],
  providers: [SqlQueryService],
})
export class SqlQueryModule {}
