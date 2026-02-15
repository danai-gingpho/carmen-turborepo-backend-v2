import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
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
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { IPaginateQuery, PaginateQuery } from 'src/shared-dto/paginate.dto';
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

  @Get('user')
  @UseGuards(new AppIdGuard('platform-user.list'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  async getUserList(
    @Req() req: Request,
    @Res() res: Response,
    @Query() query?: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'getUserList',
        query,
        version,
      },
      PlatformUserController.name,
    );
    const { user_id, tenant_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.platformUserService.getUserList(
      user_id,
      tenant_id,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  @Get('user/:id')
  @UseGuards(new AppIdGuard('platform-user.get'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async getUser(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'getUser',
        id,
        version,
      },
      PlatformUserController.name,
    );
    const { user_id, tenant_id } = ExtractRequestHeader(req);
    const result = await this.platformUserService.getUser(
      user_id,
      tenant_id,
      id,
      version,
    );
    this.respond(res, result);
  }

  @Post('user')
  @UseGuards(new AppIdGuard('platform-user.create'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async createUser(
    @Req() req: Request,
    @Res() res: Response,
    @Body() data: any,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'createUser',
        data,
        version,
      },
      PlatformUserController.name,
    );
    const { user_id, tenant_id } = ExtractRequestHeader(req);
    const result = await this.platformUserService.createUser(
      user_id,
      tenant_id,
      data,
      version,
    );
    this.respond(res, result);
  }

  @Put('user/:id')
  @UseGuards(new AppIdGuard('platform-user.update'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async updateUser(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Body() data: any,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'updateUser',
        id,
        data,
        version,
      },
      PlatformUserController.name,
    );
    const { user_id, tenant_id } = ExtractRequestHeader(req);
    const result = await this.platformUserService.updateUser(
      user_id,
      tenant_id,
      id,
      data,
      version,
    );
    this.respond(res, result);
  }

  @Delete('user/:id')
  @UseGuards(new AppIdGuard('platform-user.delete'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async deleteUser(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'deleteUser',
        id,
        version,
      },
      PlatformUserController.name,
    );
    const { user_id, tenant_id } = ExtractRequestHeader(req);
    const result = await this.platformUserService.deleteUser(
      user_id,
      tenant_id,
      id,
      version,
    );
    this.respond(res, result);
  }
}
