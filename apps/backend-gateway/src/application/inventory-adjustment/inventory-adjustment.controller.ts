import {
  Controller,
  Get,
  Param,
  UseGuards,
  Req,
  Res,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { Response } from 'express';
import { InventoryAdjustmentService, AdjustmentType } from './inventory-adjustment.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { BaseHttpController } from '@/common';
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

@Controller('api/:bu_code/inventory-adjustment')
@ApiTags('Application - Inventory Adjustment')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class InventoryAdjustmentController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(InventoryAdjustmentController.name);

  constructor(private readonly inventoryAdjustmentService: InventoryAdjustmentService) {
    super();
  }

  @Get()
  @UseGuards(new AppIdGuard('inventoryAdjustment.findAll'))
  @UseGuards(TenantHeaderGuard)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['stock-in', 'stock-out'],
    description: 'Filter by adjustment type (stock-in or stock-out). If not specified, returns both.',
  })
  @ApiOperation({
    summary: 'Get all inventory adjustments',
    description: 'Retrieves a combined list of stock-in and stock-out records (inventory adjustments). Can be filtered by type.',
    operationId: 'findAllInventoryAdjustments',
    tags: ['[Method] Get', 'Inventory Adjustment'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    responses: {
      200: { description: 'Inventory adjustments retrieved successfully' },
    },
  })
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query() query: IPaginateQuery,
    @Query('version') version: string = 'latest',
    @Query('type') type?: AdjustmentType,
  ): Promise<void> {
    this.logger.debug({ function: 'findAll', query, version, type }, InventoryAdjustmentController.name);

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.inventoryAdjustmentService.findAll(user_id, bu_code, paginate, version, type);
    this.respond(res, result);
  }

  @Get(':id')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('inventoryAdjustment.findOne'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiQuery({
    name: 'type',
    required: true,
    enum: ['stock-in', 'stock-out'],
    description: 'The type of adjustment record to retrieve',
  })
  @ApiOperation({
    summary: 'Get a specific inventory adjustment',
    description: 'Retrieves a single stock-in or stock-out record by ID. The type query parameter is required to specify which type of record to fetch.',
    operationId: 'findOneInventoryAdjustment',
    tags: ['[Method] Get', 'Inventory Adjustment'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Adjustment record ID' },
      { name: 'type', in: 'query', required: true, description: 'Type of adjustment (stock-in or stock-out)' },
    ],
    responses: {
      200: { description: 'Inventory adjustment retrieved successfully' },
      400: { description: 'Type query parameter is required' },
      404: { description: 'Inventory adjustment not found' },
    },
  })
  async findOne(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
    @Query('type') type: AdjustmentType,
  ): Promise<void> {
    this.logger.debug({ function: 'findOne', id, type, version }, InventoryAdjustmentController.name);

    if (!type || !['stock-in', 'stock-out'].includes(type)) {
      this.respond(res, {
        isSuccess: false,
        error: {
          message: 'Type query parameter is required and must be either "stock-in" or "stock-out"',
          code: 'BAD_REQUEST',
        },
      }, HttpStatus.BAD_REQUEST);
      return;
    }

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.inventoryAdjustmentService.findOne(id, type, user_id, bu_code, version);
    this.respond(res, result);
  }
}
