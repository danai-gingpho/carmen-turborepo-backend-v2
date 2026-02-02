import {
  Controller,
  Delete,
  Get,
  Param,
  Body,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  Patch,
  BadRequestException,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { PurchaseRequestService } from './purchase-request.service';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { TenantHeaderGuard } from 'src/common/guard/tenant-header.guard';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import {
  IPaginate,
  IPaginateQuery,
  PaginateQuery,
} from 'src/shared-dto/paginate.dto';
import { EXAMPLE_PURCHASE_REQUEST } from './example/purchase-request.example';
import {
  BaseHttpController,
  Serialize,
  ZodSerializerInterceptor,
  PurchaseRequestDetailResponseSchema,
  PurchaseRequestListItemResponseSchema,
  PurchaseRequestMutationResponseSchema,
  CreatePurchaseRequestDto,
  IGetAllResponse,
  IPurchaseRequest,
  UpdatePurchaseRequestDto,
  ReviewPurchaseRequestDto,
  ApproveByStateRoleSchema,
  RejectPurchaseRequestDto,
  SubmitPurchaseRequestDto
} from '@/common';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApproveByStateRoleSchema2, SavePurchaseRequestSchema } from './dto/state-change.dto';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { Permission } from 'src/auth/decorators/permission.decorator';
import { PermissionGuard } from 'src/auth/guards/permission.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import { CalculatePurchaseRequestDetail } from './dto/CalculatePurchaseRequestDetail.dto';

