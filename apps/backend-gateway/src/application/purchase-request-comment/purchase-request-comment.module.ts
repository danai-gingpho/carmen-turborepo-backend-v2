import { Module } from '@nestjs/common';
import { PurchaseRequestCommentService } from './purchase-request-comment.service';
import { PurchaseRequestCommentController } from './purchase-request-comment.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envConfig } from 'src/libs/config.env';

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
  controllers: [PurchaseRequestCommentController],
  providers: [PurchaseRequestCommentService],
})
export class PurchaseRequestCommentModule {}
