export interface ICreateProductItemGroup {
  code: string;
  name: string;
  description?: string;
  price_deviation_limit?: number;
  qty_deviation_limit?: number;
  is_used_in_recipe?: boolean;
  is_used_in_purchase_order?: boolean;
  tax_profile_id?: string;
  tax_profile_name?: string;
  tax_rate?: number;
  is_active?: boolean;
  product_subcategory_id: string;
  info?: object;
}

export interface IUpdateProductItemGroup {
  id: string;
  code?: string;
  name?: string;
  description?: string;
  price_deviation_limit?: number;
  qty_deviation_limit?: number;
  is_used_in_recipe?: boolean;
  is_used_in_purchase_order?: boolean;
  tax_profile_id?: string;
  tax_profile_name?: string;
  tax_rate?: number;
  is_active?: boolean;
  product_subcategory_id?: string;
  info?: object;
}
