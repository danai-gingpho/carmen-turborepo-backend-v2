import {
  Controller,
  Get,
  Param,
  HttpCode,
  HttpStatus,
  Query,
  Post,
  UseGuards,
  Req,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  BaseHttpController,
  ZodSerializerInterceptor,
} from '@/common';
import { ApiVersionMinRequest } from 'src/common/decorator/userfilter.decorator';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { CheckPriceListService } from './check-price-list.service';
import { IgnoreGuards } from 'src/auth/decorators/ignore-guard.decorator';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { UrlTokenGuard } from 'src/auth/guards/url-token.guard';

@Controller('api/check-price-list')
@ApiTags('Public - Check Price List')
@ApiHeaderRequiredXAppId()
@IgnoreGuards(KeycloakGuard)
@UseGuards(UrlTokenGuard)
export class CheckPriceListController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    CheckPriceListController.name,
  );

  constructor(private readonly checkPriceListService: CheckPriceListService) {
    super();
    this.logger.debug('CheckPriceListController initialized');
  }

  @Post(':url_token')
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Check price list by URL token',
    description:
      'Validates the URL token from tb_shot_url table and returns decoded token data',
    operationId: 'checkPriceListByUrlToken',
    tags: ['Public - Check Price List', '[Method] Get'],
    deprecated: false,
    parameters: [
      {
        name: 'url_token',
        in: 'path',
        required: true,
        description: 'The URL token to validate',
      },
    ],
    responses: {
      200: {
        description: 'URL token is valid and token data returned',
      },
      401: {
        description: 'URL token is invalid or expired',
      },
      404: {
        description: 'URL token not found',
      },
    },
  })
  async checkPriceList(
    @Param('url_token') urlToken: string,
    @Query('version') version: string = 'latest',
    @Req() request: Request,
    @Res() res: Response,
  ): Promise<void> {
    const decodedToken = (request as any).decodedToken;

    this.logger.debug(
      {
        function: 'checkPriceList',
        url_token: urlToken,
        version,
        decodedToken,
      },
      CheckPriceListController.name,
    );

    const result = await this.checkPriceListService.checkPriceList(urlToken, version, decodedToken);
    this.respond(res, result);
  }
}
