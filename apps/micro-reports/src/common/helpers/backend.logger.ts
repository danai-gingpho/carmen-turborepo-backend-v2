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

type LogLevel =
  | 'error'
  | 'warn'
  | 'info'
  | 'http'
  | 'verbose'
  | 'debug'
  | 'silly';

const config = defaultLokiConfig;
export class BackendLogger extends ConsoleLogger {
  constructor(context: string) {
    super(context, {
      logLevels: ['verbose', 'debug', 'log', 'warn', 'error', 'fatal'],
    });
  }

  // level = 0
  error(
    message: any,
    trace?: any,
    context?: any,
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

  // level = 1
  warn(message: any, context?: any, iam?: IAMInfo, meta?: LogMeta): void {
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

  // level = 2
  log(message: any, context?: any, iam?: IAMInfo, meta?: LogMeta): void {
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

  // level = 3
  http(message: any, context?: any, iam?: IAMInfo, meta?: LogMeta): void {
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

  // level = 4
  verbose(message: any, context?: any, iam?: IAMInfo, meta?: LogMeta): void {
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

  // level = 5
  debug(message: any, context?: any): void {
    super.debug(message, context);
  }

  // level = 6
  silly(message: any, context?: any, iam?: IAMInfo, meta?: LogMeta): void {
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

  // Log Info Action
  logInfoAction(
    action: string,
    message?: any,
    context?: any,
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

  // Custom method for structured logging
  logWithLabels(
    message: any,
    labels: Record<string, unknown>,
    context?: any,
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

  // Method for performance logging
  logPerformance(
    operation: string,
    duration: number,
    context?: any,
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

  // Method for business event logging
  logBusinessEvent(
    event: string,
    data: Record<string, unknown>,
    context?: any,
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
