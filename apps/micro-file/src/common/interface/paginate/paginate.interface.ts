export interface IPaginate {
  page?: number;
  perpage?: number;
  search?: string;
  searchfields?: string[];
  filter?: Record<string, string>;
  sort?: string[];
  advance?: any;
}

