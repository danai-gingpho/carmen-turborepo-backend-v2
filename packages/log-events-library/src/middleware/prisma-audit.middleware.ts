import { v4 as uuidv4 } from 'uuid';
import type { LogEventEntry, LogEventsConfig, AuditAction } from '../types/log-event.types.js';
import { getAuditContext } from '../context/audit-context.js';
import type { AuditBufferManager } from '../writers/buffer-manager.js';

const DEFAULT_SENSITIVE_FIELDS = ['password', 'secret', 'token', 'api_key', 'hash'];

function maskSensitiveData(
	data: Record<string, unknown> | null,
	sensitiveFields: string[],
): Record<string, unknown> | null {
	if (!data) return null;

	const masked = { ...data };
	for (const field of sensitiveFields) {
		if (field in masked) {
			masked[field] = '[REDACTED]';
		}
	}
	return masked;
}

function extractRecordId(result: unknown): string | null {
	if (!result || typeof result !== 'object') return null;
	const obj = result as Record<string, unknown>;
	return obj.id?.toString() || obj.uuid?.toString() || null;
}

export function createAuditPrismaExtension(
	tenantId: string,
	bufferManager: AuditBufferManager,
	config: LogEventsConfig,
) {
	const sensitiveFields = [...DEFAULT_SENSITIVE_FIELDS, ...(config.sensitiveFields || [])];
	const excludeModels = new Set(config.excludeModels || []);

	const logEvent = async (
		action: AuditAction,
		model: string,
		recordId: string | null,
		beforeData: Record<string, unknown> | null,
		afterData: Record<string, unknown> | null,
	) => {
		if (excludeModels.has(model)) return;

		const context = getAuditContext();
		console.log(`[AuditLog] action=${action} model=${model} context=${JSON.stringify(context)}`);

		const entry: LogEventEntry = {
			id: uuidv4(),
			timestamp: new Date().toISOString(),
			tenant_id: context?.tenant_id || tenantId,
			user_id: context?.user_id || 'system',
			action,
			entity_name: model,
			record_id: recordId,
			before_data: maskSensitiveData(beforeData, sensitiveFields),
			after_data: maskSensitiveData(afterData, sensitiveFields),
			metadata: context
				? {
						request_id: context.request_id,
						ip_address: context.ip_address,
						user_agent: context.user_agent,
					}
				: undefined,
		};

		await bufferManager.add(entry);
	};

	return {
		query: {
			$allModels: {
				async create({ model, args, query }: any) {
					const result = await query(args);
					await logEvent('create', model, extractRecordId(result), null, result as Record<string, unknown>);
					return result;
				},

				async createMany({ model, args, query }: any) {
					const result = await query(args);
					await logEvent('create', model, null, null, {
						count: result.count,
						data: args.data,
					});
					return result;
				},

				async findUnique({ model, args, query }: any) {
					const result = await query(args);
					if (result) {
						await logEvent('access', model, extractRecordId(result), null, null);
					}
					return result;
				},

				async findFirst({ model, args, query }: any) {
					const result = await query(args);
					if (result) {
						await logEvent('access', model, extractRecordId(result), null, null);
					}
					return result;
				},

				async findMany({ model, args, query }: any) {
					const result = await query(args);
					await logEvent('access', model, null, null, { count: result.length });
					return result;
				},

				async update({ model, args, query }: any) {
					const result = await query(args);
					await logEvent(
						'update',
						model,
						extractRecordId(result),
						{ where: args.where },
						result as Record<string, unknown>,
					);
					return result;
				},

				async updateMany({ model, args, query }: any) {
					const result = await query(args);
					await logEvent('update', model, null, { where: args.where }, {
						count: result.count,
						data: args.data,
					});
					return result;
				},

				async upsert({ model, args, query }: any) {
					const result = await query(args);
					await logEvent('update', model, extractRecordId(result), null, result as Record<string, unknown>);
					return result;
				},

				async delete({ model, args, query }: any) {
					const result = await query(args);
					await logEvent(
						'delete',
						model,
						extractRecordId(result),
						result as Record<string, unknown>,
						null,
					);
					return result;
				},

				async deleteMany({ model, args, query }: any) {
					const result = await query(args);
					await logEvent('delete', model, null, { where: args.where }, {
						count: result.count,
					});
					return result;
				},
			},
		},
	};
}
