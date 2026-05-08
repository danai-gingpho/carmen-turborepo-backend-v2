import { v4 as uuidv4 } from 'uuid';
import type { LogEventEntry, LogEventsConfig, AuditAction } from '../types/log-event.types.js';
import { getAuditContext } from '../context/audit-context.js';
import type { AuditBufferManager } from '../writers/buffer-manager.js';

const DEFAULT_SENSITIVE_FIELDS = ['password', 'secret', 'token', 'api_key', 'hash'];

/**
 * Masks sensitive fields in a data object by replacing their values with '[REDACTED]'
 * ปกปิดฟิลด์ที่เป็นข้อมูลอ่อนไหวในออบเจกต์โดยแทนที่ค่าด้วย '[REDACTED]'
 * @param data - The data object to mask / ออบเจกต์ข้อมูลที่ต้องการปกปิด
 * @param sensitiveFields - List of field names to redact / รายชื่อฟิลด์ที่ต้องการปกปิด
 * @returns A new object with sensitive fields masked, or null if input is null / ออบเจกต์ใหม่ที่ปกปิดฟิลด์อ่อนไหวแล้ว หรือ null ถ้า input เป็น null
 */
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

/**
 * Extracts the record ID from a Prisma query result object
 * ดึง record ID จากผลลัพธ์ของ Prisma query
 * @param result - The query result object / ออบเจกต์ผลลัพธ์จาก query
 * @returns The record ID as a string, or null if not found / record ID เป็น string หรือ null ถ้าไม่พบ
 */
function extractRecordId(result: unknown): string | null {
	if (!result || typeof result !== 'object') return null;
	const obj = result as Record<string, unknown>;
	return obj.id?.toString() || obj.uuid?.toString() || null;
}

/**
 * Creates a Prisma client extension that automatically logs audit events for all CRUD operations
 * สร้าง Prisma client extension ที่บันทึก audit event อัตโนมัติสำหรับทุกการดำเนินการ CRUD
 * @param tenantId - The tenant identifier for multi-tenant context / รหัสผู้เช่าสำหรับระบบ multi-tenant
 * @param bufferManager - The buffer manager for batching audit log writes / buffer manager สำหรับรวมกลุ่มการเขียน audit log
 * @param config - Log events configuration including sensitive fields and excluded models / การตั้งค่า log events รวมถึงฟิลด์อ่อนไหวและโมเดลที่ยกเว้น
 * @returns A Prisma extension object with query hooks for all models / Prisma extension object ที่มี query hooks สำหรับทุกโมเดล
 */
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
