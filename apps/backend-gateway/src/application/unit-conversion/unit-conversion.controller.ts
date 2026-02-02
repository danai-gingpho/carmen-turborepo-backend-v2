import { Controller, Get, HttpCode, HttpStatus, Param, Query, Req, Res, UseGuards, UseInterceptors } from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { TenantHeaderGuard } from 'src/common/guard/tenant-header.guard';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { UnitConversionService } from './unit-conversion.service';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { TaxProfileController } from '../tax-profile/tax-profile.controller';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import {
  BaseHttpController,
  ZodSerializerInterceptor,
} from '@/common';

@Controller('api/:bu_code/unit')
@ApiTags('Config - Tax Profile')
@ApiHeaderRequiredXAppId()
@ApiBearerAuth()
@UseGuards(KeycloakGuard, TenantHeaderGuard)
export class UnitConversionController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    UnitConversionController.name,
  );

  constructor(
    private readonly unitConversionService: UnitConversionService,
  ) {
    super();
  }

  @Get('order/product/:productId')
  @HttpCode(HttpStatus.OK)
  async getOrderUnitProduct(
    @Param('productId') productId: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'getUnitProduct',
        productId,
        version,
      },
      UnitConversionController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.unitConversionService.getOrderUnitProduct(
      productId,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Get('ingredient/product/:productId')
  @HttpCode(HttpStatus.OK)
  async getIngredientUnitProduct(
    @Param('productId') productId: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'getIngredientUnitProduct',
        productId,
        version,
      },
      UnitConversionController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.unitConversionService.getIngredientUnitProduct(
      productId,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Get('available/product/:productId')
  @HttpCode(HttpStatus.OK)
  async getAvailableUnitProduct(
    @Param('productId') productId: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'getAvailableUnitProduct',
        productId,
        version,
      },
      UnitConversionController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.unitConversionService.getAvailableUnitProduct(
      productId,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }
}