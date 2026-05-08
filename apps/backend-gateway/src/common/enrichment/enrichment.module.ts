import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envConfig } from 'src/libs/config.env';
import { UserNameCacheService } from './user-name-cache.service';
import { UserNameResolverService } from './user-name-resolver.service';
import { EnrichmentService } from './enrichment.service';

@Global()
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'CLUSTER_SERVICE',
        transport: Transport.TCP,
        options: {
          host: envConfig.CLUSTER_SERVICE_HOST,
          port: Number(envConfig.CLUSTER_SERVICE_TCP_PORT),
        },
      },
    ]),
  ],
  providers: [
    {
      provide: UserNameCacheService,
      useFactory: () => new UserNameCacheService(),
    },
    UserNameResolverService,
    EnrichmentService,
  ],
  exports: [EnrichmentService],
})
export class EnrichmentModule {}
