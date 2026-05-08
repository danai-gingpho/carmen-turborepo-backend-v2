import { Module } from '@nestjs/common';
import { MyApproveService } from './my-approve.service';
import { MyApproveController } from './my-approve.controller';
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
    ]),
  ],
  controllers: [MyApproveController],
  providers: [MyApproveService],
})
export class MyApproveModule {}
