import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { TenantService } from '@/tenant/tenant.service';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient, PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';
import { IPaginate } from '@/common/shared-interface/paginate.interface';
import QueryParams from '@/libs/paginate.query';
import { BackendLogger } from '@/common/helpers/backend.logger';
import {
  CreateGoodReceivedNoteComment,
  UpdateGoodReceivedNoteComment,
} from './dto/good-received-note-comment.dto';
import { Attachment } from '../../common/dto/attachment.schema';
import getPaginationParams from '@/common/helpers/pagination.params';

const ERROR_MISSING_BU_CODE = 'Missing bu_code';
const ERROR_MISSING_USER_ID = 'Missing user_id';

@Injectable()
export class GoodReceivedNoteCommentService {
  get bu_code(): string {
    if (this._bu_code) {
      return String(this._bu_code);
    }
    throw new HttpException(ERROR_MISSING_BU_CODE, HttpStatus.UNPROCESSABLE_ENTITY);
  }

  get userId(): string {
    if (isUUID(this._userId, 4)) {
      return String(this._userId);
    }
    throw new HttpException(ERROR_MISSING_USER_ID, HttpStatus.UNPROCESSABLE_ENTITY);
  }

  set bu_code(value: string) {
    this._bu_code = value;
  }

  set userId(value: string) {
    this._userId = value;
  }

  private _bu_code?: string;
  private _userId?: string;

  private readonly logger: BackendLogger = new BackendLogger(GoodReceivedNoteCommentService.name);

  async initializePrismaService(bu_code: string, userId: string): Promise<void> {
    this._bu_code = bu_code;
    this._userId = userId;
    this._prismaService = await this.tenantService.prismaTenantInstance(bu_code, userId);
  }

  private _prismaService: PrismaClient | undefined;

  get prismaService(): PrismaClient {
    if (!this._prismaService) {
      throw new HttpException('Prisma service is not initialized', HttpStatus.INTERNAL_SERVER_ERROR);
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
      { function: 'findById', id, user_id: this.userId, tenant_id: this.bu_code },
      GoodReceivedNoteCommentService.name,
    );

    const comment = await this.prismaService.tb_good_received_note_comment.findFirst({
      where: { id, deleted_at: null },
    });

    if (!comment) {
      return {
        response: { status: HttpStatus.NOT_FOUND, message: 'Comment not found' },
      };
    }

    const [userProfile, user] = comment.user_id
      ? await Promise.all([
          this.prismaSystem.tb_user_profile.findFirst({
            where: { user_id: comment.user_id },
            select: { firstname: true, middlename: true, lastname: true },
          }),
          this.prismaSystem.tb_user.findFirst({
            where: { id: comment.user_id },
            select: { username: true },
          }),
        ])
      : [null, null];

    return {
      data: {
        ...comment,
        username: user?.username ?? null,
        firstname: userProfile?.firstname ?? null,
        middlename: userProfile?.middlename ?? null,
        lastname: userProfile?.lastname ?? null,
        attachments: comment.attachments || [],
      },
      response: { status: HttpStatus.OK, message: 'Comment retrieved successfully' },
    };
  }

  async findAllByGoodReceivedNoteId(goodReceivedNoteId: string, paginate: IPaginate): Promise<any> {
    this.logger.debug(
      {
        function: 'findAllByGoodReceivedNoteId',
        goodReceivedNoteId,
        user_id: this.userId,
        tenant_id: this.bu_code,
        paginate,
      },
      GoodReceivedNoteCommentService.name,
    );

    const defaultSearchFields = ['message'];

    const q = new QueryParams(
      paginate?.page,
      paginate?.perpage,
      paginate?.search,
      paginate?.searchfields,
      defaultSearchFields,
      typeof paginate?.filter === 'object' && !Array.isArray(paginate?.filter) ? paginate.filter : {},
      paginate?.sort,
      paginate?.advance,
    );

    const pagination = getPaginationParams(q.page, q.perpage);

    const whereQry = {
      ...q.where(),
      good_received_note_id: goodReceivedNoteId,
      deleted_at: null,
    };

    const comments = await this.prismaService.tb_good_received_note_comment.findMany({
      where: whereQry,
      orderBy: q.orderBy().length > 0 ? q.orderBy() : { created_at: 'desc' },
      ...pagination,
    });

    const total = await this.prismaService.tb_good_received_note_comment.count({
      where: whereQry,
    });

    const userIds = [...new Set(comments.map((c) => c.user_id).filter(Boolean))] as string[];
    const [userProfiles, users] =
      userIds.length > 0
        ? await Promise.all([
            this.prismaSystem.tb_user_profile.findMany({
              where: { user_id: { in: userIds } },
              select: { user_id: true, firstname: true, middlename: true, lastname: true },
            }),
            this.prismaSystem.tb_user.findMany({
              where: { id: { in: userIds } },
              select: { id: true, username: true },
            }),
          ])
        : [[], []];
    const profileMap = new Map(userProfiles.map((p) => [p.user_id, p]));
    const userMap = new Map(users.map((u) => [u.id, u]));

    const mappedComments = comments.map((comment) => {
      const profile = comment.user_id ? profileMap.get(comment.user_id) : null;
      const user = comment.user_id ? userMap.get(comment.user_id) : null;
      return {
        ...comment,
        username: user?.username ?? null,
        firstname: profile?.firstname ?? null,
        middlename: profile?.middlename ?? null,
        lastname: profile?.lastname ?? null,
        attachments: comment.attachments || [],
      };
    });

    return {
      data: mappedComments,
      paginate: {
        total,
        page: q.perpage < 0 ? 1 : q.page,
        perpage: q.perpage < 0 ? 1 : q.perpage,
        pages: total === 0 || q.perpage < 0 ? 1 : Math.ceil(total / q.perpage),
      },
      response: { status: HttpStatus.OK, message: 'Comments retrieved successfully' },
    };
  }

