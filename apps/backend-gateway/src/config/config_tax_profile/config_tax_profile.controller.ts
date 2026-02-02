import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  Delete,
  UseGuards,
  UseInterceptors,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  ConsoleLogger,
  Query,
  Patch,
} from '@nestjs/common';
import { Response } from 'express';
import { Config_TaxProfileService } from './config_tax_profile.service';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  BaseHttpController,
  TaxProfileCreateDto,
  TaxProfileUpdateDto,
  IUpdateTaxProfile,
  Serialize,
  ZodSerializerInterceptor,
  TaxProfileDetailResponseSchema,
  TaxProfileListItemResponseSchema,
  TaxProfileMutationResponseSchema,
} from '@/common';
import { TenantHeaderGuard } from 'src/common/guard/tenant-header.guard';
import {
  ApiVersionMinRequest,
  ApiUserFilterQueries,
} from 'src/common/decorator/userfilter.decorator';
import { PaginateQuery } from 'src/shared-dto/paginate.dto';
import { IPaginateQuery } from 'src/shared-dto/paginate.dto';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';

@ApiTags('Config - Tax Profile')
@ApiHeaderRequiredXAppId()
@Controller('api/config/:bu_code/tax-profile')
@UseGuards(KeycloakGuard, TenantHeaderGuard)
@ApiBearerAuth()
export class Config_TaxProfileController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_TaxProfileController.name,
  );
  constructor(
    private readonly configTaxProfileService: Config_TaxProfileService,
  ) {
    super();
  }

  @Get(':id')
  @UseGuards(new AppIdGuard('taxProfile.findOne'))
  @Serialize(TaxProfileDetailResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        version,
      },
      Config_TaxProfileController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.configTaxProfileService.findOne(
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
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query() query?: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAll',
        query,
        version,
      },
      Config_TaxProfileController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.configTaxProfileService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  @Post()
  @UseGuards(new AppIdGuard('taxProfile.create'))
  @Serialize(TaxProfileMutationResponseSchema)
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  async create(
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Body() createDto: TaxProfileCreateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      Config_TaxProfileController.name,
    );
    const { user_id } = ExtractRequestHeader(req);

    const result = await this.configTaxProfileService.create(
      createDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Patch(':id')
  @UseGuards(new AppIdGuard('taxProfile.update'))
  @Serialize(TaxProfileMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async update(
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Body() updateDto: TaxProfileUpdateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateDto,
        version,
      },
      Config_TaxProfileController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const data: IUpdateTaxProfile = {
      ...updateDto,
      id: id,
    };
    const result = await this.configTaxProfileService.update(
      id,
      data,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Delete(':id')
  @UseGuards(new AppIdGuard('taxProfile.delete'))
  @Serialize(TaxProfileMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async delete(
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'delete',
        id,
        version,
      },
      Config_TaxProfileController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.configTaxProfileService.delete(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }
}
