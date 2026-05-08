import { z } from 'zod';
import * as dotenv from 'dotenv';
dotenv.config();

const DEFAULT_PORTS = {
  NOTIFICATION_TCP: 5006,
  NOTIFICATION_HTTP: 6006,
} as const;

// ─── Zod helpers ─────────────────────────────────────────────────────────────

const host = () => z.string().min(1);
const port = (defaultValue: number) => z.coerce.number().default(defaultValue);

// ─── Schema ──────────────────────────────────────────────────────────────────

const envSchema = z.object({
  // Notification (this service)
  NOTIFICATION_SERVICE_HOST: host(),
  NOTIFICATION_SERVICE_TCP_PORT: port(DEFAULT_PORTS.NOTIFICATION_TCP),
  NOTIFICATION_SERVICE_HTTP_PORT: port(DEFAULT_PORTS.NOTIFICATION_HTTP),

  // Database
  SYSTEM_DATABASE_URL: z.string().min(1, 'SYSTEM_DATABASE_URL is required'),

  // Logging
  APP_NAME: z.string().default('micro-notification'),
  NODE_ENV: z.string().default('development'),
  LOG_LEVEL: z.string().default('info'),

  // Sentry
  SENTRY_DSN: z.string().optional(),
});

// ─── Parse & validate ────────────────────────────────────────────────────────

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const missing = parsed.error.issues.map(
    (i) => `  - ${i.path.join('.')}: ${i.message}`,
  );
  console.error(
    `\n❌ Missing/invalid environment variables:\n${missing.join('\n')}\n`,
  );
  process.exit(1);
}

const env = parsed.data;

// ─── Export ──────────────────────────────────────────────────────────────────

export const envConfig = {
  // Notification (this service)
  NOTIFICATION_SERVICE_HOST: env.NOTIFICATION_SERVICE_HOST,
  NOTIFICATION_SERVICE_TCP_PORT: env.NOTIFICATION_SERVICE_TCP_PORT,
  NOTIFICATION_SERVICE_HTTP_PORT: env.NOTIFICATION_SERVICE_HTTP_PORT,

  // Database
  SYSTEM_DATABASE_URL: env.SYSTEM_DATABASE_URL,

  // Logging
  APP_NAME: env.APP_NAME,
  NODE_ENV: env.NODE_ENV,
  LOG_LEVEL: env.LOG_LEVEL,

  // Sentry
  SENTRY_DSN: env.SENTRY_DSN,
};
