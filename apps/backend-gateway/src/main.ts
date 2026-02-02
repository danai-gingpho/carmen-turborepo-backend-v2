import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { patchNestJsSwagger } from 'nestjs-zod';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as fs from 'fs';
import { envConfig } from 'src/libs/config.env';
import { winstonLogger } from './common/helpers/backend.logger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { WinstonModule } from 'nest-winston';
import { BackendLogger } from './common/helpers/backend.logger';
import { ExceptionFilter } from './exception/exception.fillter';
import { NotificationNativeGateway } from './notification/notification-native.gateway';

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

  const gatewayPort = envConfig.GATEWAY_SERVICE_PORT;
  const gatewayPortHttps = envConfig.GATEWAY_SERVICE_HTTPS_PORT;

  const config = new DocumentBuilder()
    .setTitle('CarmenSoftware')
    .setDescription('CarmenSoftware API Gateway')
    .setVersion('1.0.1')
    .addServer(`http://localhost:${gatewayPort}`, 'local environment')
    .addServer(
      `https://localhost:${gatewayPortHttps}`,
      'local environment (https)',
    )
    .addServer(
      `https://dev.blueledgers.com:${gatewayPortHttps}`,
      'dev environment',
    )
    .addServer(`https://carmen-api.semapru.com`, 'production environment')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      in: 'header',
    })
    .build();

  const document_http = SwaggerModule.createDocument(app_http as any, config);
  const document_https = SwaggerModule.createDocument(app_https as any, config);

  // SwaggerModule.setup('swagger', app_http as any, document_http);
  // SwaggerModule.setup('swagger', app_https as any, document_https);

  // fs.writeFileSync('./swagger.json', JSON.stringify(document_http));
  // fs.writeFileSync('./swagger_https.json', JSON.stringify(document_https));

  // // Serve static files from the "public" folder
  // app_http.useStaticAssets(join(__dirname, '..', 'public'));
  // app_https.useStaticAssets(join(__dirname, '..', 'public'));

  // SwaggerModule.setup('swagger', app_http, document_http, {
  //   jsonDocumentUrl: 'swagger/json',
  // });

  // SwaggerModule.setup('swagger', app_https, document_https, {
  //   jsonDocumentUrl: 'swagger/json',
  // });

  app_http.use(
    '/swagger',
    apiReference({
      spec: {
        content: document_http,
      },
      name: 'CarmenSoftware API Gateway',
      version: '1.0.1',
    }),
  );

  app_https.use(
    '/swagger',
    apiReference({
      spec: {
        content: document_https,
      },
      name: 'CarmenSoftware API Gateway',
      version: '1.0.1',
    }),
  );

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
