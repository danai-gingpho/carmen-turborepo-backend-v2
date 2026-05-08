import { Global, Module } from '@nestjs/common';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';

@Global()
@Module({
  providers: [
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
  ],
  exports: ['PRISMA_SYSTEM'],
})
export class DatabaseModule {}
