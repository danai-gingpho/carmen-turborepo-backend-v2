import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { TaxProfileService } from './tax-profile.service';
import { CreateTaxProfileDto } from './dto/tax-profile.dto';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { TenantHeaderGuard } from 'src/common/guard/tenant-header.guard';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import {
  IPaginate,
  IPaginateQuery,
  PaginateQuery,
} from 'src/shared-dto/paginate.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiOperation } from '@nestjs/swagger';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import {
  BaseHttpController,
  Serialize,
  ZodSerializerInterceptor,
  TaxProfileDetailResponseSchema,
  TaxProfileListItemResponseSchema,
} from '@/common';

@Controller('api/:bu_code/tax-profile')
@ApiTags('Config - Tax Profile')
@ApiHeaderRequiredXAppId()
@ApiBearerAuth()
@UseGuards(KeycloakGuard, TenantHeaderGuard)
export class TaxProfileController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    TaxProfileController.name,
  );

  constructor(
    private readonly taxProfileService: TaxProfileService,
  ) {
    super();
  }

  @Get(':id')
  @UseGuards(new AppIdGuard('taxProfile.findOne'))
  @Serialize(TaxProfileDetailResponseSchema)
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        version,
      },
      TaxProfileController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.taxProfileService.findOne(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Get()
  @UseGuards(new AppIdGuard('taxProfile.findAll'))
  @Serialize(TaxProfileListItemResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all tax type inventories',
    description: 'Get all tax type inventories',
  })
  async findAll(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query() query: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAll',
        query,
        version,
      },
      TaxProfileController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.taxProfileService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }
}
