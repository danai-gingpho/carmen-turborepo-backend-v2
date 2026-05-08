import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { isUUID } from "class-validator";
import { TenantService } from "@/tenant/tenant.service";
import { PrismaClient_SYSTEM } from "@repo/prisma-shared-schema-platform";
import { PrismaClient, PrismaClient_TENANT } from "@repo/prisma-shared-schema-tenant";
import { IPaginate } from "@/common/shared-interface/paginate.interface";
import QueryParams from "@/libs/paginate.query";
import { BackendLogger } from "@/common/helpers/backend.logger";
import {
  CreateTaxProfileComment,
  UpdateTaxProfileComment,
  Attachment,
} from "./dto/tax-profile-comment.dto";
import getPaginationParams from "@/common/helpers/pagination.params";

const ERROR_MISSING_BU_CODE = "Missing bu_code";
const ERROR_MISSING_USER_ID = "Missing user_id";

@Injectable()
export class TaxProfileCommentService {
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

  private readonly logger: BackendLogger = new BackendLogger(TaxProfileCommentService.name);

  /**
   * Initialize the Prisma service for tenant-specific database access
   * เริ่มต้นบริการ Prisma สำหรับการเข้าถึงฐานข้อมูลเฉพาะผู้เช่า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param userId - User ID / ID ผู้ใช้
   */
  async initializePrismaService(bu_code: string, userId: string): Promise<void> {
    this._bu_code = bu_code;
    this._userId = userId;
    this._prismaService = await this.tenantService.prismaTenantInstance(bu_code, userId);
  }

  private _prismaService: PrismaClient | undefined;

