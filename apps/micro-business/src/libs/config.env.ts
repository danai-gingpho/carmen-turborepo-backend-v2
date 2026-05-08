import { z } from 'zod';
import * as dotenv from 'dotenv';
dotenv.config();

const DEFAULT_PORTS = {
  BUSINESS_TCP: 5020,
  BUSINESS_HTTP: 6020,
  KEYCLOAK_API_TCP: 5013,
  FILE_TCP: 5007,
  REPORT_TCP: 5015,
  NOTIFICATION_TCP: 5006,
} as const;

// ─── Zod helpers ─────────────────────────────────────────────────────────────

const host = () => z.string().min(1);
const port = (defaultValue: number) => z.coerce.number().default(defaultValue);

// ─── Schema ──────────────────────────────────────────────────────────────────

const envSchema = z.object({
  // Business (this service)
  BUSINESS_SERVICE_HOST: host(),
  BUSINESS_SERVICE_TCP_PORT: port(DEFAULT_PORTS.BUSINESS_TCP),
  BUSINESS_SERVICE_HTTP_PORT: port(DEFAULT_PORTS.BUSINESS_HTTP),

  // Database
  SYSTEM_DATABASE_URL: z.string().min(1, 'SYSTEM_DATABASE_URL is required'),
  SYSTEM_DIRECT_URL: z.string().min(1, 'SYSTEM_DIRECT_URL is required'),

  // JWT
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  JWT_INVITE_EXPIRES_IN: z.string().default('1d'),

  // User invitation/registration
  INVITATION_LIMIT_HOURS: z.coerce.number().default(24),
  REGISTER_BASE_URL: z.string().default('http://localhost:3000'),
  RESET_PASSWORD_LIMIT_HOURS: z.coerce.number().default(24),
  RESET_PASSWORD_BASE_URL: z.string().default('http://localhost:3000'),

  // SMTP
  SMTP_HOST: z.string().default('smtp.example.com'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  SMTP_FROM: z.string().default('noreply@example.com'),

  // Inter-service communication
  KEYCLOAK_API_SERVICE_HOST: z.string().default('127.0.0.1'),
  KEYCLOAK_API_SERVICE_TCP_PORT: port(DEFAULT_PORTS.KEYCLOAK_API_TCP),
  FILE_SERVICE_HOST: z.string().default('127.0.0.1'),
  FILE_SERVICE_TCP_PORT: port(DEFAULT_PORTS.FILE_TCP),
  REPORT_SERVICE_HOST: z.string().default('127.0.0.1'),
  REPORT_SERVICE_TCP_PORT: port(DEFAULT_PORTS.REPORT_TCP),
  NOTIFICATION_SERVICE_HOST: z.string().default('127.0.0.1'),
  NOTIFICATION_SERVICE_TCP_PORT: port(DEFAULT_PORTS.NOTIFICATION_TCP),

  // Logging (Loki)
  LOKI_HOST: z.string().default('dev.blueledgers.com'),
  LOKI_PORT: z.coerce.number().default(3998),
  LOKI_PROTOCOL: z.string().default('http'),
  LOKI_USERNAME: z.string().default(''),
  LOKI_PASSWORD: z.string().default(''),
  APP_NAME: z.string().default('micro-business'),
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
  // Business (this service)
  BUSINESS_SERVICE_HOST: env.BUSINESS_SERVICE_HOST,
  BUSINESS_SERVICE_TCP_PORT: env.BUSINESS_SERVICE_TCP_PORT,
  BUSINESS_SERVICE_HTTP_PORT: env.BUSINESS_SERVICE_HTTP_PORT,

  // Database
  SYSTEM_DATABASE_URL: env.SYSTEM_DATABASE_URL,
  SYSTEM_DIRECT_URL: env.SYSTEM_DIRECT_URL,

  // JWT
  JWT_SECRET: env.JWT_SECRET,
  JWT_EXPIRES_IN: env.JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN: env.JWT_REFRESH_EXPIRES_IN,
  JWT_INVITE_EXPIRES_IN: env.JWT_INVITE_EXPIRES_IN,

  // User invitation/registration
  INVITATION_LIMIT_HOURS: env.INVITATION_LIMIT_HOURS,
  REGISTER_BASE_URL: env.REGISTER_BASE_URL,
  RESET_PASSWORD_LIMIT_HOURS: env.RESET_PASSWORD_LIMIT_HOURS,
  RESET_PASSWORD_BASE_URL: env.RESET_PASSWORD_BASE_URL,

  // SMTP
  SMTP_HOST: env.SMTP_HOST,
  SMTP_PORT: env.SMTP_PORT,
  SMTP_USER: env.SMTP_USER,
  SMTP_PASS: env.SMTP_PASS,
  SMTP_FROM: env.SMTP_FROM,

  // Inter-service communication
  KEYCLOAK_API_SERVICE_HOST: env.KEYCLOAK_API_SERVICE_HOST,
  KEYCLOAK_API_SERVICE_TCP_PORT: env.KEYCLOAK_API_SERVICE_TCP_PORT,
  FILE_SERVICE_HOST: env.FILE_SERVICE_HOST,
  FILE_SERVICE_TCP_PORT: env.FILE_SERVICE_TCP_PORT,
  REPORT_SERVICE_HOST: env.REPORT_SERVICE_HOST,
  REPORT_SERVICE_TCP_PORT: env.REPORT_SERVICE_TCP_PORT,
  NOTIFICATION_SERVICE_HOST: env.NOTIFICATION_SERVICE_HOST,
  NOTIFICATION_SERVICE_TCP_PORT: env.NOTIFICATION_SERVICE_TCP_PORT,

  // Logging
  LOKI_HOST: env.LOKI_HOST,
  LOKI_PORT: env.LOKI_PORT,
  LOKI_PROTOCOL: env.LOKI_PROTOCOL,
  LOKI_USERNAME: env.LOKI_USERNAME,
  LOKI_PASSWORD: env.LOKI_PASSWORD,
  APP_NAME: env.APP_NAME,
  NODE_ENV: env.NODE_ENV,
  LOG_LEVEL: env.LOG_LEVEL,

  // Sentry
  SENTRY_DSN: env.SENTRY_DSN,
};
