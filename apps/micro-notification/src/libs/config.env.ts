import 'dotenv/config';

export const envConfig = {
  NOTIFICATION_SERVICE_HOST: process.env.NOTIFICATION_SERVICE_HOST ?? 'localhost',
  NOTIFICATION_SERVICE_PORT: process.env.NOTIFICATION_SERVICE_PORT ?? '5006',
  NOTIFICATION_SERVICE_HTTP_PORT: process.env.NOTIFICATION_SERVICE_HTTP_PORT ?? '6006',
  SYSTEM_DATABASE_URL: process.env.SYSTEM_DATABASE_URL ?? process.env.DATABASE_URL,
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  SENTRY_DSN: process.env.SENTRY_DSN,
};
