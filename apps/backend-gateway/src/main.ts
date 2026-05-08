import './tracing';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { patchNestJsSwagger } from 'nestjs-zod';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as fs from 'fs';
import { execSync } from 'child_process';
import { envConfig } from 'src/libs/config.env';
import { winstonLogger } from './common/helpers/backend.logger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { APP_VERSION } from './version';
import { SWAGGER_TAGS, SWAGGER_TAG_GROUPS } from './swagger/tag-groups';
import { WinstonModule } from 'nest-winston';
import { BackendLogger } from './common/helpers/backend.logger';
import { ExceptionFilter } from './exception/exception.fillter';
import { NotificationNativeGateway } from './notification/notification-native.gateway';

// Read git commit hash once at startup
let GIT_COMMIT = 'unknown';
try {
  GIT_COMMIT = execSync('git rev-parse --short HEAD').toString().trim();
} catch { /* not a git repo or git not available */ }

async function bootstrap() {
  // https options
  const httpsOptions = {
    key: fs.readFileSync('./src/cert/key.pem'),
    cert: fs.readFileSync('./src/cert/cert.pem'),
  };

  const app_http = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
    logger: WinstonModule.createLogger({
      instance: winstonLogger,
    }),
  });

  const app_https = await NestFactory.create<NestExpressApplication>(
    AppModule,
    {
      cors: true,
      httpsOptions: httpsOptions,
      logger: WinstonModule.createLogger({
        instance: winstonLogger,
      }),
    },
  );

  const logger = new BackendLogger('bootstrap');

  patchNestJsSwagger();

  // list all environment variables
  logger.verbose({ envConfig: envConfig, process_env: process.env }, 'env');

  const gatewayPort = envConfig.GATEWAY_SERVICE_HTTP_PORT;
  const gatewayPortHttps = envConfig.GATEWAY_SERVICE_HTTPS_PORT;

  const docConfigBuilder = new DocumentBuilder()
    .setTitle('CarmenSoftware')
    .setDescription('CarmenSoftware API Gateway')
    .setVersion(APP_VERSION)
    .addServer(`http://localhost:${gatewayPort}`, 'local environment (http)')
    .addServer(
      `https://localhost:${gatewayPortHttps}`,
      'local environment (https)',
    )
    .addServer(
      `https://dev.blueledgers.com:${gatewayPortHttps}`,
      'dev environment (https)',
    )
    .addServer(
      `http://dev.blueledgers.com:${gatewayPort}`,
      'dev environment (http)',
    )
    .addServer('https://43.209.126.252', 'UAT environment')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      in: 'header',
    });

  for (const t of SWAGGER_TAGS) {
    docConfigBuilder.addTag(t.name, t.description);
  }

  const config = docConfigBuilder
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-app-id',
        in: 'header',
        description: 'Application ID',
      },
      'x-app-id',
    )
    .build();

  const document_http = SwaggerModule.createDocument(
    app_http as unknown as Parameters<typeof SwaggerModule.createDocument>[0],
    config,
  );
  const document_https = SwaggerModule.createDocument(
    app_https as unknown as Parameters<typeof SwaggerModule.createDocument>[0],
    config,
  );

  (document_http as unknown as Record<string, unknown>)['x-tagGroups'] =
    SWAGGER_TAG_GROUPS;
  (document_https as unknown as Record<string, unknown>)['x-tagGroups'] =
    SWAGGER_TAG_GROUPS;

  app_http.use(
    '/swagger',
    apiReference({
      spec: {
        content: document_http,
      },
      name: 'CarmenSoftware API Gateway',
      version: APP_VERSION,
    }),
  );

  app_https.use(
    '/swagger',
    apiReference({
      spec: {
        content: document_https,
      },
      name: 'CarmenSoftware API Gateway',
      version: APP_VERSION,
    }),
  );

  // Add git commit hash to every response header
  app_http.use((_req: any, res: any, next: any) => { res.setHeader('X-Build', GIT_COMMIT); next(); });
  app_https.use((_req: any, res: any, next: any) => { res.setHeader('X-Build', GIT_COMMIT); next(); });

  app_http.useGlobalFilters(new ExceptionFilter());
  app_https.useGlobalFilters(new ExceptionFilter());

  await app_http.listen(gatewayPort);
  await app_https.listen(gatewayPortHttps);

  // WebSocket server
  const isActiveNotification = envConfig.IS_ACTIVE_NOTIFICATION;
  if (isActiveNotification) {
    // Attach WebSocket server to HTTP server
    try {
      const httpServer = app_http.getHttpServer();
      const notificationGateway = app_http.get(NotificationNativeGateway);
      notificationGateway.attachToServer(httpServer);
      logger.log(`WebSocket available at ws://localhost:${gatewayPort}/ws`);
    } catch (error) {
      logger.error('Failed to attach WebSocket server:', error);
    }

    // Attach WebSocket server to HTTPS server
    try {
      const httpsServer = app_https.getHttpServer();
      const notificationGateway = app_https.get(NotificationNativeGateway);
      notificationGateway.attachToServer(httpsServer);
      logger.log(
        `WebSocket available at wss://localhost:${gatewayPortHttps}/ws`,
      );
    } catch (error) {
      logger.error('Failed to attach WebSocket server:', error);
    }
  }

  logger.log(`Gateway HTTP listening on port ${gatewayPort}`);
  logger.log(`Gateway HTTPS listening on port ${gatewayPortHttps}`);
}
bootstrap();
