import { Module } from '@nestjs/common';
import { StockInCommentService } from './stock-in-comment.service';
import { StockInCommentController } from './stock-in-comment.controller';
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
      {
        name: 'FILE_SERVICE',
        transport: Transport.TCP,
        options: {
          host: envConfig.FILE_SERVICE_HOST,
          port: Number(envConfig.FILE_SERVICE_TCP_PORT),
        },
      },
    ]),
  ],
  controllers: [StockInCommentController],
  providers: [StockInCommentService],
})
export class StockInCommentModule {}
