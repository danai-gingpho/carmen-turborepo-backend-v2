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
        name: 'MASTER_SERVICE',
        transport: Transport.TCP,
        options: {
          host: envConfig.MASTER_SERVICE_HOST,
          port: Number(envConfig.MASTER_SERVICE_PORT),
        },
      },
    ]),
  ],
  controllers: [PriceListTemplateController],
  providers: [PriceListTemplateService],
  exports: [PriceListTemplateService],
})
export class PriceListTemplateModule {}
