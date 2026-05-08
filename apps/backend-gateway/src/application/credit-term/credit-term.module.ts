import { Module } from '@nestjs/common';
import { CreditTermService } from './credit-term.service';
import { CreditTermController } from './credit-term.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envConfig } from 'src/libs/config.env';

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
  controllers: [CreditTermController],
  providers: [CreditTermService],
})
export class CreditTermModule {}
