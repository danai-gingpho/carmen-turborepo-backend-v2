import { ConsoleLogger } from '@nestjs/common';
import winston from 'winston';
import LokiTransport from 'winston-loki';
import { defaultLokiConfig } from 'src/libs/config.loki';

// Define proper types
interface IAMInfo {
  tenant_id?: string;
  user_id?: string;
}

interface LogMeta {
  [key: string]: unknown;
}

const config = defaultLokiConfig;
/**
 * Custom backend logger with structured logging and Loki integration
 * ตัวบันทึกล็อกแบ็กเอนด์พร้อมการบันทึกแบบมีโครงสร้างและการเชื่อมต่อ Loki
 */
export class BackendLogger extends ConsoleLogger {
  constructor(context: string) {
    super(context, {
      logLevels: ['verbose', 'debug', 'log', 'warn', 'error', 'fatal'],
    });
  }

  /**
   * Log error message (level 0)
   * บันทึกข้อความข้อผิดพลาด (ระดับ 0)
   */
  error(
    message: unknown,
    trace?: unknown,
    context?: unknown,
    iam?: IAMInfo,
    meta?: LogMeta,
  ): void {
    // ตรวจสอบว่า logMeta มีค่าไหม
    let logMeta: LogMeta = {};

    // ตรวจสอบว่า context มีค่าไหม
    if (context) {
      logMeta = { context, ...logMeta };
    }

    // ตรวจสอบว่า iam มีค่าไหม
    if (iam) {
      logMeta = { iam, ...logMeta };
    }

    // ตรวจสอบว่า meta มีค่าไหม
    if (meta) {
      logMeta = { meta, ...logMeta };
    }

    // ถ้า logMeta มีค่าให้เรียกใช้งานด้วย logMeta ถ้าไม่มีค่าให้เรียกใช้งานด้วย message เท่านั้น
    if (logMeta) {
      super.error(message, trace, logMeta);
    } else {
      super.error(message, trace);
    }
  }

  /**
   * Log warning message (level 1)
   * บันทึกข้อความเตือน (ระดับ 1)
   */
  warn(message: unknown, context?: unknown, iam?: IAMInfo, meta?: LogMeta): void {
    // ตรวจสอบว่า logMeta มีค่าไหม
    let logMeta = {};

    // ตรวจสอบว่า context มีค่าไหม
    if (context) {
      logMeta = { context, ...logMeta };
    }

    // ตรวจสอบว่า iam มีค่าไหม
    if (iam) {
      logMeta = { iam, ...logMeta };
    }

    // ตรวจสอบว่า meta มีค่าไหม
    if (meta) {
      logMeta = { meta, ...logMeta };
    }

    // ถ้า logMeta มีค่าให้เรียกใช้งานด้วย logMeta ถ้าไม่มีค่าให้เรียกใช้งานด้วย message เท่านั้น
    if (logMeta) {
      super.warn(message, logMeta);
    } else {
      super.warn(message);
    }
  }

  /**
   * Log info message (level 2)
   * บันทึกข้อความทั่วไป (ระดับ 2)
   */
  log(message: unknown, context?: unknown, iam?: IAMInfo, meta?: LogMeta): void {
    // ตรวจสอบว่า logMeta มีค่าไหม
    let logMeta: LogMeta = {};

    // ตรวจสอบว่า context มีค่าไหม
    if (context) {
      logMeta = { context, ...logMeta };
    }

    // ตรวจสอบว่า iam มีค่าไหม
    if (iam) {
      logMeta = { iam, ...logMeta };
    }

    // ตรวจสอบว่า meta มีค่าไหม
    if (meta) {
      logMeta = { meta, ...logMeta };
    }

    // ถ้า logMeta มีค่าให้เรียกใช้งานด้วย logMeta ถ้าไม่มีค่าให้เรียกใช้งานด้วย message เท่านั้น
    if (logMeta) {
      super.log(message, logMeta);
    } else {
      super.log(message);
    }
  }

