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
import { Config_ProductCategoryService } from './config_product-category.service';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  BaseHttpController,
  IUpdateProductCategory,
  ProductCategoryCreateDto,
  ProductCategoryUpdateDto,
  Serialize,
  ZodSerializerInterceptor,
  ProductCategoryDetailResponseSchema,
  ProductCategoryListItemResponseSchema,
  ProductCategoryMutationResponseSchema,
} from '@/common';
import { TenantHeaderGuard } from 'src/common/guard/tenant-header.guard';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import {
  IPaginate,
  IPaginateQuery,
  PaginateQuery,
} from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';

@Controller('api/config/:bu_code/products/category')
@ApiTags('Config - Product Category')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard, TenantHeaderGuard)
@ApiBearerAuth()
export class Config_ProductCategoryController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_ProductCategoryController.name,
  );

  constructor(
    private readonly config_productCategoryService: Config_ProductCategoryService,
  ) {
    super();
  }

  @Get(':id')
  @UseGuards(new AppIdGuard('productCategory.findOne'))
  @Serialize(ProductCategoryDetailResponseSchema)
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
      Config_ProductCategoryController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_productCategoryService.findOne(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Get()
  @UseGuards(new AppIdGuard('productCategory.findAll'))
  @Serialize(ProductCategoryListItemResponseSchema)
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
      Config_ProductCategoryController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.config_productCategoryService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  @Post()
  @UseGuards(new AppIdGuard('productCategory.create'))
  @Serialize(ProductCategoryMutationResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Body() createDto: ProductCategoryCreateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      Config_ProductCategoryController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_productCategoryService.create(
      createDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Put(':id')
  @UseGuards(new AppIdGuard('productCategory.update'))
  @Serialize(ProductCategoryMutationResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  async update(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: ProductCategoryUpdateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateDto,
        version,
      },
      Config_ProductCategoryController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const data: IUpdateProductCategory = {
      ...updateDto,
      id,
    };
    const result = await this.config_productCategoryService.update(
      data,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Delete(':id')
  @UseGuards(new AppIdGuard('productCategory.delete'))
  @Serialize(ProductCategoryMutationResponseSchema)
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
      Config_ProductCategoryController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_productCategoryService.delete(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }
}
