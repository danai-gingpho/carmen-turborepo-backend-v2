import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import QueryParams from 'src/libs/paginate.query';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { IPaginate, Result, ErrorCode, TryCatch } from '@/common';

@Injectable()
export class NewsService {
  private readonly logger: BackendLogger = new BackendLogger(NewsService.name);

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
      {
        function: 'findAll',
        user_id: user_id,
        paginate: paginate,
        version: version,
      },
      NewsService.name,
    );

    const defaultSearchFields = ['title', 'url', 'contents', 'image'];

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

    const news = await this.prismaSystem.tb_news.findMany({
      ...q.findMany(),
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        title: true,
        url: true,
        image: true,
        created_at: true,
        created_by_id: true,
        updated_at: true,
        updated_by_id: true,
        deleted_at: true,
        deleted_by_id: true,
      },
    });

    const total = await this.prismaSystem.tb_news.count({
      where: q.where(),
    });

    return Result.ok({
      paginate: {
        total: total,
        page: paginate.page,
        perpage: paginate.perpage,
        pages: total == 0 ? 1 : Math.ceil(total / q.perpage),
      },
      data: news,
    });
  }

  @TryCatch
  async findOne(id: string, user_id: string, version: string): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'findOne',
        id: id,
        user_id: user_id,
        version: version,
      },
      NewsService.name,
    );

    const news = await this.prismaSystem.tb_news.findFirst({
      where: { id, deleted_at: null },
    });

    if (!news) {
      return Result.error('News not found', ErrorCode.NOT_FOUND);
    }

    return Result.ok(news);
  }

  @TryCatch
  async create(data: any, user_id: string, version: string): Promise<Result<{ id: string }>> {
    this.logger.debug(
      {
        function: 'create',
        data: data,
        user_id: user_id,
        version: version,
      },
      NewsService.name,
    );

    const news = await this.prismaSystem.tb_news.create({
      data: {
        title: data.title,
        contents: data.contents,
        url: data.url,
        image: data.image,
        created_by_id: user_id,
      },
    });

    return Result.ok({ id: news.id });
  }

  @TryCatch
  async update(
    id: string,
    data: any,
    user_id: string,
    version: string,
  ): Promise<Result<string>> {
    this.logger.debug(
      {
        function: 'update',
        id: id,
        data: data,
        user_id: user_id,
        version: version,
      },
      NewsService.name,
    );

    const existingNews = await this.prismaSystem.tb_news.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existingNews) {
      return Result.error('News not found', ErrorCode.NOT_FOUND);
    }

    await this.prismaSystem.tb_news.update({
      where: { id },
      data: {
        title: data.title,
        url: data.url,
        image: data.image,
        updated_at: new Date(),
        updated_by_id: user_id,
      },
    });

    return Result.ok(id);
  }

  @TryCatch
  async delete(id: string, user_id: string, version: string): Promise<Result<string>> {
    this.logger.debug(
      {
        function: 'delete',
        id: id,
        user_id: user_id,
        version: version,
      },
      NewsService.name,
    );

    const existingNews = await this.prismaSystem.tb_news.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existingNews) {
      return Result.error('News not found', ErrorCode.NOT_FOUND);
    }

    await this.prismaSystem.tb_news.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        deleted_by_id: user_id,
      },
    });

    return Result.ok(id);
  }
}