  /**
   * Log HTTP message (level 3)
   * บันทึกข้อความ HTTP (ระดับ 3)
   */
  http(message: unknown, context?: unknown, iam?: IAMInfo, meta?: LogMeta): void {
    // ตรวจสอบว่า logMeta มีค่าไหม
    let logMeta: LogMeta = {};

    // ตรวจสอบว่า context มีค่าไหม
    if (context) {
      logMeta = { context, ...logMeta };
    }

    // ตรวจสอบว่า iam มีค่าไหม
    if (iam) {
      logMeta = { iam, ...logMeta };
    }

    // ตรวจสอบว่า meta มีค่าไหม
    if (meta) {
      logMeta = { meta, ...logMeta };
    }

    // ถ้า logMeta มีค่าให้เรียกใช้งานด้วย logMeta ถ้าไม่มีค่าให้เรียกใช้งานด้วย message เท่านั้น
    if (logMeta) {
      super.log(message, logMeta);
    } else {
      super.log(message);
    }
  }

  /**
   * Log verbose message (level 4)
   * บันทึกข้อความแบบละเอียด (ระดับ 4)
   */
  verbose(message: unknown, context?: unknown, iam?: IAMInfo, meta?: LogMeta): void {
    // ตรวจสอบว่า logMeta มีค่าไหม
    let logMeta: LogMeta = {};

    // ตรวจสอบว่า context มีค่าไหม
    if (context) {
      logMeta = { context, ...logMeta };
    }

    // ตรวจสอบว่า iam มีค่าไหม
    if (iam) {
      logMeta = { iam, ...logMeta };
    }

    // ตรวจสอบว่า meta มีค่าไหม
    if (meta) {
      logMeta = { meta, ...logMeta };
    }

    // ถ้า logMeta มีค่าให้เรียกใช้งานด้วย logMeta ถ้าไม่มีค่าให้เรียกใช้งานด้วย message เท่านั้น
    if (logMeta) {
      super.verbose(message, logMeta);
    } else {
      super.verbose(message);
    }
  }

  /**
   * Log debug message (level 5)
   * บันทึกข้อความดีบัก (ระดับ 5)
   */
  debug(message: unknown, context?: unknown): void {
    super.debug(message, context);
  }

  /**
   * Log silly/trace message (level 6)
   * บันทึกข้อความระดับต่ำสุด (ระดับ 6)
   */
  silly(message: unknown, context?: unknown, iam?: IAMInfo, meta?: LogMeta): void {
    // ตรวจสอบว่า logMeta มีค่าไหม
    let logMeta: LogMeta = {};

    // ตรวจสอบว่า context มีค่าไหม
    if (context) {
      logMeta = { context, ...logMeta };
    }

    // ตรวจสอบว่า iam มีค่าไหม
    if (iam) {
      logMeta = { iam, ...logMeta };
    }

    // ตรวจสอบว่า meta มีค่าไหม
    if (meta) {
      logMeta = { meta, ...logMeta };
    }

    // ถ้า logMeta มีค่าให้เรียกใช้งานด้วย logMeta ถ้าไม่มีค่าให้เรียกใช้งานด้วย message เท่านั้น
    if (logMeta) {
      super.debug(message, logMeta);
    } else {
      super.debug(message);
    }
  }

  /**
   * Log an info-level action with structured metadata
   * บันทึกการกระทำระดับ info พร้อมข้อมูลเมตาแบบมีโครงสร้าง
   */
  logInfoAction(
    action: string,
    message?: unknown,
    context?: unknown,
    iam?: IAMInfo,
    meta?: LogMeta,
  ): void {
    // ตรวจสอบว่า logMeta มีค่าไหม
    let logMeta: LogMeta = {};

    // ตรวจสอบว่า context มีค่าไหม
    if (context) {
      logMeta = { context, ...logMeta };
    }

    // ตรวจสอบว่า iam มีค่าไหม
    if (iam) {
      logMeta = { iam, ...logMeta };
    }

    // ตรวจสอบว่า meta มีค่าไหม
    if (meta) {
      logMeta = { meta, ...logMeta };
    }

    // ถ้า logMeta มีค่าให้เรียกใช้งานด้วย logMeta ถ้าไม่มีค่าให้เรียกใช้งานด้วย message เท่านั้น
    if (logMeta) {
      super.log({ action, message }, logMeta);
    } else {
      super.log({ action, message });
    }
  }

