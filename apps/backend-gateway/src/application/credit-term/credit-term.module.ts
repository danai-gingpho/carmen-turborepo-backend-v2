import { Module } from '@nestjs/common';
import { CreditTermService } from './credit-term.service';
import { CreditTermController } from './credit-term.controller';
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
  controllers: [CreditTermController],
  providers: [CreditTermService],
})
export class CreditTermModule {}
