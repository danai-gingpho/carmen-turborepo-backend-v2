import {
  Controller,
  Delete,
  Get,
  Param,
  Body,
  Post,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import { PurchaseRequestCommentService } from './purchase-request-comment.service';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { TenantHeaderGuard } from 'src/common/guard/tenant-header.guard';
import { ApiVersionMinRequest } from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { IPaginateQuery, PaginateQuery } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { PermissionGuard } from 'src/auth/guards/permission.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import {
  CreatePurchaseRequestCommentDto,
  UpdatePurchaseRequestCommentDto,
  AddAttachmentDto,
} from './dto/purchase-request-comment.dto';

@Controller('api')
@ApiTags('Application - Purchase Request Comment')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard, PermissionGuard, TenantHeaderGuard)
@ApiBearerAuth()
export class PurchaseRequestCommentController {
  private readonly logger: BackendLogger = new BackendLogger(
    PurchaseRequestCommentController.name,
  );

  constructor(
    private readonly purchaseRequestCommentService: PurchaseRequestCommentService,
  ) {}

  @Get(':bu_code/purchase-request/:purchase_request_id/comment')
  @UseGuards(new AppIdGuard('purchaseRequestComment.findAll'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get all comments for a purchase request',
    description:
      'Retrieves all comments associated with a specific purchase request',
    operationId: 'findAllPurchaseRequestComments',
    tags: ['Application - Purchase Request Comment', '[Method] Get'],
    responses: {
      200: {
        description: 'Comments retrieved successfully',
      },
      404: {
        description: 'Purchase request not found',
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async findAllByPurchaseRequestId(
    @Param('bu_code') bu_code: string,
    @Param('purchase_request_id') purchase_request_id: string,
    @Req() req: Request,
    @Query() query: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'findAllByPurchaseRequestId',
        purchase_request_id,
        query,
        version,
      },
      PurchaseRequestCommentController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);

    return this.purchaseRequestCommentService.findAllByPurchaseRequestId(
      purchase_request_id,
      user_id,
      bu_code,
      paginate,
      version,
    );
  }

  @Get(':bu_code/purchase-request-comment/:id')
  @UseGuards(new AppIdGuard('purchaseRequestComment.findOne'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get a comment by ID',
    description: 'Retrieves a specific comment by its ID',
    operationId: 'findOnePurchaseRequestComment',
    tags: ['Application - Purchase Request Comment', '[Method] Get'],
    responses: {
      200: {
        description: 'Comment retrieved successfully',
      },
      404: {
        description: 'Comment not found',
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async findById(
    @Param('bu_code') bu_code: string,
    @Param('id') id: string,
    @Req() req: Request,
    @Query('version') version: string = 'latest',
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'findById',
        id,
        version,
      },
      PurchaseRequestCommentController.name,
    );

    const { user_id } = ExtractRequestHeader(req);

    return this.purchaseRequestCommentService.findById(
      id,
      user_id,
      bu_code,
      version,
    );
  }

  @Post(':bu_code/purchase-request-comment')
  @UseGuards(new AppIdGuard('purchaseRequestComment.create'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Create a new comment',
    description: 'Creates a new comment for a purchase request',
    operationId: 'createPurchaseRequestComment',
    tags: ['Application - Purchase Request Comment', '[Method] Post'],
    responses: {
      201: {
        description: 'Comment created successfully',
      },
      404: {
        description: 'Purchase request not found',
      },
    },
  })
  @ApiBody({
    type: CreatePurchaseRequestCommentDto,
    description: 'Comment data with optional attachments',
  })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('bu_code') bu_code: string,
    @Body() createDto: CreatePurchaseRequestCommentDto,
    @Req() req: Request,
    @Query('version') version: string = 'latest',
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      PurchaseRequestCommentController.name,
    );

    const { user_id } = ExtractRequestHeader(req);

    return this.purchaseRequestCommentService.create(
      createDto,
      user_id,
      bu_code,
      version,
    );
  }

  @Patch(':bu_code/purchase-request-comment/:id')
  @UseGuards(new AppIdGuard('purchaseRequestComment.update'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Update a comment',
    description: 'Updates an existing comment',
    operationId: 'updatePurchaseRequestComment',
    tags: ['Application - Purchase Request Comment', '[Method] Patch'],
    responses: {
      200: {
        description: 'Comment updated successfully',
      },
      404: {
        description: 'Comment not found',
      },
      403: {
        description: 'Forbidden - can only update own comments',
      },
    },
  })
  @ApiBody({
    type: UpdatePurchaseRequestCommentDto,
    description: 'Updated comment data',
  })
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('bu_code') bu_code: string,
    @Param('id') id: string,
    @Body() updateDto: UpdatePurchaseRequestCommentDto,
    @Req() req: Request,
    @Query('version') version: string = 'latest',
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateDto,
        version,
      },
      PurchaseRequestCommentController.name,
    );

