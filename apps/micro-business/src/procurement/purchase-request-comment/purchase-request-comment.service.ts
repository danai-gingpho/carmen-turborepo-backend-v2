import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { TenantService } from '@/tenant/tenant.service';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import {
  PrismaClient,
  PrismaClient_TENANT,
} from '@repo/prisma-shared-schema-tenant';
import { IPaginate } from '@/common/shared-interface/paginate.interface';
import QueryParams from '@/libs/paginate.query';
import { BackendLogger } from '@/common/helpers/backend.logger';
import {
  CreatePurchaseRequestComment,
  UpdatePurchaseRequestComment,
  Attachment,
} from './dto/purchase-request-comment.dto';
import getPaginationParams from '@/common/helpers/pagination.params';

const ERROR_MISSING_BU_CODE = 'Missing bu_code';
const ERROR_MISSING_USER_ID = 'Missing user_id';

@Injectable()
export class PurchaseRequestCommentService {
  get bu_code(): string {
    if (this._bu_code) {
      return String(this._bu_code);
    }
    throw new HttpException(
      ERROR_MISSING_BU_CODE,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }

  get userId(): string {
    if (isUUID(this._userId, 4)) {
      return String(this._userId);
    }
    throw new HttpException(
      ERROR_MISSING_USER_ID,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }

  set bu_code(value: string) {
    this._bu_code = value;
  }

  set userId(value: string) {
    this._userId = value;
  }

  private _bu_code?: string;
  private _userId?: string;

  private readonly logger: BackendLogger = new BackendLogger(
    PurchaseRequestCommentService.name,
  );

  async initializePrismaService(
    bu_code: string,
    userId: string,
  ): Promise<void> {
    this._bu_code = bu_code;
    this._userId = userId;
    this._prismaService = await this.tenantService.prismaTenantInstance(
      bu_code,
      userId,
    );
  }

  private _prismaService: PrismaClient | undefined;

  get prismaService(): PrismaClient {
    if (!this._prismaService) {
      throw new HttpException(
        'Prisma service is not initialized',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return this._prismaService;
  }

  constructor(
    @Inject('PRISMA_SYSTEM')
    private readonly prismaSystem: typeof PrismaClient_SYSTEM,
    @Inject('PRISMA_TENANT')
    private readonly prismaTenant: typeof PrismaClient_TENANT,
    private readonly tenantService: TenantService,
  ) {}

  async findById(id: string): Promise<any> {
    this.logger.debug(
      {
        function: 'findById',
        id,
        user_id: this.userId,
        tenant_id: this.bu_code,
      },
      PurchaseRequestCommentService.name,
    );

    const comment =
      await this.prismaService.tb_purchase_request_comment.findFirst({
        where: {
          id: id,
          deleted_at: null,
        },
      });

    if (!comment) {
      return {
        response: {
          status: HttpStatus.NOT_FOUND,
          message: 'Comment not found',
        },
      };
    }

    return {
      data: {
        ...comment,
        attachments: comment.attachments || [],
      },
      response: {
        status: HttpStatus.OK,
        message: 'Comment retrieved successfully',
      },
    };
  }

  async findAllByPurchaseRequestId(
    purchaseRequestId: string,
    paginate: IPaginate,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'findAllByPurchaseRequestId',
        purchaseRequestId,
        user_id: this.userId,
        tenant_id: this.bu_code,
        paginate,
      },
      PurchaseRequestCommentService.name,
    );

    const defaultSearchFields = ['message'];

    const q = new QueryParams(
      paginate.page,
      paginate.perpage,
      paginate.search,
      paginate.searchfields,
      defaultSearchFields,
      typeof paginate.filter === 'object' && !Array.isArray(paginate.filter)
        ? paginate.filter
        : {},
      paginate.sort,
      paginate.advance,
    );

    const pagination = getPaginationParams(q.page, q.perpage);

    const whereQry = {
      ...q.where(),
      purchase_request_id: purchaseRequestId,
      deleted_at: null,
    };

    const comments =
      await this.prismaService.tb_purchase_request_comment.findMany({
        where: whereQry,
        orderBy: q.orderBy().length > 0 ? q.orderBy() : { created_at: 'desc' },
        ...pagination,
      });

    const total = await this.prismaService.tb_purchase_request_comment.count({
      where: whereQry,
    });

    const mappedComments = comments.map((comment) => ({
      ...comment,
      attachments: comment.attachments || [],
    }));

    return {
      data: mappedComments,
      paginate: {
        total: total,
        page: q.perpage < 0 ? 1 : q.page,
        perpage: q.perpage < 0 ? 1 : q.perpage,
        pages: total === 0 || q.perpage < 0 ? 1 : Math.ceil(total / q.perpage),
      },
      response: {
        status: HttpStatus.OK,
        message: 'Comments retrieved successfully',
      },
    };
  }

  async create(createDto: CreatePurchaseRequestComment): Promise<any> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        user_id: this.userId,
        tenant_id: this.bu_code,
      },
      PurchaseRequestCommentService.name,
    );

    // Verify purchase request exists
    const purchaseRequest =
      await this.prismaService.tb_purchase_request.findFirst({
        where: {
          id: createDto.purchase_request_id,
        },
      });

    if (!purchaseRequest) {
      return {
        response: {
          status: HttpStatus.NOT_FOUND,
          message: 'Purchase request not found',
        },
      };
    }

