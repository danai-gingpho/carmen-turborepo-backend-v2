import { Controller, Get, Header } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { BackendLogger } from './common/helpers/backend.logger';
import { ApiHeaderRequiredXAppId } from './common/decorator/x-app-id.decorator';
import * as httpdocs from './httpdocs/index';

@Controller()
@ApiTags('App Info')
@ApiHeaderRequiredXAppId()
export class AppController {
  private readonly logger: BackendLogger = new BackendLogger(
    AppController.name,
  );
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiExcludeEndpoint(true)
  @Header('Content-Type', 'text/html')
  getWelcomeHtml(): string {
    this.logger.debug({ function: 'getWelcomeHtml' }, AppController.name);
    return httpdocs.defaultRootHtml();
  }

  @Get('health')
  @ApiExcludeEndpoint(true)
  getHealth(): string {
    this.logger.debug({ function: 'getHealth' }, AppController.name);
    return 'OK';
  }
}
