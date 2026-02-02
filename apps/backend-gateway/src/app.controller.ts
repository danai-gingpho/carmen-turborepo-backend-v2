import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiExcludeEndpoint, ApiHideProperty, ApiTags } from '@nestjs/swagger';
import { BackendLogger } from './common/helpers/backend.logger';
import { ApiHeaderRequiredXAppId } from './common/decorator/x-app-id.decorator';

@Controller()
@ApiTags('App')
@ApiHeaderRequiredXAppId()
export class AppController {
  private readonly logger: BackendLogger = new BackendLogger(AppController.name);
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiExcludeEndpoint(true)
  getHello(): string {
    this.logger.debug({ function: 'getHello' }, AppController.name);
    return this.appService.getHello();
  }

  @Get('health')
  @ApiExcludeEndpoint(true)
  getHealth(): string {
    this.logger.debug({ function: 'getHealth' }, AppController.name);
    return 'OK';
  }
}
