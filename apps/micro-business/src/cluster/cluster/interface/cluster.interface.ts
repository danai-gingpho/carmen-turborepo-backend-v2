import { enum_cluster_user_role, enum_platform_role } from "@repo/prisma-shared-schema-platform";

export interface IClusterCreate {
  code: string;
  name: string;
  is_active: boolean;
}

export interface IClusterUpdate {
  id: string;
  code?: string;
  name?: string;
  is_active?: boolean;
}

export interface IUserCluster {
  user_id: string;
  cluster_id: string;
  is_active: boolean;
  role: enum_cluster_user_role;
}

export interface IUserClusterUpdate {
  id: string;
  user_id?: string;
  cluster_id?: string;
  is_active?: boolean;
  role?: enum_cluster_user_role;
}


export interface IUserClusterDTO {
  id: string;
  email: string;
  platform_role: enum_platform_role;
  role: enum_cluster_user_role;
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
};







