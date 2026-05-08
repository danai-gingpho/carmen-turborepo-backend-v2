import { enum_calculation_method, enum_user_business_unit_role } from "@repo/prisma-shared-schema-platform";

export interface IBusinessUnitCreate {
  cluster_id: string;
  code: string;
  name: string;
  alias_name?: string;
  description?: string;
  default_currency_id?: string;
  max_license_users?: number | null;
  is_hq: boolean;
  is_active: boolean;
  db_connection?: unknown;
  config?: unknown;
  calculation_method?: enum_calculation_method;
  // Company info
  branch_no?: string;
  company_name?: string;
  company_address?: string;
  company_email?: string;
  company_tel?: string;
  company_zip_code?: string;
  tax_no?: string;
  // Hotel info
  hotel_name?: string;
  hotel_address?: string;
  hotel_email?: string;
  hotel_tel?: string;
  hotel_zip_code?: string;
  // Format settings
  date_format?: string;
  date_time_format?: string;
  time_format?: string;
  short_time_format?: string;
  long_time_format?: string;
  timezone?: string;
  amount_format?: unknown;
  quantity_format?: unknown;
  perpage_format?: unknown;
  recipe_format?: unknown;
}

export interface IBusinessUnitUpdate {
  id: string;
  cluster_id?: string;
  code?: string;
  name?: string;
  alias_name?: string;
  description?: string;
  default_currency_id?: string;
  max_license_users?: number | null;
  is_hq?: boolean;
  is_active?: boolean;
  db_connection?: unknown;
  config?: unknown;
  calculation_method?: enum_calculation_method;
  // Company info
  branch_no?: string;
  company_name?: string;
  company_address?: string;
  company_email?: string;
  company_tel?: string;
  company_zip_code?: string;
  tax_no?: string;
  // Hotel info
  hotel_name?: string;
  hotel_address?: string;
  hotel_email?: string;
  hotel_tel?: string;
  hotel_zip_code?: string;
  // Format settings
  date_format?: string;
  date_time_format?: string;
  time_format?: string;
  short_time_format?: string;
  long_time_format?: string;
  timezone?: string;
  amount_format?: unknown;
  quantity_format?: unknown;
  perpage_format?: unknown;
  recipe_format?: unknown;
}

export interface IUserBusinessUnitCreate {
  user_id: string;
  business_unit_id: string;
  role: enum_user_business_unit_role;
  is_default: boolean;
  is_active: boolean;
}

export interface IUserBusinessUnitUpdate {
  id: string;
  user_id?: string;
  business_unit_id?: string;
  role?: enum_user_business_unit_role;
  is_default?: boolean;
  is_active?: boolean;
}
