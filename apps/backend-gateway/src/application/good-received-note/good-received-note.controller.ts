import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  Delete,
  UseGuards,
  Logger,
  ConsoleLogger,
  Req,
  Res,
  Query,
  HttpStatus,
  HttpCode,
  Patch,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { GoodReceivedNoteService } from './good-received-note.service';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  BaseHttpController,
  Serialize,
  ZodSerializerInterceptor,
  GoodReceivedNoteDetailResponseSchema,
  GoodReceivedNoteListItemResponseSchema,
  GoodReceivedNoteMutationResponseSchema,
} from '@/common';
import { TenantHeaderGuard } from 'src/common/guard/tenant-header.guard';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { IPaginateQuery, PaginateQuery } from 'src/shared-dto/paginate.dto';
import {
  GoodReceivedNoteCreateDto,
  GoodReceivedNoteUpdateDto,
  IGoodReceivedNoteUpdate,
} from '@/common';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';

@Controller('api')
@ApiTags('Application - Good Received Note')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class GoodReceivedNoteController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    GoodReceivedNoteController.name,
  );

  constructor(
    private readonly goodReceivedNoteService: GoodReceivedNoteService,
  ) {
    super();
  }

  @Get('good-received-note/pending')
  @UseGuards(new AppIdGuard('goodReceivedNote.findAllPending.count'))
  @Serialize(GoodReceivedNoteListItemResponseSchema)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @HttpCode(HttpStatus.OK)
  async findAllPendingGoodReceivedNoteCount(
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAllPendingGoodReceivedNoteCount',
        version,
      },
      GoodReceivedNoteController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.goodReceivedNoteService.findAllPendingGoodReceivedNoteCount(
      user_id,
      version,
    );
    this.respond(res, result);
  }

  @Get(':bu_code/good-received-note/:id')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('goodReceivedNote.findOne'))
  @Serialize(GoodReceivedNoteDetailResponseSchema)
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
      GoodReceivedNoteController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.goodReceivedNoteService.findOne(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Get(":bu_code/good-received-note/")
  @UseGuards(new AppIdGuard('goodReceivedNote.findAll'))
  @UseGuards(TenantHeaderGuard)
  @Serialize(GoodReceivedNoteListItemResponseSchema)
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
      GoodReceivedNoteController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.goodReceivedNoteService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  @Get(':bu_code/good-received-note/scan-po/:qr_code')
  @Serialize(GoodReceivedNoteDetailResponseSchema)
  @ApiVersionMinRequest()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Scan PO',
    description: 'Scan PO',
    operationId: 'scanPO',
    tags: ['Application - Good Received Note', '[Method] Get'],
    deprecated: false,
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
      },
    ],
    responses: {
      200: {
        description: 'The good received note was successfully retrieved',
      },
      404: {
        description: 'The good received note was not found',
      },
    },
  })
  async scanPO(
    @Req() req: Request,
    @Res() res: Response,
    @Param('qr_code') qr_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'scanPO',
        qr_code,
        version,
      },
      GoodReceivedNoteController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const { bu_code, po_id } = this.ExtractPO_QRCode(qr_code);
    const result = await this.goodReceivedNoteService.findOne(
      po_id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  private ExtractPO_QRCode(qr_code: string): { bu_code: string; po_id: string } {
    const [bu_code, po_id] = qr_code.split('|');
    return { bu_code, po_id };
  }

  @Post(":bu_code/good-received-note")
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('goodReceivedNote.create'))
  @Serialize(GoodReceivedNoteMutationResponseSchema)
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  async create(
    @Body() createDto: any ,//GoodReceivedNoteCreateDto,
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
      GoodReceivedNoteController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.goodReceivedNoteService.create(
      createDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Patch(':bu_code/good-received-note/:id')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('goodReceivedNote.update'))
  @Serialize(GoodReceivedNoteMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async update(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: GoodReceivedNoteUpdateDto,
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
      GoodReceivedNoteController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const data: IGoodReceivedNoteUpdate = {
      ...updateDto,
      id,
    };
    const result = await this.goodReceivedNoteService.update(
      data,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Delete(':bu_code/good-received-note/:id')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('goodReceivedNote.delete'))
  @Serialize(GoodReceivedNoteMutationResponseSchema)
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
      GoodReceivedNoteController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.goodReceivedNoteService.delete(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Get(':bu_code/good-received-note/:id/export')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('goodReceivedNote.export'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Export a Good Received Note to Excel',
    description: 'Generates an Excel file of the Good Received Note with all details',
    operationId: 'exportGoodReceivedNote',
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
        description: 'Good Received Note ID',
      },
    ],
    responses: {
      200: {
        description: 'Excel file download',
        content: {
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
            schema: {
              type: 'string',
              format: 'binary',
            },
          },
        },
      },
      404: {
        description: 'The Good Received Note was not found',
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async exportToExcel(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'exportToExcel',
        id,
        version,
      },
      GoodReceivedNoteController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.goodReceivedNoteService.exportToExcel(id, user_id, bu_code, version);

    if (!result.isOk()) {
      this.respond(res, result);
      return;
    }

    const { buffer, filename } = result.value;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  }

  @Post(':bu_code/good-received-note/:id/reject')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('goodReceivedNote.reject'))
  @Serialize(GoodReceivedNoteMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Reject a Good Received Note',
    description:
      'Rejects an existing Good Received Note. Only GRNs with status draft or saved can be rejected. Sets status to voided.',
    operationId: 'rejectGoodReceivedNote',
    tags: ['[Method] Post'],
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
        description: 'The Good Received Note was successfully rejected',
      },
      400: {
        description: 'The Good Received Note cannot be rejected due to invalid status',
      },
      404: {
        description: 'The Good Received Note was not found',
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async reject(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Body() body: { reason?: string },
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'reject',
        id,
        reason: body.reason,
        version,
      },
      GoodReceivedNoteController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.goodReceivedNoteService.reject(
      id,
      body.reason || '',
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  // ==================== Good Received Note Detail CRUD ====================

  @Get(':bu_code/good-received-note/:id/details')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('goodReceivedNote.findOne'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get all details for a Good Received Note',
    description: 'Retrieves all line items/details for a specific GRN',
    operationId: 'findAllGRNDetails',
    tags: ['[Method] Get', 'GRN Detail'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Good Received Note ID' },
    ],
    responses: {
      200: { description: 'GRN details retrieved successfully' },
      404: { description: 'Good Received Note not found' },
    },
  })
  @HttpCode(HttpStatus.OK)
  async findDetailsByGrnId(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'findDetailsByGrnId', id, version },
      GoodReceivedNoteController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.goodReceivedNoteService.findDetailsByGrnId(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Get(':bu_code/good-received-note/:id/details/:detail_id')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('goodReceivedNote.findOne'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get a specific GRN detail by ID',
    description: 'Retrieves a single GRN detail/line item by its ID',
    operationId: 'findGRNDetailById',
    tags: ['[Method] Get', 'GRN Detail'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Good Received Note ID' },
      { name: 'detail_id', in: 'path', required: true, description: 'GRN Detail ID' },
    ],
    responses: {
      200: { description: 'GRN detail retrieved successfully' },
      404: { description: 'GRN detail not found' },
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
      GoodReceivedNoteController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.goodReceivedNoteService.findDetailById(detailId, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Post(':bu_code/good-received-note/:id/details')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('goodReceivedNote.update'))
  @Serialize(GoodReceivedNoteMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Create a new GRN detail',
    description: 'Creates a new line item/detail for a GRN. Only works for GRNs in draft status.',
    operationId: 'createGRNDetail',
    tags: ['[Method] Post', 'GRN Detail'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Good Received Note ID' },
    ],
    responses: {
      201: { description: 'GRN detail created successfully' },
      400: { description: 'Cannot add detail to non-draft GRN' },
      404: { description: 'Good Received Note not found' },
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
      GoodReceivedNoteController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.goodReceivedNoteService.createDetail(id, data, user_id, bu_code, version);
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Put(':bu_code/good-received-note/:id/details/:detail_id')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('goodReceivedNote.update'))
  @Serialize(GoodReceivedNoteMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Update a GRN detail',
    description: 'Updates an existing GRN detail/line item. Only works for GRNs in draft status.',
    operationId: 'updateGRNDetail',
    tags: ['[Method] Put', 'GRN Detail'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Good Received Note ID' },
      { name: 'detail_id', in: 'path', required: true, description: 'GRN Detail ID' },
    ],
    responses: {
      200: { description: 'GRN detail updated successfully' },
      400: { description: 'Cannot update detail of non-draft GRN' },
      404: { description: 'GRN detail not found' },
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
      GoodReceivedNoteController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.goodReceivedNoteService.updateDetail(detailId, data, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Delete(':bu_code/good-received-note/:id/details/:detail_id')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('goodReceivedNote.update'))
  @Serialize(GoodReceivedNoteMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Delete a GRN detail',
    description: 'Deletes an existing GRN detail/line item. Only works for GRNs in draft status.',
    operationId: 'deleteGRNDetail',
    tags: ['[Method] Delete', 'GRN Detail'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Good Received Note ID' },
      { name: 'detail_id', in: 'path', required: true, description: 'GRN Detail ID' },
    ],
    responses: {
      200: { description: 'GRN detail deleted successfully' },
      400: { description: 'Cannot delete detail of non-draft GRN' },
      404: { description: 'GRN detail not found' },
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
      GoodReceivedNoteController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.goodReceivedNoteService.deleteDetail(detailId, user_id, bu_code, version);
    this.respond(res, result);
  }

  // ==================== Mobile-specific endpoints ====================

  @Get(':bu_code/good-received-note/manual-po/:po_no')
  @UseGuards(TenantHeaderGuard)
  @Serialize(GoodReceivedNoteDetailResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Manual check PO (return new GRN)',
    description: 'Manually checks a PO by PO number and returns a new GRN for receiving',
    operationId: 'manualCheckPO',
    tags: ['Application - Good Received Note', '[Method] Get', 'GRN Mobile'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'bu_code', in: 'path', required: true, description: 'Business Unit Code' },
      { name: 'po_no', in: 'path', required: true, description: 'Purchase Order Number' },
    ],
    responses: {
      200: { description: 'GRN retrieved successfully' },
      404: { description: 'Purchase Order not found' },
    },
  })
  @HttpCode(HttpStatus.OK)
  async manualCheckPO(
    @Param('bu_code') bu_code: string,
    @Param('po_no') po_no: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'manualCheckPO', bu_code, po_no, version },
      GoodReceivedNoteController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.goodReceivedNoteService.findByManualPO(po_no, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Patch(':bu_code/good-received-note/:id/confirm')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('goodReceivedNote.confirm'))
  @Serialize(GoodReceivedNoteMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Confirm a Good Received Note',
    description: 'Confirms a GRN and completes the receiving process',
    operationId: 'confirmGoodReceivedNote',
    tags: ['[Method] Patch', 'GRN Mobile'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Good Received Note ID' },
      { name: 'bu_code', in: 'path', required: true, description: 'Business Unit Code' },
    ],
    responses: {
      200: { description: 'GRN confirmed successfully' },
      400: { description: 'GRN cannot be confirmed' },
      404: { description: 'GRN not found' },
    },
  })
  @HttpCode(HttpStatus.OK)
  async confirm(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Body() data: any,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'confirm', id, data, version },
      GoodReceivedNoteController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.goodReceivedNoteService.confirm(id, data, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Get(':bu_code/good-received-note/:id/comments')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('goodReceivedNote.getComments'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get GRN comments',
    description: 'Retrieves all comments for a specific GRN',
    operationId: 'getGRNComments',
    tags: ['[Method] Get', 'GRN Mobile'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Good Received Note ID' },
      { name: 'bu_code', in: 'path', required: true, description: 'Business Unit Code' },
    ],
    responses: {
      200: { description: 'Comments retrieved successfully' },
      404: { description: 'GRN not found' },
    },
  })
  @HttpCode(HttpStatus.OK)
  async getComments(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'getComments', id, version },
      GoodReceivedNoteController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.goodReceivedNoteService.getComments(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Post(':bu_code/good-received-note/:id/comments')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('goodReceivedNote.createComment'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Create GRN comment',
    description: 'Adds a new comment to a specific GRN',
    operationId: 'createGRNComment',
    tags: ['[Method] Post', 'GRN Mobile'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Good Received Note ID' },
      { name: 'bu_code', in: 'path', required: true, description: 'Business Unit Code' },
    ],
    responses: {
      201: { description: 'Comment created successfully' },
      400: { description: 'Invalid request body' },
      404: { description: 'GRN not found' },
    },
  })
  @HttpCode(HttpStatus.CREATED)
  async createComment(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Body() data: { comment: string },
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'createComment', id, data, version },
      GoodReceivedNoteController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.goodReceivedNoteService.createComment(id, data, user_id, bu_code, version);
    this.respond(res, result, HttpStatus.CREATED);
  }
}