    const { user_id } = ExtractRequestHeader(req);

    return this.purchaseRequestCommentService.update(
      id,
      updateDto,
      user_id,
      bu_code,
      version,
    );
  }

  @Delete(':bu_code/purchase-request-comment/:id')
  @UseGuards(new AppIdGuard('purchaseRequestComment.delete'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Delete a comment',
    description: 'Soft deletes an existing comment',
    operationId: 'deletePurchaseRequestComment',
    tags: ['Application - Purchase Request Comment', '[Method] Delete'],
    responses: {
      200: {
        description: 'Comment deleted successfully',
      },
      404: {
        description: 'Comment not found',
      },
      403: {
        description: 'Forbidden - can only delete own comments',
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('bu_code') bu_code: string,
    @Param('id') id: string,
    @Req() req: Request,
    @Query('version') version: string = 'latest',
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'delete',
        id,
        version,
      },
      PurchaseRequestCommentController.name,
    );

    const { user_id } = ExtractRequestHeader(req);

    return this.purchaseRequestCommentService.delete(
      id,
      user_id,
      bu_code,
      version,
    );
  }

  @Post(':bu_code/purchase-request-comment/:id/attachment')
  @UseGuards(new AppIdGuard('purchaseRequestComment.addAttachment'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Add an attachment to a comment',
    description:
      'Adds a file attachment to an existing comment. File should be uploaded via files.service first.',
    operationId: 'addAttachmentToPurchaseRequestComment',
    tags: ['Application - Purchase Request Comment', '[Method] Post'],
    responses: {
      200: {
        description: 'Attachment added successfully',
      },
      404: {
        description: 'Comment not found',
      },
      403: {
        description: 'Forbidden - can only modify own comments',
      },
    },
  })
  @ApiBody({
    type: AddAttachmentDto,
    description: 'Attachment data from file service',
  })
  @HttpCode(HttpStatus.OK)
  async addAttachment(
    @Param('bu_code') bu_code: string,
    @Param('id') id: string,
    @Body() attachment: AddAttachmentDto,
    @Req() req: Request,
    @Query('version') version: string = 'latest',
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'addAttachment',
        id,
        attachment,
        version,
      },
      PurchaseRequestCommentController.name,
    );

    const { user_id } = ExtractRequestHeader(req);

    return this.purchaseRequestCommentService.addAttachment(
      id,
      attachment,
      user_id,
      bu_code,
      version,
    );
  }

  @Delete(':bu_code/purchase-request-comment/:id/attachment/:fileToken')
  @UseGuards(new AppIdGuard('purchaseRequestComment.removeAttachment'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Remove an attachment from a comment',
    description:
      'Removes a file attachment from an existing comment by its file token',
    operationId: 'removeAttachmentFromPurchaseRequestComment',
    tags: ['Application - Purchase Request Comment', '[Method] Delete'],
    responses: {
      200: {
        description: 'Attachment removed successfully',
      },
      404: {
        description: 'Comment not found',
      },
      403: {
        description: 'Forbidden - can only modify own comments',
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async removeAttachment(
    @Param('bu_code') bu_code: string,
    @Param('id') id: string,
    @Param('fileToken') fileToken: string,
    @Req() req: Request,
    @Query('version') version: string = 'latest',
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'removeAttachment',
        id,
        fileToken,
        version,
      },
      PurchaseRequestCommentController.name,
    );

    const { user_id } = ExtractRequestHeader(req);

    return this.purchaseRequestCommentService.removeAttachment(
      id,
      fileToken,
      user_id,
      bu_code,
      version,
    );
  }
}
