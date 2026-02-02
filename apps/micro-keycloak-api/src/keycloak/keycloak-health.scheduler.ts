import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { KeycloakService } from './keycloak.service';
import { BackendLogger } from '@/common/helpers/backend.logger';

@Injectable()
export class KeycloakHealthScheduler {
  private readonly logger = new BackendLogger(KeycloakHealthScheduler.name);

  constructor(private readonly keycloakService: KeycloakService) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleHealthCheck() {
    this.logger.log('Running scheduled Keycloak health check...');

    const result = await this.keycloakService.healthCheck();

    if (result.status === 'healthy') {
      this.logger.log(`Keycloak is healthy at ${result.timestamp}`);
    } else {
      this.logger.error(`Keycloak is unhealthy at ${result.timestamp}`);
    }
  }
}
