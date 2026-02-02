import { Injectable, LoggerService, Scope } from '@nestjs/common';
import * as winston from 'winston';

const formatMeta = (meta: any) => {
  const splat = meta[Symbol.for('splat')];
  if (splat && splat.length) {
    return splat.length === 1
      ? JSON.stringify(splat[0])
      : JSON.stringify(splat);
  }
  return '';
};

export const winstonLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
      const metaStr = formatMeta(meta);
      return `[${timestamp}] ${level}: ${context ? `[${context}] ` : ''}${message}${metaStr ? ` ${metaStr}` : ''}`;
    }),
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.printf(
          ({ timestamp, level, message, context, ...meta }) => {
            const metaStr = formatMeta(meta);
            return `[${timestamp}] ${level}: ${context ? `[${context}] ` : ''}${message}${metaStr ? ` ${metaStr}` : ''}`;
          },
        ),
      ),
    }),
  ],
});

@Injectable({ scope: Scope.TRANSIENT })
export class BackendLogger implements LoggerService {
  private context?: string;

  constructor(context?: string) {
    this.context = context;
  }

  setContext(context: string) {
    this.context = context;
  }

  log(message: any, context?: string) {
    winstonLogger.info(message, { context: context || this.context });
  }

  error(message: any, trace?: string, context?: string) {
    winstonLogger.error(message, { trace, context: context || this.context });
  }

  warn(message: any, context?: string) {
    winstonLogger.warn(message, { context: context || this.context });
  }

  debug(message: any, context?: string) {
    winstonLogger.debug(message, { context: context || this.context });
  }

  verbose(message: any, context?: string) {
    winstonLogger.verbose(message, { context: context || this.context });
  }
}
