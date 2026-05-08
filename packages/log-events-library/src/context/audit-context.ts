import { AsyncLocalStorage } from 'async_hooks';
import type { AuditContext } from '../types/log-event.types.js';

export const auditContextStorage = new AsyncLocalStorage<AuditContext>();

/**
 * Executes a function within a specific audit context using AsyncLocalStorage
 * รันฟังก์ชันภายใต้ audit context ที่กำหนดโดยใช้ AsyncLocalStorage
 * @param context - The audit context to bind to the execution / audit context ที่จะผูกกับการทำงาน
 * @param fn - The function to execute within the context / ฟังก์ชันที่จะรันภายใต้ context
 * @returns The return value of the executed function / ค่าที่ได้จากการรันฟังก์ชัน
 */
export function runWithAuditContext<T>(context: AuditContext, fn: () => T): T {
	return auditContextStorage.run(context, fn);
}

/**
 * Retrieves the current audit context from AsyncLocalStorage
 * ดึง audit context ปัจจุบันจาก AsyncLocalStorage
 * @returns The current audit context, or undefined if not set / audit context ปัจจุบัน หรือ undefined ถ้ายังไม่ได้ตั้งค่า
 */
export function getAuditContext(): AuditContext | undefined {
	return auditContextStorage.getStore();
}

/**
 * Merges partial audit context data into the current active context
 * รวมข้อมูล audit context บางส่วนเข้ากับ context ที่ใช้งานอยู่ในปัจจุบัน
 * @param context - Partial audit context to merge / ข้อมูล audit context บางส่วนที่จะรวมเข้า
 */
export function setAuditContext(context: Partial<AuditContext>): void {
	const store = auditContextStorage.getStore();
	if (store) {
		Object.assign(store, context);
	}
}
