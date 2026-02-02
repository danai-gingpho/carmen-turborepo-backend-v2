import {
  Controller,
  Get,
  HttpStatus,
  HttpCode,
  Param,
  Req,
  UseGuards,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { Config_ProductLocationService } from './config_product-location.service';
import { ZodSerializerInterceptor } from '@/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { TenantHeaderGuard } from 'src/common/guard/tenant-header.guard';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';

@Controller('api/config/:bu_code/product/location')
@ApiTags('Config - Product Location')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard, TenantHeaderGuard)
@ApiBearerAuth()
export class Config_ProductLocationController {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_ProductLocationController.name,
  );

  constructor(
    private readonly config_productLocationService: Config_ProductLocationService,
  ) {}

  @Get(':productId')
  @UseGuards(new AppIdGuard('productLocation.getLocationsByProductId'))
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  async getLocationsByProductId(
    @Param('productId') productId: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Query('version') version: string = 'latest',
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'getLocationsByProductId',
        productId,
        version,
      },
      Config_ProductLocationController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    return this.config_productLocationService.getLocationsByProductId(
      productId,
      user_id,
      bu_code,
      version,
    );
  }
}
