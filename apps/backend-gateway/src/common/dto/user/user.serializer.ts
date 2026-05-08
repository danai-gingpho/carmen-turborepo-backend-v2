import { z } from 'zod';

export const UserResponseSchema = z.object({
  id: z.string(),
  username: z.string().nullable().optional(),
  email: z.string().email(),
  firstname: z.string().nullable().optional(),
  middlename: z.string().nullable().optional(),
  lastname: z.string().nullable().optional(),
  telephone: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export type UserResponse = z.infer<typeof UserResponseSchema>;

const UserDepartmentSchema = z.object({
  id: z.string().nullable().optional(),
  code: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
});

const UserHodDepartmentSchema = z.object({
  id: z.string().nullable().optional(),
  code: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
});

const UserBusinessUnitConfigSchema = z.object({
  calculation_method: z.string().nullable().optional(),
  default_currency_id: z.string().nullable().optional(),
  default_currency: z.any().nullable().optional(),
  hotel: z.any().nullable().optional(),
  company: z.any().nullable().optional(),
  tax_no: z.string().nullable().optional(),
  branch_no: z.string().nullable().optional(),
  date_format: z.string().nullable().optional(),
  time_format: z.string().nullable().optional(),
  date_time_format: z.string().nullable().optional(),
  long_time_format: z.string().nullable().optional(),
  short_time_format: z.string().nullable().optional(),
  timezone: z.string().nullable().optional(),
  perpage_format: z.string().nullable().optional(),
  amount_format: z.string().nullable().optional(),
  quantity_format: z.string().nullable().optional(),
  recipe_format: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  info: z.any().nullable().optional(),
  is_hq: z.boolean().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
}).passthrough();

const UserBusinessUnitSchema = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
  code: z.string().nullable().optional(),
  alias_name: z.string().nullable().optional(),
  is_default: z.boolean().nullable().optional(),
  system_level: z.string().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
  department: UserDepartmentSchema.nullable().optional(),
  hod_department: z.array(UserHodDepartmentSchema).nullable().optional(),
  config: UserBusinessUnitConfigSchema.nullable().optional(),
}).passthrough();

const UserInfoSchema = z.object({
  firstname: z.string().nullable().optional(),
  middlename: z.string().nullable().optional(),
  lastname: z.string().nullable().optional(),
  telephone: z.string().nullable().optional(),
});

export const UserProfileResponseSchema = z.object({
  id: z.string(),
  email: z.string().nullable().optional(),
  alias_name: z.string().nullable().optional(),
  platform_role: z.string().nullable().optional(),
  user_info: UserInfoSchema.nullable().optional(),
  business_unit: z.array(UserBusinessUnitSchema).nullable().optional(),
}).passthrough();

export type UserProfileResponse = z.infer<typeof UserProfileResponseSchema>;

export const UserListItemResponseSchema = z.object({
  id: z.string(),
  username: z.string().nullable().optional(),
  email: z.string().email(),
  firstname: z.string().nullable().optional(),
  middlename: z.string().nullable().optional(),
  lastname: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
});

export type UserListItemResponse = z.infer<typeof UserListItemResponseSchema>;
