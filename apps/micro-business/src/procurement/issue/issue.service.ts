import QueryParams from '@/libs/paginate.query'
import { IPaginate } from '@/common/shared-interface/paginate.interface'
import { TenantService } from "@/tenant/tenant.service";
import { HttpStatus, HttpException, Injectable } from "@nestjs/common";
import { isUUID } from 'class-validator';
import { PrismaClient, Prisma } from "@repo/prisma-shared-schema-tenant";
import { BackendLogger } from "@/common/helpers/backend.logger";
import getPaginationParams from '@/common/helpers/pagination.params';
import {
  TryCatch,
  Result,
  ErrorCode,
  IssueDetailResponseSchema,
  IssueListItemResponseSchema,
  IssueMutationResponseSchema,
} from '@/common';

const ERROR_MISSING_BU_CODE = 'Missing bu_code';
const ERROR_MISSING_USER_ID = 'Missing user_id';

@Injectable()
export class IssueService {
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

  private readonly logger: BackendLogger = new BackendLogger(IssueService.name);

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
      throw new HttpException(
        'Prisma service is not initialized',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return this._prismaService;
  }

  constructor(
    private readonly tenantService: TenantService,
  ) { }

  /**
   * Find all issues with pagination, search, and filtering
   * ค้นหาปัญหาทั้งหมดพร้อมการแบ่งหน้า การค้นหา และการกรอง
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of issues / รายการปัญหาที่แบ่งหน้าแล้ว
   */
  @TryCatch
  async findAll(paginate: IPaginate): Promise<Result<unknown>> {
    this.logger.debug({ function: 'findAll', user_id: this.userId, tenant_id: this.bu_code, paginate }, IssueService.name);
    const defaultSearchFields = ['name', 'description', 'category'];

    const q = new QueryParams(
      paginate.page,
      paginate.perpage,
      paginate.search,
      paginate.searchfields,
      defaultSearchFields,
      typeof paginate.filter === 'object' && !Array.isArray(paginate.filter) ? paginate.filter : {},
      paginate.sort,
      paginate.advance,
    );

    const pagination = getPaginationParams(q.page, q.perpage);

    const issues = await this.prismaService.tb_issue.findMany({
      where: {
        ...q.where(),
        deleted_at: null,
      },
      orderBy: q.orderBy(),
      ...pagination,
    });

    const total = await this.prismaService.tb_issue.count({
      where: {
        ...q.where(),
        deleted_at: null,
      },
    });

    const serializedIssues = issues.map((item) =>
      IssueListItemResponseSchema.parse(item)
    );

    return Result.ok({
      paginate: {
        total: total,
        page: q.perpage < 0 ? 1 : q.page,
        perpage: q.perpage < 0 ? 1 : q.perpage,
        pages: total === 0 || q.perpage < 0 ? 1 : Math.ceil(total / q.perpage),
      },
      data: serializedIssues,
    });
  }

  /**
   * Find a single issue by ID
   * ค้นหาปัญหารายการเดียวตาม ID
   * @param id - Issue ID / ID ของปัญหา
   * @returns Issue data / ข้อมูลปัญหา
   */
  @TryCatch
  async findOne(id: string): Promise<Result<unknown>> {
    this.logger.debug({ function: 'findOne', id, user_id: this.userId, tenant_id: this.bu_code }, IssueService.name);

    const issue = await this.prismaService.tb_issue.findFirst({
      where: {
        id: id,
        deleted_at: null,
      },
    });

    if (!issue) {
      return Result.error('Issue not found', ErrorCode.NOT_FOUND);
    }

    const serializedIssue = IssueDetailResponseSchema.parse(issue);

    return Result.ok(serializedIssue);
  }

