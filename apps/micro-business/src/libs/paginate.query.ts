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
    search: any = '',
    searchFields: string[] = [],
    defaultSearchFields: string[] = [],
    filter: string | string[] | Record<string, string> = [],
    sort: string[] = [],
    advance: QueryAdvance = null,
  ) {
    this.page = Number(page) || 1;
    this.perpage = Number(perpage) || 10;

    // ✅ FIX: normalize search ให้เป็น string เสมอ (and exclude functions)
    this.search = typeof search === 'string' ? search : '';

    this.searchFields = Array.isArray(searchFields) ? searchFields : [];
    this.defaultSearchFields = defaultSearchFields ?? [];

    if (this.searchFields.length === 0) {
      this.searchFields = this.defaultSearchFields;
    }

    this.filter = this.normalizeFilter(filter);
    this.sort = Array.isArray(sort) ? sort : [];
    this.advance = advance;
  }

  private normalizeFilter(
    filter: string | string[] | Record<string, string>,
  ): string[] {
    console.log('normalizeFilter:', filter);

    if (!filter) {
      return [];
    }

    if (typeof filter === 'string') {
      return filter.split(',').map((f) => f.trim()).filter(Boolean);
    }

    if (Array.isArray(filter)) {
      return filter
        .flatMap((f) => f.split(','))
        .map((f) => f.trim())
        .filter(Boolean);
    }

    if (typeof filter === 'object') {
      return Object.entries(filter).map(
        ([key, value]) => `${key}:${value}`,
      );
    }

    return [];
  }

  private castFilterValue(
    fieldName: string,
    fieldType: string | undefined,
    value: string,
  ): Record<string, any> {
    const trimmedValue = value?.trim() ?? '';

    switch (fieldType) {
      case 'number':
      case 'num':
        return { [fieldName]: Number(trimmedValue) };

      case 'bool':
      case 'boolean':
        return {
          [fieldName]:
            trimmedValue.toLowerCase() === 'true' ||
            trimmedValue.toLowerCase() === '1',
        };

      case 'date':
      case 'datetime':
        return { [fieldName]: new Date(trimmedValue) };

      case 'contains':
      case 'like':
        return { [fieldName]: { contains: trimmedValue, mode: 'insensitive' } };

      default:
        return { [fieldName]: trimmedValue };
    }
  }

  private castSearchValue(
    fieldName: string,
    fieldType: string | undefined,
    value: any,
  ): Record<string, any> {

    const safeValue =
      typeof value === 'string'
        ? value
        : value != null
          ? String(value)
          : '';

    const trimmedValue = safeValue.trim();
    console.log('search value:', this.search, 'type:', typeof this.search);

    switch (fieldType) {
      case 'number':
      case 'num':
        return { [fieldName]: Number(trimmedValue) };

      case 'bool':
      case 'boolean':
        return {
          [fieldName]:
            trimmedValue.toLowerCase() === 'true' ||
            trimmedValue === '1',
        };

      case 'date':
      case 'datetime':
        return { [fieldName]: new Date(trimmedValue) };

      default:
        return {
          [fieldName]: {
            contains: trimmedValue,
            mode: 'insensitive',
          },
        };
    }
  }

  public where(): any {
    const _where: any = {
      AND: {},
    };

    if (this.advance != null && this.advance.where != null) {
      _where.AND = this.advance?.where;
    } else {
      if (this.filter && this.filter.length > 0) {
        _where.AND = this.filter.map((filterStr) => {
          const colonIndex = filterStr.indexOf(':');
          if (colonIndex === -1) {
            return {};
          }

          const key = filterStr.substring(0, colonIndex);
          const value = filterStr.substring(colonIndex + 1);

          const [fieldName, fieldType] = key.split('|');
          return this.castFilterValue(fieldName.trim(), fieldType?.trim(), value);
        });
      }

      if (this.searchFields.length <= 0) {
        this.searchFields = this.defaultSearchFields;
      }

      if (this.search !== '') {
        _where.OR = this.searchFields.map((field) => {
          const [fieldName, fieldType] = field.split('|');
          return this.castSearchValue(
            fieldName.trim(),
            fieldType?.trim(),
            this.search,
          );
        });
      }
    }

    console.log('where:', _where)
    return _where;
  }

  public orderBy(): any {
    if (this.sort.length === 0) {
      return {};
    }

    return this.sort
      .map((s) => {
        const [field, order] = s.split(':');
        const trimmedField = field?.trim();
        if (!trimmedField) {
          return null;
        }
        return { [trimmedField]: order === 'desc' ? 'desc' : 'asc' };
      })
      .filter((o) => o !== null);
  }

  public findMany(): any {
    const _where: any = this.where();
    const _order: any = this.orderBy();
    const _skip: number = (this.page - 1) * this.perpage;
    const _take: number = this.perpage;

    const query = {
      where: _where,
      orderBy: _order,
      skip: _skip,
    };

    if (_take >= 0) {
      query['take'] = _take;
    }

    return query;
  }

  //---------------------------------------
  private parseFilterDSL(filter: string): Record<string, any> {
    // BETWEEN
    if (filter.includes(':between:')) {
      const [field, , range] = filter.split(':');
      const [from, to] = range.split(',');
      return {
        [field]: {
          gte: this.castValue(from),
          lte: this.castValue(to),
        },
      };
    }

    // IN
    if (filter.includes(':in:')) {
      const [field, , values] = filter.split(':');
      return {
        [field]: {
          in: values.split(',').map(v => this.castValue(v)),
        },
      };
    }

    // >=
    if (filter.includes('>=')) {
      const [field, value] = filter.split('>=');
      return { [field]: { gte: this.castValue(value) } };
    }

    // <=
    if (filter.includes('<=')) {
      const [field, value] = filter.split('<=');
      return { [field]: { lte: this.castValue(value) } };
    }

    // >
    if (filter.includes('>')) {
      const [field, value] = filter.split('>');
      return { [field]: { gt: this.castValue(value) } };
    }

    // <
    if (filter.includes('<')) {
      const [field, value] = filter.split('<');
      return { [field]: { lt: this.castValue(value) } };
    }

    // CONTAINS
    if (filter.includes('~')) {
      const [field, value] = filter.split('~');
      return {
        [field]: {
          contains: value.trim(),
          mode: 'insensitive',
        },
      };
    }

    // EQUALS (default)
    if (filter.includes('=')) {
      const [field, value] = filter.split('=');
      return { [field]: this.castValue(value) };
    }

    return {};
  }

  private castValue(value: string): any {
    const v = value.trim();

    if (v === 'true' || v === 'false') {
      return v === 'true';
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

  public where_(): any {
    const where: any = { AND: [] };

    if (this.advance?.where) {
      where.AND.push(this.advance.where);
    }

    console.log('filter:', this.filter)
    if (this.filter?.length) {
      this.filter.forEach(f => {
        const parsed = this.parseFilterDSL(f);
        if (Object.keys(parsed).length > 0) {
          where.AND.push(parsed);
        }
      });
    }

    if (this.search) {
      where.OR = this.searchFields.map(field => ({
        [field]: {
          contains: this.search,
          mode: 'insensitive',
        },
      }));
    }

    if (where.AND.length === 0) {
      delete where.AND;
    }

    console.log('where:', where)
    return where;
  }

}
