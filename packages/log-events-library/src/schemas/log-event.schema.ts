import { z } from 'zod';

export const AuditActionSchema = z.enum(['access', 'create', 'update', 'delete']);

export const LogEventEntrySchema = z.object({
	id: z.string().uuid(),
	timestamp: z.string().datetime(),
	tenant_id: z.string().min(1),
	user_id: z.string().min(1),
	action: AuditActionSchema,
	entity_name: z.string().min(1),
	record_id: z.string().nullable(),
	before_data: z.record(z.unknown()).nullable(),
	after_data: z.record(z.unknown()).nullable(),
	metadata: z.record(z.unknown()).optional(),
});

export const LogEventsConfigSchema = z.object({
	logDirectory: z.string().min(1),
	filePrefix: z.string().default('audit'),
	rotationStrategy: z.enum(['daily', 'size']).default('daily'),
	maxFileSizeMB: z.number().positive().optional().default(100),
	bufferSize: z.number().positive().optional().default(100),
	flushIntervalMs: z.number().positive().optional().default(5000),
	enableCompression: z.boolean().optional().default(false),
	retentionDays: z.number().positive().optional(),
	excludeModels: z.array(z.string()).optional().default([]),
	sensitiveFields: z
		.array(z.string())
		.optional()
		.default(['password', 'secret', 'token', 'api_key', 'hash']),
});

export const AuditContextSchema = z.object({
	tenant_id: z.string().min(1),
	user_id: z.string().min(1),
	request_id: z.string().optional(),
	ip_address: z.string().optional(),
	user_agent: z.string().optional(),
});

export type LogEventEntryModel = z.infer<typeof LogEventEntrySchema>;
export type LogEventsConfigModel = z.infer<typeof LogEventsConfigSchema>;
export type AuditContextModel = z.infer<typeof AuditContextSchema>;
