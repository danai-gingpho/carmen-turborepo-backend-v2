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
import { StockOutDetailService } from './stock-out-detail.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  BaseHttpController,
  Serialize,
  StockOutMutationResponseSchema,
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

@Controller('api/:bu_code/stock-out-detail')
@ApiTags('Application - Stock Out Detail')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class StockOutDetailController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(StockOutDetailController.name);

  constructor(private readonly stockOutDetailService: StockOutDetailService) {
    super();
  }

  @Get()
  @UseGuards(new AppIdGuard('stockOutDetail.findAll'))
  @UseGuards(TenantHeaderGuard)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all Stock Out Details with pagination',
    description: 'Retrieves all stock out detail records with pagination and filtering',
    operationId: 'findAllStockOutDetails',
    tags: ['[Method] Get'],
    responses: {
      200: { description: 'Stock Out Details retrieved successfully' },
    },
  })
  async findAll(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query() query: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug({ function: 'findAll', query, version }, StockOutDetailController.name);

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.stockOutDetailService.findAll(user_id, bu_code, paginate, version);
    this.respond(res, result);
  }

  @Get(':id')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('stockOutDetail.findOne'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get a Stock Out Detail by ID',
    description: 'Retrieves a single stock out detail record by its ID',
    operationId: 'findOneStockOutDetail',
    tags: ['[Method] Get'],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Stock Out Detail ID' },
    ],
    responses: {
      200: { description: 'Stock Out Detail retrieved successfully' },
      404: { description: 'Stock Out Detail not found' },
    },
  })
  async findOne(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug({ function: 'findOne', id, version }, StockOutDetailController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.stockOutDetailService.findOne(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Post()
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('stockOutDetail.create'))
  @Serialize(StockOutMutationResponseSchema)
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Create a new Stock Out Detail',
    description: 'Creates a new stock out detail record. Requires stock_out_id in the body. Only works for Stock Out in draft status.',
    operationId: 'createStockOutDetail',
    tags: ['[Method] Post'],
    responses: {
      201: { description: 'Stock Out Detail created successfully' },
      400: { description: 'Cannot add detail to non-draft Stock Out' },
      404: { description: 'Stock Out not found' },
    },
  })
  async create(
    @Body() createDto: any,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug({ function: 'create', createDto, version }, StockOutDetailController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.stockOutDetailService.create(createDto, user_id, bu_code, version);
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Patch(':id')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('stockOutDetail.update'))
  @Serialize(StockOutMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Update a Stock Out Detail',
    description: 'Updates an existing stock out detail record. Only works for Stock Out in draft status.',
    operationId: 'updateStockOutDetail',
    tags: ['[Method] Patch'],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Stock Out Detail ID' },
    ],
    responses: {
      200: { description: 'Stock Out Detail updated successfully' },
      400: { description: 'Cannot update detail of non-draft Stock Out' },
      404: { description: 'Stock Out Detail not found' },
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
    this.logger.debug({ function: 'update', id, updateDto, version }, StockOutDetailController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.stockOutDetailService.update(id, updateDto, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Delete(':id')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('stockOutDetail.delete'))
  @Serialize(StockOutMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Delete a Stock Out Detail',
    description: 'Soft deletes an existing stock out detail record. Only works for Stock Out in draft status.',
    operationId: 'deleteStockOutDetail',
    tags: ['[Method] Delete'],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Stock Out Detail ID' },
    ],
    responses: {
      200: { description: 'Stock Out Detail deleted successfully' },
      400: { description: 'Cannot delete detail of non-draft Stock Out' },
      404: { description: 'Stock Out Detail not found' },
    },
  })
  async delete(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug({ function: 'delete', id, version }, StockOutDetailController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.stockOutDetailService.delete(id, user_id, bu_code, version);
    this.respond(res, result);
  }
}