  get prismaService(): PrismaClient {
    if (!this._prismaService) {
      throw new HttpException("Prisma service is not initialized", HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return this._prismaService;
  }

  constructor(
    @Inject("PRISMA_SYSTEM")
    private readonly prismaSystem: typeof PrismaClient_SYSTEM,
    @Inject("PRISMA_TENANT")
    private readonly prismaTenant: typeof PrismaClient_TENANT,
    private readonly tenantService: TenantService,
  ) {}

  /**
   * Find a purchase request comment by ID with user profile information
   * ค้นหาความคิดเห็นใบขอซื้อรายการเดียวตาม ID พร้อมข้อมูลโปรไฟล์ผู้ใช้
   * @param id - Comment ID / ID ของความคิดเห็น
   * @returns Comment data with user profile / ข้อมูลความคิดเห็นพร้อมโปรไฟล์ผู้ใช้
   */
  async findById(id: string): Promise<any> {
    this.logger.debug(
      {
        function: "findById",
        id,
        user_id: this.userId,
        tenant_id: this.bu_code,
      },
      TaxProfileCommentService.name,
    );

    const comment = await this.prismaService.tb_tax_profile_comment.findFirst({
      where: {
        id: id,
        deleted_at: null,
      },
    });

    if (!comment) {
      return {
        response: {
          status: HttpStatus.NOT_FOUND,
          message: "Comment not found",
        },
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
      response: {
        status: HttpStatus.OK,
        message: "Comment retrieved successfully",
      },
    };
  }

  /**
   * Find all comments for a specific purchase request with pagination and user profiles
   * ค้นหาความคิดเห็นทั้งหมดของใบขอซื้อที่ระบุพร้อมการแบ่งหน้าและโปรไฟล์ผู้ใช้
   * @param taxProfileId - Purchase request ID / ID ของใบขอซื้อ
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of comments with user profiles / รายการความคิดเห็นพร้อมโปรไฟล์ผู้ใช้ที่แบ่งหน้าแล้ว
   */
  async findAllByTaxProfileId(taxProfileId: string, paginate: IPaginate): Promise<any> {
    this.logger.debug(
      {
        function: "findAllByTaxProfileId",
        taxProfileId,
        user_id: this.userId,
        tenant_id: this.bu_code,
        paginate,
      },
      TaxProfileCommentService.name,
    );

    const defaultSearchFields = ["message"];

    const q = new QueryParams(
      paginate.page,
      paginate.perpage,
      paginate.search,
      paginate.searchfields,
      defaultSearchFields,
      typeof paginate.filter === "object" && !Array.isArray(paginate.filter) ? paginate.filter : {},
      paginate.sort,
      paginate.advance,
    );

    const pagination = getPaginationParams(q.page, q.perpage);

    const whereQry = {
      ...q.where(),
      tax_profile_id: taxProfileId,
      deleted_at: null,
    };

    const comments = await this.prismaService.tb_tax_profile_comment.findMany({
      where: whereQry,
      orderBy: q.orderBy().length > 0 ? q.orderBy() : { created_at: "desc" },
      ...pagination,
    });

    const total = await this.prismaService.tb_tax_profile_comment.count({
      where: whereQry,
    });

    // Collect unique user_ids and batch-fetch profiles + usernames
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
        total: total,
        page: q.perpage < 0 ? 1 : q.page,
        perpage: q.perpage < 0 ? 1 : q.perpage,
        pages: total === 0 || q.perpage < 0 ? 1 : Math.ceil(total / q.perpage),
      },
      response: {
        status: HttpStatus.OK,
        message: "Comments retrieved successfully",
      },
    };
  }

  /**
   * Create a new comment on a purchase request
   * สร้างความคิดเห็นใหม่ในใบขอซื้อ
   * @param createDto - Comment creation data / ข้อมูลสำหรับสร้างความคิดเห็น
   * @returns Created comment data / ข้อมูลความคิดเห็นที่สร้างแล้ว
   */
  async create(createDto: CreateTaxProfileComment): Promise<any> {
    this.logger.debug(
      {
        function: "create",
        createDto,
        user_id: this.userId,
        tenant_id: this.bu_code,
      },
      TaxProfileCommentService.name,
    );

    // Verify purchase request exists
    const taxProfile = await this.prismaService.tb_tax_profile.findFirst({
      where: {
        id: createDto.tax_profile_id,
      },
    });

    if (!taxProfile) {
      return {
        response: {
          status: HttpStatus.NOT_FOUND,
          message: "Purchase request not found",
        },
      };
    }

    const comment = await this.prismaService.tb_tax_profile_comment.create({
      data: {
        tax_profile_id: createDto.tax_profile_id,
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
        message: "Comment created successfully",
      },
    };
  }

  /**
   * Update an existing purchase request comment (own comments only)
   * อัปเดตความคิดเห็นใบขอซื้อที่มีอยู่ (เฉพาะความคิดเห็นของตนเอง)
   * @param id - Comment ID to update / ID ของความคิดเห็นที่ต้องการอัปเดต
   * @param updateDto - Updated comment data / ข้อมูลความคิดเห็นที่อัปเดต
   * @returns Updated comment data / ข้อมูลความคิดเห็นที่อัปเดตแล้ว
   */
  async update(id: string, updateDto: UpdateTaxProfileComment): Promise<any> {
    this.logger.debug(
      {
        function: "update",
        id,
        updateDto,
        user_id: this.userId,
        tenant_id: this.bu_code,
      },
      TaxProfileCommentService.name,
    );

    const existingComment = await this.prismaService.tb_tax_profile_comment.findFirst({
      where: {
        id: id,
        deleted_at: null,
      },
    });

    if (!existingComment) {
      return {
        response: {
          status: HttpStatus.NOT_FOUND,
          message: "Comment not found",
        },
      };
    }

    // Only allow updating own comments (user type)
    if (existingComment.user_id !== this.userId) {
      return {
        response: {
          status: HttpStatus.FORBIDDEN,
          message: "You can only update your own comments",
        },
      };
    }

    const updateData: Record<string, unknown> = {
      updated_by_id: this.userId,
    };

    if (updateDto.message !== undefined) {
      updateData.message = updateDto.message;
    }

    if (updateDto.attachments !== undefined) {
      updateData.attachments = updateDto.attachments;
    }

    const comment = await this.prismaService.tb_tax_profile_comment.update({
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
        message: "Comment updated successfully",
      },
    };
  }

  /**
   * Soft delete a purchase request comment (own comments only)
   * ลบความคิดเห็นใบขอซื้อแบบซอฟต์ (เฉพาะความคิดเห็นของตนเอง)
   * @param id - Comment ID to delete / ID ของความคิดเห็นที่ต้องการลบ
   * @returns Deleted comment ID / ID ของความคิดเห็นที่ลบแล้ว
   */
  async delete(id: string): Promise<any> {
    this.logger.debug(
      {
        function: "delete",
        id,
        user_id: this.userId,
        tenant_id: this.bu_code,
      },
      TaxProfileCommentService.name,
    );

    const existingComment = await this.prismaService.tb_tax_profile_comment.findFirst({
      where: {
        id: id,
        deleted_at: null,
      },
    });

    if (!existingComment) {
      return {
        response: {
          status: HttpStatus.NOT_FOUND,
          message: "Comment not found",
        },
      };
    }

    // Only allow deleting own comments
    if (existingComment.user_id !== this.userId) {
      return {
        response: {
          status: HttpStatus.FORBIDDEN,
          message: "You can only delete your own comments",
        },
      };
    }

    // Soft delete
    await this.prismaService.tb_tax_profile_comment.update({
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
        message: "Comment deleted successfully",
      },
    };
  }

  /**
   * Add an attachment to a purchase request comment (own comments only)
   * เพิ่มไฟล์แนบในความคิดเห็นใบขอซื้อ (เฉพาะความคิดเห็นของตนเอง)
   * @param id - Comment ID / ID ของความคิดเห็น
   * @param attachment - Attachment data to add / ข้อมูลไฟล์แนบที่ต้องการเพิ่ม
   * @returns Updated comment with new attachment / ความคิดเห็นที่อัปเดตพร้อมไฟล์แนบใหม่
   */
  async addAttachment(id: string, attachment: Attachment): Promise<any> {
    this.logger.debug(
      {
        function: "addAttachment",
        id,
        attachment,
        user_id: this.userId,
        tenant_id: this.bu_code,
      },
      TaxProfileCommentService.name,
    );

    const existingComment = await this.prismaService.tb_tax_profile_comment.findFirst({
      where: {
        id: id,
        deleted_at: null,
      },
    });

    if (!existingComment) {
      return {
        response: {
          status: HttpStatus.NOT_FOUND,
          message: "Comment not found",
        },
      };
    }

    if (existingComment.user_id !== this.userId) {
      return {
        response: {
          status: HttpStatus.FORBIDDEN,
          message: "You can only modify your own comments",
        },
      };
    }

    const currentAttachments = (existingComment.attachments as Attachment[]) || [];
    const updatedAttachments = [...currentAttachments, attachment];

    const comment = await this.prismaService.tb_tax_profile_comment.update({
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
        message: "Attachment added successfully",
      },
    };
  }

  /**
   * Remove an attachment from a purchase request comment by file token (own comments only)
   * ลบไฟล์แนบจากความคิดเห็นใบขอซื้อตาม file token (เฉพาะความคิดเห็นของตนเอง)
   * @param id - Comment ID / ID ของความคิดเห็น
   * @param fileToken - File token of the attachment to remove / token ของไฟล์แนบที่ต้องการลบ
   * @returns Updated comment without the removed attachment / ความคิดเห็นที่อัปเดตโดยไม่มีไฟล์แนบที่ลบ
   */
  async removeAttachment(id: string, fileToken: string): Promise<any> {
    this.logger.debug(
      {
        function: "removeAttachment",
        id,
        fileToken,
        user_id: this.userId,
        tenant_id: this.bu_code,
      },
      TaxProfileCommentService.name,
    );

    const existingComment = await this.prismaService.tb_tax_profile_comment.findFirst({
      where: {
        id: id,
        deleted_at: null,
      },
    });

    if (!existingComment) {
      return {
        response: {
          status: HttpStatus.NOT_FOUND,
          message: "Comment not found",
        },
      };
    }

    if (existingComment.user_id !== this.userId) {
      return {
        response: {
          status: HttpStatus.FORBIDDEN,
          message: "You can only modify your own comments",
        },
      };
    }

    const currentAttachments = (existingComment.attachments as Attachment[]) || [];
    const updatedAttachments = currentAttachments.filter((att) => att.fileToken !== fileToken);

    const comment = await this.prismaService.tb_tax_profile_comment.update({
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
        message: "Attachment removed successfully",
      },
    };
  }
}