  async create(createDto: CreateGoodReceivedNoteComment): Promise<any> {
    this.logger.debug(
      { function: 'create', createDto, user_id: this.userId, tenant_id: this.bu_code },
      GoodReceivedNoteCommentService.name,
    );

    const grn = await this.prismaService.tb_good_received_note.findFirst({
      where: { id: createDto.good_received_note_id },
    });

    if (!grn) {
      return {
        response: { status: HttpStatus.NOT_FOUND, message: 'Good received note not found' },
      };
    }

    const comment = await this.prismaService.tb_good_received_note_comment.create({
      data: {
        good_received_note_id: createDto.good_received_note_id,
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
      response: { status: HttpStatus.CREATED, message: 'Comment created successfully' },
    };
  }

  async update(id: string, updateDto: UpdateGoodReceivedNoteComment): Promise<any> {
    this.logger.debug(
      { function: 'update', id, updateDto, user_id: this.userId, tenant_id: this.bu_code },
      GoodReceivedNoteCommentService.name,
    );

    const existingComment = await this.prismaService.tb_good_received_note_comment.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existingComment) {
      return {
        response: { status: HttpStatus.NOT_FOUND, message: 'Comment not found' },
      };
    }

    if (existingComment.user_id !== this.userId) {
      return {
        response: { status: HttpStatus.FORBIDDEN, message: 'You can only update your own comments' },
      };
    }

    const updateData: Record<string, unknown> = { updated_by_id: this.userId };
    if (updateDto.message !== undefined) updateData.message = updateDto.message;
    if (updateDto.attachments !== undefined) updateData.attachments = updateDto.attachments;

    const comment = await this.prismaService.tb_good_received_note_comment.update({
      where: { id },
      data: updateData,
    });

    return {
      data: { ...comment, attachments: comment.attachments || [] },
      response: { status: HttpStatus.OK, message: 'Comment updated successfully' },
    };
  }

  async delete(id: string): Promise<any> {
    this.logger.debug(
      { function: 'delete', id, user_id: this.userId, tenant_id: this.bu_code },
      GoodReceivedNoteCommentService.name,
    );

    const existingComment = await this.prismaService.tb_good_received_note_comment.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existingComment) {
      return {
        response: { status: HttpStatus.NOT_FOUND, message: 'Comment not found' },
      };
    }

    if (existingComment.user_id !== this.userId) {
      return {
        response: { status: HttpStatus.FORBIDDEN, message: 'You can only delete your own comments' },
      };
    }

    await this.prismaService.tb_good_received_note_comment.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        deleted_by_id: this.userId,
      },
    });

    return {
      data: { id },
      response: { status: HttpStatus.OK, message: 'Comment deleted successfully' },
    };
  }

  async addAttachment(id: string, attachment: Attachment): Promise<any> {
    this.logger.debug(
      { function: 'addAttachment', id, attachment, user_id: this.userId, tenant_id: this.bu_code },
      GoodReceivedNoteCommentService.name,
    );

    const existingComment = await this.prismaService.tb_good_received_note_comment.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existingComment) {
      return {
        response: { status: HttpStatus.NOT_FOUND, message: 'Comment not found' },
      };
    }

    if (existingComment.user_id !== this.userId) {
      return {
        response: { status: HttpStatus.FORBIDDEN, message: 'You can only modify your own comments' },
      };
    }

    const currentAttachments = (existingComment.attachments as Attachment[]) || [];
    const updatedAttachments = [...currentAttachments, attachment];

    const comment = await this.prismaService.tb_good_received_note_comment.update({
      where: { id },
      data: { attachments: updatedAttachments, updated_by_id: this.userId },
    });

    return {
      data: { ...comment, attachments: comment.attachments || [] },
      response: { status: HttpStatus.OK, message: 'Attachment added successfully' },
    };
  }

  async removeAttachment(id: string, fileToken: string): Promise<any> {
    this.logger.debug(
      { function: 'removeAttachment', id, fileToken, user_id: this.userId, tenant_id: this.bu_code },
      GoodReceivedNoteCommentService.name,
    );

    const existingComment = await this.prismaService.tb_good_received_note_comment.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existingComment) {
      return {
        response: { status: HttpStatus.NOT_FOUND, message: 'Comment not found' },
      };
    }

    if (existingComment.user_id !== this.userId) {
      return {
        response: { status: HttpStatus.FORBIDDEN, message: 'You can only modify your own comments' },
      };
    }

    const currentAttachments = (existingComment.attachments as Attachment[]) || [];
    const updatedAttachments = currentAttachments.filter((att) => att.fileToken !== fileToken);

    const comment = await this.prismaService.tb_good_received_note_comment.update({
      where: { id },
      data: { attachments: updatedAttachments, updated_by_id: this.userId },
    });

    return {
      data: { ...comment, attachments: comment.attachments || [] },
      response: { status: HttpStatus.OK, message: 'Attachment removed successfully' },
    };
  }
}
