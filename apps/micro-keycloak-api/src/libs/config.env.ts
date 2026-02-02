import * as dotenv from 'dotenv';
dotenv.config();

const DEFAULT_HOST = 'localhost';

export const envConfig = {
  // Keycloak API service
  KEYCLOAK_API_SERVICE_HOST: process.env.KEYCLOAK_API_SERVICE_HOST ?? DEFAULT_HOST,
  KEYCLOAK_API_SERVICE_PORT: Number(process.env.KEYCLOAK_API_SERVICE_PORT ?? 5013),
  KEYCLOAK_API_SERVICE_HTTP_PORT: Number(process.env.KEYCLOAK_API_SERVICE_HTTP_PORT ?? 6013),

  // Keycloak Configuration
  KEYCLOAK_BASE_URL: process.env.KEYCLOAK_BASE_URL ?? 'http://localhost:8080',
  KEYCLOAK_REALM: process.env.KEYCLOAK_REALM ?? 'master',
  KEYCLOAK_CLIENT_ID: process.env.KEYCLOAK_CLIENT_ID ?? '',
  KEYCLOAK_ADMIN_CLIENT_ID: process.env.KEYCLOAK_ADMIN_CLIENT_ID ?? '',
  KEYCLOAK_ADMIN_CLIENT_SECRET: process.env.KEYCLOAK_ADMIN_CLIENT_SECRET ?? '',
  KEYCLOAK_ADMIN_USERNAME: process.env.KEYCLOAK_ADMIN_USERNAME ?? 'admin',
  KEYCLOAK_ADMIN_PASSWORD: process.env.KEYCLOAK_ADMIN_PASSWORD ?? 'admin',
};
