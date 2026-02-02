import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  Delete,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  ConsoleLogger,
  Query,
  Patch,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { Config_VendorBusinessTypeService } from './config_vendor_business_type.service';
import { ZodSerializerInterceptor, BaseHttpController } from '@/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  VendorBusinessTypeCreateDto,
  VendorBusinessTypeUpdateDto,
  IUpdateVendorBusinessType,
} from './dto/vendor_business_type.dto';
import { TenantHeaderGuard } from 'src/common/guard/tenant-header.guard';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { PaginateQuery } from 'src/shared-dto/paginate.dto';
import { IPaginateQuery } from 'src/shared-dto/paginate.dto';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';

@Controller('api/config/:bu_code/vendor-business-type')
@ApiTags('Config - Vendor Business Type')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard, TenantHeaderGuard)
@ApiBearerAuth()
export class Config_VendorBusinessTypeController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_VendorBusinessTypeController.name,
  );
  constructor(
    private readonly configVendorBusinessTypeService: Config_VendorBusinessTypeService,
  ) {
    super();
  }

  @Get(':id')
  @UseGuards(new AppIdGuard('vendorBusinessType.findOne'))
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
      Config_VendorBusinessTypeController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.configVendorBusinessTypeService.findOne(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Get()
  @UseGuards(new AppIdGuard('vendorBusinessType.findAll'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
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
      Config_VendorBusinessTypeController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.configVendorBusinessTypeService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  @Post()
  @UseGuards(new AppIdGuard('vendorBusinessType.create'))
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  async create(
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Body() createDto: VendorBusinessTypeCreateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      Config_VendorBusinessTypeController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.configVendorBusinessTypeService.create(
      createDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Patch(':id')
  @UseGuards(new AppIdGuard('vendorBusinessType.update'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async update(
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Body() updateDto: VendorBusinessTypeUpdateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateDto,
        version,
      },
      Config_VendorBusinessTypeController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const data: IUpdateVendorBusinessType = {
      ...updateDto,
      id,
    };
    const result = await this.configVendorBusinessTypeService.update(
      data,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Delete(':id')
  @UseGuards(new AppIdGuard('vendorBusinessType.delete'))
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
      Config_VendorBusinessTypeController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.configVendorBusinessTypeService.delete(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }
}
