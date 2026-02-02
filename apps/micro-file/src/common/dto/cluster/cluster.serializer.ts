import { z } from 'zod';

const ClusterUserSchema = z.object({
  id: z.string(),
  user_id: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
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
});

export const ClusterDetailResponseSchema = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
  code: z.string().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
  info: z.any().nullable().optional(),
  tb_business_unit: z.array(ClusterBusinessUnitSchema).nullable().optional(),
  tb_cluster_user: z.array(ClusterUserSchema).nullable().optional(),
});

export const ClusterListItemResponseSchema = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
  code: z.string().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
  info: z.any().nullable().optional(),
  _count: z.object({
    tb_business_unit: z.number().nullable().optional(),
    tb_cluster_user: z.number().nullable().optional(),
  }).nullable().optional(),
});

export const ClusterMutationResponseSchema = z.object({
  id: z.string(),
});

const UserClusterSchema = z.object({
  id: z.string(),
  email: z.string().nullable().optional(),
  platform_role: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
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
  email: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
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
