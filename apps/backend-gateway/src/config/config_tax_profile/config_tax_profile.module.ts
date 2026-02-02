import { Module } from '@nestjs/common';
import { Config_TaxProfileService } from './config_tax_profile.service';
import { Config_TaxProfileController } from './config_tax_profile.controller';
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
  controllers: [Config_TaxProfileController],
  providers: [Config_TaxProfileService],
})
export class Config_TaxProfileModule { }
