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
import { RequestForPricingService } from './request-for-pricing.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TenantHeaderGuard } from 'src/common/guard/tenant-header.guard';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  ApiHeaderRequestTenantId,
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
} from '@/common';

@Controller('api/:bu_code/request-for-pricing')
@ApiTags('Application - Request For Pricing')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard, TenantHeaderGuard)
@ApiBearerAuth()
@ApiHeaderRequestTenantId()
export class RequestForPricingController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    RequestForPricingController.name,
  );

  constructor(
    private readonly requestForPricingService: RequestForPricingService,
  ) {
    super();
    this.logger.debug('RequestForPricingController initialized');
  }

  @Get(':id')
  @UseGuards(new AppIdGuard('requestForPricing.findOne'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get request for pricing by ID',
    description: 'Retrieves request for pricing by ID',
    operationId: 'findOneRequestForPricing',
    tags: ['Application - Request For Pricing', '[Method] Get'],
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
        description: 'Request for pricing was successfully retrieved',
      },
      404: {
        description: 'Request for pricing was not found',
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
      RequestForPricingController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.requestForPricingService.findOne(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Get()
  @UseGuards(new AppIdGuard('requestForPricing.findAll'))
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get all request for pricing',
    description: 'Retrieves all request for pricing with pagination',
    operationId: 'findAllRequestForPricing',
    tags: ['Application - Request For Pricing', '[Method] Get'],
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
        description: 'Request for pricing list was successfully retrieved',
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
      RequestForPricingController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.requestForPricingService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  @Post()
  @UseGuards(new AppIdGuard('requestForPricing.create'))
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Create a new request for pricing',
    description: 'Creates a new request for pricing',
    operationId: 'createRequestForPricing',
    tags: ['Application - Request For Pricing', '[Method] Post'],
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    responses: {
      201: {
        description: 'Request for pricing was successfully created',
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
      RequestForPricingController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.requestForPricingService.create(data, user_id, bu_code, version);
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Patch(':id')
  @UseGuards(new AppIdGuard('requestForPricing.update'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Update a request for pricing',
    description: 'Updates an existing request for pricing',
    operationId: 'updateRequestForPricing',
    tags: ['Application - Request For Pricing', '[Method] Patch'],
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
        description: 'Request for pricing was successfully updated',
      },
      404: {
        description: 'Request for pricing was not found',
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
      RequestForPricingController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.requestForPricingService.update(
      { ...data, id },
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Delete(':id')
  @UseGuards(new AppIdGuard('requestForPricing.delete'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Delete a request for pricing',
    description: 'Deletes an existing request for pricing',
    operationId: 'deleteRequestForPricing',
    tags: ['Application - Request For Pricing', '[Method] Delete'],
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
        description: 'Request for pricing was successfully deleted',
      },
      404: {
        description: 'Request for pricing was not found',
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
      RequestForPricingController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.requestForPricingService.remove(id, user_id, bu_code, version);
    this.respond(res, result);
  }
}
