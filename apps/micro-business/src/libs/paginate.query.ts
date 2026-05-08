// export interface QueryAdvance {
//   where: Record<string, string>;
// }
// export class KeyValueString {
//   public Key: string;
//   public Value: string;

//   constructor(key: string, value: string) {
//     this.Key = key;
//     this.Value = value;
//   }
// }

// export default class QueryParams {
//   public readonly page: number = 1;
//   public readonly perpage: number = 10;
//   public readonly search: string;
//   public searchFields: string[];
//   public readonly defaultSearchFields: string[];
//   public readonly filter: Record<string, string>;
//   public readonly sort: string[];
//   public readonly advance: QueryAdvance;

//   constructor(
//     page: number = 1,
//     perpage: number = 10,
//     search: string = '',
//     searchFields: string[] = [],
//     defaultSearchFields: string[] = [],
//     filter: Record<string, string> = {},
//     sort: string[] = [],
//     advance: QueryAdvance = null,
//   ) {
//     if (typeof page !== 'number') {
//       page = parseInt(page);
//     }

//     if (typeof perpage !== 'number') {
//       perpage = parseInt(perpage);
//     }

//     this.page = page ?? 1;
//     this.perpage = perpage ?? 10;
//     this.search = typeof search === 'string' ? search : '';
//     this.searchFields = searchFields ?? [];

//     this.defaultSearchFields = defaultSearchFields;

//     if (this.searchFields.length <= 0) {
//       this.searchFields = this.defaultSearchFields;
//     }
//     this.filter = filter;
//     this.sort = sort ?? [];
//     this.advance = advance;

//   }

//   public where(): any {
//     const _where: any = {
//       AND: {},
//     };

//     if (this.advance != null && this.advance.where != null) {
//       _where.AND = this.advance?.where;
//     } else {
//       if (this.filter && Object.keys(this.filter).length > 0) {
//         _where.AND = Object.entries(this.filter).map((o) => {
//            console.log({key: o[0], value: o[1]});

//           const [key, value] = o[1].split(':');
//           const [k, f] = key.split('|');
//           const kTrim = k.trim();
//           const vTrim = value.trim();
//           switch (f) {
//             case 'number':
//             case 'num':
//               return {
//                 [kTrim]: vTrim,
//               };

//             case 'bool':
//             case 'boolean':
//               return {
//                 [kTrim]:
//                   vTrim.toLowerCase() == 'true' || vTrim.toLowerCase() == '1',
//               };

//             case 'date':
//             case 'datetime':
//               return {
//                 [kTrim]: new Date(vTrim),
//               };
//             case 'enum':
//               return {
//                 [kTrim]: vTrim,
//               };
//             default:
//               return {
//                 [kTrim]: { contains: vTrim, mode: 'insensitive' },
//               };
//           }
//         });
//       }

//       if (this.searchFields.length <= 0) {
//         this.searchFields = this.defaultSearchFields;
//       }

//       let searchCol: KeyValueString[] = [];

//       if (this.search != '') {
//         searchCol = this.searchFields.map((f) => {
//           const [k, t] = f.split('|');
//           const kTrim = k.trim();
//           const tTrim = t?.trim();
//           return new KeyValueString(kTrim, tTrim);
//         });

//         _where.OR = searchCol.map((o) => {
//           const k = o.Key;
//           const f = o.Value;

//           switch (f) {
//             case 'number':
//             case 'num':
//               return {
//                 [k]: this.search,
//               };
//             case 'bool':
//             case 'boolean':
//               return {
//                 [k]:
//                   this.search.toLowerCase() == 'true' ||
//                   this.search.toLowerCase() == '1',
//               };
//             case 'date':
//             case 'datetime':
//               return {
//                 [k]: new Date(this.search),
//               };
//             case 'enum':
//               return {
//                 [k]: this.search,
//               };
//             default:
//               return {
//                 [k]: { contains: this.search, mode: 'insensitive' },
//               };
//           }
//         });
//       }
//     }
//     console.log({ query_where: _where });
//     return _where;
//   }

//   public orderBy(): any {
//     let result = {};

//     if (this.sort.length > 0) {
//       const list = this.sort
//         .map((s) => {
//           const [field, order] = s.split(':');

//           if (order === 'desc') {
//             return { [field.trim()]: 'desc' };
//           } else {
//             return { [field.trim()]: 'asc' };
//           }
//         })
//         .filter((o) => Object.keys(o).toString() != '');

//       result = list;
//     } else {
//       result = {};
//     }

//     console.log({ query_orderBy: result });

//     return result;
//   }

