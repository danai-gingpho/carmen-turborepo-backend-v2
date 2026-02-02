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
import { StockOutService } from './stock-out.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  BaseHttpController,
  Serialize,
  StockOutDetailResponseSchema,
  StockOutListItemResponseSchema,
  StockOutMutationResponseSchema,
  StockOutCreateDto,
  StockOutUpdateDto,
  IStockOutUpdate,
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

@Controller('api/:bu_code/stock-out')
@ApiTags('Application - Stock Out')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class StockOutController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(StockOutController.name);

  constructor(private readonly stockOutService: StockOutService) {
    super();
  }

  @Get(':id')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('stockOut.findOne'))
  @Serialize(StockOutDetailResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async findOne(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug({ function: 'findOne', id, version }, StockOutController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.stockOutService.findOne(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Get()
  @UseGuards(new AppIdGuard('stockOut.findAll'))
  @UseGuards(TenantHeaderGuard)
  @Serialize(StockOutListItemResponseSchema)
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
    this.logger.debug({ function: 'findAll', query, version }, StockOutController.name);

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.stockOutService.findAll(user_id, bu_code, paginate, version);
    this.respond(res, result);
  }

  @Post()
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('stockOut.create'))
  @Serialize(StockOutMutationResponseSchema)
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  async create(
    @Body() createDto: StockOutCreateDto,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug({ function: 'create', createDto, version }, StockOutController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.stockOutService.create(createDto, user_id, bu_code, version);
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Patch(':id')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('stockOut.update'))
  @Serialize(StockOutMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async update(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: StockOutUpdateDto,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug({ function: 'update', id, updateDto, version }, StockOutController.name);

    const { user_id } = ExtractRequestHeader(req);
    const data: IStockOutUpdate = { ...updateDto, id };
    const result = await this.stockOutService.update(data, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Delete(':id')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('stockOut.delete'))
  @Serialize(StockOutMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async delete(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug({ function: 'delete', id, version }, StockOutController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.stockOutService.delete(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  // ==================== Stock Out Detail CRUD ====================

  @Get(':id/details')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('stockOut.findOne'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get all details for a Stock Out',
    description: 'Retrieves all line items/details for a specific Stock Out',
    operationId: 'findAllStockOutDetails',
    tags: ['[Method] Get', 'Stock Out Detail'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Stock Out ID' },
    ],
    responses: {
      200: { description: 'Stock Out details retrieved successfully' },
      404: { description: 'Stock Out not found' },
    },
  })
  @HttpCode(HttpStatus.OK)
  async findDetailsByStockOutId(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug({ function: 'findDetailsByStockOutId', id, version }, StockOutController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.stockOutService.findDetailsByStockOutId(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Get(':id/details/:detail_id')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('stockOut.findOne'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get a specific Stock Out detail by ID',
    description: 'Retrieves a single Stock Out detail/line item by its ID',
    operationId: 'findStockOutDetailById',
    tags: ['[Method] Get', 'Stock Out Detail'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Stock Out ID' },
      { name: 'detail_id', in: 'path', required: true, description: 'Stock Out Detail ID' },
    ],
    responses: {
      200: { description: 'Stock Out detail retrieved successfully' },
      404: { description: 'Stock Out detail not found' },
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
    this.logger.debug({ function: 'findDetailById', id, detailId, version }, StockOutController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.stockOutService.findDetailById(detailId, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Post(':id/details')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('stockOut.update'))
  @Serialize(StockOutMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Create a new Stock Out detail',
    description: 'Creates a new line item/detail for a Stock Out. Only works for Stock Out in draft status.',
    operationId: 'createStockOutDetail',
    tags: ['[Method] Post', 'Stock Out Detail'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Stock Out ID' },
    ],
    responses: {
      201: { description: 'Stock Out detail created successfully' },
      400: { description: 'Cannot add detail to non-draft Stock Out' },
      404: { description: 'Stock Out not found' },
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
    this.logger.debug({ function: 'createDetail', id, data, version }, StockOutController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.stockOutService.createDetail(id, data, user_id, bu_code, version);
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Put(':id/details/:detail_id')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('stockOut.update'))
  @Serialize(StockOutMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Update a Stock Out detail',
    description: 'Updates an existing Stock Out detail/line item. Only works for Stock Out in draft status.',
    operationId: 'updateStockOutDetail',
    tags: ['[Method] Put', 'Stock Out Detail'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Stock Out ID' },
      { name: 'detail_id', in: 'path', required: true, description: 'Stock Out Detail ID' },
    ],
    responses: {
      200: { description: 'Stock Out detail updated successfully' },
      400: { description: 'Cannot update detail of non-draft Stock Out' },
      404: { description: 'Stock Out detail not found' },
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
    this.logger.debug({ function: 'updateDetail', id, detailId, data, version }, StockOutController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.stockOutService.updateDetail(detailId, data, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Delete(':id/details/:detail_id')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('stockOut.update'))
  @Serialize(StockOutMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Delete a Stock Out detail',
    description: 'Deletes an existing Stock Out detail/line item. Only works for Stock Out in draft status.',
    operationId: 'deleteStockOutDetail',
    tags: ['[Method] Delete', 'Stock Out Detail'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Stock Out ID' },
      { name: 'detail_id', in: 'path', required: true, description: 'Stock Out Detail ID' },
    ],
    responses: {
      200: { description: 'Stock Out detail deleted successfully' },
      400: { description: 'Cannot delete detail of non-draft Stock Out' },
      404: { description: 'Stock Out detail not found' },
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
    this.logger.debug({ function: 'deleteDetail', id, detailId, version }, StockOutController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.stockOutService.deleteDetail(detailId, user_id, bu_code, version);
    this.respond(res, result);
  }
}
