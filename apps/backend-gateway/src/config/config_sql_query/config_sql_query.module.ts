import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envConfig } from 'src/libs/config.env';
import { Config_SqlQueryController } from './config_sql_query.controller';
import { Config_SqlQueryService } from './config_sql_query.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'BUSINESS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: envConfig.BUSINESS_SERVICE_HOST,
          port: Number(envConfig.BUSINESS_SERVICE_TCP_PORT),
        },
      },
    ]),
  ],
  controllers: [Config_SqlQueryController],
  providers: [Config_SqlQueryService],
})
export class Config_SqlQueryModule {}
