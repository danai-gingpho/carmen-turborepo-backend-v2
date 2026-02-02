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
import { Config_UserLocationService } from './config_user-location.service';
import { ZodSerializerInterceptor } from '@/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { TenantHeaderGuard } from 'src/common/guard/tenant-header.guard';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';

@Controller('api/config/:bu_code/user/location')
@ApiTags('Config - User Location')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard, TenantHeaderGuard)
@ApiBearerAuth()
export class Config_UserLocationController {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_UserLocationController.name,
  );
  constructor(
    private readonly config_userLocationService: Config_UserLocationService,
  ) {}

  @Get(':locationId')
  @UseGuards(new AppIdGuard('userLocation.getUsersByLocationId'))
  @ApiVersionMinRequest()
  async getUsersByLocationId(
    @Param('bu_code') bu_code: string,
    @Param('locationId') locationId: string,
    @Req() req: Request,
    @Query('version') version: string = 'latest',
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'getUsersByLocationId',
        locationId,
        version,
      },
      Config_UserLocationController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    return this.config_userLocationService.getUsersByLocationId(
      locationId,
      user_id,
      bu_code,
      version,
    );
  }

  @Put(':locationId')
  @UseGuards(new AppIdGuard('userLocation.managerUserLocation'))
  @ApiVersionMinRequest()
  async managerUserLocation(
    @Param('bu_code') bu_code: string,
    @Param('locationId') locationId: string,
    @Body() updateDto: any,
    @Req() req: Request,
    @Query('version') version: string = 'latest',
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'managerUserLocation',
        locationId,
        updateDto,
        version,
      },
      Config_UserLocationController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    return this.config_userLocationService.managerUserLocation(
      locationId,
      updateDto,
      user_id,
      bu_code,
      version,
    );
  }
}
