import { DynamicModule, Global, Module } from '@nestjs/common';
import { NotificationService, NotificationServiceConfig } from '../services/notification.service';

export const NOTIFICATION_SERVICE_OPTIONS = 'NOTIFICATION_SERVICE_OPTIONS';

/**
 * NotificationModule - NestJS module for notification service
 *
 * Usage:
 * ```typescript
 * // In your module (e.g., app.module.ts)
 * @Module({
 *   imports: [
 *     NotificationModule.forRoot({
 *       host: process.env.NOTIFICATION_SERVICE_HOST,
 *       port: process.env.NOTIFICATION_SERVICE_PORT,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 *
 * // In your service
 * @Injectable()
 * export class MyService {
 *   constructor(private readonly notificationService: NotificationService) {}
 *
 *   async notify() {
 *     await this.notificationService.sendToUser({
 *       to_user_id: 'uuid',
 *       title: 'Hello',
 *       message: 'World',
 *     });
 *   }
 * }
 * ```
 */
@Global()
@Module({})
export class NotificationModule {
  /**
   * Register the module with static configuration
   */
  static forRoot(config?: NotificationServiceConfig): DynamicModule {
    return {
      module: NotificationModule,
      providers: [
        {
          provide: NOTIFICATION_SERVICE_OPTIONS,
          useValue: config || {},
        },
        {
          provide: NotificationService,
          useFactory: (options: NotificationServiceConfig) => {
            return new NotificationService(options);
          },
          inject: [NOTIFICATION_SERVICE_OPTIONS],
        },
      ],
      exports: [NotificationService],
    };
  }

  /**
   * Register the module with async configuration
   */
  static forRootAsync(options: {
    useFactory: (...args: any[]) => Promise<NotificationServiceConfig> | NotificationServiceConfig;
    inject?: any[];
  }): DynamicModule {
    return {
      module: NotificationModule,
      providers: [
        {
          provide: NOTIFICATION_SERVICE_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        {
          provide: NotificationService,
          useFactory: (config: NotificationServiceConfig) => {
            return new NotificationService(config);
          },
          inject: [NOTIFICATION_SERVICE_OPTIONS],
        },
      ],
      exports: [NotificationService],
    };
  }
}
