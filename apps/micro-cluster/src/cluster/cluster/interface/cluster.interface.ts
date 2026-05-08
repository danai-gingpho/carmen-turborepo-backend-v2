import { enum_cluster_user_role, enum_platform_role } from "@repo/prisma-shared-schema-platform";

export interface IClusterCreate {
  code: string;
  name: string;
  alias_name?: string | null;
  logo_url?: string | null;
  max_license_bu?: number | null;
  is_active: boolean;
  info?: any | null;
}

export interface IClusterUpdate {
  id: string;
  code?: string;
  name?: string;
  alias_name?: string | null;
  logo_url?: string | null;
  max_license_bu?: number | null;
  is_active?: boolean;
  info?: any | null;
}

export interface IUserCluster {
  user_id: string;
  cluster_id: string;
  is_active: boolean;
  role: enum_cluster_user_role;
  parent_bu_id?: string | null;
}

export interface IUserClusterUpdate {
  id: string;
  user_id?: string;
  cluster_id?: string;
  is_active?: boolean;
  role?: enum_cluster_user_role;
  parent_bu_id?: string | null;
}


export interface IUserClusterDTO {
  id: string;
  email: string;
  platform_role: enum_platform_role;
  role: enum_cluster_user_role;
  parent_bu_id?: string | null;
  cluster: {
    id: string;
    name: string
  };
  user_info: {
    firstname: string;
    lastname: string;
    middlename: string
  };
  business_unit: {
    id: string;
    name: string;
    code: string
  };
  created_at?: Date | null;
  created_by_id?: string | null;
  updated_at?: Date | null;
  updated_by_id?: string | null;
  deleted_at?: Date | null;
  deleted_by_id?: string | null;
};







