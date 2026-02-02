import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Query,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { PriceListTemplateService } from './price-list-template.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TenantHeaderGuard } from 'src/common/guard/tenant-header.guard';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { IPaginateQuery } from 'src/shared-dto/paginate.dto';
import { PaginateQuery } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import {
  BaseHttpController,
  ZodSerializerInterceptor,
  PriceListTemplateDetailResponseSchema,
  PriceListTemplateListItemResponseSchema,
  PriceListTemplateMutationResponseSchema,
  Serialize,
} from '@/common';

@Controller('api/:bu_code/price-list-template')
@ApiTags('Application - Price List Template')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard, TenantHeaderGuard)
@ApiBearerAuth()
export class PriceListTemplateController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    PriceListTemplateController.name,
  );

  constructor(
    private readonly priceListTemplateService: PriceListTemplateService,
  ) {
    super();
    this.logger.debug('PriceListTemplateController initialized');
  }

  @Get(':id')
  @UseGuards(new AppIdGuard('priceListTemplate.findOne'))
  @Serialize(PriceListTemplateDetailResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get price list template by ID',
    description: 'Retrieves price list template by ID',
    operationId: 'findOnePriceListTemplate',
    tags: ['Application - Price List Template', '[Method] Get'],
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
        description: 'Price list template was successfully retrieved',
      },
      404: {
        description: 'Price list template was not found',
      },
    },
  })
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
      PriceListTemplateController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.priceListTemplateService.findOne(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Get()
  @UseGuards(new AppIdGuard('priceListTemplate.findAll'))
  @Serialize(PriceListTemplateListItemResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get all price list templates',
    description: 'Retrieves all price list templates with pagination',
    operationId: 'findAllPriceListTemplates',
    tags: ['Application - Price List Template', '[Method] Get'],
    deprecated: false,
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
        description: 'The version of the API',
        example: 'latest',
      },
    ],
    responses: {
      200: {
        description: 'Price list templates were successfully retrieved',
      },
    },
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
      PriceListTemplateController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.priceListTemplateService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  @Post()
  @UseGuards(new AppIdGuard('priceListTemplate.create'))
  @Serialize(PriceListTemplateMutationResponseSchema)
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Create a new price list template',
    description: 'Creates a new price list template',
    operationId: 'createPriceListTemplate',
    tags: ['Application - Price List Template', '[Method] Post'],
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    responses: {
      201: {
        description: 'Price list template was successfully created',
      },
      400: {
        description: 'Bad request',
      },
    },
  })
  async create(
    @Body() data: any,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        data,
        version,
      },
      PriceListTemplateController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.priceListTemplateService.create(data, user_id, bu_code, version);
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Patch(':id')
  @UseGuards(new AppIdGuard('priceListTemplate.update'))
  @Serialize(PriceListTemplateMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Update a price list template',
    description: 'Updates an existing price list template',
    operationId: 'updatePriceListTemplate',
    tags: ['Application - Price List Template', '[Method] Patch'],
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
        description: 'Price list template was successfully updated',
      },
      404: {
        description: 'Price list template was not found',
      },
    },
  })
  async update(
    @Param('id') id: string,
    @Body() data: any,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        data,
        version,
      },
      PriceListTemplateController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.priceListTemplateService.update(
      { ...data, id },
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Delete(':id')
  @UseGuards(new AppIdGuard('priceListTemplate.delete'))
  @Serialize(PriceListTemplateMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Delete a price list template',
    description: 'Deletes an existing price list template',
    operationId: 'deletePriceListTemplate',
    tags: ['Application - Price List Template', '[Method] Delete'],
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
        description: 'Price list template was successfully deleted',
      },
      404: {
        description: 'Price list template was not found',
      },
    },
  })
  async remove(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'remove',
        id,
        version,
      },
      PriceListTemplateController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.priceListTemplateService.remove(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Patch(':id/status')
  @UseGuards(new AppIdGuard('priceListTemplate.updateStatus'))
  @Serialize(PriceListTemplateMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Update price list template status',
    description: 'Updates the status of a price list template (draft/active/inactive)',
    operationId: 'updatePriceListTemplateStatus',
    tags: ['Application - Price List Template', '[Method] Patch'],
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
        description: 'Price list template status was successfully updated',
      },
      404: {
        description: 'Price list template was not found',
      },
    },
  })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'updateStatus',
        id,
        status,
        version,
      },
      PriceListTemplateController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.priceListTemplateService.updateStatus(
      id,
      status,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }
}
