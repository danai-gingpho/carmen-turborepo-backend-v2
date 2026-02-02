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
import { StockInService } from './stock-in.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  BaseHttpController,
  Serialize,
  StockInDetailResponseSchema,
  StockInListItemResponseSchema,
  StockInMutationResponseSchema,
  StockInCreateDto,
  StockInUpdateDto,
  IStockInUpdate,
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

@Controller('api/:bu_code/stock-in')
@ApiTags('Application - Stock In')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class StockInController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(StockInController.name);

  constructor(private readonly stockInService: StockInService) {
    super();
  }

  @Get(':id')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('stockIn.findOne'))
  @Serialize(StockInDetailResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async findOne(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug({ function: 'findOne', id, version }, StockInController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.stockInService.findOne(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Get()
  @UseGuards(new AppIdGuard('stockIn.findAll'))
  @UseGuards(TenantHeaderGuard)
  @Serialize(StockInListItemResponseSchema)
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
    this.logger.debug({ function: 'findAll', query, version }, StockInController.name);

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.stockInService.findAll(user_id, bu_code, paginate, version);
    this.respond(res, result);
  }

  @Post()
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('stockIn.create'))
  @Serialize(StockInMutationResponseSchema)
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  async create(
    @Body() createDto: StockInCreateDto,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug({ function: 'create', createDto, version }, StockInController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.stockInService.create(createDto, user_id, bu_code, version);
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Patch(':id')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('stockIn.update'))
  @Serialize(StockInMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async update(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: StockInUpdateDto,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug({ function: 'update', id, updateDto, version }, StockInController.name);

    const { user_id } = ExtractRequestHeader(req);
    const data: IStockInUpdate = { ...updateDto, id };
    const result = await this.stockInService.update(data, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Delete(':id')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('stockIn.delete'))
  @Serialize(StockInMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async delete(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug({ function: 'delete', id, version }, StockInController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.stockInService.delete(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  // ==================== Stock In Detail CRUD ====================

  @Get(':id/details')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('stockIn.findOne'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get all details for a Stock In',
    description: 'Retrieves all line items/details for a specific Stock In',
    operationId: 'findAllStockInDetails',
    tags: ['[Method] Get', 'Stock In Detail'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Stock In ID' },
    ],
    responses: {
      200: { description: 'Stock In details retrieved successfully' },
      404: { description: 'Stock In not found' },
    },
  })
  @HttpCode(HttpStatus.OK)
  async findDetailsByStockInId(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug({ function: 'findDetailsByStockInId', id, version }, StockInController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.stockInService.findDetailsByStockInId(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Get(':id/details/:detail_id')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('stockIn.findOne'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get a specific Stock In detail by ID',
    description: 'Retrieves a single Stock In detail/line item by its ID',
    operationId: 'findStockInDetailById',
    tags: ['[Method] Get', 'Stock In Detail'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Stock In ID' },
      { name: 'detail_id', in: 'path', required: true, description: 'Stock In Detail ID' },
    ],
    responses: {
      200: { description: 'Stock In detail retrieved successfully' },
      404: { description: 'Stock In detail not found' },
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
    this.logger.debug({ function: 'findDetailById', id, detailId, version }, StockInController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.stockInService.findDetailById(detailId, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Post(':id/details')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('stockIn.update'))
  @Serialize(StockInMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Create a new Stock In detail',
    description: 'Creates a new line item/detail for a Stock In. Only works for Stock In in draft status.',
    operationId: 'createStockInDetail',
    tags: ['[Method] Post', 'Stock In Detail'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Stock In ID' },
    ],
    responses: {
      201: { description: 'Stock In detail created successfully' },
      400: { description: 'Cannot add detail to non-draft Stock In' },
      404: { description: 'Stock In not found' },
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
    this.logger.debug({ function: 'createDetail', id, data, version }, StockInController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.stockInService.createDetail(id, data, user_id, bu_code, version);
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Put(':id/details/:detail_id')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('stockIn.update'))
  @Serialize(StockInMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Update a Stock In detail',
    description: 'Updates an existing Stock In detail/line item. Only works for Stock In in draft status.',
    operationId: 'updateStockInDetail',
    tags: ['[Method] Put', 'Stock In Detail'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Stock In ID' },
      { name: 'detail_id', in: 'path', required: true, description: 'Stock In Detail ID' },
    ],
    responses: {
      200: { description: 'Stock In detail updated successfully' },
      400: { description: 'Cannot update detail of non-draft Stock In' },
      404: { description: 'Stock In detail not found' },
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
    this.logger.debug({ function: 'updateDetail', id, detailId, data, version }, StockInController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.stockInService.updateDetail(detailId, data, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Delete(':id/details/:detail_id')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('stockIn.update'))
  @Serialize(StockInMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Delete a Stock In detail',
    description: 'Deletes an existing Stock In detail/line item. Only works for Stock In in draft status.',
    operationId: 'deleteStockInDetail',
    tags: ['[Method] Delete', 'Stock In Detail'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Stock In ID' },
      { name: 'detail_id', in: 'path', required: true, description: 'Stock In Detail ID' },
    ],
    responses: {
      200: { description: 'Stock In detail deleted successfully' },
      400: { description: 'Cannot delete detail of non-draft Stock In' },
      404: { description: 'Stock In detail not found' },
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
    this.logger.debug({ function: 'deleteDetail', id, detailId, version }, StockInController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.stockInService.deleteDetail(detailId, user_id, bu_code, version);
    this.respond(res, result);
  }
}
