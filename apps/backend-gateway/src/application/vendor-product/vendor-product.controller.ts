import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { VendorProductService } from './vendor-product.service';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { TenantHeaderGuard } from 'src/common/guard/tenant-header.guard';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import {
  BaseHttpController,
  ZodSerializerInterceptor,
} from '@/common';

@Controller('api/:bu_code/vendor-product')
@ApiTags('Application - Vendor Product')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard, TenantHeaderGuard)
@ApiBearerAuth()
export class VendorProductController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    VendorProductController.name,
  );

  constructor(private readonly vendorProductService: VendorProductService) {
    super();
  }

  @Get(':id')
  @UseGuards(new AppIdGuard('vendorProduct.findOne'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get vendor product by ID',
    description: 'Get vendor product by ID',
    operationId: 'getVendorProductById',
    tags: ['[Method] Get'],
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
      },
    ],
    responses: {
      200: {
        description: 'Vendor product retrieved successfully',
      },
      404: {
        description: 'Vendor product not found',
      },
    },
  })
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
      VendorProductController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.vendorProductService.findOne(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Get()
  @UseGuards(new AppIdGuard('vendorProduct.findAll'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get all vendor products',
    description: 'Get all vendor products',
    operationId: 'getAllVendorProducts',
    tags: ['[Method] Get'],
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
      },
    ],
    responses: {
      200: {
        description: 'Vendor products retrieved successfully',
      },
      404: {
        description: 'Vendor products not found',
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAll',
        version,
      },
      VendorProductController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.vendorProductService.findAll(user_id, bu_code, version);
    this.respond(res, result);
  }

  @Post()
  @UseGuards(new AppIdGuard('vendorProduct.create'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Create a vendor product',
    description: 'Create a vendor product',
    operationId: 'createVendorProduct',
    tags: ['[Method] Post'],
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
      },
    ],
    responses: {
      201: {
        description: 'Vendor product created successfully',
      },
      404: {
        description: 'Vendor product not found',
      },
    },
  })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        version,
      },
      VendorProductController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.vendorProductService.create(user_id, bu_code, version);
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Put(':id')
  @UseGuards(new AppIdGuard('vendorProduct.update'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Update a vendor product',
    description: 'Update a vendor product',
    operationId: 'updateVendorProduct',
    tags: ['[Method] Put'],
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
      },
    ],
    responses: {
      200: {
        description: 'Vendor product updated successfully',
      },
      404: {
        description: 'Vendor product not found',
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        version,
      },
      VendorProductController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.vendorProductService.update(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Delete(':id')
  @UseGuards(new AppIdGuard('vendorProduct.delete'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Delete a vendor product',
    description: 'Delete a vendor product',
    operationId: 'deleteVendorProduct',
    tags: ['[Method] Delete'],
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
      },
    ],
    responses: {
      200: {
        description: 'Vendor product deleted successfully',
      },
      404: {
        description: 'Vendor product not found',
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string,
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'delete',
        id,
        version,
      },
      VendorProductController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.vendorProductService.delete(id, user_id, bu_code, version);
    this.respond(res, result);
  }
}
