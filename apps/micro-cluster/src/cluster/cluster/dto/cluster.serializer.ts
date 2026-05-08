import { z } from 'zod';

const ClusterUserSchema = z.object({
  id: z.string(),
  user_id: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
  parent_bu_id: z.string().nullable().optional(),
  user: z.object({
    id: z.string(),
    email: z.string().nullable().optional(),
    platform_role: z.string().nullable().optional(),
    profile: z.object({
      firstname: z.string().nullable().optional(),
      lastname: z.string().nullable().optional(),
      middlename: z.string().nullable().optional(),
      telephone: z.string().nullable().optional(),
    }).nullable().optional(),
  }).nullable().optional(),
});

const ClusterBusinessUnitSchema = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
  code: z.string().nullable().optional(),
  max_license_users: z.number().nullable().optional(),
});

export const ClusterDetailResponseSchema = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
  code: z.string().nullable().optional(),
  alias_name: z.string().nullable().optional(),
  logo_url: z.string().nullable().optional(),
  max_license_bu: z.number().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
  info: z.any().nullable().optional(),
  tb_business_unit: z.array(ClusterBusinessUnitSchema).nullable().optional(),
  tb_cluster_user: z.array(ClusterUserSchema).nullable().optional(),
});

const AuditUserSchema = z.object({
  username: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
}).nullable().optional();

export const ClusterListItemResponseSchema = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
  code: z.string().nullable().optional(),
  alias_name: z.string().nullable().optional(),
  logo_url: z.string().nullable().optional(),
  max_license_bu: z.number().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
  info: z.any().nullable().optional(),
  created_at: z.coerce.date().nullable().optional(),
  created_by_id: z.string().nullable().optional(),
  tb_user_tb_cluster_created_by_idTotb_user: AuditUserSchema,
  updated_at: z.coerce.date().nullable().optional(),
  updated_by_id: z.string().nullable().optional(),
  tb_user_tb_cluster_updated_by_idTotb_user: AuditUserSchema,
  deleted_at: z.coerce.date().nullable().optional(),
  deleted_by_id: z.string().nullable().optional(),
  _count: z.object({
    tb_business_unit: z.number().nullable().optional(),
    tb_cluster_user: z.number().nullable().optional(),
  }).nullable().optional(),
}).transform((item) => ({
  ...item,
  created_by_name: item.tb_user_tb_cluster_created_by_idTotb_user?.username
    ?? item.tb_user_tb_cluster_created_by_idTotb_user?.email
    ?? null,
  updated_by_name: item.tb_user_tb_cluster_updated_by_idTotb_user?.username
    ?? item.tb_user_tb_cluster_updated_by_idTotb_user?.email
    ?? null,
  tb_user_tb_cluster_created_by_idTotb_user: undefined,
  tb_user_tb_cluster_updated_by_idTotb_user: undefined,
}));

export const ClusterMutationResponseSchema = z.object({
  id: z.string(),
});

const UserClusterSchema = z.object({
  id: z.string(),
  email: z.string().nullable().optional(),
  platform_role: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
  parent_bu_id: z.string().nullable().optional(),
  cluster: z.object({
    id: z.string(),
    name: z.string().nullable().optional(),
  }).nullable().optional(),
  user_info: z.object({
    firstname: z.string().nullable().optional(),
    lastname: z.string().nullable().optional(),
    middlename: z.string().nullable().optional(),
    telephone: z.string().nullable().optional(),
  }).nullable().optional(),
  business_unit: z.object({
    id: z.string(),
    name: z.string().nullable().optional(),
    code: z.string().nullable().optional(),
  }).nullable().optional(),
});

export const UserClusterListResponseSchema = z.array(UserClusterSchema);

export const UserClusterByClusterIdSchema = z.object({
  id: z.string(),
  user_id: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
  parent_bu_id: z.string().nullable().optional(),
  userInfo: z.object({
    firstname: z.string().nullable().optional(),
    lastname: z.string().nullable().optional(),
    middlename: z.string().nullable().optional(),
    telephone: z.string().nullable().optional(),
  }).nullable().optional(),
});

export type ClusterDetailResponse = z.infer<typeof ClusterDetailResponseSchema>;
export type ClusterListItemResponse = z.infer<typeof ClusterListItemResponseSchema>;
export type ClusterMutationResponse = z.infer<typeof ClusterMutationResponseSchema>;
export type UserClusterListResponse = z.infer<typeof UserClusterListResponseSchema>;
export type UserClusterByClusterId = z.infer<typeof UserClusterByClusterIdSchema>;
