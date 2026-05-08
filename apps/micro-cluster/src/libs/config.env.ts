import { z } from 'zod';
import * as dotenv from 'dotenv';
dotenv.config();

const DEFAULT_PORTS = {
  CLUSTER_TCP: 5014,
  CLUSTER_HTTP: 6014,
  KEYCLOAK_API_TCP: 5013,
} as const;

// ─── Zod helpers ─────────────────────────────────────────────────────────────

const host = () => z.string().min(1);
const port = (defaultValue: number) => z.coerce.number().default(defaultValue);

// ─── Schema ──────────────────────────────────────────────────────────────────

const envSchema = z.object({
  // Cluster (this service)
  CLUSTER_SERVICE_HOST: host(),
  CLUSTER_SERVICE_TCP_PORT: port(DEFAULT_PORTS.CLUSTER_TCP),
  CLUSTER_SERVICE_HTTP_PORT: port(DEFAULT_PORTS.CLUSTER_HTTP),

  // Database
  SYSTEM_DATABASE_URL: z.string().min(1, 'SYSTEM_DATABASE_URL is required'),
  SYSTEM_DIRECT_URL: z.string().min(1, 'SYSTEM_DIRECT_URL is required'),

  // JWT
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  JWT_INVITE_EXPIRES_IN: z.string().default('1d'),

  // Inter-service communication
  KEYCLOAK_API_SERVICE_HOST: z.string().default('127.0.0.1'),
  KEYCLOAK_API_SERVICE_TCP_PORT: port(DEFAULT_PORTS.KEYCLOAK_API_TCP),

  // Logging (Loki)
  LOKI_HOST: z.string().default('dev.blueledgers.com'),
  LOKI_PORT: z.coerce.number().default(3998),
  LOKI_PROTOCOL: z.string().default('http'),
  LOKI_USERNAME: z.string().default(''),
  LOKI_PASSWORD: z.string().default(''),
  APP_NAME: z.string().default('micro-cluster'),
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
  // Cluster (this service)
  CLUSTER_SERVICE_HOST: env.CLUSTER_SERVICE_HOST,
  CLUSTER_SERVICE_TCP_PORT: env.CLUSTER_SERVICE_TCP_PORT,
  CLUSTER_SERVICE_HTTP_PORT: env.CLUSTER_SERVICE_HTTP_PORT,

  // Database
  SYSTEM_DATABASE_URL: env.SYSTEM_DATABASE_URL,
  SYSTEM_DIRECT_URL: env.SYSTEM_DIRECT_URL,

  // JWT
  JWT_SECRET: env.JWT_SECRET,
  JWT_EXPIRES_IN: env.JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN: env.JWT_REFRESH_EXPIRES_IN,
  JWT_INVITE_EXPIRES_IN: env.JWT_INVITE_EXPIRES_IN,

  // Inter-service communication
  KEYCLOAK_API_SERVICE_HOST: env.KEYCLOAK_API_SERVICE_HOST,
  KEYCLOAK_API_SERVICE_TCP_PORT: env.KEYCLOAK_API_SERVICE_TCP_PORT,

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
