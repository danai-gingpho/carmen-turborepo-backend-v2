import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
  Body,
  Put,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { StoreRequisitionService } from './store-requisition.service';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
} from '@nestjs/swagger';
import { TenantHeaderGuard } from 'src/common/guard/tenant-header.guard';
import {
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { IPaginateQuery, PaginateQuery } from 'src/shared-dto/paginate.dto';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import {
  BaseHttpController,
  Serialize,
  StoreRequisitionDetailResponseSchema,
  StoreRequisitionListItemResponseSchema,
  StoreRequisitionMutationResponseSchema,
  CreateStoreRequisitionDto,
  UpdateStoreRequisitionDto,
  SubmitStoreRequisitionDto,
  RejectStoreRequisitionDto,
  ReviewStoreRequisitionDto,
  ApproveStoreRequisitionByStateRoleSchema,
} from '@/common';

@Controller('api')
@ApiTags('Config - Store Requisition')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard, TenantHeaderGuard)
@ApiBearerAuth()
export class StoreRequisitionController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    StoreRequisitionController.name,
  );

  constructor(
    private readonly storeRequisitionService: StoreRequisitionService,
  ) {
    super();
  }

  @Get('/:bu_code/store-requisition/:id')
  @UseGuards(new AppIdGuard('storeRequisition.findOne'))
  @Serialize(StoreRequisitionDetailResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get a store requisition by ID',
    description: 'Retrieves a store requisition by its unique identifier',
    operationId: 'findOneStoreRequisition',
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
        description: 'The store requisition was successfully retrieved',
      },
      404: {
        description: 'The store requisition was not found',
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
      StoreRequisitionController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const userDatas: {
      bu_id: string;
      bu_code: string;
      role: string;
      permissions: any;
    }[] = JSON.parse((req.headers as any)['x-bu-datas'] as string);
    const userData = userDatas.find((ud) => ud.bu_code === bu_code);
    const result = await this.storeRequisitionService.findOne(
      id,
      user_id,
      bu_code,
      userData,
      version,
    );
    this.respond(res, result);
  }

  @Get('store-requisition')
  @UseGuards(new AppIdGuard('storeRequisition.findAll'))
  @Serialize(StoreRequisitionListItemResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get all store requisitions',
    description: 'Retrieves all store requisitions',
    operationId: 'findAllStoreRequisitions',
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
        description: 'The store requisitions were successfully retrieved',
      },
      404: {
        description: 'The store requisitions were not found',
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
      StoreRequisitionController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const bu_code = query.bu_code
      ? Array.isArray(query.bu_code)
        ? query.bu_code
        : [query.bu_code]
      : [];
    const userDatas: {
      bu_id: string;
      bu_code: string;
      role: string;
      permissions: any;
    }[] = JSON.parse((req.headers as any)['x-bu-datas'] as string);
    const result = await this.storeRequisitionService.findAll(
      user_id,
      bu_code,
      paginate,
      userDatas,
      version,
    );
    this.respond(res, result);
  }

  @Post(':bu_code/store-requisition')
  @UseGuards(new AppIdGuard('storeRequisition.create'))
  @Serialize(StoreRequisitionMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Create a store requisition',
    description: 'Creates a new store requisition',
    operationId: 'createStoreRequisition',
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
        description: 'The store requisition was successfully created',
      },
      404: {
        description: 'The store requisition was not found',
      },
    },
  })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createDto: CreateStoreRequisitionDto,
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
      StoreRequisitionController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.storeRequisitionService.create(
      createDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Put(':bu_code/store-requisition/:id')
  @UseGuards(new AppIdGuard('storeRequisition.update'))
  @Serialize(StoreRequisitionMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Update a store requisition',
    description: 'Updates an existing store requisition',
    operationId: 'updateStoreRequisition',
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
        description: 'The store requisition was successfully updated',
      },
      404: {
        description: 'The store requisition was not found',
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: UpdateStoreRequisitionDto,
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
      StoreRequisitionController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.storeRequisitionService.update(
      id,
      updateDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Patch(':bu_code/store-requisition/:id/submit')
  @UseGuards(new AppIdGuard('storeRequisition.submit'))
  @Serialize(StoreRequisitionMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Submit a store requisition',
    description: 'Submits an existing store requisition for approval',
  })
  @HttpCode(HttpStatus.OK)
  async submit(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Body() payload: SubmitStoreRequisitionDto,
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
      StoreRequisitionController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.storeRequisitionService.submit(
      id,
      payload,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Patch(':bu_code/store-requisition/:id/approve')
  @UseGuards(new AppIdGuard('storeRequisition.approve'))
  @Serialize(StoreRequisitionMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Approve a store requisition',
    description: 'Approves an existing store requisition',
  })
  @HttpCode(HttpStatus.OK)
  async approve(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Body() payload: typeof ApproveStoreRequisitionByStateRoleSchema,
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
      StoreRequisitionController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.storeRequisitionService.approve(
      id,
      payload,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Patch(':bu_code/store-requisition/:id/reject')
  @UseGuards(new AppIdGuard('storeRequisition.reject'))
  @Serialize(StoreRequisitionMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Reject a store requisition',
    description: 'Rejects an existing store requisition',
  })
  @HttpCode(HttpStatus.OK)
  async reject(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Body() payload: RejectStoreRequisitionDto,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'reject',
        id,
        payload,
        version,
      },
      StoreRequisitionController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.storeRequisitionService.reject(
      id,
      payload,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Patch(':bu_code/store-requisition/:id/review')
  @UseGuards(new AppIdGuard('storeRequisition.review'))
  @Serialize(StoreRequisitionMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Review a store requisition',
    description: 'Sends a store requisition back to a previous stage for review',
  })
  @HttpCode(HttpStatus.OK)
  async review(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Body() payload: ReviewStoreRequisitionDto,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'review',
        id,
        version,
      },
      StoreRequisitionController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.storeRequisitionService.review(
      id,
      payload,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Delete(':bu_code/store-requisition/:id')
  @UseGuards(new AppIdGuard('storeRequisition.delete'))
  @Serialize(StoreRequisitionMutationResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Delete a store requisition',
    description: 'Deletes an existing store requisition',
    operationId: 'deleteStoreRequisition',
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
        description: 'The store requisition was successfully deleted',
      },
      404: {
        description: 'The store requisition was not found',
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
      StoreRequisitionController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.storeRequisitionService.delete(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  // ==================== Mobile-specific endpoints ====================

  @Get(':bu_code/store-requisition/:id/workflow-permission')
  @UseGuards(new AppIdGuard('storeRequisition.getWorkflowPermission'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get workflow permission for a store requisition',
    description: 'Retrieves the workflow permission for the current user on a store requisition',
    operationId: 'getStoreRequisitionWorkflowPermission',
    tags: ['[Method] Get', 'Store Requisition Mobile'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Store Requisition ID' },
      { name: 'bu_code', in: 'path', required: true, description: 'Business Unit Code' },
    ],
    responses: {
      200: { description: 'Workflow permission retrieved successfully' },
      404: { description: 'Store requisition not found' },
    },
  })
  @HttpCode(HttpStatus.OK)
  async getWorkflowPermission(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'getWorkflowPermission',
        id,
        version,
      },
      StoreRequisitionController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.storeRequisitionService.getWorkflowPermission(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Get(':bu_code/store-requisition/:id/workflow-previous-step-list')
  @UseGuards(new AppIdGuard('storeRequisition.getWorkflowPreviousStepList'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get workflow previous step list for a store requisition',
    description: 'Retrieves the list of previous workflow steps for a store requisition',
    operationId: 'getStoreRequisitionWorkflowPreviousStepList',
    tags: ['[Method] Get', 'Store Requisition Mobile'],
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Store Requisition ID' },
      { name: 'bu_code', in: 'path', required: true, description: 'Business Unit Code' },
    ],
    responses: {
      200: { description: 'Workflow previous step list retrieved successfully' },
      404: { description: 'Store requisition not found' },
    },
  })
  @HttpCode(HttpStatus.OK)
  async getWorkflowPreviousStepList(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'getWorkflowPreviousStepList',
        id,
        version,
      },
      StoreRequisitionController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.storeRequisitionService.getWorkflowPreviousStepList(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }
}
