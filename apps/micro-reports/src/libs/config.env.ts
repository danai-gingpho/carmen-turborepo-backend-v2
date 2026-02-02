import * as dotenv from 'dotenv';
dotenv.config();

const DEFAULT_HOST = 'localhost';

export const envConfig = {
  // Report service
  REPORT_SERVICE_HOST: process.env.REPORT_SERVICE_HOST ?? DEFAULT_HOST,
  REPORT_SERVICE_PORT: Number(process.env.REPORT_SERVICE_PORT ?? 5004),
  REPORT_SERVICE_HTTP_PORT: Number(process.env.REPORT_SERVICE_HTTP_PORT ?? 6004),
};
