import * as dotenv from 'dotenv';
dotenv.config();

const DEFAULT_HOST = 'localhost';

export const envConfig = {
  // File service
  FILE_SERVICE_HOST: process.env.FILE_SERVICE_HOST ?? DEFAULT_HOST,
  FILE_SERVICE_PORT: Number(process.env.FILE_SERVICE_PORT ?? 5007),
  FILE_SERVICE_HTTP_PORT: Number(process.env.FILE_SERVICE_HTTP_PORT ?? 6007),

  // MinIO Configuration
  MINIO_ENDPOINT: process.env.MINIO_ENDPOINT ?? 'http://localhost:9000',
  MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY ?? '',
  MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY ?? '',
  MINIO_BUCKET_NAME: process.env.MINIO_BUCKET_NAME ?? 'default',
};