//   public findMany(): any {
//     const _where: any = this.where();
//     const _order: any = this.orderBy();
//     const _skip: number = (this.page - 1) * this.perpage;
//     const _take: number = this.perpage;

//     const query = {
//       where: _where,
//       orderBy: _order,
//       skip: _skip,
//     };

//     if (_take >= 0) {
//       query['take'] = _take;
//     }

//     return query;
//   }
// }

// //---------------------------------------

export interface QueryAdvance {
  where: Record<string, string>;
}

type CastValueResult = string | number | boolean | Date;

interface PrismaWhereInput {
  AND?: Record<string, unknown> | Record<string, unknown>[];
  OR?: Record<string, unknown>[];
  [key: string]: unknown;
}

interface PrismaOrderByInput {
  [key: string]: "asc" | "desc";
}

interface PrismaFindManyArgs {
  where: PrismaWhereInput;
  orderBy: PrismaOrderByInput[] | Record<string, never>;
  skip: number;
  take?: number;
}

export default class QueryParams {
  public readonly page: number = 1;
  public readonly perpage: number = 10;
  public readonly search: string;
  public searchFields: string[];
  public readonly defaultSearchFields: string[];
  public readonly filter: string[];
  public readonly sort: string[];
  public readonly advance: QueryAdvance;

  constructor(
    page: number = 1,
    perpage: number = 10,
    search: string | unknown = "",
    searchFields: string[] = [],
    defaultSearchFields: string[] = [],
    filter: string | string[] | Record<string, string> = [],
    sort: string[] = [],
    advance: QueryAdvance = null,
  ) {
    this.page = Number(page) || 1;
    this.perpage = Number(perpage) || 10;

    // ✅ FIX: normalize search ให้เป็น string เสมอ (and exclude functions)
    this.search = typeof search === "string" ? search : "";

    this.searchFields = Array.isArray(searchFields)
      ? searchFields
          .flatMap((f) => f.split(","))
          .map((f) => f.trim())
          .filter(Boolean)
      : [];
    this.defaultSearchFields = defaultSearchFields ?? [];

    if (this.searchFields.length === 0) {
      this.searchFields = this.defaultSearchFields;
    }

    this.filter = this.normalizeFilter(filter);
    this.sort = Array.isArray(sort) ? sort : [];
    this.advance = advance;
  }

  private normalizeFilter(filter: string | string[] | Record<string, string>): string[] {
    if (!filter) {
      return [];
    }

    if (typeof filter === "string") {
      return filter
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean);
    }

    if (Array.isArray(filter)) {
      return filter
        .flatMap((f) => f.split(","))
        .map((f) => f.trim())
        .filter(Boolean);
    }

    if (typeof filter === "object") {
      return Object.entries(filter).map(([key, value]) => `${key}:${value}`);
    }

