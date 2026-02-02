import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const PaginateSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => {
      const n = Number(v);
      return Number.isInteger(n) && n > 0 ? n : 1;
    }),

  perpage: z
    .string()
    .optional()
    .transform((v) => {
      const n = Number(v);
      return Number.isInteger(n) && n > 0 ? n : 10;
    }),

  search: z.string().optional().default(''),

  searchfields: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(';') : [])),

  sort: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(';') : [])),

  filter: z
    .string()
    .optional()
    .transform((v) => {
      if (!v) return {};
      const result: Record<string, string> = {};
      v.split(';').forEach((item) => {
        const [k, val] = item.split(':');
        if (k && val) result[k.trim()] = val.trim();
      });
      return result;
    }),

  advance: z
    .string()
    .optional()
    .transform((v) => {
      if (!v) return null;
      try {
        return JSON.parse(v);
      } catch {
        return null;
      }
    }),

  bu_code: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(';') : [])),
});

export interface IPaginateQuery {
  search?: string;
  page?: string;
  perpage?: string;
  searchfields?: string; // "name;code"
  filter?: string;       // "status:active;type:main"
  sort?: string;         // "name:asc;code:desc"
  advance?: string;      // JSON string
  bu_code?: string;      // "BU01;BU02"
}

export type IPaginate = {
  page: number;
  perpage: number;
  search: string;
  searchfields: string[];
  sort: string[];
  filter: Record<string, string>;
  advance: Record<string, any> | null;
  bu_code: string[];
};

export class PaginateDto extends createZodDto(PaginateSchema) { }

export function PaginateQuery(query: IPaginateQuery): IPaginate {
  if (!query) {
    return {
      page: 1,
      perpage: 10,
      search: '',
      searchfields: [],
      sort: [],
      filter: {},
      advance: null,
      bu_code: [],
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
      filterValue = query.filter as Record<string, string>;
    }
  }

  return {
    page: Number(query.page) || 1,
    perpage: Number(query.perpage) || 10,
    search: typeof query.search === 'string' ? query.search : '',
    searchfields: query.searchfields ? query.searchfields.split(';') : [],
    sort: query.sort ? query.sort.split(';') : [],
    filter: filterValue,
    advance: query.advance ? JSON.parse(query.advance) : null,
    bu_code: query.bu_code ? query.bu_code.split(',') : [],
  };
}
