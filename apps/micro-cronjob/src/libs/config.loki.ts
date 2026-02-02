import * as dotenv from 'dotenv';
dotenv.config();
export interface LokiConfig {
  host: string;
  port: number;
  labels: Record<string, string>;
  protocol: 'http' | 'https';
  username?: string;
  password?: string;
  json: boolean;
  format: string;
  replaceTimestamp: boolean;
  onConnectionError: (error: any) => void;
}

export class DefaultLokiConfig implements LokiConfig {
  host = process.env.LOKI_HOST || 'dev.blueledgers.com';
  port = parseInt(process.env.LOKI_PORT || '3998');
  protocol = (process.env.LOKI_PROTOCOL as 'http' | 'https') || 'http';
  username = process.env.LOKI_USERNAME;
  password = process.env.LOKI_PASSWORD;
  labels = {
    application: process.env.APP_NAME || 'carmen-inventory',
    environment: process.env.NODE_ENV || 'development',
  };
  json = true;
  format = 'json';
  replaceTimestamp = true;
  onConnectionError = (error: any) => {
    console.error('Loki connection error:', error);
  };
}

export const defaultLokiConfig = new DefaultLokiConfig();
