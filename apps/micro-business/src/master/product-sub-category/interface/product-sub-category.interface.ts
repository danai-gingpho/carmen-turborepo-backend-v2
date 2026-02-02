export interface ICreateProductSubCategory {
  code: string;
  name: string;
  description?: string;
  price_deviation_limit?: number;
  qty_deviation_limit?: number;
  is_used_in_recipe?: boolean;
  is_sold_directly?: boolean;
  tax_profile_id?: string;
  tax_profile_name?: string;
  tax_rate?: number;
  is_active?: boolean;
  product_category_id: string;
  info?: object;
}

export interface IUpdateProductSubCategory {
  id: string;
  code?: string;
  name?: string;
  description?: string;
  price_deviation_limit?: number;
  qty_deviation_limit?: number;
  is_used_in_recipe?: boolean;
  is_sold_directly?: boolean;
  tax_profile_id?: string;
  tax_profile_name?: string;
  tax_rate?: number;
  is_active?: boolean;
  product_category_id?: string;
  info?: object;
}
