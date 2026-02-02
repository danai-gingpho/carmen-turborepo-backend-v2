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

	setDbWriter(dbWriter: AuditDbWriter): void {
		this.dbWriter = dbWriter;
	}

	private startFlushTimer(): void {
		const interval = this.config.flushIntervalMs || 5000;
		this.flushTimer = setInterval(() => {
			this.flush().catch(err => {
				console.error('[AuditBufferManager] Failed to flush:', err);
			});
		}, interval);
	}

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

	private async closeWriters(): Promise<void> {
		if (this.fileWriter) {
			await this.fileWriter.close();
		}
		if (this.dbWriter) {
			await this.dbWriter.close();
		}
	}

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

	async close(): Promise<void> {
		if (this.flushTimer) {
			clearInterval(this.flushTimer);
			this.flushTimer = null;
		}
		await this.flush();
		await this.closeWriters();
	}

	getBufferSize(): number {
		return this.buffer.length;
	}
}
