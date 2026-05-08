import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

/**
 * Parse a filter query string into a Record<key, value>.
 * Supports semicolons or commas as filter separators.
 * When a comma-split part has no colon, it is treated as a continuation
 * of the previous filter's value, enabling IN queries:
 *   "requestor_id|string:uuid1,uuid2" → { "requestor_id|string": "uuid1,uuid2" }
 *   "status|string:draft;type|string:main" → two separate filters
 */
function parseFilterString(filterStr: string): Record<string, string> {
  const result: Record<string, string> = {};
  let lastKey: string | null = null;

  filterStr.split(/[;,]/).forEach((item) => {
    const trimmed = item.trim();
    if (!trimmed) return;

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) {
      // No colon → continuation value for the previous key (IN query)
      if (lastKey !== null) {
        result[lastKey] = result[lastKey] + ',' + trimmed;
      }
      return;
    }

    const key = trimmed.substring(0, colonIndex).trim();
    const value = trimmed.substring(colonIndex + 1).trim();
    if (key && value) {
      result[key] = result[key] ? result[key] + ',' + value : value;
      lastKey = key;
    }
  });

  return result;
}

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
    .transform((v) => (v ? v.split(/[;,]/) : [])),

  sort: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(/[;,]/) : [])),

  filter: z
    .string()
    .optional()
    .transform((v) => {
      if (!v) return {};
      return parseFilterString(v);
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
  advance: Record<string, unknown> | null;
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
      filterValue = parseFilterString(query.filter);
    } else if (typeof query.filter === 'object') {
      // Object format: { status: 'inactive' }
      filterValue = query.filter as Record<string, string>;
    }
  }

  return {
    page: Number(query.page) || 1,
    perpage: Number(query.perpage) || 10,
    search: typeof query.search === 'string' ? query.search : '',
    searchfields: query.searchfields ? query.searchfields.split(/[;,]/) : [],
    sort: query.sort ? query.sort.split(/[;,]/) : [],
    filter: filterValue,
    advance: query.advance ? JSON.parse(query.advance) : null,
    bu_code: query.bu_code ? query.bu_code.split(',') : [],
  };
}
