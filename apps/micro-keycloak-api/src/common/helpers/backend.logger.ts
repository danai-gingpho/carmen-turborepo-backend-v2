import { ConsoleLogger } from '@nestjs/common';
import winston from 'winston';
import LokiTransport from 'winston-loki';
import { defaultLokiConfig } from 'src/libs/config.loki';

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

  error(
    message: any,
    trace?: any,
    context?: any,
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

  warn(message: any, context?: any, iam?: IAMInfo, meta?: LogMeta): void {
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

  log(message: any, context?: any, iam?: IAMInfo, meta?: LogMeta): void {
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

  verbose(message: any, context?: any, iam?: IAMInfo, meta?: LogMeta): void {
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

  debug(message: any, context?: any): void {
    super.debug(message, context);
  }
}

export const winstonLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
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
