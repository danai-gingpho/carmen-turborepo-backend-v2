import { Module } from '@nestjs/common';
import { GoodReceivedNoteService } from './good-received-note.service';
import { GoodReceivedNoteController } from './good-received-note.controller';
import { envConfig } from 'src/libs/config.env';
import { Transport } from '@nestjs/microservices';
import { ClientsModule } from '@nestjs/microservices';

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
  controllers: [GoodReceivedNoteController],
  providers: [GoodReceivedNoteService],
})
export class GoodReceivedNoteModule {}
