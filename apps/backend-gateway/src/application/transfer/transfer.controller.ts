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
import { TransferService } from './transfer.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  BaseHttpController,
  Serialize,
  TransferDetailResponseSchema,
  TransferListItemResponseSchema,
  TransferMutationResponseSchema,
  TransferCreateDto,
  TransferUpdateDto,
  ITransferUpdate,
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

@Controller('api/:bu_code/transfer')
@ApiTags('Application - Transfer')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class TransferController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(TransferController.name);

  constructor(private readonly transferService: TransferService) {
    super();
  }

  @Get(':id')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('transfer.findOne'))
  @Serialize(TransferDetailResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async findOne(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug({ function: 'findOne', id, version }, TransferController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.transferService.findOne(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Get()
  @UseGuards(new AppIdGuard('transfer.findAll'))
  @UseGuards(TenantHeaderGuard)
  @Serialize(TransferListItemResponseSchema)
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
    this.logger.debug({ function: 'findAll', query, version }, TransferController.name);

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.transferService.findAll(user_id, bu_code, paginate, version);
    this.respond(res, result);
  }

  @Post()
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('transfer.create'))
  @Serialize(TransferMutationResponseSchema)
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  async create(
    @Body() createDto: TransferCreateDto,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug({ function: 'create', createDto, version }, TransferController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.transferService.create(createDto, user_id, bu_code, version);
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Patch(':id')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('transfer.update'))
  @Serialize(TransferMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async update(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: TransferUpdateDto,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug({ function: 'update', id, updateDto, version }, TransferController.name);

    const { user_id } = ExtractRequestHeader(req);
    const data: ITransferUpdate = { ...updateDto, id };
    const result = await this.transferService.update(data, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Delete(':id')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('transfer.delete'))
  @Serialize(TransferMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async delete(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug({ function: 'delete', id, version }, TransferController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.transferService.delete(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  // ==================== Transfer Detail CRUD ====================

  @Get(':id/details')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('transfer.findOne'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get all details for a Transfer',
    description: 'Retrieves all line items/details for a specific Transfer',
    operationId: 'findAllTransferDetails',
    tags: ['[Method] Get', 'Transfer Detail'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Transfer ID' },
    ],
    responses: {
      200: { description: 'Transfer details retrieved successfully' },
      404: { description: 'Transfer not found' },
    },
  })
  @HttpCode(HttpStatus.OK)
  async findDetailsByTransferId(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug({ function: 'findDetailsByTransferId', id, version }, TransferController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.transferService.findDetailsByTransferId(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Get(':id/details/:detail_id')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('transfer.findOne'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get a specific Transfer detail by ID',
    description: 'Retrieves a single Transfer detail/line item by its ID',
    operationId: 'findTransferDetailById',
    tags: ['[Method] Get', 'Transfer Detail'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Transfer ID' },
      { name: 'detail_id', in: 'path', required: true, description: 'Transfer Detail ID' },
    ],
    responses: {
      200: { description: 'Transfer detail retrieved successfully' },
      404: { description: 'Transfer detail not found' },
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
    this.logger.debug({ function: 'findDetailById', id, detailId, version }, TransferController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.transferService.findDetailById(detailId, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Post(':id/details')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('transfer.update'))
  @Serialize(TransferMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Create a new Transfer detail',
    description: 'Creates a new line item/detail for a Transfer. Only works for Transfer in draft status.',
    operationId: 'createTransferDetail',
    tags: ['[Method] Post', 'Transfer Detail'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Transfer ID' },
    ],
    responses: {
      201: { description: 'Transfer detail created successfully' },
      400: { description: 'Cannot add detail to non-draft Transfer' },
      404: { description: 'Transfer not found' },
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
    this.logger.debug({ function: 'createDetail', id, data, version }, TransferController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.transferService.createDetail(id, data, user_id, bu_code, version);
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Put(':id/details/:detail_id')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('transfer.update'))
  @Serialize(TransferMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Update a Transfer detail',
    description: 'Updates an existing Transfer detail/line item. Only works for Transfer in draft status.',
    operationId: 'updateTransferDetail',
    tags: ['[Method] Put', 'Transfer Detail'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Transfer ID' },
      { name: 'detail_id', in: 'path', required: true, description: 'Transfer Detail ID' },
    ],
    responses: {
      200: { description: 'Transfer detail updated successfully' },
      400: { description: 'Cannot update detail of non-draft Transfer' },
      404: { description: 'Transfer detail not found' },
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
    this.logger.debug({ function: 'updateDetail', id, detailId, data, version }, TransferController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.transferService.updateDetail(detailId, data, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Delete(':id/details/:detail_id')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('transfer.update'))
  @Serialize(TransferMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Delete a Transfer detail',
    description: 'Deletes an existing Transfer detail/line item. Only works for Transfer in draft status.',
    operationId: 'deleteTransferDetail',
    tags: ['[Method] Delete', 'Transfer Detail'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Transfer ID' },
      { name: 'detail_id', in: 'path', required: true, description: 'Transfer Detail ID' },
    ],
    responses: {
      200: { description: 'Transfer detail deleted successfully' },
      400: { description: 'Cannot delete detail of non-draft Transfer' },
      404: { description: 'Transfer detail not found' },
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
    this.logger.debug({ function: 'deleteDetail', id, detailId, version }, TransferController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.transferService.deleteDetail(detailId, user_id, bu_code, version);
    this.respond(res, result);
  }
}
