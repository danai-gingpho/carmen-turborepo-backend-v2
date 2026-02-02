export interface ICreateProductCategory {
  code: string;
  name: string;
  description?: string;
  is_active?: boolean;
  price_deviation_limit?: number;
  qty_deviation_limit?: number;
  is_used_in_recipe?: boolean;
  is_sold_directly?: boolean;
  tax_profile_id?: string;
  tax_profile_name?: string;
  tax_rate?: number;
  info?: object;
}

export interface IUpdateProductCategory {
  id: string;
  code?: string;
  name?: string;
  description?: string;
  is_active?: boolean;
  price_deviation_limit?: number;
  qty_deviation_limit?: number;
  is_used_in_recipe?: boolean;
  is_sold_directly?: boolean;
  tax_profile_id?: string;
  tax_profile_name?: string;
  tax_rate?: number;
  info?: object;
}
