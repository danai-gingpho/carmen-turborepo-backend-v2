import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import type { LogEventEntry, LogEventsConfig, AuditAction, AuditContext } from '../types/log-event.types.js';
import type { AuditBufferManager } from '../writers/buffer-manager.js';
import { runWithAuditContext } from '../context/audit-context.js';

@Injectable()
export class LogEventsService {
	private readonly logger = new Logger(LogEventsService.name);

	constructor(
		private readonly bufferManager: AuditBufferManager,
		private readonly config: LogEventsConfig,
	) {}

	runWithContext<T>(context: AuditContext, fn: () => T): T {
		return runWithAuditContext(context, fn);
	}

	async logEvent(
		action: AuditAction,
		entityName: string,
		recordId: string | null,
		context: AuditContext,
		beforeData?: Record<string, unknown> | null,
		afterData?: Record<string, unknown> | null,
		metadata?: Record<string, unknown>,
	): Promise<void> {
		const entry: LogEventEntry = {
			id: uuidv4(),
			timestamp: new Date().toISOString(),
			tenant_id: context.tenant_id,
			user_id: context.user_id,
			action,
			entity_name: entityName,
			record_id: recordId,
			before_data: beforeData || null,
			after_data: afterData || null,
			metadata: {
				...metadata,
				request_id: context.request_id,
				ip_address: context.ip_address,
				user_agent: context.user_agent,
			},
		};

		await this.bufferManager.add(entry);
	}

	async flush(): Promise<void> {
		await this.bufferManager.flush();
	}

	createContext(
		tenantId: string,
		userId: string,
		requestId?: string,
		ipAddress?: string,
		userAgent?: string,
	): AuditContext {
		return {
			tenant_id: tenantId,
			user_id: userId,
			request_id: requestId || uuidv4(),
			ip_address: ipAddress,
			user_agent: userAgent,
		};
	}

	getBufferSize(): number {
		return this.bufferManager.getBufferSize();
	}
}
