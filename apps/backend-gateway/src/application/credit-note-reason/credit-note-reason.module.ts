import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envConfig } from 'src/libs/config.env';
import { CreditNoteReasonService } from './credit-note-reason.service';
import { CreditNoteReasonController } from './credit-note-reason.controller';
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'PROCUREMENT_SERVICE',
        transport: Transport.TCP,
        options: {
          host: envConfig.PROCUREMENT_SERVICE_HOST,
          port: Number(envConfig.PROCUREMENT_SERVICE_PORT),
        },
      },
    ]),
  ],
  controllers: [CreditNoteReasonController],
  providers: [CreditNoteReasonService],
})
export class CreditNoteReasonModule {}
