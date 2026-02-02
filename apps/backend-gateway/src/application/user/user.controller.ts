import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  Query,
  Param,
  Put,
  Body,
} from '@nestjs/common';
import { Response } from 'express';
import { UserService } from './user.service';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { TenantHeaderGuard } from 'src/common/guard/tenant-header.guard';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { UpdateUserProfileDto } from 'src/auth/dto/auth.dto';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import {
  BaseHttpController,
  Serialize,
  ZodSerializerInterceptor,
  UserProfileResponseSchema,
  UserListItemResponseSchema,
} from '@/common';

@Controller()
@ApiTags('Application - User')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class UserController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    UserController.name,
  );

  constructor(private readonly userService: UserService) {
    super();
  }

  @Get('/api/user/profile')
  @UseGuards(new AppIdGuard('user.getProfile'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @UseGuards(KeycloakGuard)
  @Serialize(UserProfileResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get user profile',
    description: 'Get user profile',
    operationId: 'getUserProfile',
    tags: ['[Method] Get'],
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
      },
    ],
    responses: {
      200: {
        description: 'User profile retrieved successfully',
      },
    },
  })
  async profile(
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'profile',
        version,
      },
      UserController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.userService.getUserProfile(user_id, version);
    this.respond(res, result);
  }

  @Get('/api/user/permission')
  @UseGuards(KeycloakGuard, TenantHeaderGuard)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get User Profile',
    description: 'Get user profile',
    operationId: 'getUserProfile',
    tags: ['Authentication'],
    deprecated: false,
    security: [{}],
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
      },
    ],
    responses: {
      200: {
        description: 'User profile retrieved successfully',
      },
      401: {
        description: 'Unauthorized',
      },
    },
  })
  async getPermission(
    @Req() req: any,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ) {
    const { user_id } = ExtractRequestHeader(req);

    this.logger.debug(
      {
        function: 'getPermission',
        user_id,
        version,
      },
      UserController.name,
    );

    const result = await this.userService.getPermission(user_id, version);

    this.respond(res, result);
  }

  // get all user in tenant
  @Get('api/:bu_code/users')
  @UseGuards(new AppIdGuard('user.getAllUserInTenant'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @UseGuards(KeycloakGuard, TenantHeaderGuard)
  @Serialize(UserListItemResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get all user in tenant',
    description: 'Get all user in tenant',
    operationId: 'getAllUserInTenant',
    tags: ['[Method] Get'],
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    responses: {
      200: {
        description: 'User profile retrieved successfully',
      },
    },
  })
  async getAllUserInTenant(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'getAllUserInTenant',
        version,
      },
      UserController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.userService.getAllUserInTenant(
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Put('/api/user/:user_id')
  @UseGuards(new AppIdGuard('user.updateUserById'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Serialize(UserProfileResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Update user profile by ID',
    description:
      'Update user profile information (firstname, middlename, lastname, telephone). Updates both Keycloak and database.',
    operationId: 'updateUserById',
    tags: ['[Method] Put'],
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    responses: {
      200: {
        description: 'User profile updated successfully',
      },
      404: {
        description: 'User not found',
      },
    },
  })
  @ApiBody({ type: UpdateUserProfileDto })
  async updateUserById(
    @Param('user_id') targetUserId: string,
    @Body() updateData: UpdateUserProfileDto,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'updateUserById',
        targetUserId,
        updateData,
        version,
      },
      UserController.name,
    );

    const result = await this.userService.updateUserById(
      targetUserId,
      updateData,
      version,
    );
    this.respond(res, result);
  }
}
