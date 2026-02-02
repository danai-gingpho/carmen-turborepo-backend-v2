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
  ConsoleLogger,
  HttpCode,
  HttpStatus,
  Req,
  Res,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { Config_ProductSubCategoryService } from './config_product-sub-category.service';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  BaseHttpController,
  IUpdateProductSubCategory,
  ProductSubCategoryCreateDto,
  ProductSubCategoryUpdateDto,
  Serialize,
  ZodSerializerInterceptor,
  ProductSubCategoryDetailResponseSchema,
  ProductSubCategoryListItemResponseSchema,
  ProductSubCategoryMutationResponseSchema,
} from '@/common';
import { TenantHeaderGuard } from 'src/common/guard/tenant-header.guard';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { PaginateQuery } from 'src/shared-dto/paginate.dto';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { IPaginateQuery } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';

@Controller('api/config/:bu_code/products/sub-category')
@ApiTags('Config - Product Sub Category')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard, TenantHeaderGuard)
@ApiBearerAuth()
export class Config_ProductSubCategoryController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_ProductSubCategoryController.name,
  );

  constructor(
    private readonly config_productSubCategoryService: Config_ProductSubCategoryService,
  ) {
    super();
  }

  @Get(':id')
  @UseGuards(new AppIdGuard('productSubCategory.findOne'))
  @Serialize(ProductSubCategoryDetailResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
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
      Config_ProductSubCategoryController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_productSubCategoryService.findOne(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Get()
  @UseGuards(new AppIdGuard('productSubCategory.findAll'))
  @Serialize(ProductSubCategoryListItemResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
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
      Config_ProductSubCategoryController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.config_productSubCategoryService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  @Post()
  @UseGuards(new AppIdGuard('productSubCategory.create'))
  @Serialize(ProductSubCategoryMutationResponseSchema)
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  async create(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Body() createDto: ProductSubCategoryCreateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      Config_ProductSubCategoryController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_productSubCategoryService.create(
      createDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Put(':id')
  @UseGuards(new AppIdGuard('productSubCategory.update'))
  @Serialize(ProductSubCategoryMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async update(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: ProductSubCategoryUpdateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateDto,
        version,
      },
      Config_ProductSubCategoryController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const data: IUpdateProductSubCategory = {
      ...updateDto,
      id,
    };
    const result = await this.config_productSubCategoryService.update(
      data,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Delete(':id')
  @UseGuards(new AppIdGuard('productSubCategory.delete'))
  @Serialize(ProductSubCategoryMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async remove(
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
      Config_ProductSubCategoryController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_productSubCategoryService.delete(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }
}