@Controller('api')
@ApiTags('Application - Purchase Request')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard, PermissionGuard, TenantHeaderGuard)
@ApiBearerAuth()
export class PurchaseRequestController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    PurchaseRequestController.name,
  );

  constructor(
    private readonly purchaseRequestService: PurchaseRequestService,
  ) {
    super();
  }

  @Get('purchase-request')
  @Permission({ 'procurement.purchase_request': ['view'] })
  @UseGuards(new AppIdGuard('purchaseRequest.findAll'))
  @Serialize(PurchaseRequestListItemResponseSchema)
  @ApiVersionMinRequest()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all purchase requests',
    description: 'Retrieves all purchase requests',
    operationId: 'findAllPurchaseRequests',
    tags: ['Application - Purchase Request', '[Method] Get'],
    deprecated: false,
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
      },
      {
        name: 'page',
        in: 'query',
        required: false,
      },
      {
        name: 'perpage',
        in: 'query',
        required: false,
      },
      {
        name: 'search',
        in: 'query',
        required: false,
      },
    ],
    responses: {
      200: {
        description: 'The purchase requests were successfully retrieved',
      },
      404: {
        description: 'The purchase requests were not found',
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAll',
        query,
        version,
      },
      PurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const userData: {
      bu_id: string;
      bu_code: string;
      role: string;
      permissions: any;
    } = JSON.parse(req.headers['x-bu-datas'] as string)

    if (paginate?.bu_code.length === 0) {
      throw new BadRequestException('bu_code is required');
    }

    const result = await this.purchaseRequestService.findAll(
      user_id,
      paginate.bu_code,
      paginate,
      userData,
      version,
    );

    this.respond(res, result);
  }

  @Get(':bu_code/purchase-request/workflow-stages')
  @Permission({ 'procurement.purchase_request': ['view'] })
  @UseGuards(new AppIdGuard('purchaseRequest.findAll'))
  @ApiVersionMinRequest()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all workflow stages by purchase request',
    description: 'Retrieves all workflow stages for purchase requests',
    operationId: 'findAllWorkflowStagesByPr',
    tags: ['Application - Purchase Request', '[Method] Get'],
    deprecated: false,
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
      },
      {
        name: 'page',
        in: 'query',
        required: false,
      },
      {
        name: 'perpage',
        in: 'query',
        required: false,
      },
      {
        name: 'search',
        in: 'query',
        required: false,
      },
    ],
    responses: {
      200: {
        description: 'The purchase requests were successfully retrieved',
      },
      404: {
        description: 'The purchase requests were not found',
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async findAllWorkflowStagesByPr(
    @Req() req: Request,
    @Res() res: Response,
    @Query('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAllWorkflowStagesByPr',
        version,
      },
      PurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);

    const result = await this.purchaseRequestService.findAllWorkflowStagesByPr(
      user_id,
      bu_code,
      version,
    );

    this.respond(res, result);
  }

  @Get(':bu_code/purchase-request/:id')
  @UseGuards(new AppIdGuard('purchaseRequest.findOne'))
  @Serialize(PurchaseRequestDetailResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get a purchase request by ID',
    description: 'Retrieves a purchase request by its unique identifier',
    operationId: 'findOnePurchaseRequest',
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
        description: 'The purchase request was successfully retrieved',
      },
      404: {
        description: 'The purchase request was not found',
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('bu_code') bu_code: string,
    @Param('id') id: string,
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
      PurchaseRequestController.name,
    );
    const userDatas: {
      bu_id: string;
      bu_code: string;
      role: string;
      permissions: any;
    }[] = JSON.parse(req.headers['x-bu-datas'] as string)

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseRequestService.findById(
      id,
      user_id,
      bu_code,
      userDatas[0],
      version,
    );
    this.respond(res, result);
  }


  @Get(':bu_code/purchase-request/:id/status/:status')
  @UseGuards(new AppIdGuard('purchaseRequest.approval'))
  @Serialize(PurchaseRequestListItemResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get approval status of a purchase request',
    description: 'Retrieves the approval status of a purchase request',
  })
  @HttpCode(HttpStatus.OK)
  async findAllByStatus(
    @Param('status') status: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAllByStatus',
        status,
        version,
      },
      PurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseRequestService.findAllByStatus(
      status,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Post(':bu_code/purchase-request')
  @UseGuards(new AppIdGuard('purchaseRequest.create'))
  @Serialize(PurchaseRequestMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a purchase request',
    description: 'Creates a new purchase request',
    operationId: 'createPurchaseRequest',
    tags: ['Application - Purchase Request', '[Method] Post'],
    deprecated: false,
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
      },
    ],
    responses: {
      201: {
        description: 'The purchase request was successfully created',
      },
      404: {
        description: 'The purchase request was not found',
      },
      401: {
        description: 'Unauthorized',
      },
    },
  })
  @ApiBody({
    type: CreatePurchaseRequestDto || String || Object,
    description: 'Purchase request data',
    examples: {
      example1: {
        value: EXAMPLE_PURCHASE_REQUEST,
        summary: 'Sample purchase request',
      }
    },
  })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('bu_code') bu_code: string,
    @Body() createDto: CreatePurchaseRequestDto,
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
      PurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);

    const result = await this.purchaseRequestService.create(
      createDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Post(':bu_code/purchase-request/duplicate-pr')
  @UseGuards(new AppIdGuard('purchaseRequest.duplicatePr'))
  @Serialize(PurchaseRequestMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Duplicate purchase requests',
    description: 'Duplicates existing purchase requests',
  })
  @HttpCode(HttpStatus.CREATED)
  async duplicatePr(
    @Param('bu_code') bu_code: string,
    @Body() body: { ids: string[] },
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'duplicatePr',
        body,
        version,
      },
      PurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseRequestService.duplicatePr(body, user_id, bu_code, version);
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Post(':bu_code/purchase-request/:id/split')
  @UseGuards(new AppIdGuard('purchaseRequest.split'))
  @Serialize(PurchaseRequestMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Split purchase request',
    description: 'Splits specified detail items from a purchase request into a new purchase request with the same status',
    operationId: 'splitPurchaseRequest',
    tags: ['Application - Purchase Request', '[Method] Post'],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Original purchase request ID' },
      { name: 'bu_code', in: 'path', required: true, description: 'Business unit code' },
    ],
    responses: {
      200: {
        description: 'The purchase request was successfully split',
      },
      400: {
        description: 'Invalid request - no valid detail IDs or cannot split all details',
      },
      404: {
        description: 'The purchase request was not found',
      },
    },
  })
  @ApiBody({
    description: 'Detail IDs to split into a new purchase request',
    schema: {
      type: 'object',
      properties: {
        detail_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of purchase request detail IDs to split',
        },
      },
      required: ['detail_ids'],
    },
  })
  @HttpCode(HttpStatus.OK)
  async splitPr(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Body() body: { detail_ids: string[] },
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'splitPr',
        id,
        body,
        version,
      },
      PurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseRequestService.splitPr(id, body, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Patch(':bu_code/purchase-request/:id/submit')
  @UseGuards(new AppIdGuard('purchaseRequest.submit'))
  @Serialize(PurchaseRequestMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Submit a purchase request',
    description: 'Submits an existing purchase request',
  })
  @HttpCode(HttpStatus.OK)
  async submit(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Body() payload: SubmitPurchaseRequestDto,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'submit',
        id,
        version,
      },
      PurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseRequestService.submit(id, payload, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Patch(':bu_code/purchase-request/:id/approve')
  @UseGuards(new AppIdGuard('purchaseRequest.approve'))
  @Serialize(PurchaseRequestMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Submit a purchase request',
    description: 'Submits an existing purchase request',
  })
  @HttpCode(HttpStatus.OK)
  async approve(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Body() payload: typeof ApproveByStateRoleSchema2,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'approve',
        id,
        version,
      },
      PurchaseRequestController.name,
    );
    let approvePayload
    try {
      approvePayload = ApproveByStateRoleSchema2.parse(payload)
    } catch (e: any) {
      console.log(e)
      throw new BadRequestException(e);
    }

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseRequestService.approve(id, approvePayload, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Patch(':bu_code/purchase-request/:id/reject')
  @UseGuards(new AppIdGuard('purchaseRequest.reject'))
  @Serialize(PurchaseRequestMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Submit a purchase request',
    description: 'Submits an existing purchase request',
  })
  @HttpCode(HttpStatus.OK)
  async reject(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Body() payload: RejectPurchaseRequestDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'approve',
        id,
        payload,
        version,
      },
      PurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseRequestService.reject(id, payload, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Patch(':bu_code/purchase-request/:id/review')
  @UseGuards(new AppIdGuard('purchaseRequest.review'))
  @Serialize(PurchaseRequestMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Review a purchase request',
    description: 'Review an existing purchase request',
  })
  @HttpCode(HttpStatus.OK)
  async review(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Body() payload: typeof ReviewPurchaseRequestDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'approve',
        id,
        version,
      },
      PurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseRequestService.review(id, payload, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Patch(':bu_code/purchase-request/:id/save')
  @UseGuards(new AppIdGuard('purchaseRequest.update'))
  @Serialize(PurchaseRequestMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Update a purchase request',
    description: 'Updates an existing purchase request',
    operationId: 'updatePurchaseRequest',
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
        description: 'The purchase request was successfully updated',
      },
      404: {
        description: 'The purchase request was not found',
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: typeof SavePurchaseRequestSchema,
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
      PurchaseRequestController.name,
    );

    let savePayload
    try {
      savePayload = SavePurchaseRequestSchema.parse(updateDto)
    } catch (e: any) {
      console.log(e)
      throw new BadRequestException(e);
    }

    const { user_id } = ExtractRequestHeader(req);

    const result = await this.purchaseRequestService.save(
      id,
      updateDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Get(':bu_code/purchase-request/:id/export')
  @UseGuards(new AppIdGuard('purchaseRequest.export'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Export a purchase request to Excel',
    description: 'Exports a purchase request to Excel format (.xlsx) for download',
    operationId: 'exportPurchaseRequest',
    tags: ['[Method] Get'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Purchase request ID' },
    ],
    responses: {
      200: {
        description: 'Excel file download',
        content: {
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
            schema: { type: 'string', format: 'binary' },
          },
        },
      },
      404: { description: 'The purchase request was not found' },
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
      { function: 'exportToExcel', id, version },
      PurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseRequestService.exportToExcel(id, user_id, bu_code, version);

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

  @Get(':bu_code/purchase-request/:id/print')
  @UseGuards(new AppIdGuard('purchaseRequest.print'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Print a purchase request to PDF',
    description: 'Generates a PDF document of the purchase request for printing',
    operationId: 'printPurchaseRequest',
    tags: ['[Method] Get'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Purchase request ID' },
    ],
    responses: {
      200: {
        description: 'PDF file download',
        content: {
          'application/pdf': {
            schema: { type: 'string', format: 'binary' },
          },
        },
      },
      404: { description: 'The purchase request was not found' },
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
      { function: 'printToPdf', id, version },
      PurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseRequestService.printToPdf(id, user_id, bu_code, version);

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

  @Delete(':bu_code/purchase-request/:id')
  @UseGuards(new AppIdGuard('purchaseRequest.delete'))
  @Serialize(PurchaseRequestMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Delete a purchase request',
    description: 'Deletes an existing purchase request',
    operationId: 'deletePurchaseRequest',
    tags: ['[Method] Delete'],
    deprecated: false,
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
      },
    ],
    responses: {
      200: {
        description: 'The purchase request was successfully deleted',
      },
      404: {
        description: 'The purchase request was not found',
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
      PurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseRequestService.delete(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Get(':bu_code/purchase-request/detail/:detail_id/dimension')
  @UseGuards(new AppIdGuard('purchaseRequest.detail.findDimensions'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get dimensions of a purchase request detail',
    description: 'Retrieves dimensions associated with a purchase request detail',
  })
  @HttpCode(HttpStatus.OK)
  async findDimensionsByDetailId(
    @Param('detail_id') detail_id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Query('version') version: string = 'latest',
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'findDimensionsByDetailId',
        detail_id,
        version,
      },
      PurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    return this.purchaseRequestService.findDimensionsByDetailId(
      detail_id,
      user_id,
      bu_code,
      version,
    );
  }


  @Get(':bu_code/purchase-request/detail/:detail_id/history')
  @UseGuards(new AppIdGuard('purchaseRequest.detail.findhistory'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get history of a purchase request detail',
    description: 'Retrieves history associated with a purchase request detail',
  })
  @HttpCode(HttpStatus.OK)
  async findHistoryByDetailId(
    @Param('detail_id') detail_id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Query('version') version: string = 'latest',
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'findHistoryByDetailId',
        detail_id,
        version,
      },
      PurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    return this.purchaseRequestService.findHistoryByDetailId(
      detail_id,
      user_id,
      bu_code,
      version,
    );
  }


  @Get(':bu_code/purchase-request/detail/:detail_id/calculate')
  @UseGuards(new AppIdGuard('purchaseRequest.detail.findhistory'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get history of a purchase request detail',
    description: 'Retrieves history associated with a purchase request detail',
  })
  @HttpCode(HttpStatus.OK)
  async getCalculatePriceInfoByDetailId(
    @Param('detail_id') detail_id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Body() data: CalculatePurchaseRequestDetail,
    @Query('version') version: string = 'latest',
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'getCalculatePriceInfoByDetailId',
        detail_id,
        version,
      },
      PurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    return this.purchaseRequestService.getCalculatePriceInfoByDetailId(
      detail_id,
      data,
      user_id,
      bu_code,
      version,
    );
  }
}
