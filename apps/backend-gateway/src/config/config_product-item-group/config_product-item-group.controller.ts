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
  Req,
  Res,
  HttpStatus,
  HttpCode,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { Config_ProductItemGroupService } from './config_product-item-group.service';
import { ApiTags, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  BaseHttpController,
  IUpdateProductItemGroup,
  ProductItemGroupCreateDto,
  ProductItemGroupUpdateDto,
  Serialize,
  ZodSerializerInterceptor,
  ProductItemGroupDetailResponseSchema,
  ProductItemGroupListItemResponseSchema,
  ProductItemGroupMutationResponseSchema,
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

@Controller('api/config/:bu_code/products/item-group')
@ApiTags('Config - Product Item Group')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard, TenantHeaderGuard)
@ApiBearerAuth()
export class Config_ProductItemGroupController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_ProductItemGroupController.name,
  );

  constructor(
    private readonly config_productItemGroupService: Config_ProductItemGroupService,
  ) {
    super();
  }

  @Get(':id')
  @UseGuards(new AppIdGuard('productItemGroup.findOne'))
  @Serialize(ProductItemGroupDetailResponseSchema)
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
      Config_ProductItemGroupController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_productItemGroupService.findOne(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Get()
  @UseGuards(new AppIdGuard('productItemGroup.findAll'))
  @Serialize(ProductItemGroupListItemResponseSchema)
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
      Config_ProductItemGroupController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.config_productItemGroupService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  @Post()
  @UseGuards(new AppIdGuard('productItemGroup.create'))
  @Serialize(ProductItemGroupMutationResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Body() createDto: ProductItemGroupCreateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      Config_ProductItemGroupController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_productItemGroupService.create(
      createDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Put(':id')
  @UseGuards(new AppIdGuard('productItemGroup.update'))
  @Serialize(ProductItemGroupMutationResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  async update(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: ProductItemGroupUpdateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateDto,
        version,
      },
      Config_ProductItemGroupController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const data: IUpdateProductItemGroup = {
      ...updateDto,
      id,
    };
    const result = await this.config_productItemGroupService.update(
      data,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Delete(':id')
  @UseGuards(new AppIdGuard('productItemGroup.delete'))
  @Serialize(ProductItemGroupMutationResponseSchema)
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
      Config_ProductItemGroupController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_productItemGroupService.delete(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }
}
