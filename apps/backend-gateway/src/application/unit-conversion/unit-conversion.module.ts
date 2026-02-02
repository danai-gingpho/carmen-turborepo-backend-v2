import { Module } from '@nestjs/common'
import { UnitConversionController } from './unit-conversion.controller';
import { UnitConversionService } from './unit-conversion.service';
import { envConfig } from 'src/libs/config.env';
import { ClientsModule, Transport } from '@nestjs/microservices';

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
  controllers: [UnitConversionController],
  providers: [UnitConversionService],
  exports: [UnitConversionService],
})
export class UnitConversionModule {}