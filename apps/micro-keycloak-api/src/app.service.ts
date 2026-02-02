import { Injectable } from '@nestjs/common';
import { BackendLogger } from '@/common/helpers/backend.logger';

@Injectable()
export class AppService {
  private readonly logger: BackendLogger = new BackendLogger(AppService.name);
  getHello(): string {
    this.logger.debug({ function: 'getHello' }, AppService.name);
    return 'Keycloak API Service';
  }
}
