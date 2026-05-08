import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import QueryParams from 'src/libs/paginate.query';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { IPaginate, Result, ErrorCode, TryCatch } from '@/common';

@Injectable()
export class ReportTemplateService {
  private readonly logger: BackendLogger = new BackendLogger(ReportTemplateService.name);

  constructor(
    @Inject('PRISMA_SYSTEM')
    private readonly prismaSystem: typeof PrismaClient_SYSTEM,
  ) {}

  @TryCatch
  async findAll(
    user_id: string,
    paginate: IPaginate,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findAll', user_id, paginate, version },
      ReportTemplateService.name,
    );

    const defaultSearchFields = ['name', 'description', 'report_group'];

    const q = new QueryParams(
      paginate.page,
      paginate.perpage,
      paginate.search,
      paginate.searchfields,
      defaultSearchFields,
      paginate.filter,
      paginate.sort,
      paginate.advance,
    );

    const templates = await this.prismaSystem.tb_report_template.findMany({
      ...q.findMany(),
      select: {
        id: true,
        name: true,
        description: true,
        report_group: true,
        dialog: true,
        is_standard: true,
        allow_business_unit: true,
        deny_business_unit: true,
        is_active: true,
        created_at: true,
        created_by_id: true,
        updated_at: true,
        updated_by_id: true,
        deleted_at: true,
        deleted_by_id: true,
      },
    });

    const total = await this.prismaSystem.tb_report_template.count({
      where: q.where(),
    });

    return Result.ok({
      paginate: {
        total: total,
        page: paginate.page,
        perpage: paginate.perpage,
        pages: total == 0 ? 1 : Math.ceil(total / q.perpage),
      },
      data: templates,
    });
  }

  @TryCatch
  async findOne(id: string, user_id: string, version: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findOne', id, user_id, version },
      ReportTemplateService.name,
    );

    const template = await this.prismaSystem.tb_report_template.findFirst({
      where: { id, deleted_at: null },
    });

    if (!template) {
      return Result.error('Report template not found', ErrorCode.NOT_FOUND);
    }

    return Result.ok(template);
  }

  @TryCatch
  async create(data: any, user_id: string, version: string): Promise<Result<{ id: string }>> {
    this.logger.debug(
      { function: 'create', data, user_id, version },
      ReportTemplateService.name,
    );

    const existing = await this.prismaSystem.tb_report_template.findFirst({
      where: { name: data.name, deleted_at: null },
    });

    if (existing) {
      return Result.error('Report template name already exists', ErrorCode.ALREADY_EXISTS);
    }

    const template = await this.prismaSystem.tb_report_template.create({
      data: {
        name: data.name,
        description: data.description,
        report_group: data.report_group,
        dialog: data.dialog,
        content: data.content,
        is_standard: data.is_standard ?? true,
        allow_business_unit: data.allow_business_unit,
        deny_business_unit: data.deny_business_unit,
        is_active: data.is_active ?? true,
        created_by_id: user_id,
      },
    });

    return Result.ok({ id: template.id });
  }

  @TryCatch
  async update(
    id: string,
    data: any,
    user_id: string,
    version: string,
  ): Promise<Result<string>> {
    this.logger.debug(
      { function: 'update', id, data, user_id, version },
      ReportTemplateService.name,
    );

    const existingTemplate = await this.prismaSystem.tb_report_template.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existingTemplate) {
      return Result.error('Report template not found', ErrorCode.NOT_FOUND);
    }

    if (data.name && data.name !== existingTemplate.name) {
      const duplicate = await this.prismaSystem.tb_report_template.findFirst({
        where: { name: data.name, deleted_at: null, id: { not: id } },
      });

      if (duplicate) {
        return Result.error('Report template name already exists', ErrorCode.ALREADY_EXISTS);
      }
    }

    await this.prismaSystem.tb_report_template.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        report_group: data.report_group,
        dialog: data.dialog,
        content: data.content,
        is_standard: data.is_standard,
        allow_business_unit: data.allow_business_unit,
        deny_business_unit: data.deny_business_unit,
        is_active: data.is_active,
        updated_at: new Date().toISOString(),
        updated_by_id: user_id,
      },
    });

    return Result.ok(id);
  }

  @TryCatch
  async delete(id: string, user_id: string, version: string): Promise<Result<string>> {
    this.logger.debug(
      { function: 'delete', id, user_id, version },
      ReportTemplateService.name,
    );

    const existingTemplate = await this.prismaSystem.tb_report_template.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existingTemplate) {
      return Result.error('Report template not found', ErrorCode.NOT_FOUND);
    }

    await this.prismaSystem.tb_report_template.update({
      where: { id },
      data: {
        deleted_at: new Date().toISOString(),
        deleted_by_id: user_id,
      },
    });

    return Result.ok(id);
  }
}
