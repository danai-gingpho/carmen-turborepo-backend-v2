import type { LogEventEntry, LogEventsConfig } from '../types/log-event.types.js';

// Map AuditAction to enum_activity_action
const ACTION_MAP: Record<string, string> = {
	access: 'view',
	create: 'create',
	update: 'update',
	delete: 'delete',
	login: 'login',
	logout: 'logout',
};

export interface AuditDbWriterOptions {
	prismaClient: any;
	excludeModels?: string[];
}

export class AuditDbWriter {
	private prismaClient: any;
	private excludeModels: Set<string>;

	constructor(private config: LogEventsConfig, private options: AuditDbWriterOptions) {
		this.prismaClient = options.prismaClient;
		this.excludeModels = new Set([
			...(config.excludeModels || []),
			...(options.excludeModels || []),
			'tb_activity', // Always exclude activity table to prevent infinite loops
		]);
	}

	/**
	 * Converts a Prisma model name to a normalized entity type string
	 * แปลงชื่อโมเดล Prisma เป็นสตริง entity type ที่ปรับรูปแบบแล้ว
	 * @param modelName - The Prisma model name (e.g., 'tb_purchase_order') / ชื่อโมเดล Prisma (เช่น 'tb_purchase_order')
	 * @returns The normalized entity type without 'tb_' prefix / entity type ที่ปรับรูปแบบแล้วโดยไม่มี prefix 'tb_'
	 */
	private mapEntityType(modelName: string): string {
		// Derive entity type from model name (remove tb_ prefix and convert to snake_case)
		return modelName
			.replace(/^tb_/, '')
			.replace(/([A-Z])/g, '_$1')
			.toLowerCase()
			.replace(/^_/, '');
	}

	/**
	 * Maps an audit action to the corresponding database activity action enum value
	 * แปลง audit action เป็นค่า enum ของ activity action ในฐานข้อมูล
	 * @param action - The audit action string / สตริง audit action
	 * @returns The mapped database action value / ค่า action ที่แปลงแล้วสำหรับฐานข้อมูล
	 */
	private mapAction(action: string): string {
		return ACTION_MAP[action] || 'other';
	}

	/**
	 * Generates a human-readable description for the audit log entry
	 * สร้างคำอธิบายที่อ่านเข้าใจง่ายสำหรับรายการ audit log
	 * @param entry - The log event entry / รายการ log event
	 * @param action - The mapped action string / สตริง action ที่แปลงแล้ว
	 * @returns A descriptive string for the activity / สตริงคำอธิบายสำหรับกิจกรรม
	 */
	private generateDescription(entry: LogEventEntry, action: string): string {
		// Handle login/logout actions with user email
		if (action === 'login' || action === 'logout') {
			const email = entry.metadata?.email;
			if (email) {
				return `User ${email} ${action === 'login' ? 'logged in' : 'logged out'}`;
			}
			return `User ${action === 'login' ? 'logged in' : 'logged out'}`;
		}

		// Default description for other actions
		return `${action} on ${entry.entity_name}${entry.record_id ? ` (${entry.record_id})` : ''}`;
	}

	/**
	 * Validates whether a string is a valid UUID v4 format
	 * ตรวจสอบว่าสตริงเป็นรูปแบบ UUID v4 ที่ถูกต้องหรือไม่
	 * @param value - The string to validate / สตริงที่จะตรวจสอบ
	 * @returns True if the value is a valid UUID / true ถ้าค่าเป็น UUID ที่ถูกต้อง
	 */
	private isValidUuid(value: string | null): boolean {
		if (!value) return false;
		const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		return uuidRegex.test(value);
	}

	/**
	 * Writes a single audit log entry to the database activity table
	 * เขียน audit log entry หนึ่งรายการลงตาราง activity ในฐานข้อมูล
	 * @param entry - The log event entry to persist / รายการ log event ที่จะบันทึก
	 */
	async write(entry: LogEventEntry): Promise<void> {
		// Skip excluded models
		if (this.excludeModels.has(entry.entity_name)) {
			return;
		}

		const entityType = this.mapEntityType(entry.entity_name);
		const action = this.mapAction(entry.action);

		try {
			await this.prismaClient.tb_activity.create({
				data: {
					action: action as any,
					entity_type: entityType,
					entity_id: this.isValidUuid(entry.record_id) ? entry.record_id : null,
					actor_id: this.isValidUuid(entry.user_id) ? entry.user_id : null,
					old_data: entry.before_data || {},
					new_data: entry.after_data || {},
					meta_data: entry.metadata || {},
					ip_address: entry.metadata?.ip_address || null,
					user_agent: entry.metadata?.user_agent || null,
					description: this.generateDescription(entry, action),
					created_by_id: this.isValidUuid(entry.user_id) ? entry.user_id : null,
				},
			});
		} catch (error) {
			console.error('[AuditDbWriter] Failed to write audit log to database:', error);
			throw error;
		}
	}

	/**
	 * Writes a batch of audit log entries to the database, falling back to individual writes on failure
	 * เขียน audit log entries เป็นชุดลงฐานข้อมูล โดยเปลี่ยนเป็นเขียนทีละรายการเมื่อเกิดข้อผิดพลาด
	 * @param entries - Array of log event entries to persist / อาร์เรย์ของรายการ log event ที่จะบันทึก
	 */
	async writeBatch(entries: LogEventEntry[]): Promise<void> {
		// Filter out excluded models
		const filteredEntries = entries.filter(entry => !this.excludeModels.has(entry.entity_name));

		if (filteredEntries.length === 0) {
			return;
		}

		const data = filteredEntries.map(entry => {
			const entityType = this.mapEntityType(entry.entity_name);
			const action = this.mapAction(entry.action);

			return {
				action: action as any,
				entity_type: entityType,
				entity_id: this.isValidUuid(entry.record_id) ? entry.record_id : null,
				actor_id: this.isValidUuid(entry.user_id) ? entry.user_id : null,
				old_data: entry.before_data || {},
				new_data: entry.after_data || {},
				meta_data: entry.metadata || {},
				ip_address: entry.metadata?.ip_address || null,
				user_agent: entry.metadata?.user_agent || null,
				description: this.generateDescription(entry, action),
				created_by_id: this.isValidUuid(entry.user_id) ? entry.user_id : null,
			};
		});

		try {
			await this.prismaClient.tb_activity.createMany({
				data,
				skipDuplicates: true,
			});
		} catch (error) {
			console.error('[AuditDbWriter] Failed to batch write audit logs to database:', error);
			// Fallback to individual writes
			for (const entry of filteredEntries) {
				try {
					await this.write(entry);
				} catch (innerError) {
					console.error('[AuditDbWriter] Individual write also failed:', innerError);
				}
			}
		}
	}

	/**
	 * Closes the database writer (no cleanup needed for database connections)
	 * ปิด database writer (ไม่ต้องล้างข้อมูลสำหรับการเชื่อมต่อฐานข้อมูล)
	 */
	async close(): Promise<void> {
		// No cleanup needed for database writer
	}
}
