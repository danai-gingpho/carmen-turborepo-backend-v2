import {
  ConsoleLogger,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { CurrenciesService } from './currencies.service';
import {
  BaseHttpController,
  Serialize,
  ZodSerializerInterceptor,
  CurrencyDetailResponseSchema,
  CurrencyListItemResponseSchema,
} from '@/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { TenantHeaderGuard } from 'src/common/guard/tenant-header.guard';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { IPaginateQuery, PaginateQuery } from 'src/shared-dto/paginate.dto';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';

@Controller('api')
@ApiTags('Application - Currencies')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard, TenantHeaderGuard)
@ApiBearerAuth()
export class CurrenciesController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    CurrenciesController.name,
  );

  constructor(private readonly currenciesService: CurrenciesService) {
    super();
  }

  @Get(':bu_code/currencies')
  @UseGuards(new AppIdGuard('currencies.findAllActive'))
  @Serialize(CurrencyListItemResponseSchema)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all active currencies',
    description: 'Get all active currencies',
    tags: ['[Method] Get'],
  })
  async findAllActive(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query() query: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAllActive',
        query,
        version,
      },
      CurrenciesController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.currenciesService.findAllActive(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  @Get('iso')
  @UseGuards(new AppIdGuard('currencies.findAllISO'))
  @Serialize(CurrencyListItemResponseSchema)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all ISO currencies',
    description: 'Get all ISO currencies',
    tags: ['[Method] Get'],
  })
  async findAllISO(
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAllISO',
        query,
        version,
      },
      CurrenciesController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.currenciesService.findAllISO(user_id, paginate, version);
    this.respond(res, result);
  }

  @Get(':bu_code/currencies/default')
  @UseGuards(new AppIdGuard('currencies.default'))
  @Serialize(CurrencyDetailResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get default currency',
    description: 'Retrieve default currency',
    tags: ['[Method] Get'],
  })
  async currency_default(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'currency_default',
        version,
      },
      CurrenciesController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.currenciesService.getDefault(user_id, bu_code, version);
    this.respond(res, result);
  }

  @Get(':bu_code/currencies/:id')
  @UseGuards(new AppIdGuard('currencies.findOne'))
  @Serialize(CurrencyDetailResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a currency by ID',
    description: 'Retrieve a currency by its unique identifier',
    tags: ['[Method] Get'],
  })
  async findOne(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Param('id') id: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        version,
      },
      CurrenciesController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.currenciesService.findOne(id, user_id, bu_code, version);
    this.respond(res, result);
  }


}
