import { z } from 'zod';
import * as dotenv from 'dotenv';
dotenv.config();

const DEFAULT_PORTS = {
  GATEWAY_HTTP: 4000,
  GATEWAY_HTTPS: 4001,
  BUSINESS_TCP: 5020,
  BUSINESS_HTTP: 6020,
  CLUSTER_TCP: 5014,
  CLUSTER_HTTP: 6014,
  NOTIFICATION_TCP: 5006,
  NOTIFICATION_HTTP: 6006,
  FILE_TCP: 5007,
  FILE_HTTP: 6007,
KEYCLOAK_API_TCP: 5013,
  KEYCLOAK_API_HTTP: 6013,
  REPORT_TCP: 5015,
  REPORT_HTTP: 6015,
  REPORT_RENDER_TCP: 8001,
} as const;

// ─── Zod helpers ─────────────────────────────────────────────────────────────

const host = () => z.string().min(1);
const port = (defaultValue: number) => z.coerce.number().default(defaultValue);

// ─── Schema ──────────────────────────────────────────────────────────────────

const envSchema = z.object({
  // JWT
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),

  // Gateway
  GATEWAY_SERVICE_HOST: host(),
  GATEWAY_SERVICE_HTTP_PORT: port(DEFAULT_PORTS.GATEWAY_HTTP),
  GATEWAY_SERVICE_HTTPS_PORT: port(DEFAULT_PORTS.GATEWAY_HTTPS),

  // Business (base for consolidated services)
  BUSINESS_SERVICE_HOST: host(),
  BUSINESS_SERVICE_TCP_PORT: port(DEFAULT_PORTS.BUSINESS_TCP),
  BUSINESS_SERVICE_HTTP_PORT: port(DEFAULT_PORTS.BUSINESS_HTTP),

  // Cluster
  CLUSTER_SERVICE_HOST: host(),
  CLUSTER_SERVICE_TCP_PORT: port(DEFAULT_PORTS.CLUSTER_TCP),
  CLUSTER_SERVICE_HTTP_PORT: port(DEFAULT_PORTS.CLUSTER_HTTP),

  // Notification
  NOTIFICATION_SERVICE_HOST: host(),
  NOTIFICATION_SERVICE_TCP_PORT: port(DEFAULT_PORTS.NOTIFICATION_TCP),
  NOTIFICATION_SERVICE_HTTP_PORT: port(DEFAULT_PORTS.NOTIFICATION_HTTP),

  // File
  FILE_SERVICE_HOST: host(),
  FILE_SERVICE_TCP_PORT: port(DEFAULT_PORTS.FILE_TCP),
  FILE_SERVICE_HTTP_PORT: port(DEFAULT_PORTS.FILE_HTTP),

// Keycloak API
  KEYCLOAK_API_SERVICE_HOST: host(),
  KEYCLOAK_API_SERVICE_TCP_PORT: port(DEFAULT_PORTS.KEYCLOAK_API_TCP),
  KEYCLOAK_API_SERVICE_HTTP_PORT: port(DEFAULT_PORTS.KEYCLOAK_API_HTTP),

  // Report
  REPORT_SERVICE_HOST: host(),
  REPORT_SERVICE_TCP_PORT: port(DEFAULT_PORTS.REPORT_TCP),
  REPORT_SERVICE_HTTP_PORT: port(DEFAULT_PORTS.REPORT_HTTP),

  // Report Render
  REPORT_RENDER_HOST: host(),
  REPORT_RENDER_TCP_PORT: port(DEFAULT_PORTS.REPORT_RENDER_TCP),

  // Cronjob (remote HTTP service)
  CRONJOB_SERVICE_URL: z.string().url(),

  // Feature flags
  IS_ACTIVE_NOTIFICATION: z.string().optional(),

  // Loki logging
  LOKI_HOST: z.string().default('dev.blueledgers.com'),
  LOKI_PORT: z.coerce.number().default(3998),
  LOKI_PROTOCOL: z.string().default('http'),
  LOKI_USERNAME: z.string().default(''),
  LOKI_PASSWORD: z.string().default(''),

  // Application
  APP_NAME: z.string().default('backend-gateway'),
  NODE_ENV: z.string().default('development'),

  // Reset password
  RESET_PASSWORD_BASE_URL: z
    .string()
    .default('https://yourapp.com/reset-password'),
  RESET_PASSWORD_LIMIT_HOURS: z.coerce.number().default(1),

  // SMTP
  SMTP_HOST: z.string().default('smtp.example.com'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  SMTP_FROM: z.string().default('noreply@yourapp.com'),
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
  // Gateway
  GATEWAY_SERVICE_HOST: env.GATEWAY_SERVICE_HOST,
  GATEWAY_SERVICE_HTTP_PORT: env.GATEWAY_SERVICE_HTTP_PORT,
  GATEWAY_SERVICE_HTTPS_PORT: env.GATEWAY_SERVICE_HTTPS_PORT,

  // Business (consolidated: auth, master, inventory, procurement, log)
  BUSINESS_SERVICE_HOST: env.BUSINESS_SERVICE_HOST,
  BUSINESS_SERVICE_TCP_PORT: env.BUSINESS_SERVICE_TCP_PORT,
  BUSINESS_SERVICE_HTTP_PORT: env.BUSINESS_SERVICE_HTTP_PORT,

  // Cluster
  CLUSTER_SERVICE_HOST: env.CLUSTER_SERVICE_HOST,
  CLUSTER_SERVICE_TCP_PORT: env.CLUSTER_SERVICE_TCP_PORT,
  CLUSTER_SERVICE_HTTP_PORT: env.CLUSTER_SERVICE_HTTP_PORT,

  // Notification
  NOTIFICATION_SERVICE_HOST: env.NOTIFICATION_SERVICE_HOST,
  NOTIFICATION_SERVICE_TCP_PORT: env.NOTIFICATION_SERVICE_TCP_PORT,
  NOTIFICATION_SERVICE_HTTP_PORT: env.NOTIFICATION_SERVICE_HTTP_PORT,

  // File
  FILE_SERVICE_HOST: env.FILE_SERVICE_HOST,
  FILE_SERVICE_TCP_PORT: env.FILE_SERVICE_TCP_PORT,
  FILE_SERVICE_HTTP_PORT: env.FILE_SERVICE_HTTP_PORT,

// Keycloak API
  KEYCLOAK_API_SERVICE_HOST: env.KEYCLOAK_API_SERVICE_HOST,
  KEYCLOAK_API_SERVICE_TCP_PORT: env.KEYCLOAK_API_SERVICE_TCP_PORT,
  KEYCLOAK_API_SERVICE_HTTP_PORT: env.KEYCLOAK_API_SERVICE_HTTP_PORT,

  // Report
  REPORT_SERVICE_HOST: env.REPORT_SERVICE_HOST,
  REPORT_SERVICE_TCP_PORT: env.REPORT_SERVICE_TCP_PORT,
  REPORT_SERVICE_HTTP_PORT: env.REPORT_SERVICE_HTTP_PORT,

  // Report Render
  REPORT_RENDER_HOST: env.REPORT_RENDER_HOST,
  REPORT_RENDER_TCP_PORT: env.REPORT_RENDER_TCP_PORT,

  // Cronjob (remote HTTP service)
  CRONJOB_SERVICE_URL: env.CRONJOB_SERVICE_URL,

  // App config
  IS_ACTIVE_NOTIFICATION: Boolean(env.IS_ACTIVE_NOTIFICATION),
  JWT_SECRET: env.JWT_SECRET,

  // Loki logging
  LOKI_HOST: env.LOKI_HOST,
  LOKI_PORT: env.LOKI_PORT,
  LOKI_PROTOCOL: env.LOKI_PROTOCOL,
  LOKI_USERNAME: env.LOKI_USERNAME,
  LOKI_PASSWORD: env.LOKI_PASSWORD,

  // Application
  APP_NAME: env.APP_NAME,
  NODE_ENV: env.NODE_ENV,

  // Reset password
  RESET_PASSWORD_BASE_URL: env.RESET_PASSWORD_BASE_URL,
  RESET_PASSWORD_LIMIT_HOURS: env.RESET_PASSWORD_LIMIT_HOURS,

  // SMTP
  SMTP_HOST: env.SMTP_HOST,
  SMTP_PORT: env.SMTP_PORT,
  SMTP_USER: env.SMTP_USER,
  SMTP_PASS: env.SMTP_PASS,
  SMTP_FROM: env.SMTP_FROM,
};
