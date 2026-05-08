import { Module } from '@nestjs/common';
import { PhysicalCountDetailCommentService } from './physical-count-detail-comment.service';
import { PhysicalCountDetailCommentController } from './physical-count-detail-comment.controller';
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
  controllers: [PhysicalCountDetailCommentController],
  providers: [PhysicalCountDetailCommentService],
})
export class PhysicalCountDetailCommentModule {}
