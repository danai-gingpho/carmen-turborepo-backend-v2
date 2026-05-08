import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export interface IPaginateQuery {
  search: string | undefined;
  page: number | undefined;
  perpage: number | undefined;
  searchfields: string | undefined;
  filter: string | Record<string, string> | undefined;
  sort: string | undefined;
  advance: object | undefined;
  bu_code: string | undefined
}

export function PaginateQuery(query: IPaginateQuery) {
  if (!query) {
    return {
      page: 1,
      perpage: 10,
      search: '',
      searchfields: [],
      sort: [],
      filter: [],
      advance: {},
      bu_code: []
    };
  }

  // Handle filter: supports both string format "status:inactive" and object format { status: 'inactive' }
  let filterValue: Record<string, string> = {};
  if (query.filter) {
    if (typeof query.filter === 'string') {
      // String format: "status:inactive;type:active"
      query.filter.split(';').forEach((item) => {
        const [key, value] = item.split(':');
        if (key && value) {
          filterValue[key.trim()] = value.trim();
        }
      });
    } else if (typeof query.filter === 'object') {
      // Object format: { status: 'inactive' }
      filterValue = query.filter;
    }
  }

  const paginate: IPaginate = {
    page: query.page ?? 1,
    perpage: query.perpage ?? 10,
    search: query.search ?? '',
    searchfields: query.searchfields?.split(';') ?? [],
    sort: query.sort?.split(';') ?? [],
    filter: filterValue,
    advance: query.advance ?? {},
    bu_code: query.bu_code?.split(';') ?? []
  };

  return { ...paginate };
}

export const PaginateSchema = z.object({
  search: z.string().optional(),
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => {
      const num = parseInt(val, 10);
      return isNaN(num) || num < 1 ? 1 : num;
    }),
  perpage: z
    .string()
    .optional()
    .default('10')
    .transform((val) => {
      const num = parseInt(val, 10);
      return isNaN(num) || num < 1 ? 10 : num;
    }),
  searchfields: z.array(z.string()).optional(),
  filter: z.union([
    z.string().transform((val) => {
      if (!val) return {};
      const result: Record<string, string> = {};
      val.split(';').forEach((item) => {
        const [key, value] = item.split(':');
        if (key && value) {
          result[key.trim()] = value.trim();
        }
      });
      return result;
    }),
    z.record(z.string(), z.string()),
  ]).optional().default({}),
  sort: z.array(z.string()).optional(),
  advance: z.object({}).optional(),
  bu_code:
  z
  .string().
  optional()
  .transform((val => {
      if (!val) return [];
      return val.split(';');
  })),
});

export type IPaginate = z.infer<typeof PaginateSchema>;

export class PaginateDto extends createZodDto(PaginateSchema) {
  constructor(partial: Partial<PaginateDto>) {
    super();
    Object.assign(this, partial);
  }
}
