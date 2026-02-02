import { Controller, Get, HttpCode, HttpStatus, Param, Query, Req, Res, UseGuards, UseInterceptors } from '@nestjs/common';
import { Response } from 'express';
import { UserLocationService } from './user-location.service';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ApiTags } from '@nestjs/swagger';
import { TenantHeaderGuard } from 'src/common/guard/tenant-header.guard';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import {
  BaseHttpController,
  ZodSerializerInterceptor,
} from '@/common';

@Controller('api/:bu_code/user-location')
@ApiTags('Config - Tax Type Inventory')
@ApiHeaderRequiredXAppId()
@ApiBearerAuth()
@UseGuards(KeycloakGuard, TenantHeaderGuard)
export class UserLocationController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    UserLocationController.name,
  );

  constructor(private readonly userLocationService: UserLocationService) {
    super();
  }

  @Get()
  @UseGuards(new AppIdGuard('userLocation.findAll'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiBearerAuth()
  async findAll(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAll',
        version,
      },
      UserLocationController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.userLocationService.findAll(user_id, bu_code, version);
    this.respond(res, result);
  }
}
