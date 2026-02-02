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
import { MyPendingPurchaseRequestService } from './my-pending.purchase-request.service';
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
  CreatePurchaseRequestDto,
  IGetAllResponse,
  IPurchaseRequest,
  ReviewPurchaseRequestDto,
  UpdatePurchaseRequestDto,
} from '@/common';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import {
  EXAMPLE_PURCHASE_REQUEST,
  MOCK_PURCHASE_REQUEST_LIST,
} from './example/my-pending.purchase-request.example';
import { ApproveByStateRoleSchema2 } from './dto/state-change.dto';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';

@Controller('api/my-pending/purchase-request')
@ApiTags('Application - My Pending')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class MyPendingPurchaseRequestController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    MyPendingPurchaseRequestController.name,
  );

  constructor(
    private readonly myPendingPurchaseRequestService: MyPendingPurchaseRequestService,
  ) {
    super();
  }

  @Get('pending')
  @UseGuards(new AppIdGuard('my-pending.purchaseRequest.findAllPending.count'))
  //@IgnoreGuards(KeycloakGuard)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get count of all pending purchase requests',
    description: 'Retrieves count of all pending purchase requests',
    operationId: 'findAllPendingPurchaseRequestsCount',
    tags: ['Application - My Pending Purchase Request', '[Method] Get'],
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
        description: 'The purchase requests were successfully retrieved',
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
        description: 'The purchase requests were not found',
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
  async findAllPendingPurchaseRequestsCount(
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAllPendingPurchaseRequestsCount',
        version,
      },
      MyPendingPurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result =
      await this.myPendingPurchaseRequestService.findAllMyPendingPurchaseRequestsCount(
        user_id,
        version,
      );
    this.respond(res, result);
  }

  @Get(':bu_code/workflow-stages')
  @UseGuards(
    new AppIdGuard('my-pending.purchaseRequest.findAllWorkflowStagesByPr'),
  )
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get workflow stages of a purchase request',
    description: 'Retrieves workflow stages of a purchase request',
    operationId: 'findAllWorkflowStagesByPr',
    tags: ['Application - My Pending Purchase Request', '[Method] Get'],
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
        description: 'The purchase requests were successfully retrieved',
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
        description: 'The purchase requests were not found',
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
  async findAllWorkflowStagesByPr(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAllWorkflowStagesByPr',
        version,
      },
      MyPendingPurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result =
      await this.myPendingPurchaseRequestService.findAllMyPendingStages(
        user_id,
        bu_code,
        version,
      );
    this.respond(res, result);
  }

  @Get(':bu_code/:id')
  @UseGuards(new AppIdGuard('my-pending.purchaseRequest.findOne'))
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
      {
        name: 'bu_code',
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
      MyPendingPurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.myPendingPurchaseRequestService.findById(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Get()
  @UseGuards(new AppIdGuard('my-pending.purchaseRequest.findAll'))
  @ApiVersionMinRequest()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all purchase requests',
    description: 'Retrieves all purchase requests',
    operationId: 'findAllPurchaseRequests',
    tags: ['Application - My Pending Purchase Request', '[Method] Get'],
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
        in: 'path',
        required: true,
      },
    ],
    responses: {
      200: {
        description: 'The purchase requests were successfully retrieved',
        content: {
          'application/json': {
            examples: {
              default: {
                value: MOCK_PURCHASE_REQUEST_LIST,
              },
            },
          },
        },
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
      MyPendingPurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.myPendingPurchaseRequestService.findAll(
      user_id,
      paginate.bu_code,
      paginate,
      version,
    );

    this.respond(res, result);
  }

  @Get(':bu_code/status/:status')
  @UseGuards(new AppIdGuard('my-pending.purchaseRequest.findAllByStatus'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get approval status of a purchase request',
    description: 'Retrieves the approval status of a purchase request',
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
      MyPendingPurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.myPendingPurchaseRequestService.findAllByStatus(
      status,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Post(':bu_code')
  @UseGuards(new AppIdGuard('my-pending.purchaseRequest.create'))
  @ApiVersionMinRequest()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a purchase request',
    description: 'Creates a new purchase request',
    operationId: 'createPurchaseRequest',
    tags: ['Application - My Pending Purchase Request', '[Method] Post'],
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
    type: CreatePurchaseRequestDto,
    description: 'Purchase request data',
    examples: {
      example1: {
        value: EXAMPLE_PURCHASE_REQUEST,
        summary: 'Sample purchase request',
      },
    },
  })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createDto: CreatePurchaseRequestDto,
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      MyPendingPurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.myPendingPurchaseRequestService.create(
      createDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Patch(':bu_code/:id/submit')
  @UseGuards(new AppIdGuard('my-pending.purchaseRequest.submit'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Submit a purchase request',
    description: 'Submits an existing purchase request',
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
      MyPendingPurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.myPendingPurchaseRequestService.submit(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Patch(':bu_code/:id/approve')
  @UseGuards(new AppIdGuard('my-pending.purchaseRequest.approve'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Submit a purchase request',
    description: 'Submits an existing purchase request',
  })
  @HttpCode(HttpStatus.OK)
  async approve(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
    @Body() payload: typeof ApproveByStateRoleSchema2,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'approve',
        id,
        version,
      },
      MyPendingPurchaseRequestController.name,
    );
    let approvePayload;
    try {
      approvePayload = ApproveByStateRoleSchema2.parse(payload);
    } catch (e: any) {
      console.log(e);
      throw new BadRequestException(e);
    }

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.myPendingPurchaseRequestService.approve(
      id,
      approvePayload,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Patch(':bu_code/:id/reject')
  @UseGuards(new AppIdGuard('my-pending.purchaseRequest.reject'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Submit a purchase request',
    description: 'Submits an existing purchase request',
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
        function: 'approve',
        id,
        version,
      },
      MyPendingPurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.myPendingPurchaseRequestService.reject(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Patch(':bu_code/:id/review')
  @UseGuards(new AppIdGuard('my-pending.purchaseRequest.review'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Review a purchase request',
    description: 'Review an existing purchase request',
  })
  @HttpCode(HttpStatus.OK)
  async review(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
    @Body() payload: typeof ReviewPurchaseRequestDto,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'approve',
        id,
        version,
      },
      MyPendingPurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.myPendingPurchaseRequestService.review(
      id,
      payload,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Patch(':bu_code/:id/save')
  @UseGuards(new AppIdGuard('my-pending.purchaseRequest.update'))
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
    @Body() updateDto: UpdatePurchaseRequestDto,
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateDto,
        version,
      },
      MyPendingPurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.myPendingPurchaseRequestService.update(
      id,
      updateDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Delete(':bu_code/:id')
  @UseGuards(new AppIdGuard('my-pending.purchaseRequest.delete'))
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
      MyPendingPurchaseRequestController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.myPendingPurchaseRequestService.delete(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }
}
