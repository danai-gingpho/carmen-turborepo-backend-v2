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

export const UserProfileResponseSchema = z.object({
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
