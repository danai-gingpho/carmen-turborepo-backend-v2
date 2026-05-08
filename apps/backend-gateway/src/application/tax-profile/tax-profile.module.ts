import { Module } from '@nestjs/common';
import { TaxProfileController } from './tax-profile.controller';
import { TaxProfileService } from './tax-profile.service';
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
  controllers: [TaxProfileController],
  providers: [TaxProfileService],
})
export class TaxProfileModule { }
