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
  Query,
  HttpStatus,
  HttpCode,
  Patch,
} from '@nestjs/common';
import { Response } from 'express';
import { SpotCheckService } from './spot-check.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  BaseHttpController,
} from '@/common';
import { TenantHeaderGuard } from 'src/common/guard/tenant-header.guard';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { IPaginateQuery, PaginateQuery } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';

@Controller('api')
@ApiTags('Application - Spot Check')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class SpotCheckController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    SpotCheckController.name,
  );

  constructor(
    private readonly spotCheckService: SpotCheckService,
  ) {
    super();
  }

  @Get('spot-check/pending')
  @UseGuards(new AppIdGuard('spotCheck.findAllPending.count'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async findAllPendingSpotCheckCount(
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAllPendingSpotCheckCount',
        version,
      },
      SpotCheckController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.spotCheckService.findAllPendingSpotCheckCount(
      user_id,
      version,
    );
    this.respond(res, result);
  }

  @Get(':bu_code/spot-check/:id')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('spotCheck.findOne'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
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
      SpotCheckController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.spotCheckService.findOne(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Get(':bu_code/spot-check/')
  @UseGuards(new AppIdGuard('spotCheck.findAll'))
  @UseGuards(TenantHeaderGuard)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @HttpCode(HttpStatus.OK)
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
      SpotCheckController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.spotCheckService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  @Post(':bu_code/spot-check')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('spotCheck.create'))
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  async create(
    @Body() createDto: any,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      SpotCheckController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.spotCheckService.create(
      createDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Patch(':bu_code/spot-check/:id')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('spotCheck.update'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async update(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: any,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateDto,
        version,
      },
      SpotCheckController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.spotCheckService.update(
      id,
      updateDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Delete(':bu_code/spot-check/:id')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('spotCheck.delete'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async delete(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'delete',
        id,
        version,
      },
      SpotCheckController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.spotCheckService.delete(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  // ==================== Spot Check Detail CRUD ====================

  @Get(':bu_code/spot-check/:id/details')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('spotCheck.findOne'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get all details for a Spot Check',
    description: 'Retrieves all line items/details for a specific Spot Check',
    operationId: 'findAllSpotCheckDetails',
    tags: ['[Method] Get', 'Spot Check Detail'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Spot Check ID' },
    ],
    responses: {
      200: { description: 'Spot Check details retrieved successfully' },
      404: { description: 'Spot Check not found' },
    },
  })
  @HttpCode(HttpStatus.OK)
  async findDetailsBySpotCheckId(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'findDetailsBySpotCheckId', id, version },
      SpotCheckController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.spotCheckService.findDetailsBySpotCheckId(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Get(':bu_code/spot-check/:id/details/:detail_id')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('spotCheck.findOne'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get a specific Spot Check detail by ID',
    description: 'Retrieves a single Spot Check detail/line item by its ID',
    operationId: 'findSpotCheckDetailById',
    tags: ['[Method] Get', 'Spot Check Detail'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Spot Check ID' },
      { name: 'detail_id', in: 'path', required: true, description: 'Spot Check Detail ID' },
    ],
    responses: {
      200: { description: 'Spot Check detail retrieved successfully' },
      404: { description: 'Spot Check detail not found' },
    },
  })
  @HttpCode(HttpStatus.OK)
  async findDetailById(
    @Param('id') id: string,
    @Param('detail_id') detailId: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'findDetailById', id, detailId, version },
      SpotCheckController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.spotCheckService.findDetailById(detailId, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Post(':bu_code/spot-check/:id/details')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('spotCheck.update'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Create a new Spot Check detail',
    description: 'Creates a new line item/detail for a Spot Check. Only works for Spot Checks in draft status.',
    operationId: 'createSpotCheckDetail',
    tags: ['[Method] Post', 'Spot Check Detail'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Spot Check ID' },
    ],
    responses: {
      201: { description: 'Spot Check detail created successfully' },
      400: { description: 'Cannot add detail to non-draft Spot Check' },
      404: { description: 'Spot Check not found' },
    },
  })
  @HttpCode(HttpStatus.CREATED)
  async createDetail(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Body() data: any,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'createDetail', id, data, version },
      SpotCheckController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.spotCheckService.createDetail(id, data, user_id, bu_code, version);
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Put(':bu_code/spot-check/:id/details/:detail_id')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('spotCheck.update'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Update a Spot Check detail',
    description: 'Updates an existing Spot Check detail/line item. Only works for Spot Checks in draft status.',
    operationId: 'updateSpotCheckDetail',
    tags: ['[Method] Put', 'Spot Check Detail'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Spot Check ID' },
      { name: 'detail_id', in: 'path', required: true, description: 'Spot Check Detail ID' },
    ],
    responses: {
      200: { description: 'Spot Check detail updated successfully' },
      400: { description: 'Cannot update detail of non-draft Spot Check' },
      404: { description: 'Spot Check detail not found' },
    },
  })
  @HttpCode(HttpStatus.OK)
  async updateDetail(
    @Param('id') id: string,
    @Param('detail_id') detailId: string,
    @Param('bu_code') bu_code: string,
    @Body() data: any,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'updateDetail', id, detailId, data, version },
      SpotCheckController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.spotCheckService.updateDetail(detailId, data, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Delete(':bu_code/spot-check/:id/details/:detail_id')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('spotCheck.update'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Delete a Spot Check detail',
    description: 'Deletes an existing Spot Check detail/line item. Only works for Spot Checks in draft status.',
    operationId: 'deleteSpotCheckDetail',
    tags: ['[Method] Delete', 'Spot Check Detail'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Spot Check ID' },
      { name: 'detail_id', in: 'path', required: true, description: 'Spot Check Detail ID' },
    ],
    responses: {
      200: { description: 'Spot Check detail deleted successfully' },
      400: { description: 'Cannot delete detail of non-draft Spot Check' },
      404: { description: 'Spot Check detail not found' },
    },
  })
  @HttpCode(HttpStatus.OK)
  async deleteDetail(
    @Param('id') id: string,
    @Param('detail_id') detailId: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'deleteDetail', id, detailId, version },
      SpotCheckController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.spotCheckService.deleteDetail(detailId, user_id, bu_code, version);
    this.respond(res, result);
  }

  // ==================== Mobile-specific endpoints ====================

  @Patch(':bu_code/spot-check/:id/save')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('spotCheck.save'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Save Spot Check items',
    description: 'Saves actual quantities for Spot Check items without submitting',
    operationId: 'saveSpotCheckItems',
    tags: ['[Method] Patch', 'Spot Check Mobile'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Spot Check ID' },
      { name: 'bu_code', in: 'path', required: true, description: 'Business Unit Code' },
    ],
    responses: {
      200: { description: 'Spot Check items saved successfully' },
      400: { description: 'Invalid request body' },
      404: { description: 'Spot Check not found' },
    },
  })
  @HttpCode(HttpStatus.OK)
  async saveItems(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Body() data: { items: Array<{ product_id: string; actual_qty: number }> },
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'saveItems', id, data, version },
      SpotCheckController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.spotCheckService.saveItems(id, data, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Patch(':bu_code/spot-check/:id/review')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('spotCheck.review'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Review Spot Check items',
    description: 'Reviews actual quantities for Spot Check items and returns difference list',
    operationId: 'reviewSpotCheckItems',
    tags: ['[Method] Patch', 'Spot Check Mobile'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Spot Check ID' },
      { name: 'bu_code', in: 'path', required: true, description: 'Business Unit Code' },
    ],
    responses: {
      200: { description: 'Spot Check items reviewed successfully with difference list' },
      400: { description: 'Invalid request body' },
      404: { description: 'Spot Check not found' },
    },
  })
  @HttpCode(HttpStatus.OK)
  async reviewItems(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Body() data: { items: Array<{ product_id: string; actual_qty: number }> },
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'reviewItems', id, data, version },
      SpotCheckController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.spotCheckService.reviewItems(id, data, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Get(':bu_code/spot-check/:id/review')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('spotCheck.getReview'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get Spot Check review result',
    description: 'Gets the review result with difference calculations for a Spot Check',
    operationId: 'getSpotCheckReview',
    tags: ['[Method] Get', 'Spot Check Mobile'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Spot Check ID' },
      { name: 'bu_code', in: 'path', required: true, description: 'Business Unit Code' },
    ],
    responses: {
      200: { description: 'Spot Check review result retrieved successfully' },
      404: { description: 'Spot Check not found' },
    },
  })
  @HttpCode(HttpStatus.OK)
  async getReview(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'getReview', id, version },
      SpotCheckController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.spotCheckService.getReview(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Patch(':bu_code/spot-check/:id/submit')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('spotCheck.submit'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Submit Spot Check',
    description: 'Submits a Spot Check for completion',
    operationId: 'submitSpotCheck',
    tags: ['[Method] Patch', 'Spot Check Mobile'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Spot Check ID' },
      { name: 'bu_code', in: 'path', required: true, description: 'Business Unit Code' },
    ],
    responses: {
      200: { description: 'Spot Check submitted successfully' },
      400: { description: 'Spot Check cannot be submitted' },
      404: { description: 'Spot Check not found' },
    },
  })
  @HttpCode(HttpStatus.OK)
  async submit(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'submit', id, version },
      SpotCheckController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.spotCheckService.submit(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Post(':bu_code/spot-check/:id/reset')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('spotCheck.reset'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Reset Spot Check',
    description: 'Resets a Spot Check to its initial state',
    operationId: 'resetSpotCheck',
    tags: ['[Method] Post', 'Spot Check Mobile'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Spot Check ID' },
      { name: 'bu_code', in: 'path', required: true, description: 'Business Unit Code' },
    ],
    responses: {
      200: { description: 'Spot Check reset successfully' },
      400: { description: 'Spot Check cannot be reset' },
      404: { description: 'Spot Check not found' },
    },
  })
  @HttpCode(HttpStatus.OK)
  async reset(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'reset', id, version },
      SpotCheckController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.spotCheckService.reset(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Get(':bu_code/locations/:location_id/products')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('spotCheck.getProductsByLocation'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get products by location',
    description: 'Gets all products available at a specific location for spot checking',
    operationId: 'getProductsByLocationId',
    tags: ['[Method] Get', 'Spot Check Mobile'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'location_id', in: 'path', required: true, description: 'Location ID' },
      { name: 'bu_code', in: 'path', required: true, description: 'Business Unit Code' },
    ],
    responses: {
      200: { description: 'Products retrieved successfully' },
      404: { description: 'Location not found' },
    },
  })
  @HttpCode(HttpStatus.OK)
  async getProductsByLocationId(
    @Param('location_id') locationId: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'getProductsByLocationId', locationId, version },
      SpotCheckController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.spotCheckService.getProductsByLocationId(locationId, user_id, bu_code, version);
    this.respond(res, result);
  }
}
