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
    message: unknown,
    trace?: unknown,
    context?: unknown,
    iam?: IAMInfo,
    meta?: LogMeta,
  ): void {
    let logMeta: LogMeta = {};

    if (context) {
      logMeta = { context, ...logMeta };
    }

    if (iam) {
      logMeta = { iam, ...logMeta };
    }

    if (meta) {
      logMeta = { meta, ...logMeta };
    }

    if (logMeta) {
      super.error(message, trace, logMeta);
    } else {
      super.error(message, trace);
    }
  }

  // level = 1
  warn(message: unknown, context?: unknown, iam?: IAMInfo, meta?: LogMeta): void {
    let logMeta = {};

    if (context) {
      logMeta = { context, ...logMeta };
    }

    if (iam) {
      logMeta = { iam, ...logMeta };
    }

    if (meta) {
      logMeta = { meta, ...logMeta };
    }

    if (logMeta) {
      super.warn(message, logMeta);
    } else {
      super.warn(message);
    }
  }

  // level = 2
  log(message: unknown, context?: unknown, iam?: IAMInfo, meta?: LogMeta): void {
    let logMeta: LogMeta = {};

    if (context) {
      logMeta = { context, ...logMeta };
    }

    if (iam) {
      logMeta = { iam, ...logMeta };
    }

    if (meta) {
      logMeta = { meta, ...logMeta };
    }

    if (logMeta) {
      super.log(message, logMeta);
    } else {
      super.log(message);
    }
  }

  // level = 3
  http(message: unknown, context?: unknown, iam?: IAMInfo, meta?: LogMeta): void {
    let logMeta: LogMeta = {};

    if (context) {
      logMeta = { context, ...logMeta };
    }

    if (iam) {
      logMeta = { iam, ...logMeta };
    }

    if (meta) {
      logMeta = { meta, ...logMeta };
    }

    if (logMeta) {
      super.log(message, logMeta);
    } else {
      super.log(message);
    }
  }

  // level = 4
  verbose(message: unknown, context?: unknown, iam?: IAMInfo, meta?: LogMeta): void {
    let logMeta: LogMeta = {};

    if (context) {
      logMeta = { context, ...logMeta };
    }

    if (iam) {
      logMeta = { iam, ...logMeta };
    }

    if (meta) {
      logMeta = { meta, ...logMeta };
    }

    if (logMeta) {
      super.verbose(message, logMeta);
    } else {
      super.verbose(message);
    }
  }

  // level = 5
  debug(message: unknown, context?: unknown): void {
    super.debug(message, context);
  }

  // level = 6
  silly(message: unknown, context?: unknown, iam?: IAMInfo, meta?: LogMeta): void {
    let logMeta: LogMeta = {};

    if (context) {
      logMeta = { context, ...logMeta };
    }

    if (iam) {
      logMeta = { iam, ...logMeta };
    }

    if (meta) {
      logMeta = { meta, ...logMeta };
    }

    if (logMeta) {
      super.debug(message, logMeta);
    } else {
      super.debug(message);
    }
  }

  // Log Info Action
  logInfoAction(
    action: string,
    message?: unknown,
    context?: unknown,
    iam?: IAMInfo,
    meta?: LogMeta,
  ): void {
    let logMeta: LogMeta = {};

    if (context) {
      logMeta = { context, ...logMeta };
    }

    if (iam) {
      logMeta = { iam, ...logMeta };
    }

    if (meta) {
      logMeta = { meta, ...logMeta };
    }

    if (logMeta) {
      super.log({ action, message }, logMeta);
    } else {
      super.log({ action, message });
    }
  }

  // Custom method for structured logging
  logWithLabels(
    message: unknown,
    labels: Record<string, unknown>,
    context?: unknown,
    iam?: IAMInfo,
  ): void {
    let logMeta: LogMeta = {};

    if (labels) {
      logMeta = { labels, ...logMeta };
    }

    if (context) {
      logMeta = { context, ...logMeta };
    }

    if (iam) {
      logMeta = { iam, ...logMeta };
    }

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
    context?: unknown,
    iam?: IAMInfo,
    meta?: LogMeta,
  ): void {
    let logMeta: LogMeta = {};

    if (context) {
      logMeta = { context, ...logMeta };
    }

    if (iam) {
      logMeta = { iam, ...logMeta };
    }

    if (meta) {
      logMeta = { meta, ...logMeta };
    }

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
    context?: unknown,
    iam?: IAMInfo,
  ): void {
    let logMeta: LogMeta = {};

    if (data) {
      logMeta = { data, ...logMeta };
    }

    if (context) {
      logMeta = { context, ...logMeta };
    }

    if (iam) {
      logMeta = { iam, ...logMeta };
    }

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
