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
        name: 'INVENTORY_SERVICE',
        transport: Transport.TCP,
        options: {
          host: envConfig.INVENTORY_SERVICE_HOST,
          port: Number(envConfig.INVENTORY_SERVICE_PORT),
        },
      },
    ]),
  ],
  controllers: [GoodReceivedNoteController],
  providers: [GoodReceivedNoteService],
})
export class GoodReceivedNoteModule {}
