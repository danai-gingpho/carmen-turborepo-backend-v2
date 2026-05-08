import './tracing';
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { envConfig } from "src/libs/config.env";
import { WinstonModule } from "nest-winston";
import { BackendLogger, winstonLogger } from "./common/helpers/backend.logger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      instance: winstonLogger,
    }),
  });
  const logger = new BackendLogger(bootstrap.name);

  // List all environment variables
  logger.verbose({ envConfig: envConfig, process_env: process.env }, "env");

  const businessServiceHost = envConfig.BUSINESS_SERVICE_HOST;
  const businessServiceTcpPort = Number(envConfig.BUSINESS_SERVICE_TCP_PORT);
  const businessServiceHttpPort = Number(envConfig.BUSINESS_SERVICE_HTTP_PORT);

  logger.log(`BusinessService is configured to run on ${businessServiceHost}:${businessServiceTcpPort}`);
  logger.log(`HTTP server is configured to run on ${businessServiceHost}:${businessServiceHttpPort}`);

  // Connect TCP microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: businessServiceHost,
      port: businessServiceTcpPort,
    },
  });

  // Enable CORS for WebSocket
  app.enableCors({
    origin: true,
    credentials: true,
  });

  await app.startAllMicroservices();
  await app.listen(businessServiceHttpPort);

  logger.log(`BusinessService TCP is running on ${businessServiceHost}:${businessServiceTcpPort}`);
  logger.log(`BusinessService HTTP is running on ${businessServiceHost}:${businessServiceHttpPort}`);
  logger.log(`BusinessService WebSocket is available at ws://${businessServiceHost}:${businessServiceHttpPort}`);
}

bootstrap();
