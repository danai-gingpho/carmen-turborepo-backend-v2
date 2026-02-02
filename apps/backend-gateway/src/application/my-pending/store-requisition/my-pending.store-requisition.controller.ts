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
import { MyPendingStoreRequisitionService as MyPendingStoreRequisitionService } from './my-pending.store-requisition.service';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import {
  BaseHttpController,
  ZodSerializerInterceptor,
} from '@/common';
import { TenantHeaderGuard } from 'src/common/guard/tenant-header.guard';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
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
import {
  IGetAllResponse,
  IPurchaseRequest,
} from '@/common';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import { IgnoreGuards } from 'src/auth/decorators/ignore-guard.decorator';

@Controller('api/my-pending/store-requisition')
@ApiTags('Application - My Pending')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class MyPendingStoreRequisitionController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    MyPendingStoreRequisitionController.name,
  );

  constructor(
    private readonly myPendingStoreRequisitionService: MyPendingStoreRequisitionService,
  ) {
    super();
  }

  @Get('pending')
  @UseGuards(new AppIdGuard('my-pending.storeRequisition.findAllPending.count'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get count of all pending store requisitions',
    description: 'Retrieves count of all pending store requisitions',
    operationId: 'findAllPendingStoreRequisitionsCount',
    tags: ['Application - My Pending Store Requisition', '[Method] Get'],
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
        description: 'The store requisitions were successfully retrieved',
        content: {
          'application/json': {
            examples: {
              default: {
                value: {
                  data: {
                    pending: 1,
                  },
                  message: 'Success',
                  status: 200,
                },
              },
            },
          },
        },
      },
      404: {
        description: 'The store requisitions were not found',
        content: {
          'application/json': {
            examples: {
              default: {
                value: {
                  data: {},
                  message: 'false',
                  status: 404,
                },
              },
            },
          },
        },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async findAllPendingStoreRequisitionsCount(
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAllPendingStoreRequisitionsCount',
        version,
      },
      MyPendingStoreRequisitionController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result =
      await this.myPendingStoreRequisitionService.findAllMyPendingStoreRequisitionsCount(
        user_id,
        version,
      );
    this.respond(res, result);
  }

  @Get(':bu_code/workflow-stages')
  @UseGuards(
    new AppIdGuard('my-pending.storeRequisition.findAllWorkflowStagesBySr'),
  )
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get workflow stages of a store requisition',
    description: 'Retrieves workflow stages of a store requisition',
    operationId: 'findAllWorkflowStagesBySr',
    tags: ['Application - My Pending Store Requisition', '[Method] Get'],
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
        description: 'The store requisitions were successfully retrieved',
        content: {
          'application/json': {
            examples: {
              default: {
                value: {
                  data: {
                    workflowStages: [],
                  },
                  message: 'Success',
                  status: 200,
                },
              },
            },
          },
        },
      },
      404: {
        description: 'The store requisitions were not found',
        content: {
          'application/json': {
            examples: {
              default: {
                value: {
                  data: {},
                  message: 'false',
                  status: 404,
                },
              },
            },
          },
        },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async findAllWorkflowStagesBySr(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAllWorkflowStagesBySr',
        version,
      },
      MyPendingStoreRequisitionController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result =
      await this.myPendingStoreRequisitionService.findAllMyPendingStages(
        user_id,
        bu_code,
        version,
      );
    this.respond(res, result);
  }

  @Get(':bu_code/:id')
  @UseGuards(new AppIdGuard('my-pending.storeRequisition.findOne'))
  @ApiVersionMinRequest()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get a store requisition by ID',
    description: 'Retrieves a store requisition by its ID',
    operationId: 'findStoreRequisitionById',
    tags: ['Application - My Pending Store Requisition', '[Method] Get'],
    deprecated: false,
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
      },
      {
        name: 'bu_code',
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
  async findById(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Param('id') id: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findById',
        bu_code,
        id,
        version,
      },
      MyPendingStoreRequisitionController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.myPendingStoreRequisitionService.findById(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Get()
  @UseGuards(new AppIdGuard('my-pending.storeRequisition.findAll'))
  @ApiVersionMinRequest()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all store requisitions',
    description: 'Retrieves all store requisitions',
    operationId: 'findAllStoreRequisitions',
    tags: ['Application - My Pending Store Requisition', '[Method] Get'],
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
      {
        name: 'bu_code',
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
      MyPendingStoreRequisitionController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.myPendingStoreRequisitionService.findAll(
      user_id,
      paginate.bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  @Get(':bu_code/status/:status')
  @UseGuards(new AppIdGuard('my-pending.storeRequisition.findAllByStatus'))
  @ApiVersionMinRequest()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all store requisitions by status',
    description: 'Retrieves all store requisitions by status',
  })
  @HttpCode(HttpStatus.OK)
  async findAllByStatus(
    @Param('status') status: string,
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAllByStatus',
        status,
        version,
      },
      MyPendingStoreRequisitionController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.myPendingStoreRequisitionService.findAllByStatus(
      status,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Post(':bu_code')
  @UseGuards(new AppIdGuard('my-pending.storeRequisition.create'))
  @ApiVersionMinRequest()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a store requisition',
    description: 'Creates a new store requisition',
    operationId: 'createStoreRequisition',
    tags: ['Application - My Pending Store Requisition', '[Method] Post'],
    deprecated: false,
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
      },
      {
        name: 'bu_code',
        in: 'path',
        required: true,
      },
    ],
  })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: any, // CreateStoreRequisitionDto,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        body,
        version,
      },
      MyPendingStoreRequisitionController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.myPendingStoreRequisitionService.create(
      body,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Patch(':bu_code/:id/save')
  @UseGuards(new AppIdGuard('my-pending.storeRequisition.update'))
  @ApiVersionMinRequest()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update a store requisition',
    description: 'Updates an existing store requisition',
    operationId: 'updateStoreRequisition',
    tags: ['Application - My Pending Store Requisition', '[Method] Patch'],
    deprecated: false,
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
      },
      {
        name: 'bu_code',
        in: 'path',
        required: true,
      },
    ],
  })
  @HttpCode(HttpStatus.OK)
  async update(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: any, // UpdateStoreRequisitionDto,
    @Param('bu_code') bu_code: string,
    @Param('id') id: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        body,
        version,
      },
      MyPendingStoreRequisitionController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.myPendingStoreRequisitionService.update(
      id,
      body,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Patch(':bu_code/:id/submit')
  @UseGuards(new AppIdGuard('my-pending.storeRequisition.submit'))
  @ApiVersionMinRequest()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Submit a store requisition',
    description: 'Submits an existing store requisition',
    operationId: 'submitStoreRequisition',
    tags: ['Application - My Pending Store Requisition', '[Method] Patch'],
    deprecated: false,
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
      },
      {
        name: 'bu_code',
        in: 'path',
        required: true,
      },
    ],
  })
  @HttpCode(HttpStatus.OK)
  async submit(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'submit',
        id,
        version,
      },
      MyPendingStoreRequisitionController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.myPendingStoreRequisitionService.submit(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Patch(':bu_code/:id/approve')
  @UseGuards(new AppIdGuard('my-pending.storeRequisition.approve'))
  @ApiVersionMinRequest()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Approve a store requisition',
    description: 'Approves an existing store requisition',
    operationId: 'approveStoreRequisition',
    tags: ['Application - My Pending Store Requisition', '[Method] Patch'],
    deprecated: false,
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
      },
      {
        name: 'bu_code',
        in: 'path',
        required: true,
      },
    ],
  })
  @HttpCode(HttpStatus.OK)
  async approve(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'approve',
        id,
        version,
      },
      MyPendingStoreRequisitionController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.myPendingStoreRequisitionService.approve(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Patch(':bu_code/:id/reject')
  @UseGuards(new AppIdGuard('my-pending.storeRequisition.reject'))
  @ApiVersionMinRequest()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Reject a store requisition',
    description: 'Rejects an existing store requisition',
    operationId: 'rejectStoreRequisition',
    tags: ['Application - My Pending Store Requisition', '[Method] Patch'],
    deprecated: false,
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
      },
      {
        name: 'bu_code',
        in: 'path',
        required: true,
      },
    ],
  })
  @HttpCode(HttpStatus.OK)
  async reject(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'reject',
        id,
        version,
      },
      MyPendingStoreRequisitionController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.myPendingStoreRequisitionService.reject(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Patch(':bu_code/:id/review')
  @UseGuards(new AppIdGuard('my-pending.storeRequisition.review'))
  @ApiVersionMinRequest()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Review a store requisition',
    description: 'Reviews an existing store requisition',
    operationId: 'reviewStoreRequisition',
    tags: ['Application - My Pending Store Requisition', '[Method] Patch'],
    deprecated: false,
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
      },
      {
        name: 'bu_code',
        in: 'path',
        required: true,
      },
    ],
  })
  @HttpCode(HttpStatus.OK)
  async review(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'review',
        id,
        version,
      },
      MyPendingStoreRequisitionController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.myPendingStoreRequisitionService.review(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Delete(':bu_code/:id')
  @UseGuards(new AppIdGuard('my-pending.storeRequisition.delete'))
  @ApiVersionMinRequest()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete a store requisition',
    description: 'Deletes an existing store requisition',
    operationId: 'deleteStoreRequisition',
    tags: ['Application - My Pending Store Requisition', '[Method] Delete'],
    deprecated: false,
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
      },
      {
        name: 'bu_code',
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
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'delete',
        id,
        version,
      },
      MyPendingStoreRequisitionController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.myPendingStoreRequisitionService.delete(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }
}
