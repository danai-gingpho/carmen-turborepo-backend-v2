import { z } from 'zod';
import * as dotenv from 'dotenv';
dotenv.config();

const DEFAULT_PORTS = {
  FILE_TCP: 5007,
  FILE_HTTP: 6007,
} as const;

// ─── Zod helpers ─────────────────────────────────────────────────────────────

const host = () => z.string().min(1);
const port = (defaultValue: number) => z.coerce.number().default(defaultValue);

// ─── Schema ──────────────────────────────────────────────────────────────────

const envSchema = z.object({
  // File (this service)
  FILE_SERVICE_HOST: host(),
  FILE_SERVICE_TCP_PORT: port(DEFAULT_PORTS.FILE_TCP),
  FILE_SERVICE_HTTP_PORT: port(DEFAULT_PORTS.FILE_HTTP),

  // MinIO
  MINIO_ENDPOINT: z.string().min(1, 'MINIO_ENDPOINT is required'),
  MINIO_ACCESS_KEY: z.string().min(1, 'MINIO_ACCESS_KEY is required'),
  MINIO_SECRET_KEY: z.string().min(1, 'MINIO_SECRET_KEY is required'),
  MINIO_BUCKET_NAME: z.string().default('default'),

  // Logging (Loki)
  LOKI_HOST: z.string().default('dev.blueledgers.com'),
  LOKI_PORT: z.coerce.number().default(3998),
  LOKI_PROTOCOL: z.string().default('http'),
  LOKI_USERNAME: z.string().default(''),
  LOKI_PASSWORD: z.string().default(''),
  APP_NAME: z.string().default('micro-file'),
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
  // File (this service)
  FILE_SERVICE_HOST: env.FILE_SERVICE_HOST,
  FILE_SERVICE_TCP_PORT: env.FILE_SERVICE_TCP_PORT,
  FILE_SERVICE_HTTP_PORT: env.FILE_SERVICE_HTTP_PORT,

  // MinIO
  MINIO_ENDPOINT: env.MINIO_ENDPOINT,
  MINIO_ACCESS_KEY: env.MINIO_ACCESS_KEY,
  MINIO_SECRET_KEY: env.MINIO_SECRET_KEY,
  MINIO_BUCKET_NAME: env.MINIO_BUCKET_NAME,

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
