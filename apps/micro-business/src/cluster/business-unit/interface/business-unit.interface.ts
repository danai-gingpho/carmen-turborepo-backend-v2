import { enum_user_business_unit_role } from "@repo/prisma-shared-schema-platform";
import { enum_data_type } from "@repo/prisma-shared-schema-tenant";

export interface IBusinessUnitCreate {
  cluster_id: string;
  code: string;
  name: string;
  alias_name?: string;
  config: IBusinessUnitConfig[] | null;
  is_hq: boolean;
  is_active: boolean;
}

export interface IBusinessUnitUpdate {
  id: string;
  cluster_id?: string;
  code?: string;
  name?: string;
  alias_name?: string;
  config?: IBusinessUnitConfig[] | null;
  is_hq?: boolean;
  is_active?: boolean;
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

export interface IBusinessUnitConfig {
  id?: string;
  key?: string;
  label?: string;
  datatype?: enum_data_type;
  value?: any;
}