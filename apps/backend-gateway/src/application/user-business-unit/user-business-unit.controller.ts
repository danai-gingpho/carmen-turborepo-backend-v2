import {
  Controller,
  Param,
  Post,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Query,
  Body,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { UserBusinessUnitService } from './user-business-unit.service';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { TenantHeaderGuard } from 'src/common/guard/tenant-header.guard';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import {
  BaseHttpController,
  ZodSerializerInterceptor,
} from '@/common';

@Controller('api/business-unit')
@ApiTags('Application - User Business Unit')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class UserBusinessUnitController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    UserBusinessUnitController.name,
  );

  constructor(
    private readonly userBusinessUnitService: UserBusinessUnitService,
  ) {
    super();
  }

  @Post('default')
  @UseGuards(new AppIdGuard('userBusinessUnit.setDefaultTenant'))
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Set default tenant',
    description: 'Set default tenant',
    operationId: 'setDefaultTenant',
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
      },
    ],
    responses: {
      200: {
        description: 'Default tenant set successfully',
      },
      404: {
        description: 'Default tenant not found',
      },
    },
  })
  async setDefaultTenant(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: { tenant_id: string },
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'setDefaultTenant',
        version,
      },
      UserBusinessUnitController.name,
    );

    const { user_id, tenant_id } = ExtractRequestHeader(req);
    const result = await this.userBusinessUnitService.setDefaultTenant(
      user_id,
      body.tenant_id,
      version,
    );
    this.respond(res, result);
  }

  // @Get()
  // @ApiVersionMinRequest()
  // @HttpCode(HttpStatus.OK)
  // async getBusinessUnit(@Req() req: Request, @Query('version') version: string = 'latest') {
  //   const {user_id} = ExtractRequestHeader(req);
  //   return this.userBusinessUnitService.getBusinessUnit(user_id, version);
  // }
}
