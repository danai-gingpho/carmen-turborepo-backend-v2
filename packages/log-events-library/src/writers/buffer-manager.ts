import type { LogEventEntry, LogEventsConfig } from '../types/log-event.types.js';
import { AuditFileWriter } from './file-writer.js';
import type { AuditDbWriter } from './db-writer.js';

export interface AuditWriter {
	write(entry: LogEventEntry): Promise<void>;
	writeBatch(entries: LogEventEntry[]): Promise<void>;
	close(): Promise<void>;
}

export class AuditBufferManager {
	private buffer: LogEventEntry[] = [];
	private flushTimer: ReturnType<typeof setInterval> | null = null;
	private isShuttingDown = false;
	private isFlushing = false;
	private fileWriter: AuditFileWriter | null = null;
	private dbWriter: AuditDbWriter | null = null;

	constructor(
		private writer: AuditFileWriter | null,
		private config: LogEventsConfig,
		dbWriter?: AuditDbWriter | null,
	) {
		this.fileWriter = writer;
		this.dbWriter = dbWriter || null;
		this.startFlushTimer();
		this.setupShutdownHandlers();
	}

	/**
	 * Sets the database writer for audit log persistence
	 * ตั้งค่า database writer สำหรับบันทึก audit log ลงฐานข้อมูล
	 * @param dbWriter - The database writer instance / อินสแตนซ์ของ database writer
	 */
	setDbWriter(dbWriter: AuditDbWriter): void {
		this.dbWriter = dbWriter;
	}

	/**
	 * Starts the periodic flush timer based on configured interval
	 * เริ่มตั้งเวลา flush เป็นระยะตามช่วงเวลาที่กำหนด
	 */
	private startFlushTimer(): void {
		const interval = this.config.flushIntervalMs || 5000;
		this.flushTimer = setInterval(() => {
			this.flush().catch(err => {
				console.error('[AuditBufferManager] Failed to flush:', err);
			});
		}, interval);
	}

	/**
	 * Registers process signal handlers to ensure graceful shutdown with buffer flushing
	 * ลงทะเบียน handler สำหรับสัญญาณ process เพื่อให้แน่ใจว่า shutdown อย่างสมบูรณ์พร้อม flush buffer
	 */
	private setupShutdownHandlers(): void {
		const shutdown = async () => {
			if (this.isShuttingDown) return;
			this.isShuttingDown = true;
			await this.flush();
			await this.closeWriters();
		};

		process.on('SIGTERM', shutdown);
		process.on('SIGINT', shutdown);
		process.on('beforeExit', shutdown);
	}

	/**
	 * Closes all active writers (file and database)
	 * ปิด writer ที่ใช้งานอยู่ทั้งหมด (ไฟล์และฐานข้อมูล)
	 */
	private async closeWriters(): Promise<void> {
		if (this.fileWriter) {
			await this.fileWriter.close();
		}
		if (this.dbWriter) {
			await this.dbWriter.close();
		}
	}

	/**
	 * Writes a single audit entry to all enabled writers (file and/or database)
	 * เขียน audit entry เดียวไปยัง writer ที่เปิดใช้งานทั้งหมด (ไฟล์ และ/หรือ ฐานข้อมูล)
	 * @param entry - The log event entry to write / รายการ log event ที่จะเขียน
	 */
	private async writeToWriters(entry: LogEventEntry): Promise<void> {
		const promises: Promise<void>[] = [];

		// Write to file if enabled (default behavior if no database)
		if (this.fileWriter && (this.config.saveToFile !== false || !this.dbWriter)) {
			promises.push(this.fileWriter.write(entry));
		}

		// Write to database if enabled
		if (this.dbWriter && this.config.saveToDatabase) {
			promises.push(this.dbWriter.write(entry));
		}

		await Promise.allSettled(promises);
	}

	/**
	 * Writes a batch of audit entries to all enabled writers with error reporting
	 * เขียน audit entries เป็นชุดไปยัง writer ที่เปิดใช้งานทั้งหมดพร้อมรายงานข้อผิดพลาด
	 * @param entries - Array of log event entries to write / อาร์เรย์ของรายการ log event ที่จะเขียน
	 */
	private async writeBatchToWriters(entries: LogEventEntry[]): Promise<void> {
		const promises: Promise<void>[] = [];

		// Write to file if enabled (default behavior if no database)
		if (this.fileWriter && (this.config.saveToFile !== false || !this.dbWriter)) {
			promises.push(this.fileWriter.writeBatch(entries));
		}

		// Write to database if enabled
		if (this.dbWriter && this.config.saveToDatabase) {
			promises.push(this.dbWriter.writeBatch(entries));
		}

		const results = await Promise.allSettled(promises);
		const errors = results.filter(r => r.status === 'rejected');
		if (errors.length > 0) {
			console.error('[AuditBufferManager] Some writers failed:', errors);
		}
	}

	/**
	 * Adds an audit entry to the buffer, flushing automatically when buffer size limit is reached
	 * เพิ่ม audit entry เข้าไปใน buffer โดย flush อัตโนมัติเมื่อถึงขนาด buffer ที่กำหนด
	 * @param entry - The log event entry to buffer / รายการ log event ที่จะเก็บใน buffer
	 */
	async add(entry: LogEventEntry): Promise<void> {
		if (this.isShuttingDown) {
			await this.writeToWriters(entry);
			return;
		}

		this.buffer.push(entry);

		const bufferSize = this.config.bufferSize || 100;
		if (this.buffer.length >= bufferSize) {
			await this.flush();
		}
	}

	/**
	 * Flushes all buffered entries to the configured writers, restoring entries on failure
	 * เขียนข้อมูลทั้งหมดที่อยู่ใน buffer ไปยัง writer ที่กำหนด คืนข้อมูลกลับเมื่อเกิดข้อผิดพลาด
	 */
	async flush(): Promise<void> {
		if (this.buffer.length === 0 || this.isFlushing) return;

		this.isFlushing = true;
		const entries = [...this.buffer];
		this.buffer = [];

		try {
			await this.writeBatchToWriters(entries);
		} catch (error) {
			this.buffer = [...entries, ...this.buffer];
			console.error('[AuditBufferManager] Failed to flush audit log buffer:', error);
		} finally {
			this.isFlushing = false;
		}
	}

	/**
	 * Stops the flush timer, flushes remaining entries, and closes all writers
	 * หยุดตัวตั้งเวลา flush, เขียนข้อมูลที่เหลือ, และปิด writer ทั้งหมด
	 */
	async close(): Promise<void> {
		if (this.flushTimer) {
			clearInterval(this.flushTimer);
			this.flushTimer = null;
		}
		await this.flush();
		await this.closeWriters();
	}

	/**
	 * Returns the current number of entries in the buffer
	 * คืนค่าจำนวนรายการที่อยู่ใน buffer ในปัจจุบัน
	 * @returns The number of buffered entries / จำนวนรายการที่อยู่ใน buffer
	 */
	getBufferSize(): number {
		return this.buffer.length;
	}
}
