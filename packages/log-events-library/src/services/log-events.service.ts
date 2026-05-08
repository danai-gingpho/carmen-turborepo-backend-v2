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

	/**
	 * Executes a function within a specific audit context for tracking purposes
	 * รันฟังก์ชันภายใต้ audit context ที่กำหนดเพื่อการติดตาม
	 * @param context - The audit context to bind / audit context ที่จะผูก
	 * @param fn - The function to execute / ฟังก์ชันที่จะรัน
	 * @returns The return value of the executed function / ค่าที่ได้จากการรันฟังก์ชัน
	 */
	runWithContext<T>(context: AuditContext, fn: () => T): T {
		return runWithAuditContext(context, fn);
	}

	/**
	 * Records an audit log event with before/after data snapshots and metadata
	 * บันทึก audit log event พร้อมข้อมูลก่อน/หลังการเปลี่ยนแปลงและ metadata
	 * @param action - The type of action performed (create, update, delete, etc.) / ประเภทการดำเนินการ (create, update, delete ฯลฯ)
	 * @param entityName - The name of the entity being acted upon / ชื่อ entity ที่ถูกดำเนินการ
	 * @param recordId - The ID of the specific record, or null / ID ของระเบียนที่เกี่ยวข้อง หรือ null
	 * @param context - The audit context with user and tenant info / audit context ที่มีข้อมูลผู้ใช้และ tenant
	 * @param beforeData - Data snapshot before the action / ข้อมูลก่อนการดำเนินการ
	 * @param afterData - Data snapshot after the action / ข้อมูลหลังการดำเนินการ
	 * @param metadata - Additional metadata to include / metadata เพิ่มเติมที่ต้องการรวม
	 */
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

	/**
	 * Forces an immediate flush of all buffered audit log entries
	 * บังคับ flush ข้อมูล audit log ทั้งหมดที่อยู่ใน buffer ทันที
	 */
	async flush(): Promise<void> {
		await this.bufferManager.flush();
	}

	/**
	 * Creates a new audit context object with the provided user and request information
	 * สร้างออบเจกต์ audit context ใหม่จากข้อมูลผู้ใช้และ request ที่ให้มา
	 * @param tenantId - The tenant identifier / รหัสผู้เช่า
	 * @param userId - The user identifier / รหัสผู้ใช้
	 * @param requestId - Optional request ID (auto-generated if not provided) / request ID (สร้างอัตโนมัติถ้าไม่ระบุ)
	 * @param ipAddress - Optional client IP address / IP address ของ client (ถ้ามี)
	 * @param userAgent - Optional client user agent string / user agent string ของ client (ถ้ามี)
	 * @returns A new AuditContext object / ออบเจกต์ AuditContext ใหม่
	 */
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

	/**
	 * Returns the current number of entries waiting in the audit log buffer
	 * คืนค่าจำนวนรายการที่รออยู่ใน audit log buffer ในปัจจุบัน
	 * @returns The number of buffered entries / จำนวนรายการที่อยู่ใน buffer
	 */
	getBufferSize(): number {
		return this.bufferManager.getBufferSize();
	}
}
