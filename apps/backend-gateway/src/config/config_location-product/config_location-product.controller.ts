import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Config_LocationProductService } from './config_location-product.service';
import { ZodSerializerInterceptor } from '@/common';
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

@Controller('api/config/:bu_code/location-product')
@ApiTags('Config - Location Product')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard, TenantHeaderGuard)
@ApiBearerAuth()
export class Config_LocationProductController {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_LocationProductController.name,
  );

  constructor(
    private readonly config_locationProductService: Config_LocationProductService,
  ) {}

  @Get(':locationId')
  @UseGuards(new AppIdGuard('locationProduct.getProductByLocationId'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get a product by location ID',
    description: 'Get a product by location ID',
    operationId: 'getProductByLocationId',
    tags: ['config-location-product', '[Method] Get - Config'],
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: 'locationId',
        in: 'path',
        required: true,
      },
    ],
    responses: {
      200: {
        description: 'Product retrieved successfully',
      },
    },
  })
  async getProductByLocationId(
    @Req() req: Request,
    @Param('locationId') locationId: string,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'getProductByLocationId',
        locationId,
        version,
      },
      Config_LocationProductController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    return this.config_locationProductService.getProductByLocationId(
      locationId,
      user_id,
      bu_code,
      version,
    );
  }
}
