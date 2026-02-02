import {
  Controller,
  Get,
  Param,
  Put,
  Body,
  UseGuards,
  Req,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { Config_LocationsUserService } from './config_locations-user.service';
import { ZodSerializerInterceptor } from '@/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
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

@Controller('api/config/:bu_code/locations/user')
@ApiTags('Config - Location User')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard, TenantHeaderGuard)
@ApiBearerAuth()
export class Config_LocationsUserController {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_LocationsUserController.name,
  );

  constructor(
    private readonly config_locationsUserService: Config_LocationsUserService,
  ) {}

  @Get(':userId')
  @UseGuards(new AppIdGuard('locationUser.getLocationByUserId'))
  @ApiVersionMinRequest()
  async getLocationByUserId(
    @Param('userId') userId: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Query('version') version: string = 'latest',
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'getLocationByUserId',
        userId,
        version,
      },
      Config_LocationsUserController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    return this.config_locationsUserService.getLocationByUserId(
      userId,
      user_id,
      bu_code,
      version,
    );
  }

  @Put(':userId')
  @UseGuards(new AppIdGuard('locationUser.managerLocationUser'))
  @ApiVersionMinRequest()
  async managerLocationUser(
    @Param('userId') userId: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: any,
    @Req() req: Request,
    @Query('version') version: string = 'latest',
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'managerLocationUser',
        userId,
        version,
      },
      Config_LocationsUserController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    return this.config_locationsUserService.managerLocationUser(
      userId,
      updateDto,
      user_id,
      bu_code,
      version,
    );
  }
}
