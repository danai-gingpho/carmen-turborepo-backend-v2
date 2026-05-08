import { z } from 'zod';
import * as dotenv from 'dotenv';
dotenv.config();

const DEFAULT_PORTS = {
  KEYCLOAK_API_TCP: 5013,
  KEYCLOAK_API_HTTP: 6013,
} as const;

// ─── Zod helpers ─────────────────────────────────────────────────────────────

const host = () => z.string().min(1);
const port = (defaultValue: number) => z.coerce.number().default(defaultValue);

// ─── Schema ──────────────────────────────────────────────────────────────────

const envSchema = z.object({
  // Keycloak API (this service)
  KEYCLOAK_API_SERVICE_HOST: host(),
  KEYCLOAK_API_SERVICE_TCP_PORT: port(DEFAULT_PORTS.KEYCLOAK_API_TCP),
  KEYCLOAK_API_SERVICE_HTTP_PORT: port(DEFAULT_PORTS.KEYCLOAK_API_HTTP),

  // Keycloak Configuration
  KEYCLOAK_BASE_URL: z.string().min(1, 'KEYCLOAK_BASE_URL is required'),
  KEYCLOAK_REALM: z.string().default('master'),
  KEYCLOAK_CLIENT_ID: z.string().default('account'),
  KEYCLOAK_CLIENT_SECRET: z.string().default(''),
  KEYCLOAK_ADMIN_CLIENT_ID: z.string().default('admin-cli'),
  KEYCLOAK_ADMIN_CLIENT_SECRET: z.string().default(''),
  KEYCLOAK_ADMIN_USERNAME: z.string().default('admin'),
  KEYCLOAK_ADMIN_PASSWORD: z
    .string()
    .min(1, 'KEYCLOAK_ADMIN_PASSWORD is required'),

  // Logging (Loki)
  LOKI_HOST: z.string().default('dev.blueledgers.com'),
  LOKI_PORT: z.coerce.number().default(3998),
  LOKI_PROTOCOL: z.string().default('http'),
  LOKI_USERNAME: z.string().default(''),
  LOKI_PASSWORD: z.string().default(''),
  APP_NAME: z.string().default('micro-keycloak-api'),
  NODE_ENV: z.string().default('development'),
  LOG_LEVEL: z.string().default('info'),
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
  // Keycloak API (this service)
  KEYCLOAK_API_SERVICE_HOST: env.KEYCLOAK_API_SERVICE_HOST,
  KEYCLOAK_API_SERVICE_TCP_PORT: env.KEYCLOAK_API_SERVICE_TCP_PORT,
  KEYCLOAK_API_SERVICE_HTTP_PORT: env.KEYCLOAK_API_SERVICE_HTTP_PORT,

  // Keycloak Configuration
  KEYCLOAK_BASE_URL: env.KEYCLOAK_BASE_URL,
  KEYCLOAK_REALM: env.KEYCLOAK_REALM,
  KEYCLOAK_CLIENT_ID: env.KEYCLOAK_CLIENT_ID,
  KEYCLOAK_CLIENT_SECRET: env.KEYCLOAK_CLIENT_SECRET,
  KEYCLOAK_ADMIN_CLIENT_ID: env.KEYCLOAK_ADMIN_CLIENT_ID,
  KEYCLOAK_ADMIN_CLIENT_SECRET: env.KEYCLOAK_ADMIN_CLIENT_SECRET,
  KEYCLOAK_ADMIN_USERNAME: env.KEYCLOAK_ADMIN_USERNAME,
  KEYCLOAK_ADMIN_PASSWORD: env.KEYCLOAK_ADMIN_PASSWORD,

  // Logging
  LOKI_HOST: env.LOKI_HOST,
  LOKI_PORT: env.LOKI_PORT,
  LOKI_PROTOCOL: env.LOKI_PROTOCOL,
  LOKI_USERNAME: env.LOKI_USERNAME,
  LOKI_PASSWORD: env.LOKI_PASSWORD,
  APP_NAME: env.APP_NAME,
  NODE_ENV: env.NODE_ENV,
  LOG_LEVEL: env.LOG_LEVEL,
};
