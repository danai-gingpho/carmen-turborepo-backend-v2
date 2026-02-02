import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  ConsoleLogger,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { Config_ProductsService } from './config_products.service';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  IUpdateProduct,
  ProductCreateDto,
  ProductUpdateDto,
  Serialize,
  ZodSerializerInterceptor,
  ProductDetailResponseSchema,
  ProductListItemResponseSchema,
  ProductItemGroupResponseSchema,
  ProductMutationResponseSchema,
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

@Controller('api/config/:bu_code/products')
@ApiTags('Config - Products')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard, TenantHeaderGuard)
@ApiBearerAuth()
export class Config_ProductsController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_ProductsController.name,
  );

  constructor(
    private readonly config_productsService: Config_ProductsService,
  ) {
    super();
  }

  @Get(':id')
  @UseGuards(new AppIdGuard('product.findOne'))
  @Serialize(ProductDetailResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
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
      Config_ProductsController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_productsService.findOne(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Get()
  @UseGuards(new AppIdGuard('product.findAll'))
  @Serialize(ProductListItemResponseSchema)
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
      Config_ProductsController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.config_productsService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );

    this.respond(res, result);
  }

  @Get('item-group/:id')
  @UseGuards(new AppIdGuard('product.findItemGroup'))
  @Serialize(ProductItemGroupResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  async findItemGroup(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findItemGroup',
        id,
        version,
      },
      Config_ProductsController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_productsService.findItemGroup(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  // @Get('by-item-group-id/:id')
  // async getByItemsGroup(@Param('id') id: string) {
  //   this.logger.debug({
  //     file: ProductsController.name,
  //     function: this.getByItemsGroup.name,
  //   });
  //   // return this.productsService.getByItemsGroup(id);
  // }

  // @Get('order-unit/:id')
  // async getOrderUnitByProductId(@Param('id') id: string) {
  //   this.logger.debug({
  //     file: ProductsController.name,
  //     function: this.getOrderUnitByProductId.name,
  //   });
  //   // return this.productsService.getOrderUnitByProductId(id);
  // }

  // @Get('ingredient-unit/:id')
  // async getIngredientUnitByProductId(@Param('id') id: string) {
  //   this.logger.debug({
  //     file: ProductsController.name,
  //     function: this.getIngredientUnitByProductId.name,
  //   });
  //   // return this.productsService.getIngredientUnitByProductId(id);
  // }

  @Post()
  @UseGuards(new AppIdGuard('product.create'))
  @Serialize(ProductMutationResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Body() createDto: ProductCreateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      Config_ProductsController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_productsService.create(
      createDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Patch(':id')
  @UseGuards(new AppIdGuard('product.update'))
  @Serialize(ProductMutationResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  async update(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: ProductUpdateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateDto,
        version,
      },
      Config_ProductsController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const data: IUpdateProduct = {
      ...updateDto,
      id,
    };
    const result = await this.config_productsService.update(
      data,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Delete(':id')
  @UseGuards(new AppIdGuard('product.delete'))
  @Serialize(ProductMutationResponseSchema)
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
      Config_ProductsController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_productsService.delete(id, user_id, bu_code, version);
    this.respond(res, result);
  }
}
