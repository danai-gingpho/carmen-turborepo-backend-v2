import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import QueryParams from 'src/libs/paginate.query';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { IPaginate, Result, TryCatch } from '@/common';

@Injectable()
export class CurrenciesService {
  private readonly logger: BackendLogger = new BackendLogger(
    CurrenciesService.name,
  );
  constructor(
    @Inject('PRISMA_SYSTEM')
    private readonly prismaSystem: typeof PrismaClient_SYSTEM,
  ) {}

  @TryCatch
  async findAllISO(
    user_id: string,
    paginate: IPaginate,
    version: string,
  ): Promise<Result<{ paginate: unknown; data: unknown[] }>> {
    this.logger.debug(
      {
        function: 'findAllISO',
        user_id: user_id,
        paginate: paginate,
        version: version,
      },
      CurrenciesService.name,
    );
    const defaultSearchFields = ['name', 'iso_code', 'symbol'];

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

    const currencies = await this.prismaSystem.tb_currency_iso.findMany({
      ...q.findMany(),
    });

    const total = await this.prismaSystem.tb_currency_iso.count({
      where: q.where(),
    });

    return Result.ok({
      paginate: {
        total: total,
        page: paginate.page,
        perpage: paginate.perpage,
        pages: total == 0 ? 1 : Math.ceil(total / q.perpage),
      },
      data: currencies,
    });
  }
}
