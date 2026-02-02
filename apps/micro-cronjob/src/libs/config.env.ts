import * as dotenv from 'dotenv';
dotenv.config();

const DEFAULT_HOST = 'localhost';

export const envConfig = {
  // Cronjob service
  CRONJOB_SERVICE_HOST: process.env.CRONJOB_SERVICE_HOST ?? DEFAULT_HOST,
  CRONJOB_SERVICE_PORT: Number(process.env.CRONJOB_SERVICE_PORT ?? 5012),

  // Notification service (for sending notifications)
  NOTIFICATION_SERVICE_HOST: process.env.NOTIFICATION_SERVICE_HOST ?? DEFAULT_HOST,
  NOTIFICATION_SERVICE_PORT: Number(process.env.NOTIFICATION_SERVICE_PORT ?? 5006),
};
