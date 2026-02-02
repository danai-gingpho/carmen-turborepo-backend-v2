import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { enum_user_business_unit_role } from '@repo/prisma-shared-schema-platform';

export const UserBusinessUnitSchema = z.object({
  user_id: z.string({ required_error: 'user_id is required' }).uuid(),
  business_unit_id: z
    .string({
      required_error: 'business_unit_id is required',
    })
    .uuid(),
  role: z.enum(
    Object.values(enum_user_business_unit_role) as [string, ...string[]],
    {
      required_error: 'role is required',
    },
  ),
  is_default: z
    .boolean({ required_error: 'is_default is required' })
    .optional()
    .default(false),
  is_active: z
    .boolean({ required_error: 'is_active is required' })
    .optional()
    .default(true),
});

export type IUserBusinessUnit = z.infer<typeof UserBusinessUnitSchema>;
export class UserBusinessUnitDto extends createZodDto(UserBusinessUnitSchema) {}

export const UserBusinessUnitUpdateSchema = z.object({
  user_id: z
    .string({ required_error: 'user_id is required' })
    .uuid()
    .optional(),
  business_unit_id: z
    .string({ required_error: 'business_unit_id is required' })
    .uuid()
    .optional(),
  role: z
    .enum(
      Object.values(enum_user_business_unit_role) as [string, ...string[]],
      {
        required_error: 'role is required',
      },
    )
    .optional(),
  is_default: z
    .boolean({ required_error: 'is_default is required' })
    .optional(),
  is_active: z.boolean({ required_error: 'is_active is required' }).optional(),
});

export type IUserBusinessUnitUpdate = z.infer<
  typeof UserBusinessUnitUpdateSchema
> & {
  id: string;
};

export class UserBusinessUnitUpdateDto extends createZodDto(
  UserBusinessUnitUpdateSchema,
) {}
