

import { enum_product_status_type, enum_unit_type } from "@repo/prisma-shared-schema-tenant";

export interface IProductInfo {
  is_used_in_recipe?: boolean;
  is_sold_directly?: boolean;
  barcode?: string;
  price_deviation_limit?: number;
  qty_deviation_limit?: number;
  tax_profile_id?: string;
  tax_profile_name?: string;
  tax_rate?: number;
  info?: object;
}

export interface IAddLocation {
  location_id?: string;
}

export interface IRemoveLocation {
  product_location_id?: string;
}

export interface IAddOrderUnit {
  from_unit_id: string;
  from_unit_name?: string;
  from_unit_qty: number;
  to_unit_id: string;
  to_unit_name?: string;
  to_unit_qty: number;
  unit_type?: enum_unit_type;
  description?: string;
  is_active?: boolean;
  is_default?: boolean;
}

export interface IUpdateOrderUnit {
  product_order_unit_id: string;
  from_unit_id: string;
  from_unit_name?: string;
  from_unit_qty: number;
  to_unit_id: string;
  to_unit_name?: string;
  to_unit_qty: number;
  description?: string;
  is_active?: boolean;
  is_default?: boolean;
}

export interface IRemoveOrderUnit {
  product_order_unit_id: string;
}

export interface IAddIngredientUnit {
  from_unit_id: string;
  from_unit_name?: string;
  from_unit_qty: number;
  to_unit_id: string;
  to_unit_name?: string;
  to_unit_qty: number;
  unit_type?: enum_unit_type;
  description?: string;
  is_active?: boolean;
  is_default?: boolean;
}

export interface IUpdateIngredientUnit {
  product_ingredient_unit_id: string;
  from_unit_id: string;
  from_unit_name?: string;
  from_unit_qty: number;
  to_unit_id: string;
  to_unit_name?: string;
  to_unit_qty: number;
  description?: string;
  is_active?: boolean;
  is_default?: boolean;
}

export interface IRemoveIngredientUnit {
  product_ingredient_unit_id: string;
}

export interface ICreateProduct {
  name: string;
  code: string;
  local_name?: string;
  description?: string;
  inventory_unit_id: string;
  inventory_unit_name?: string;
  product_status_type: enum_product_status_type;
  product_item_group_id?: string;
  product_info?: IProductInfo;
  locations?: {
    add?: IAddLocation[];
  };
  order_units?: {
    add?: IAddOrderUnit[];
  };
  ingredient_units?: {
    add?: IAddIngredientUnit[];
  };
}

export interface IUpdateProduct {
  id: string;
  name?: string;
  code?: string;
  local_name?: string;
  description?: string;
  inventory_unit_id?: string;
  inventory_unit_name?: string;
  product_status_type?: enum_product_status_type;
  product_item_group_id?: string;
  product_info?: IProductInfo;
  locations?: {
    add?: IAddLocation[];
    remove?: IRemoveLocation[];
  };
  order_units?: {
    add?: IAddOrderUnit[];
    update?: IUpdateOrderUnit[];
    remove?: IRemoveOrderUnit[];
  };
  ingredient_units?: {
    add?: IAddIngredientUnit[];
    update?: IUpdateIngredientUnit[];
    remove?: IRemoveIngredientUnit[];
  };
}
