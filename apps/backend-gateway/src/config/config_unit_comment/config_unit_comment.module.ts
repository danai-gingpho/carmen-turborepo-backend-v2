import { Module } from '@nestjs/common';
import { Config_UnitCommentService } from './config_unit_comment.service';
import { Config_UnitCommentController } from './config_unit_comment.controller';
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
  controllers: [Config_UnitCommentController],
  providers: [Config_UnitCommentService],
})
export class Config_UnitCommentModule {}
