import {
  Controller,
  Post,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { PlatformUserService } from './platform-user.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { ApiVersionMinRequest } from 'src/common/decorator/userfilter.decorator';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import { BaseHttpController } from '@/common';

@Controller('api-system')
@ApiTags('Platform - User')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class PlatformUserController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    PlatformUserController.name,
  );

  constructor(
    private readonly platformUserService: PlatformUserService,
  ) {
    super();
  }

  @Post('fetch-user')
  @UseGuards(new AppIdGuard('platform-user.fetch'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Fetch users from Keycloak realm',
    description: 'Fetches all users from Keycloak realm and syncs them to tb_user and tb_user_profile tables. Creates new records if not exists, updates existing records.',
    operationId: 'fetchUsers',
    tags: ['[Method] Post'],
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
        description: 'API version',
      },
    ],
    responses: {
      200: {
        description: 'Users fetched and synced successfully',
      },
      400: {
        description: 'Bad request',
      },
      401: {
        description: 'Unauthorized',
      },
      500: {
        description: 'Internal server error',
      },
    },
  })
  async fetchUsers(
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'fetchUsers',
        version,
      },
      PlatformUserController.name,
    );

    const result = await this.platformUserService.fetchUsers(version);
    this.respond(res, result);
  }
}
