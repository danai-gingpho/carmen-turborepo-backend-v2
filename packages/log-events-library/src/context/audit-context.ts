import { AsyncLocalStorage } from 'async_hooks';
import type { AuditContext } from '../types/log-event.types.js';

export const auditContextStorage = new AsyncLocalStorage<AuditContext>();

export function runWithAuditContext<T>(context: AuditContext, fn: () => T): T {
	return auditContextStorage.run(context, fn);
}

export function getAuditContext(): AuditContext | undefined {
	return auditContextStorage.getStore();
}

export function setAuditContext(context: Partial<AuditContext>): void {
	const store = auditContextStorage.getStore();
	if (store) {
		Object.assign(store, context);
	}
}
