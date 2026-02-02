import { Module } from '@nestjs/common';
import { KeycloakService } from './keycloak.service';
import { KeycloakController } from './keycloak.controller';
import { KeycloakHealthScheduler } from './keycloak-health.scheduler';

@Module({
  controllers: [KeycloakController],
  providers: [KeycloakService, KeycloakHealthScheduler],
  exports: [KeycloakService],
})
export class KeycloakModule {}