    return [];
  }

  private castFilterValue(fieldName: string, fieldType: string | undefined, value: string): Record<string, unknown> {
    const trimmedValue = value?.trim() ?? "";

    // daterange must be handled before the comma check (value format: "from,to")
    if (fieldType === "daterange" || fieldType === "date_range") {
      const [from, to] = trimmedValue.split(",").map((v) => v.trim());
      const fromDate = new Date(from);
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      return {
        [fieldName]: {
          gte: fromDate.toISOString(),
          lte: toDate.toISOString(),
        },
      };
    }

    // Handle comma-separated values as IN query
    if (trimmedValue.includes(",")) {
      const values = trimmedValue.split(",").map((v) => v.trim());
      return { [fieldName]: { in: values } };
    }

    switch (fieldType) {
      case "number":
      case "num":
        return { [fieldName]: Number(trimmedValue) };

      case "bool":
      case "boolean":
        return {
          [fieldName]: trimmedValue.toLowerCase() === "true" || trimmedValue.toLowerCase() === "1",
        };

      case "date":
      case "datetime":
        return { [fieldName]: new Date(trimmedValue) };

      case "contains":
      case "like":
        return { [fieldName]: { contains: trimmedValue, mode: "insensitive" } };

      default:
        return { [fieldName]: trimmedValue };
    }
  }

  private castSearchValue(fieldName: string, fieldType: string | undefined, value: unknown): Record<string, unknown> {
    const safeValue = typeof value === "string" ? value : value != null ? String(value) : "";

    const trimmedValue = safeValue.trim();

    switch (fieldType) {
      case "number":
      case "num":
        return { [fieldName]: Number(trimmedValue) };

      case "bool":
      case "boolean":
        return {
          [fieldName]: trimmedValue.toLowerCase() === "true" || trimmedValue === "1",
        };

      case "date":
      case "datetime":
        return { [fieldName]: new Date(trimmedValue) };

      default:
        return {
          [fieldName]: {
            contains: trimmedValue,
            mode: "insensitive",
          },
        };
    }
  }

  public where(): PrismaWhereInput {
    const _where: PrismaWhereInput = {
      AND: {},
    };

    if (this.advance != null && this.advance.where != null) {
      _where.AND = this.advance?.where;
    } else {
      if (this.filter && this.filter.length > 0) {
        _where.AND = this.filter.map((filterStr) => {
          const colonIndex = filterStr.indexOf(":");
          if (colonIndex === -1) {
            return {};
          }

          const key = filterStr.substring(0, colonIndex);
          const value = filterStr.substring(colonIndex + 1);

          const [fieldName, fieldType] = key.split("|");
          return this.castFilterValue(fieldName.trim(), fieldType?.trim(), value);
        });
      }

      if (this.searchFields.length <= 0) {
        this.searchFields = this.defaultSearchFields;
      }

      if (this.search !== "") {
        _where.OR = this.searchFields.map((field) => {
          const [fieldName, fieldType] = field.split("|");
          return this.castSearchValue(fieldName.trim(), fieldType?.trim(), this.search);
        });
      }
    }

    return _where;
  }

  public orderBy(): PrismaOrderByInput[] | Record<string, never> {
    if (this.sort.length === 0) {
      return {};
    }

    return this.sort
      .map((s) => {
        const [field, order] = s.split(":");
        const trimmedField = field?.trim();
        if (!trimmedField) {
          return null;
        }
        return { [trimmedField]: order === "desc" ? "desc" : "asc" } as PrismaOrderByInput;
      })
      .filter((o): o is PrismaOrderByInput => o !== null);
  }

  public findMany(): PrismaFindManyArgs {
    const _where: PrismaWhereInput = this.where();
    const _order: PrismaOrderByInput[] | Record<string, never> = this.orderBy();
    const _skip: number = (this.page - 1) * this.perpage;
    const _take: number = this.perpage;

    const query: PrismaFindManyArgs = {
      where: _where,
      orderBy: _order,
      skip: _skip,
    };

    if (_take >= 0) {
      query.take = _take;
    }

    return query;
  }

  //---------------------------------------
  private parseFilterDSL(filter: string): Record<string, unknown> {
    // BETWEEN
    if (filter.includes(":between:")) {
      const [field, , range] = filter.split(":");
      const [from, to] = range.split(",");
      return {
        [field]: {
          gte: this.castValue(from),
          lte: this.castValue(to),
        },
      };
    }

    // IN
    if (filter.includes(":in:")) {
      const [field, , values] = filter.split(":");
      return {
        [field]: {
          in: values.split(",").map((v) => this.castValue(v)),
        },
      };
    }

    // >=
    if (filter.includes(">=")) {
      const [field, value] = filter.split(">=");
      return { [field]: { gte: this.castValue(value) } };
    }

    // <=
    if (filter.includes("<=")) {
      const [field, value] = filter.split("<=");
      return { [field]: { lte: this.castValue(value) } };
    }

    // >
    if (filter.includes(">")) {
      const [field, value] = filter.split(">");
      return { [field]: { gt: this.castValue(value) } };
    }

    // <
    if (filter.includes("<")) {
      const [field, value] = filter.split("<");
      return { [field]: { lt: this.castValue(value) } };
    }

    // CONTAINS
    if (filter.includes("~")) {
      const [field, value] = filter.split("~");
      return {
        [field]: {
          contains: value.trim(),
          mode: "insensitive",
        },
      };
    }

    // EQUALS (default)
    if (filter.includes("=")) {
      const [field, value] = filter.split("=");
      return { [field]: this.castValue(value) };
    }

    return {};
  }

  private castValue(value: string): CastValueResult {
    const v = value.trim();

    if (v === "true" || v === "false") {
      return v === "true";
    }

    if (!isNaN(Number(v))) {
      return Number(v);
    }

    const date = new Date(v);
    if (!isNaN(date.getTime())) {
      return date;
    }

    return v;
  }

  public where_(): PrismaWhereInput {
    const andConditions: Record<string, unknown>[] = [];

    if (this.advance?.where) {
      andConditions.push(this.advance.where);
    }

    if (this.filter?.length) {
      this.filter.forEach((f) => {
        const parsed = this.parseFilterDSL(f);
        if (Object.keys(parsed).length > 0) {
          andConditions.push(parsed);
        }
      });
    }

    const where: PrismaWhereInput = {};

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    if (this.search) {
      where.OR = this.searchFields.map((field) => ({
        [field]: {
          contains: this.search,
          mode: "insensitive",
        },
      }));
    }

    return where;
  }
}