  /**
   * Create a new issue record
   * สร้างรายการปัญหาใหม่
   * @param data - Issue data including name, description, status, priority, etc. / ข้อมูลปัญหารวมถึงชื่อ คำอธิบาย สถานะ ลำดับความสำคัญ ฯลฯ
   * @returns Created issue data / ข้อมูลปัญหาที่สร้างแล้ว
   */
  @TryCatch
  async create(data: {
    name: string;
    description?: string;
    status?: string;
    priority?: string;
    assigned_to_id?: string;
    due_date?: Date;
    category?: string;
    tags?: string[];
    resolution?: string;
    note?: string;
    info?: Record<string, unknown>;
  }): Promise<Result<unknown>> {
    this.logger.debug({ function: 'create', data, user_id: this.userId, tenant_id: this.bu_code }, IssueService.name);

    const issue = await this.prismaService.tb_issue.create({
      data: {
        name: data.name,
        description: data.description,
        status: data.status as any,
        priority: data.priority as any,
        assigned_to_id: data.assigned_to_id,
        due_date: data.due_date,
        category: data.category,
        tags: data.tags,
        resolution: data.resolution,
        note: data.note,
        info: data.info as Prisma.InputJsonValue,
        created_by_id: this.userId,
        updated_by_id: this.userId,
      },
    });

    const serializedIssue = IssueMutationResponseSchema.parse(issue);

    return Result.ok(serializedIssue);
  }

  /**
   * Update an existing issue record
   * อัปเดตรายการปัญหาที่มีอยู่
   * @param id - Issue ID to update / ID ของปัญหาที่ต้องการอัปเดต
   * @param data - Updated issue data / ข้อมูลปัญหาที่อัปเดต
   * @returns Updated issue data / ข้อมูลปัญหาที่อัปเดตแล้ว
   */
  @TryCatch
  async update(id: string, data: {
    name?: string;
    description?: string;
    status?: string;
    priority?: string;
    assigned_to_id?: string;
    due_date?: Date;
    category?: string;
    tags?: string[];
    resolution?: string;
    note?: string;
    info?: Record<string, unknown>;
  }): Promise<Result<unknown>> {
    this.logger.debug({ function: 'update', id, data, user_id: this.userId, tenant_id: this.bu_code }, IssueService.name);

    const existingIssue = await this.prismaService.tb_issue.findFirst({
      where: {
        id: id,
        deleted_at: null,
      },
    });

    if (!existingIssue) {
      return Result.error('Issue not found', ErrorCode.NOT_FOUND);
    }

    const issue = await this.prismaService.tb_issue.update({
      where: { id: id },
      data: {
        name: data.name,
        description: data.description,
        status: data.status as any,
        priority: data.priority as any,
        assigned_to_id: data.assigned_to_id,
        due_date: data.due_date,
        category: data.category,
        tags: data.tags,
        resolution: data.resolution,
        note: data.note,
        info: data.info as Prisma.InputJsonValue,
        updated_at: new Date().toISOString(),
        updated_by_id: this.userId,
      },
    });

    const serializedIssue = IssueMutationResponseSchema.parse(issue);

    return Result.ok(serializedIssue);
  }

  /**
   * Soft delete an issue by setting deleted_at timestamp
   * ลบปัญหาแบบซอฟต์โดยตั้งค่า deleted_at
   * @param id - Issue ID to delete / ID ของปัญหาที่ต้องการลบ
   * @returns Deleted issue ID / ID ของปัญหาที่ลบแล้ว
   */
  @TryCatch
  async delete(id: string): Promise<Result<unknown>> {
    this.logger.debug({ function: 'delete', id, user_id: this.userId, tenant_id: this.bu_code }, IssueService.name);

    const existingIssue = await this.prismaService.tb_issue.findFirst({
      where: {
        id: id,
        deleted_at: null,
      },
    });

    if (!existingIssue) {
      return Result.error('Issue not found', ErrorCode.NOT_FOUND);
    }

    await this.prismaService.tb_issue.update({
      where: { id: id },
      data: {
        deleted_at: new Date(),
        deleted_by_id: this.userId,
      },
    });

    return Result.ok({ id: id });
  }
}
