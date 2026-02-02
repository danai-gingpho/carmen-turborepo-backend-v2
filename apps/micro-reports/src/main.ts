import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { envConfig } from 'src/libs/config.env';
import { WinstonModule } from 'nest-winston';
import { BackendLogger, winstonLogger } from './common/helpers/backend.logger';

async function bootstrap() {

  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      instance: winstonLogger,
    }),
  });
  const logger = new BackendLogger(bootstrap.name);

  // list all environment variables
  logger.verbose({ envConfig: envConfig, process_env: process.env }, 'env');

  const reportsServiceHost = envConfig.REPORT_SERVICE_HOST;
  const reportsServicePort = Number(envConfig.REPORT_SERVICE_PORT);
  const reportsServiceHttpPort = Number(envConfig.REPORT_SERVICE_HTTP_PORT);

  logger.log(
    `ReportsService is configured to run on ${reportsServiceHost}:${reportsServicePort}`,
  );
  logger.log(
    `HTTP server is configured to run on ${reportsServiceHost}:${reportsServiceHttpPort}`,
  );

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: reportsServiceHost,
      port: reportsServicePort,
    },
  });

  await app.startAllMicroservices();
  await app.listen(reportsServiceHttpPort);

  logger.log(
    `ReportsService is running on ${reportsServiceHost}:${reportsServicePort}`,
  );
  logger.log(
    `HTTP server is running on ${reportsServiceHost}:${reportsServiceHttpPort}`,
  );
}

bootstrap();
