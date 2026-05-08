import { z } from 'zod';
import * as dotenv from 'dotenv';
dotenv.config();

const envSchema = z.object({
  // Required
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),

  // Business service (consolidated)
  BUSINESS_SERVICE_HOST: z.string().min(1),
  BUSINESS_SERVICE_TCP_PORT: z.coerce.number().default(5020),
  BUSINESS_SERVICE_HTTP_PORT: z.coerce.number().default(6020),

  // External services (not consolidated)
  KEYCLOAK_API_SERVICE_HOST: z.string().min(1),
  KEYCLOAK_API_SERVICE_TCP_PORT: z.coerce.number().default(5013),
  FILE_SERVICE_HOST: z.string().min(1),
  FILE_SERVICE_TCP_PORT: z.coerce.number().default(5007),
  REPORT_SERVICE_HOST: z.string().min(1),
  REPORT_SERVICE_TCP_PORT: z.coerce.number().default(5015),

  // JWT configuration
  JWT_EXPIRES_IN: z.string().default('1d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  JWT_INVITE_EXPIRES_IN: z.string().default('1d'),
});

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

export const envConfig = {
  // Business service (consolidated)
  BUSINESS_SERVICE_HOST: env.BUSINESS_SERVICE_HOST,
  BUSINESS_SERVICE_TCP_PORT: env.BUSINESS_SERVICE_TCP_PORT,
  BUSINESS_SERVICE_HTTP_PORT: env.BUSINESS_SERVICE_HTTP_PORT,

  // External services (not consolidated)
  KEYCLOAK_API_SERVICE_HOST: env.KEYCLOAK_API_SERVICE_HOST,
  KEYCLOAK_API_SERVICE_TCP_PORT: env.KEYCLOAK_API_SERVICE_TCP_PORT,
  FILE_SERVICE_HOST: env.FILE_SERVICE_HOST,
  FILE_SERVICE_TCP_PORT: env.FILE_SERVICE_TCP_PORT,
  REPORT_SERVICE_HOST: env.REPORT_SERVICE_HOST,
  REPORT_SERVICE_TCP_PORT: env.REPORT_SERVICE_TCP_PORT,

  // JWT configuration
  JWT_SECRET: env.JWT_SECRET,
  JWT_EXPIRES_IN: env.JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN: env.JWT_REFRESH_EXPIRES_IN,
  JWT_INVITE_EXPIRES_IN: env.JWT_INVITE_EXPIRES_IN,
};
