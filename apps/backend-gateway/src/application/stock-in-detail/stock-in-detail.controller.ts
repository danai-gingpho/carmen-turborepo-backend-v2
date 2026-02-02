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
import { StockInDetailService } from './stock-in-detail.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  BaseHttpController,
  Serialize,
  StockInMutationResponseSchema,
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

@Controller('api/:bu_code/stock-in-detail')
@ApiTags('Application - Stock In Detail')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class StockInDetailController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(StockInDetailController.name);

  constructor(private readonly stockInDetailService: StockInDetailService) {
    super();
  }

  @Get()
  @UseGuards(new AppIdGuard('stockInDetail.findAll'))
  @UseGuards(TenantHeaderGuard)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all Stock In Details with pagination',
    description: 'Retrieves all stock in detail records with pagination and filtering',
    operationId: 'findAllStockInDetails',
    tags: ['[Method] Get'],
    responses: {
      200: { description: 'Stock In Details retrieved successfully' },
    },
  })
  async findAll(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query() query: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug({ function: 'findAll', query, version }, StockInDetailController.name);

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.stockInDetailService.findAll(user_id, bu_code, paginate, version);
    this.respond(res, result);
  }

  @Get(':id')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('stockInDetail.findOne'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get a Stock In Detail by ID',
    description: 'Retrieves a single stock in detail record by its ID',
    operationId: 'findOneStockInDetail',
    tags: ['[Method] Get'],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Stock In Detail ID' },
    ],
    responses: {
      200: { description: 'Stock In Detail retrieved successfully' },
      404: { description: 'Stock In Detail not found' },
    },
  })
  async findOne(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug({ function: 'findOne', id, version }, StockInDetailController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.stockInDetailService.findOne(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Post()
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('stockInDetail.create'))
  @Serialize(StockInMutationResponseSchema)
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Create a new Stock In Detail',
    description: 'Creates a new stock in detail record. Requires stock_in_id in the body. Only works for Stock In in draft status.',
    operationId: 'createStockInDetail',
    tags: ['[Method] Post'],
    responses: {
      201: { description: 'Stock In Detail created successfully' },
      400: { description: 'Cannot add detail to non-draft Stock In' },
      404: { description: 'Stock In not found' },
    },
  })
  async create(
    @Body() createDto: any,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug({ function: 'create', createDto, version }, StockInDetailController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.stockInDetailService.create(createDto, user_id, bu_code, version);
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Patch(':id')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('stockInDetail.update'))
  @Serialize(StockInMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Update a Stock In Detail',
    description: 'Updates an existing stock in detail record. Only works for Stock In in draft status.',
    operationId: 'updateStockInDetail',
    tags: ['[Method] Patch'],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Stock In Detail ID' },
    ],
    responses: {
      200: { description: 'Stock In Detail updated successfully' },
      400: { description: 'Cannot update detail of non-draft Stock In' },
      404: { description: 'Stock In Detail not found' },
    },
  })
  async update(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: any,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug({ function: 'update', id, updateDto, version }, StockInDetailController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.stockInDetailService.update(id, updateDto, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Delete(':id')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('stockInDetail.delete'))
  @Serialize(StockInMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Delete a Stock In Detail',
    description: 'Soft deletes an existing stock in detail record. Only works for Stock In in draft status.',
    operationId: 'deleteStockInDetail',
    tags: ['[Method] Delete'],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Stock In Detail ID' },
    ],
    responses: {
      200: { description: 'Stock In Detail deleted successfully' },
      400: { description: 'Cannot delete detail of non-draft Stock In' },
      404: { description: 'Stock In Detail not found' },
    },
  })
  async delete(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug({ function: 'delete', id, version }, StockInDetailController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.stockInDetailService.delete(id, user_id, bu_code, version);
    this.respond(res, result);
  }
}
