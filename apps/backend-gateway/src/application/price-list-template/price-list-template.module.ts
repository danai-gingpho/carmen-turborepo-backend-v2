import { Module } from '@nestjs/common';
import { PriceListTemplateService } from './price-list-template.service';
import { PriceListTemplateController } from './price-list-template.controller';
import { ClientsModule } from '@nestjs/microservices';
import { Transport } from '@nestjs/microservices';
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
  controllers: [PriceListTemplateController],
  providers: [PriceListTemplateService],
  exports: [PriceListTemplateService],
})
export class PriceListTemplateModule {}
