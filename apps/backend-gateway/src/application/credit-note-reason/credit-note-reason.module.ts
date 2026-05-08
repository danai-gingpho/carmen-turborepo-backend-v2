import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envConfig } from 'src/libs/config.env';
import { CreditNoteReasonService } from './credit-note-reason.service';
import { CreditNoteReasonController } from './credit-note-reason.controller';
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
  controllers: [CreditNoteReasonController],
  providers: [CreditNoteReasonService],
})
export class CreditNoteReasonModule {}