    const comment =
      await this.prismaService.tb_purchase_request_comment.create({
        data: {
          purchase_request_id: createDto.purchase_request_id,
          message: createDto.message,
          type: createDto.type,
          user_id: this.userId,
          attachments: createDto.attachments || [],
          created_by_id: this.userId,
        },
      });

    return {
      data: {
        id: comment.id,
        ...comment,
        attachments: comment.attachments || [],
      },
      response: {
        status: HttpStatus.CREATED,
        message: 'Comment created successfully',
      },
    };
  }

  async update(id: string, updateDto: UpdatePurchaseRequestComment): Promise<any> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateDto,
        user_id: this.userId,
        tenant_id: this.bu_code,
      },
      PurchaseRequestCommentService.name,
    );

    const existingComment =
      await this.prismaService.tb_purchase_request_comment.findFirst({
        where: {
          id: id,
          deleted_at: null,
        },
      });

    if (!existingComment) {
      return {
        response: {
          status: HttpStatus.NOT_FOUND,
          message: 'Comment not found',
        },
      };
    }

    // Only allow updating own comments (user type)
    if (existingComment.user_id !== this.userId) {
      return {
        response: {
          status: HttpStatus.FORBIDDEN,
          message: 'You can only update your own comments',
        },
      };
    }

    const updateData: any = {
      updated_by_id: this.userId,
    };

    if (updateDto.message !== undefined) {
      updateData.message = updateDto.message;
    }

    if (updateDto.attachments !== undefined) {
      updateData.attachments = updateDto.attachments;
    }

    const comment =
      await this.prismaService.tb_purchase_request_comment.update({
        where: { id: id },
        data: updateData,
      });

    return {
      data: {
        ...comment,
        attachments: comment.attachments || [],
      },
      response: {
        status: HttpStatus.OK,
        message: 'Comment updated successfully',
      },
    };
  }

  async delete(id: string): Promise<any> {
    this.logger.debug(
      {
        function: 'delete',
        id,
        user_id: this.userId,
        tenant_id: this.bu_code,
      },
      PurchaseRequestCommentService.name,
    );

    const existingComment =
      await this.prismaService.tb_purchase_request_comment.findFirst({
        where: {
          id: id,
          deleted_at: null,
        },
      });

    if (!existingComment) {
      return {
        response: {
          status: HttpStatus.NOT_FOUND,
          message: 'Comment not found',
        },
      };
    }

    // Only allow deleting own comments
    if (existingComment.user_id !== this.userId) {
      return {
        response: {
          status: HttpStatus.FORBIDDEN,
          message: 'You can only delete your own comments',
        },
      };
    }

    // Soft delete
    await this.prismaService.tb_purchase_request_comment.update({
      where: { id: id },
      data: {
        deleted_at: new Date(),
        deleted_by_id: this.userId,
      },
    });

    return {
      data: { id },
      response: {
        status: HttpStatus.OK,
        message: 'Comment deleted successfully',
      },
    };
  }

  async addAttachment(id: string, attachment: Attachment): Promise<any> {
    this.logger.debug(
      {
        function: 'addAttachment',
        id,
        attachment,
        user_id: this.userId,
        tenant_id: this.bu_code,
      },
      PurchaseRequestCommentService.name,
    );

    const existingComment =
      await this.prismaService.tb_purchase_request_comment.findFirst({
        where: {
          id: id,
          deleted_at: null,
        },
      });

    if (!existingComment) {
      return {
        response: {
          status: HttpStatus.NOT_FOUND,
          message: 'Comment not found',
        },
      };
    }

    if (existingComment.user_id !== this.userId) {
      return {
        response: {
          status: HttpStatus.FORBIDDEN,
          message: 'You can only modify your own comments',
        },
      };
    }

    const currentAttachments = (existingComment.attachments as Attachment[]) || [];
    const updatedAttachments = [...currentAttachments, attachment];

    const comment =
      await this.prismaService.tb_purchase_request_comment.update({
        where: { id: id },
        data: {
          attachments: updatedAttachments,
          updated_by_id: this.userId,
        },
      });

    return {
      data: {
        ...comment,
        attachments: comment.attachments || [],
      },
      response: {
        status: HttpStatus.OK,
        message: 'Attachment added successfully',
      },
    };
  }

  async removeAttachment(id: string, fileToken: string): Promise<any> {
    this.logger.debug(
      {
        function: 'removeAttachment',
        id,
        fileToken,
        user_id: this.userId,
        tenant_id: this.bu_code,
      },
      PurchaseRequestCommentService.name,
    );

    const existingComment =
      await this.prismaService.tb_purchase_request_comment.findFirst({
        where: {
          id: id,
          deleted_at: null,
        },
      });

    if (!existingComment) {
      return {
        response: {
          status: HttpStatus.NOT_FOUND,
          message: 'Comment not found',
        },
      };
    }

    if (existingComment.user_id !== this.userId) {
      return {
        response: {
          status: HttpStatus.FORBIDDEN,
          message: 'You can only modify your own comments',
        },
      };
    }

    const currentAttachments = (existingComment.attachments as Attachment[]) || [];
    const updatedAttachments = currentAttachments.filter(
      (att) => att.fileToken !== fileToken,
    );

    const comment =
      await this.prismaService.tb_purchase_request_comment.update({
        where: { id: id },
        data: {
          attachments: updatedAttachments,
          updated_by_id: this.userId,
        },
      });

    return {
      data: {
        ...comment,
        attachments: comment.attachments || [],
      },
      response: {
        status: HttpStatus.OK,
        message: 'Attachment removed successfully',
      },
    };
  }
}
