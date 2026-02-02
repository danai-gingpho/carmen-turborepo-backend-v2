import { Module } from '@nestjs/common';
import { Config_CreditTermService } from './config_credit_term.service';
import { Config_CreditTermController } from './config_credit_term.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envConfig } from 'src/libs/config.env';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'MASTER_SERVICE',
        transport: Transport.TCP,
        options: {
          host: envConfig.MASTER_SERVICE_HOST,
          port: Number(envConfig.MASTER_SERVICE_PORT),
        },
      },
    ]),
  ],
  controllers: [Config_CreditTermController],
  providers: [Config_CreditTermService],
})
export class Config_CreditTermModule {}
