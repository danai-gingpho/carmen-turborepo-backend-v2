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

	private ensureLogDirectory(): void {
		if (!fs.existsSync(this.config.logDirectory)) {
			fs.mkdirSync(this.config.logDirectory, { recursive: true });
		}
	}

	private getLogFilePath(): string {
		const prefix = this.config.filePrefix || 'audit';

		if (this.config.rotationStrategy === 'daily') {
			const date = new Date().toISOString().split('T')[0];
			return path.join(this.config.logDirectory, `${prefix}-${date}.jsonl`);
		} else {
			return this.getSizeBasedFilePath(prefix);
		}
	}

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

	private closeCurrentStream(): void {
		if (this.writeStream) {
			this.writeStream.end();
			this.writeStream = null;
		}
	}

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

	async writeBatch(entries: LogEventEntry[]): Promise<void> {
		for (const entry of entries) {
			await this.write(entry);
		}
	}

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

	async close(): Promise<void> {
		this.closeCurrentStream();
	}
}
