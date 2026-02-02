import { DynamicModule, Global, Module, OnModuleDestroy } from '@nestjs/common';
import { LogEventsService } from '../services/log-events.service.js';
import type { LogEventsConfig } from '../types/log-event.types.js';
import { AuditFileWriter } from '../writers/file-writer.js';
import { AuditBufferManager } from '../writers/buffer-manager.js';

export const LOG_EVENTS_OPTIONS = 'LOG_EVENTS_OPTIONS';
export const AUDIT_BUFFER_MANAGER = 'AUDIT_BUFFER_MANAGER';

@Global()
@Module({})
export class LogEventsModule implements OnModuleDestroy {
	private static bufferManager: AuditBufferManager | null = null;

	static forRoot(config: LogEventsConfig): DynamicModule {
		return {
			module: LogEventsModule,
			providers: [
				{
					provide: LOG_EVENTS_OPTIONS,
					useValue: config,
				},
				{
					provide: AUDIT_BUFFER_MANAGER,
					useFactory: () => {
						const writer = new AuditFileWriter(config);
						LogEventsModule.bufferManager = new AuditBufferManager(writer, config);
						return LogEventsModule.bufferManager;
					},
				},
				{
					provide: LogEventsService,
					useFactory: (bufferManager: AuditBufferManager, options: LogEventsConfig) => {
						return new LogEventsService(bufferManager, options);
					},
					inject: [AUDIT_BUFFER_MANAGER, LOG_EVENTS_OPTIONS],
				},
			],
			exports: [LogEventsService, AUDIT_BUFFER_MANAGER, LOG_EVENTS_OPTIONS],
		};
	}

	static forRootAsync(options: {
		useFactory: (...args: any[]) => Promise<LogEventsConfig> | LogEventsConfig;
		inject?: any[];
	}): DynamicModule {
		return {
			module: LogEventsModule,
			providers: [
				{
					provide: LOG_EVENTS_OPTIONS,
					useFactory: options.useFactory,
					inject: options.inject || [],
				},
				{
					provide: AUDIT_BUFFER_MANAGER,
					useFactory: (config: LogEventsConfig) => {
						const writer = new AuditFileWriter(config);
						LogEventsModule.bufferManager = new AuditBufferManager(writer, config);
						return LogEventsModule.bufferManager;
					},
					inject: [LOG_EVENTS_OPTIONS],
				},
				{
					provide: LogEventsService,
					useFactory: (bufferManager: AuditBufferManager, options: LogEventsConfig) => {
						return new LogEventsService(bufferManager, options);
					},
					inject: [AUDIT_BUFFER_MANAGER, LOG_EVENTS_OPTIONS],
				},
			],
			exports: [LogEventsService, AUDIT_BUFFER_MANAGER, LOG_EVENTS_OPTIONS],
		};
	}

	async onModuleDestroy() {
		if (LogEventsModule.bufferManager) {
			await LogEventsModule.bufferManager.close();
		}
	}
}
