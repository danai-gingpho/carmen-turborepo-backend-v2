import { Module } from '@nestjs/common';
import { DocumentManagementService } from './document-management.service';
import { DocumentManagementController } from './document-management.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envConfig } from 'src/libs/config.env';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'FILE_SERVICE',
        transport: Transport.TCP,
        options: {
          host: envConfig.FILE_SERVICE_HOST,
          port: Number(envConfig.FILE_SERVICE_PORT),
        },
      },
    ]),
  ],
  controllers: [DocumentManagementController],
  providers: [DocumentManagementService],
})
export class DocumentManagementModule {}
