import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { PurchaseOrderService } from './purchase-order.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { TenantHeaderGuard } from 'src/common/guard/tenant-header.guard';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { ApiVersionMinRequest } from 'src/common/decorator/userfilter.decorator';
import { IPaginateQuery, PaginateQuery } from 'src/shared-dto/paginate.dto';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { PermissionGuard } from 'src/auth';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import {
  BaseHttpController,
  Serialize,
  ZodSerializerInterceptor,
  PurchaseOrderDetailResponseSchema,
  PurchaseOrderListItemResponseSchema,
  PurchaseOrderMutationResponseSchema,
} from '@/common';

@Controller('api/:bu_code/purchase-order')
@ApiTags('Application - Purchase Order')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard, PermissionGuard, TenantHeaderGuard)
@ApiBearerAuth()
export class PurchaseOrderController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    PurchaseOrderController.name,
  );

  constructor(private readonly purchaseOrderService: PurchaseOrderService) {
    super();
  }

  @Get(':id')
  @UseGuards(new AppIdGuard('purchaseOrder.findOne'))
  @Serialize(PurchaseOrderDetailResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get a purchase order by ID',
    description: 'Retrieves a purchase order by its unique identifier',
    operationId: 'findOnePurchaseOrder',
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
      },
    ],
    responses: {
      200: {
        description: 'The purchase order was successfully retrieved',
      },
      404: {
        description: 'The purchase order was not found',
      },
    },
  })
  @HttpCode(HttpStatus.OK)
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
      PurchaseOrderController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseOrderService.findOne(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Get()
  @UseGuards(new AppIdGuard('purchaseOrder.findAll'))
  @Serialize(PurchaseOrderListItemResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get all purchase orders',
    description: 'Retrieves all purchase orders',
    operationId: 'findAllPurchaseOrders',
    tags: ['[Method] Get'],
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
      },
    ],
    responses: {
      200: {
        description: 'The purchase orders were successfully retrieved',
      },
      404: {
        description: 'The purchase orders were not found',
      },
    },
  })
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
      PurchaseOrderController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.purchaseOrderService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  @Post()
  @UseGuards(new AppIdGuard('purchaseOrder.create'))
  @Serialize(PurchaseOrderMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Create a purchase order',
    description:
      'Creates a new purchase order. PO groups items from PR by vendor_id -> delivery_date -> currency_id',
    operationId: 'createPurchaseOrder',
    tags: ['[Method] Post'],
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
      },
    ],
    responses: {
      201: {
        description: 'The purchase order was successfully created',
      },
      400: {
        description: 'Invalid request body',
      },
    },
  })
  @ApiBody({ type: CreatePurchaseOrderDto })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createDto: CreatePurchaseOrderDto,
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
      PurchaseOrderController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseOrderService.create(
      createDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Put(':id')
  @UseGuards(new AppIdGuard('purchaseOrder.update'))
  @Serialize(PurchaseOrderMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Update a purchase order',
    description: 'Updates an existing purchase order',
    operationId: 'updatePurchaseOrder',
    tags: ['[Method] Update'],
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
        description: 'The purchase order was successfully updated',
      },
      404: {
        description: 'The purchase order was not found',
      },
    },
  })
  @HttpCode(HttpStatus.OK)
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
      PurchaseOrderController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseOrderService.update(
      id,
      updateDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Delete(':id')
  @UseGuards(new AppIdGuard('purchaseOrder.delete'))
  @Serialize(PurchaseOrderMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Delete a purchase order',
    description: 'Deletes an existing purchase order',
    operationId: 'deletePurchaseOrder',
    tags: ['[Method] Delete'],
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
        description: 'The purchase order was successfully deleted',
      },
      404: {
        description: 'The purchase order was not found',
      },
    },
  })
  @HttpCode(HttpStatus.OK)
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
      PurchaseOrderController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseOrderService.delete(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Post(':id/approve')
  @UseGuards(new AppIdGuard('purchaseOrder.approve'))
  @Serialize(PurchaseOrderMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Approve a purchase order',
    description:
      'Approves a purchase order at the current workflow stage. Validates user role and advances the workflow.',
    operationId: 'approvePurchaseOrder',
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
        description: 'The purchase order was successfully approved',
      },
      400: {
        description: 'Invalid state_role or user does not have permission',
      },
      404: {
        description: 'The purchase order was not found',
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async approve(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Body() data: any,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'approve',
        id,
        version,
      },
      PurchaseOrderController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseOrderService.approve(
      id,
      data,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Post(':id/cancel')
  @UseGuards(new AppIdGuard('purchaseOrder.cancel'))
  @Serialize(PurchaseOrderMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Cancel a purchase order',
    description:
      'Cancels an existing purchase order. Only orders with status draft, in_progress, or sent can be cancelled. Sets status to closed and updates cancelled_qty on line items.',
    operationId: 'cancelPurchaseOrder',
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
        description: 'The purchase order was successfully cancelled',
      },
      400: {
        description: 'The purchase order cannot be cancelled due to invalid status',
      },
      404: {
        description: 'The purchase order was not found',
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async cancel(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'cancel',
        id,
        version,
      },
      PurchaseOrderController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseOrderService.cancel(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Post(':id/close')
  @UseGuards(new AppIdGuard('purchaseOrder.close'))
  @Serialize(PurchaseOrderMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Close a purchase order',
    description:
      'Closes an existing purchase order and sends notification to buyer and email to vendor. Only orders with status sent, partial, or in_progress can be closed. Sets status to closed and updates cancelled_qty for unreceived items.',
    operationId: 'closePurchaseOrder',
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
        description: 'The purchase order was successfully closed',
      },
      400: {
        description: 'The purchase order cannot be closed due to invalid status',
      },
      404: {
        description: 'The purchase order was not found',
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async closePO(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'closePO',
        id,
        version,
      },
      PurchaseOrderController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseOrderService.closePO(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Post('group-pr')
  @UseGuards(new AppIdGuard('purchaseOrder.groupPr'))
  @Serialize(PurchaseOrderListItemResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Group PR details for PO creation',
    description:
      'Groups PR details by vendor_id -> delivery_date -> currency_id for creating POs from PRs',
    operationId: 'groupPrForPo',
    tags: ['[Method] Post'],
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
      },
    ],
    responses: {
      200: {
        description: 'PR details grouped successfully',
      },
      400: {
        description: 'Invalid request body',
      },
    },
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        pr_ids: {
          type: 'array',
          items: { type: 'string', format: 'uuid' },
          description: 'Array of PR IDs to group',
        },
      },
      required: ['pr_ids'],
    },
  })
  @HttpCode(HttpStatus.OK)
  async groupPrForPo(
    @Body() body: { pr_ids: string[] },
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'groupPrForPo',
        pr_ids: body.pr_ids,
        version,
      },
      PurchaseOrderController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseOrderService.groupPrForPo(
      body.pr_ids,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Post('confirm-pr')
  @UseGuards(new AppIdGuard('purchaseOrder.confirmPr'))
  @Serialize(PurchaseOrderMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Confirm PR and create PO(s)',
    description:
      'Finds PRs by ID, groups PR details by vendor_id -> delivery_date -> currency_id, and creates Purchase Orders',
    operationId: 'confirmPrToPo',
    tags: ['[Method] Post'],
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
      },
    ],
    responses: {
      201: {
        description: 'Purchase Orders created successfully from PRs',
      },
      400: {
        description: 'Invalid request body',
      },
    },
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        pr_ids: {
          type: 'array',
          items: { type: 'string', format: 'uuid' },
          description: 'Array of PR IDs to confirm and create POs from',
        },
      },
      required: ['pr_ids'],
    },
  })
  @HttpCode(HttpStatus.CREATED)
  async confirmPrToPo(
    @Body() body: { pr_ids: string[] },
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'confirmPrToPo',
        pr_ids: body.pr_ids,
        version,
      },
      PurchaseOrderController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseOrderService.confirmPrToPo(
      body.pr_ids,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Get(':id/export')
  @UseGuards(new AppIdGuard('purchaseOrder.export'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Export a purchase order to Excel',
    description: 'Exports a purchase order to Excel format (.xlsx) for download',
    operationId: 'exportPurchaseOrder',
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
        description: 'Purchase order ID',
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
        description: 'The purchase order was not found',
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
      PurchaseOrderController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseOrderService.exportToExcel(id, user_id, bu_code, version);

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

  @Get(':id/print')
  @UseGuards(new AppIdGuard('purchaseOrder.print'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Print a purchase order to PDF',
    description: 'Generates a PDF document of the purchase order for printing',
    operationId: 'printPurchaseOrder',
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
        description: 'Purchase order ID',
      },
    ],
    responses: {
      200: {
        description: 'PDF file download',
        content: {
          'application/pdf': {
            schema: {
              type: 'string',
              format: 'binary',
            },
          },
        },
      },
      404: {
        description: 'The purchase order was not found',
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async printToPdf(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'printToPdf',
        id,
        version,
      },
      PurchaseOrderController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseOrderService.printToPdf(id, user_id, bu_code, version);

    if (!result.isOk()) {
      this.respond(res, result);
      return;
    }

    const { buffer, filename } = result.value;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  }

  // ==================== Purchase Order Detail CRUD ====================

  @Get(':id/details')
  @UseGuards(new AppIdGuard('purchaseOrder.findOne'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get all details for a purchase order',
    description: 'Retrieves all line items/details for a specific purchase order',
    operationId: 'findAllPurchaseOrderDetails',
    tags: ['[Method] Get', 'Purchase Order Detail'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Purchase order ID' },
    ],
    responses: {
      200: { description: 'The purchase order details were successfully retrieved' },
      404: { description: 'The purchase order was not found' },
    },
  })
  @HttpCode(HttpStatus.OK)
  async findAllDetails(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'findAllDetails', id, version },
      PurchaseOrderController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseOrderService.findDetailsByPurchaseOrderId(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Get(':id/details/:detail_id')
  @UseGuards(new AppIdGuard('purchaseOrder.findOne'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get a single purchase order detail by ID',
    description: 'Retrieves a specific line item/detail from a purchase order',
    operationId: 'findOnePurchaseOrderDetail',
    tags: ['[Method] Get', 'Purchase Order Detail'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Purchase order ID' },
      { name: 'detail_id', in: 'path', required: true, description: 'Detail ID' },
    ],
    responses: {
      200: { description: 'The purchase order detail was successfully retrieved' },
      404: { description: 'The purchase order detail was not found' },
    },
  })
  @HttpCode(HttpStatus.OK)
  async findOneDetail(
    @Param('id') id: string,
    @Param('detail_id') detailId: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'findOneDetail', id, detailId, version },
      PurchaseOrderController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseOrderService.findDetailById(detailId, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Post(':id/details')
  @UseGuards(new AppIdGuard('purchaseOrder.update'))
  @Serialize(PurchaseOrderMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Create a new purchase order detail',
    description: 'Adds a new line item/detail to a purchase order (draft status only)',
    operationId: 'createPurchaseOrderDetail',
    tags: ['[Method] Post', 'Purchase Order Detail'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Purchase order ID' },
    ],
    responses: {
      201: { description: 'The purchase order detail was successfully created' },
      400: { description: 'Invalid request body or purchase order is not in draft status' },
      404: { description: 'The purchase order was not found' },
    },
  })
  @HttpCode(HttpStatus.CREATED)
  async createDetail(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Body() body: any,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'createDetail', id, body, version },
      PurchaseOrderController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseOrderService.createDetail(id, body, user_id, bu_code, version);
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Put(':id/details/:detail_id')
  @UseGuards(new AppIdGuard('purchaseOrder.update'))
  @Serialize(PurchaseOrderMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Update a purchase order detail',
    description: 'Updates a line item/detail in a purchase order (draft status only)',
    operationId: 'updatePurchaseOrderDetail',
    tags: ['[Method] Put', 'Purchase Order Detail'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Purchase order ID' },
      { name: 'detail_id', in: 'path', required: true, description: 'Detail ID' },
    ],
    responses: {
      200: { description: 'The purchase order detail was successfully updated' },
      400: { description: 'Invalid request body or purchase order is not in draft status' },
      404: { description: 'The purchase order detail was not found' },
    },
  })
  @HttpCode(HttpStatus.OK)
  async updateDetail(
    @Param('id') id: string,
    @Param('detail_id') detailId: string,
    @Param('bu_code') bu_code: string,
    @Body() body: any,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'updateDetail', id, detailId, body, version },
      PurchaseOrderController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseOrderService.updateDetail(detailId, body, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Delete(':id/details/:detail_id')
  @UseGuards(new AppIdGuard('purchaseOrder.update'))
  @Serialize(PurchaseOrderMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Delete a purchase order detail',
    description: 'Removes a line item/detail from a purchase order (draft status only)',
    operationId: 'deletePurchaseOrderDetail',
    tags: ['[Method] Delete', 'Purchase Order Detail'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Purchase order ID' },
      { name: 'detail_id', in: 'path', required: true, description: 'Detail ID' },
    ],
    responses: {
      200: { description: 'The purchase order detail was successfully deleted' },
      400: { description: 'Purchase order is not in draft status' },
      404: { description: 'The purchase order detail was not found' },
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
      PurchaseOrderController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseOrderService.deleteDetail(detailId, user_id, bu_code, version);
    this.respond(res, result);
  }
}
