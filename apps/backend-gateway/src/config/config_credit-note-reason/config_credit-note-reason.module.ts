import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envConfig } from 'src/libs/config.env';
import { Config_CreditNoteReasonService } from './config_credit-note-reason.service';
import { Config_CreditNoteReasonController } from './config_credit-note-reason.controller';

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
  controllers: [Config_CreditNoteReasonController],
  providers: [Config_CreditNoteReasonService],
})
export class Config_CreditNoteReasonModule {}
