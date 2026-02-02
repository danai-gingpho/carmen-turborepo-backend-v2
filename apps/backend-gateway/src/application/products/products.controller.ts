import {
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
import { ProductsService } from './products.service';
import { PaginateQuery } from 'src/shared-dto/paginate.dto';
import { IPaginateQuery } from 'src/shared-dto/paginate.dto';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { TenantHeaderGuard } from 'src/common/guard/tenant-header.guard';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import {
  BaseHttpController,
  Serialize,
  ZodSerializerInterceptor,
  ProductLocationListItemResponseSchema,
} from '@/common';

@Controller('api')
@ApiTags('Application - Products')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard, TenantHeaderGuard)
@ApiBearerAuth()
export class ProductsController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    ProductsController.name,
  );

  constructor(private readonly productService: ProductsService) {
    super();
  }

  @Get(':bu_code/products/locations/:id')
  @UseGuards(new AppIdGuard('products.getByLocation'))
  @Serialize(ProductLocationListItemResponseSchema)
  @ApiVersionMinRequest()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all products by location id',
    description: 'Retrieves all products by location id',
    operationId: 'findAllProductsByLocationId',
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
        description: 'The products were successfully retrieved',
      },
      404: {
        description: 'The products were not found',
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async GetByLocation(
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: IPaginateQuery,
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'GetByLocation',
        id,
        version,
      },
      ProductsController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.productService.getByLocation(
      user_id,
      bu_code,
      id,
      paginate,
      version,
    );
    this.respond(res, result);
  }
}