  /**
   * Log with custom labels for structured logging
   * บันทึกล็อกพร้อม label กำหนดเองสำหรับการบันทึกแบบมีโครงสร้าง
   */
  logWithLabels(
    message: unknown,
    labels: Record<string, unknown>,
    context?: unknown,
    iam?: IAMInfo,
  ): void {
    // ตรวจสอบว่า logMeta มีค่าไหม
    let logMeta: LogMeta = {};

    // ตรวจสอบว่า labels มีค่าไหม
    if (labels) {
      logMeta = { labels, ...logMeta };
    }

    // ตรวจสอบว่า context มีค่าไหม
    if (context) {
      logMeta = { context, ...logMeta };
    }

    // ตรวจสอบว่า iam มีค่าไหม
    if (iam) {
      logMeta = { iam, ...logMeta };
    }

    // ถ้า logMeta มีค่าให้เรียกใช้งานด้วย logMeta ถ้าไม่มีค่าให้เรียกใช้งานด้วย message เท่านั้น
    if (logMeta) {
      super.log(message, logMeta);
    } else {
      super.log(message);
    }
  }

  /**
   * Log performance metrics for an operation
   * บันทึกข้อมูลประสิทธิภาพของการดำเนินการ
   */
  logPerformance(
    operation: string,
    duration: number,
    context?: unknown,
    iam?: IAMInfo,
    meta?: LogMeta,
  ): void {
    // ตรวจสอบว่า logMeta มีค่าไหม
    let logMeta: LogMeta = {};

    // ตรวจสอบว่า context มีค่าไหม
    if (context) {
      logMeta = { context, ...logMeta };
    }

    // ตรวจสอบว่า iam มีค่าไหม
    if (iam) {
      logMeta = { iam, ...logMeta };
    }

    // ตรวจสอบว่า meta มีค่าไหม
    if (meta) {
      logMeta = { meta, ...logMeta };
    }

    // ถ้า logMeta มีค่าให้เรียกใช้งานด้วย logMeta ถ้าไม่มีค่าให้เรียกใช้งานด้วย message เท่านั้น
    if (logMeta) {
      super.log(`Performance: ${operation}`, duration, logMeta);
    } else {
      super.log(`Performance: ${operation}`, duration);
    }
  }

  /**
   * Log a business event with associated data
   * บันทึกเหตุการณ์ทางธุรกิจพร้อมข้อมูลที่เกี่ยวข้อง
   */
  logBusinessEvent(
    event: string,
    data: Record<string, unknown>,
    context?: unknown,
    iam?: IAMInfo,
  ): void {
    // ตรวจสอบว่า logMeta มีค่าไหม
    let logMeta: LogMeta = {};

    // ตรวจสอบว่า data มีค่าไหม
    if (data) {
      logMeta = { data, ...logMeta };
    }

    // ตรวจสอบว่า context มีค่าไหม
    if (context) {
      logMeta = { context, ...logMeta };
    }

    // ตรวจสอบว่า iam มีค่าไหม
    if (iam) {
      logMeta = { iam, ...logMeta };
    }

    // ถ้า logMeta มีค่าให้เรียกใช้งานด้วย logMeta ถ้าไม่มีค่าให้เรียกใช้งานด้วย message เท่านั้น
    if (logMeta) {
      super.log(`Business Event: ${event}`, logMeta);
    } else {
      super.log(`Business Event: ${event}`);
    }
  }
}

export const winstonLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    // ✅ Console logger
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.printf(
          ({ level, message, timestamp }) =>
            `[${timestamp}] ${level}: ${message}`,
        ),
      ),
    }),

    // ✅ Loki transport
    new LokiTransport({
      host: `${config.protocol}://${config.host}:${config.port}`,
      json: config.json,
      format: winston.format.json(),
      replaceTimestamp: config.replaceTimestamp,
      onConnectionError: (error: Error) => {
        const console_logger = new ConsoleLogger();
        console_logger.log({ lokiconfig: config });
        console_logger.error('Loki connection error:', error);
      },
      labels: config.labels,
      ...(config.username &&
        config.password && {
          auth: {
            username: config.username,
            password: config.password,
          },
        }),
    }),
  ],
});
