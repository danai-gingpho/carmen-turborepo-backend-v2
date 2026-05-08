import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { AuditContextInterceptor, LogEventsModule } from '@repo/log-events-library';
import { SentryModule } from '@sentry/nestjs/setup';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';

// Cluster modules
import { ClusterModule } from './cluster/cluster/cluster.module';
import { BusinessUnitModule } from './cluster/business-unit/business-unit.module';
import { CurrenciesModule as ClusterCurrenciesModule } from './cluster/currencies/currencies.module';
import { NewsModule } from './cluster/news/news.module';
import { ReportTemplateModule } from './cluster/report-template/report-template.module';
import { UserModule } from './cluster/user/user.module';

@Module({
  imports: [
    // Sentry for error tracking
    SentryModule.forRoot(),

    // Log events module for manual audit logging
    LogEventsModule.forRoot({
      logDirectory: process.env.AUDIT_LOG_DIR || './logs/audit',
      filePrefix: 'cluster-audit',
      rotationStrategy: 'daily',
      bufferSize: 100,
      flushIntervalMs: 5000,
      excludeModels: ['_prisma_migrations', 'tb_activity'],
      sensitiveFields: ['password', 'hash', 'token', 'secret', 'api_key'],
      saveToDatabase: false,
      saveToFile: true,
    }),

    // Cluster modules
    ClusterModule,
    BusinessUnitModule,
    ClusterCurrenciesModule,
    NewsModule,
    ReportTemplateModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    BackendLogger,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditContextInterceptor,
    },
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
  ],
})
export class AppModule {}
