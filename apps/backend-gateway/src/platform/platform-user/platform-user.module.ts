import { Module } from '@nestjs/common';
import { PlatformUserService } from './platform-user.service';
import { PlatformUserController } from './platform-user.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envConfig } from 'src/libs/config.env';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.TCP,
        options: {
          host: envConfig.AUTH_SERVICE_HOST,
          port: Number(envConfig.AUTH_SERVICE_PORT),
        },
      },
    ]),
  ],
  controllers: [PlatformUserController],
  providers: [PlatformUserService],
  exports: [PlatformUserService],
})
export class PlatformUserModule {}
