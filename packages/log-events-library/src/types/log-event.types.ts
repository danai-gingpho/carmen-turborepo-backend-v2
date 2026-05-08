export type AuditAction = 'access' | 'create' | 'update' | 'delete' | 'login' | 'logout';

export interface LogEventEntry {
	id: string;
	timestamp: string;
	tenant_id: string;
	user_id: string;
	action: AuditAction;
	entity_name: string;
	record_id: string | null;
	before_data: Record<string, unknown> | null;
	after_data: Record<string, unknown> | null;
	metadata?: {
		request_id?: string;
		ip_address?: string;
		user_agent?: string;
		email?: string;
		[key: string]: unknown;
	};
}

export interface LogEventsConfig {
	logDirectory: string;
	filePrefix?: string;
	rotationStrategy: 'daily' | 'size';
	maxFileSizeMB?: number;
	bufferSize?: number;
	flushIntervalMs?: number;
	enableCompression?: boolean;
	retentionDays?: number;
	excludeModels?: string[];
	sensitiveFields?: string[];
	/** Enable saving logs to tb_activity database table */
	saveToDatabase?: boolean;
	/** Enable saving logs to file (default: true if saveToDatabase is false) */
	saveToFile?: boolean;
}

export interface AuditContext {
	tenant_id: string;
	user_id: string;
	request_id?: string;
	ip_address?: string;
	user_agent?: string;
}
