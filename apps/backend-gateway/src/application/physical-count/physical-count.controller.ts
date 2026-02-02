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
import { PhysicalCountService } from './physical-count.service';
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
@ApiTags('Application - Physical Count')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class PhysicalCountController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    PhysicalCountController.name,
  );

  constructor(
    private readonly physicalCountService: PhysicalCountService,
  ) {
    super();
  }

  @Get('physical-count/pending')
  @UseGuards(new AppIdGuard('physicalCount.findAllPending.count'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async findAllPendingPhysicalCountCount(
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAllPendingPhysicalCountCount',
        version,
      },
      PhysicalCountController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.physicalCountService.findAllPendingPhysicalCountCount(
      user_id,
      version,
    );
    this.respond(res, result);
  }

  @Get(':bu_code/physical-count/:id')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('physicalCount.findOne'))
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
      PhysicalCountController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.physicalCountService.findOne(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Get(':bu_code/physical-count/')
  @UseGuards(new AppIdGuard('physicalCount.findAll'))
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
      PhysicalCountController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.physicalCountService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  @Post(':bu_code/physical-count')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('physicalCount.create'))
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
      PhysicalCountController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.physicalCountService.create(
      createDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Patch(':bu_code/physical-count/:id')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('physicalCount.update'))
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
      PhysicalCountController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.physicalCountService.update(
      id,
      updateDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Delete(':bu_code/physical-count/:id')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('physicalCount.delete'))
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
      PhysicalCountController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.physicalCountService.delete(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  // ==================== Physical Count Detail CRUD ====================

  @Get(':bu_code/physical-count/:id/details')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('physicalCount.findOne'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get all details for a Physical Count',
    description: 'Retrieves all line items/details for a specific Physical Count',
    operationId: 'findAllPhysicalCountDetails',
    tags: ['[Method] Get', 'Physical Count Detail'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Physical Count ID' },
    ],
    responses: {
      200: { description: 'Physical Count details retrieved successfully' },
      404: { description: 'Physical Count not found' },
    },
  })
  @HttpCode(HttpStatus.OK)
  async findDetailsByPhysicalCountId(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'findDetailsByPhysicalCountId', id, version },
      PhysicalCountController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.physicalCountService.findDetailsByPhysicalCountId(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Get(':bu_code/physical-count/:id/details/:detail_id')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('physicalCount.findOne'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get a specific Physical Count detail by ID',
    description: 'Retrieves a single Physical Count detail/line item by its ID',
    operationId: 'findPhysicalCountDetailById',
    tags: ['[Method] Get', 'Physical Count Detail'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Physical Count ID' },
      { name: 'detail_id', in: 'path', required: true, description: 'Physical Count Detail ID' },
    ],
    responses: {
      200: { description: 'Physical Count detail retrieved successfully' },
      404: { description: 'Physical Count detail not found' },
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
      PhysicalCountController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.physicalCountService.findDetailById(detailId, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Post(':bu_code/physical-count/:id/details')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('physicalCount.update'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Create a new Physical Count detail',
    description: 'Creates a new line item/detail for a Physical Count. Only works for Physical Counts in draft status.',
    operationId: 'createPhysicalCountDetail',
    tags: ['[Method] Post', 'Physical Count Detail'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Physical Count ID' },
    ],
    responses: {
      201: { description: 'Physical Count detail created successfully' },
      400: { description: 'Cannot add detail to non-draft Physical Count' },
      404: { description: 'Physical Count not found' },
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
      PhysicalCountController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.physicalCountService.createDetail(id, data, user_id, bu_code, version);
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Put(':bu_code/physical-count/:id/details/:detail_id')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('physicalCount.update'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Update a Physical Count detail',
    description: 'Updates an existing Physical Count detail/line item. Only works for Physical Counts in draft status.',
    operationId: 'updatePhysicalCountDetail',
    tags: ['[Method] Put', 'Physical Count Detail'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Physical Count ID' },
      { name: 'detail_id', in: 'path', required: true, description: 'Physical Count Detail ID' },
    ],
    responses: {
      200: { description: 'Physical Count detail updated successfully' },
      400: { description: 'Cannot update detail of non-draft Physical Count' },
      404: { description: 'Physical Count detail not found' },
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
      PhysicalCountController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.physicalCountService.updateDetail(detailId, data, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Delete(':bu_code/physical-count/:id/details/:detail_id')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('physicalCount.update'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Delete a Physical Count detail',
    description: 'Deletes an existing Physical Count detail/line item. Only works for Physical Counts in draft status.',
    operationId: 'deletePhysicalCountDetail',
    tags: ['[Method] Delete', 'Physical Count Detail'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Physical Count ID' },
      { name: 'detail_id', in: 'path', required: true, description: 'Physical Count Detail ID' },
    ],
    responses: {
      200: { description: 'Physical Count detail deleted successfully' },
      400: { description: 'Cannot delete detail of non-draft Physical Count' },
      404: { description: 'Physical Count detail not found' },
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
      PhysicalCountController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.physicalCountService.deleteDetail(detailId, user_id, bu_code, version);
    this.respond(res, result);
  }

  // ==================== Mobile-specific endpoints ====================

  @Patch(':bu_code/physical-count/:id/save')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('physicalCount.save'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Save Physical Count items',
    description: 'Saves actual quantities for Physical Count items without submitting',
    operationId: 'savePhysicalCountItems',
    tags: ['[Method] Patch', 'Physical Count Mobile'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Physical Count ID' },
      { name: 'bu_code', in: 'path', required: true, description: 'Business Unit Code' },
    ],
    responses: {
      200: { description: 'Physical Count items saved successfully' },
      400: { description: 'Invalid request body' },
      404: { description: 'Physical Count not found' },
    },
  })
  @HttpCode(HttpStatus.OK)
  async saveItems(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Body() data: { items: Array<{ id: string; actual_qty: number }> },
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'saveItems', id, data, version },
      PhysicalCountController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.physicalCountService.saveItems(id, data, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Patch(':bu_code/physical-count/:id/review')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('physicalCount.review'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Review Physical Count items',
    description: 'Reviews actual quantities for Physical Count items and calculates differences',
    operationId: 'reviewPhysicalCountItems',
    tags: ['[Method] Patch', 'Physical Count Mobile'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Physical Count ID' },
      { name: 'bu_code', in: 'path', required: true, description: 'Business Unit Code' },
    ],
    responses: {
      200: { description: 'Physical Count items reviewed successfully with difference list' },
      400: { description: 'Invalid request body' },
      404: { description: 'Physical Count not found' },
    },
  })
  @HttpCode(HttpStatus.OK)
  async reviewItems(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Body() data: { items: Array<{ id: string; actual_qty: number }> },
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'reviewItems', id, data, version },
      PhysicalCountController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.physicalCountService.reviewItems(id, data, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Get(':bu_code/physical-count/:id/review')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('physicalCount.getReview'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get Physical Count review result',
    description: 'Gets the review result with difference calculations for a Physical Count',
    operationId: 'getPhysicalCountReview',
    tags: ['[Method] Get', 'Physical Count Mobile'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Physical Count ID' },
      { name: 'bu_code', in: 'path', required: true, description: 'Business Unit Code' },
    ],
    responses: {
      200: { description: 'Physical Count review result retrieved successfully' },
      404: { description: 'Physical Count not found' },
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
      PhysicalCountController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.physicalCountService.getReview(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Patch(':bu_code/physical-count/:id/submit')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('physicalCount.submit'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Submit Physical Count',
    description: 'Submits a Physical Count and creates inventory adjustment',
    operationId: 'submitPhysicalCount',
    tags: ['[Method] Patch', 'Physical Count Mobile'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Physical Count ID' },
      { name: 'bu_code', in: 'path', required: true, description: 'Business Unit Code' },
    ],
    responses: {
      200: { description: 'Physical Count submitted and adjustment created successfully' },
      400: { description: 'Physical Count cannot be submitted' },
      404: { description: 'Physical Count not found' },
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
      PhysicalCountController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.physicalCountService.submit(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Post(':bu_code/physical-count/:id/details/:detail_id/comment')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('physicalCount.createComment'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Add comment to Physical Count detail',
    description: 'Adds a comment to a specific Physical Count detail item',
    operationId: 'createPhysicalCountDetailComment',
    tags: ['[Method] Post', 'Physical Count Mobile'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Physical Count ID' },
      { name: 'detail_id', in: 'path', required: true, description: 'Physical Count Detail ID' },
      { name: 'bu_code', in: 'path', required: true, description: 'Business Unit Code' },
    ],
    responses: {
      201: { description: 'Comment created successfully' },
      400: { description: 'Invalid request body' },
      404: { description: 'Physical Count detail not found' },
    },
  })
  @HttpCode(HttpStatus.CREATED)
  async createComment(
    @Param('id') id: string,
    @Param('detail_id') detailId: string,
    @Param('bu_code') bu_code: string,
    @Body() data: { comment: string },
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'createComment', id, detailId, data, version },
      PhysicalCountController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.physicalCountService.createComment(detailId, data, user_id, bu_code, version);
    this.respond(res, result, HttpStatus.CREATED);
  }
}
