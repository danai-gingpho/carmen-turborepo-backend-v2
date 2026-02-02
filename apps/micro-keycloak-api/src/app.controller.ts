import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { BackendLogger } from '@/common/helpers/backend.logger';

@Controller()
export class AppController {
  private readonly logger: BackendLogger = new BackendLogger(
    AppController.name,
  );
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    this.logger.debug({ function: 'getHello' }, AppController.name);
    return this.appService.getHello();
  }

  @Get('health')
  getHealth(): string {
    this.logger.debug({ function: 'getHealth' }, AppController.name);
    return 'OK';
  }
}
