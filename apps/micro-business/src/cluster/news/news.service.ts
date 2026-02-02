import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import QueryParams from 'src/libs/paginate.query';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { IPaginate, Result, TryCatch } from '@/common';

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
  ): Promise<any> {
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
        // contents: true,
        image: true,
        created_at: true,
        created_by_id: true,
        updated_at: true,
        updated_by_id: true,
        // deleted_at: true,
        // deleted_by_id: true,
      },
    });

    const total = await this.prismaSystem.tb_news.count({
      where: q.where(),
    });

    // return {
    //   data: {
    //     paginate: {
    //       total: total,
    //       page: paginate.page,
    //       perpage: paginate.perpage,
    //       pages: total == 0 ? 1 : Math.ceil(total / q.perpage),
    //     },
    //     data: news,
    //   },
    //   response: {
    //     status: HttpStatus.OK,
    //     message: 'News retrieved successfully',
    //   },
    // };

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

  async findOne(id: string, user_id: string, version: string): Promise<any> {
    this.logger.debug(
      {
        function: 'findOne',
        id: id,
        user_id: user_id,
        version: version,
      },
      NewsService.name,
    );

    const news = await this.prismaSystem.tb_news.findUnique({
      where: { id },
    });

    if (!news) {
      return {
        data: null,
        response: {
          status: HttpStatus.NOT_FOUND,
          message: 'News not found',
        },
      };
    }

    // return {
    //   data: news,
    //   response: {
    //     status: HttpStatus.OK,
    //     message: 'News retrieved successfully',
    //   },
    // };

    return Result.ok(news);
  }

  async create(data: any, user_id: string, version: string): Promise<any> {
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

    // return {
    //   data: news.id,
    //   response: {
    //     status: HttpStatus.CREATED,
    //     message: 'News created successfully',
    //   },
    // };

    return Result.ok({ id: news.id });
  }

  async update(
    id: string,
    data: any,
    user_id: string,
    version: string,
  ): Promise<any> {
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

    const existingNews = await this.prismaSystem.tb_news.findUnique({
      where: { id },
    });

    if (!existingNews) {
      return {
        data: null,
        response: {
          status: HttpStatus.NOT_FOUND,
          message: 'News not found',
        },
      };
    }

    const news = await this.prismaSystem.tb_news.update({
      where: { id },
      data: {
        title: data.title,
        url: data.url,
        image: data.image,
        updated_at: new Date(),
        updated_by_id: user_id,
      },
    });

    // return {
    //   data: news.id,
    //   response: {
    //     status: HttpStatus.OK,
    //     message: 'News updated successfully',
    //   },
    // };

    return Result.ok(id);
  }

  async delete(id: string, user_id: string, version: string): Promise<any> {
    this.logger.debug(
      {
        function: 'delete',
        id: id,
        user_id: user_id,
        version: version,
      },
      NewsService.name,
    );

    const existingNews = await this.prismaSystem.tb_news.findUnique({
      where: { id },
    });

    if (!existingNews) {
      return {
        data: null,
        response: {
          status: HttpStatus.NOT_FOUND,
          message: 'News not found',
        },
      };
    }

    await this.prismaSystem.tb_news.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        deleted_by_id: user_id,
      },
    });

    //   return {
    //     data: { id },
    //     response: {
    //       status: HttpStatus.OK,
    //       message: 'News deleted successfully',
    //     },
    //   };

    return Result.ok(id);
  }
}
