import * as fs from 'fs';
import * as path from 'path';
import type { LogEventEntry, LogEventsConfig } from '../types/log-event.types.js';

export class AuditFileWriter {
	private currentFilePath: string | null = null;
	private currentFileSize: number = 0;
	private writeStream: fs.WriteStream | null = null;

	constructor(private config: LogEventsConfig) {
		this.ensureLogDirectory();
	}

	/**
	 * Ensures the configured log directory exists, creating it recursively if needed
	 * ตรวจสอบว่าไดเรกทอรีสำหรับเก็บ log มีอยู่ และสร้างขึ้นแบบ recursive ถ้ายังไม่มี
	 */
	private ensureLogDirectory(): void {
		if (!fs.existsSync(this.config.logDirectory)) {
			fs.mkdirSync(this.config.logDirectory, { recursive: true });
		}
	}

	/**
	 * Determines the current log file path based on the rotation strategy (daily or size-based)
	 * กำหนดพาธไฟล์ log ปัจจุบันตามกลยุทธ์การหมุนเวียน (รายวัน หรือ ตามขนาด)
	 * @returns The file path for the current log file / พาธไฟล์สำหรับไฟล์ log ปัจจุบัน
	 */
	private getLogFilePath(): string {
		const prefix = this.config.filePrefix || 'audit';

		if (this.config.rotationStrategy === 'daily') {
			const date = new Date().toISOString().split('T')[0];
			return path.join(this.config.logDirectory, `${prefix}-${date}.jsonl`);
		} else {
			return this.getSizeBasedFilePath(prefix);
		}
	}

	/**
	 * Finds or creates a log file path using size-based rotation with sequential numbering
	 * ค้นหาหรือสร้างพาธไฟล์ log โดยใช้การหมุนเวียนตามขนาดพร้อมลำดับเลข
	 * @param prefix - The file name prefix / คำนำหน้าชื่อไฟล์
	 * @returns The file path for the current size-based log file / พาธไฟล์สำหรับไฟล์ log ตามขนาดปัจจุบัน
	 */
	private getSizeBasedFilePath(prefix: string): string {
		const date = new Date().toISOString().split('T')[0];
		let counter = 1;
		let filePath: string;
		const maxSize = (this.config.maxFileSizeMB || 100) * 1024 * 1024;

		do {
			filePath = path.join(
				this.config.logDirectory,
				`${prefix}-${date}-${counter.toString().padStart(4, '0')}.jsonl`,
			);
			counter++;
		} while (fs.existsSync(filePath) && fs.statSync(filePath).size >= maxSize);

		return filePath;
	}

	/**
	 * Checks if log file rotation is needed and switches to a new file if necessary
	 * ตรวจสอบว่าจำเป็นต้องหมุนเวียนไฟล์ log หรือไม่ และเปลี่ยนไปใช้ไฟล์ใหม่ถ้าจำเป็น
	 */
	private rotateIfNeeded(): void {
		const targetPath = this.getLogFilePath();

		if (this.currentFilePath !== targetPath) {
			this.closeCurrentStream();
			this.currentFilePath = targetPath;
			this.writeStream = fs.createWriteStream(targetPath, { flags: 'a' });
			this.currentFileSize = fs.existsSync(targetPath) ? fs.statSync(targetPath).size : 0;
		}

		const maxSize = (this.config.maxFileSizeMB || 100) * 1024 * 1024;
		if (this.config.rotationStrategy === 'size' && this.currentFileSize >= maxSize) {
			this.closeCurrentStream();
			this.currentFilePath = this.getLogFilePath();
			this.writeStream = fs.createWriteStream(this.currentFilePath, { flags: 'a' });
			this.currentFileSize = 0;
		}
	}

	/**
	 * Closes the current write stream if one is open
	 * ปิด write stream ปัจจุบันถ้ามีการเปิดอยู่
	 */
	private closeCurrentStream(): void {
		if (this.writeStream) {
			this.writeStream.end();
			this.writeStream = null;
		}
	}

	/**
	 * Writes a single log event entry as a JSON line to the current log file
	 * เขียน log event entry หนึ่งรายการเป็น JSON line ลงไฟล์ log ปัจจุบัน
	 * @param entry - The log event entry to write / รายการ log event ที่จะเขียน
	 */
	async write(entry: LogEventEntry): Promise<void> {
		this.rotateIfNeeded();

		const line = JSON.stringify(entry) + '\n';
		const buffer = Buffer.from(line, 'utf-8');

		return new Promise((resolve, reject) => {
			if (!this.writeStream) {
				reject(new Error('Write stream not initialized'));
				return;
			}

			this.writeStream.write(buffer, err => {
				if (err) reject(err);
				else {
					this.currentFileSize += buffer.length;
					resolve();
				}
			});
		});
	}

	/**
	 * Writes multiple log event entries sequentially to the log file
	 * เขียน log event entries หลายรายการลงไฟล์ log ตามลำดับ
	 * @param entries - Array of log event entries to write / อาร์เรย์ของรายการ log event ที่จะเขียน
	 */
	async writeBatch(entries: LogEventEntry[]): Promise<void> {
		for (const entry of entries) {
			await this.write(entry);
		}
	}

	/**
	 * Waits for the write stream to drain all pending writes
	 * รอให้ write stream เขียนข้อมูลที่ค้างอยู่ทั้งหมดเสร็จสิ้น
	 */
	async flush(): Promise<void> {
		return new Promise(resolve => {
			if (this.writeStream) {
				this.writeStream.once('drain', resolve);
				if (this.writeStream.writableNeedDrain === false) {
					resolve();
				}
			} else {
				resolve();
			}
		});
	}

	/**
	 * Closes the file writer by ending the current write stream
	 * ปิด file writer โดยจบ write stream ปัจจุบัน
	 */
	async close(): Promise<void> {
		this.closeCurrentStream();
	}
}
