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

  logger.verbose({ envConfig: envConfig, process_env: process.env }, 'env');

  const keycloakApiServiceHost = envConfig.KEYCLOAK_API_SERVICE_HOST;
  const keycloakApiServicePort = envConfig.KEYCLOAK_API_SERVICE_PORT;
  const keycloakApiServiceHttpPort = envConfig.KEYCLOAK_API_SERVICE_HTTP_PORT;

  logger.log(
    `KeycloakApiService is configured to run on ${keycloakApiServiceHost}:${keycloakApiServicePort}`,
  );
  logger.log(
    `HTTP server is configured to run on ${keycloakApiServiceHost}:${keycloakApiServiceHttpPort}`,
  );

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: keycloakApiServiceHost,
      port: Number(keycloakApiServicePort),
    },
  });

  await app.startAllMicroservices();
  await app.listen(keycloakApiServiceHttpPort);

  logger.log(
    `KeycloakApiService is running on ${keycloakApiServiceHost}:${keycloakApiServicePort}`,
  );
  logger.log(
    `HTTP server is running on ${keycloakApiServiceHost}:${keycloakApiServiceHttpPort}`,
  );
}

bootstrap();
