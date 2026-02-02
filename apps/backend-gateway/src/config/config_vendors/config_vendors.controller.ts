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
  HttpCode,
  HttpStatus,
  ConsoleLogger,
  Req,
  Res,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { Config_VendorsService } from './config_vendors.service';
import { ApiTags, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  IUpdateVendor,
  VendorCreateDto,
  VendorUpdateDto,
  Serialize,
  ZodSerializerInterceptor,
  VendorDetailResponseSchema,
  VendorListItemResponseSchema,
  VendorMutationResponseSchema,
  BaseHttpController,
} from '@/common';
import { TenantHeaderGuard } from 'src/common/guard/tenant-header.guard';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { IPaginateQuery } from 'src/shared-dto/paginate.dto';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { PaginateQuery } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';

@Controller('api/config/:bu_code/vendors')
@ApiTags('Config - Vendors')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard, TenantHeaderGuard)
@ApiBearerAuth()
export class Config_VendorsController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_VendorsController.name,
  );

  constructor(private readonly config_vendorsService: Config_VendorsService) {
    super();
  }

  @Get(':id')
  @UseGuards(new AppIdGuard('vendor.findOne'))
  @Serialize(VendorDetailResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        version,
      },
      Config_VendorsController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_vendorsService.findOne(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Get()
  @UseGuards(new AppIdGuard('vendor.findAll'))
  @Serialize(VendorListItemResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiUserFilterQueries()
  async findAll(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query() query?: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAll',
        query,
        version,
      },
      Config_VendorsController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.config_vendorsService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  @Post()
  @UseGuards(new AppIdGuard('vendor.create'))
  @Serialize(VendorMutationResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Body() createDto: VendorCreateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      Config_VendorsController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_vendorsService.create(
      createDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Put(':id')
  @UseGuards(new AppIdGuard('vendor.update'))
  @Serialize(VendorMutationResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  async update(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: VendorUpdateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateDto,
        version,
      },
      Config_VendorsController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const data: IUpdateVendor = {
      ...updateDto,
      id,
    };
    const result = await this.config_vendorsService.update(data, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Delete(':id')
  @UseGuards(new AppIdGuard('vendor.delete'))
  @Serialize(VendorMutationResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  async delete(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'delete',
        id,
        version,
      },
      Config_VendorsController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_vendorsService.delete(id, user_id, bu_code, version);
    this.respond(res, result);
  }
}
