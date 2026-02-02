import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { enum_cluster_user_role } from '@repo/prisma-shared-schema-platform';

export const UserClusterSchema = z.object({
  user_id: z.string({ required_error: 'user_id is required' }),
  cluster_id: z.string({ required_error: 'cluster_id is required' }),
  is_active: z.boolean({ required_error: 'is_active is required' }),
  role: z.enum(Object.values(enum_cluster_user_role) as [string, ...string[]], {
    required_error: 'role is required',
  }),
});

export type IUserCluster = z.infer<typeof UserClusterSchema>;
export class UserClusterDto extends createZodDto(UserClusterSchema) {}

export const UserClusterUpdateSchema = z.object({
  id: z.string({ required_error: 'id is required' }).optional(),
  user_id: z.string({ required_error: 'user_id is required' }).optional(),
  cluster_id: z.string({ required_error: 'cluster_id is required' }).optional(),
  is_active: z.boolean({ required_error: 'is_active is required' }).optional(),
  role: z
    .enum(Object.values(enum_cluster_user_role) as [string, ...string[]], {
      required_error: 'role is required',
    })
    .optional(),
});

export type IUserClusterUpdate = z.infer<typeof UserClusterUpdateSchema> & {
  id: string;
};
export class UserClusterUpdateDto extends createZodDto(UserClusterUpdateSchema) {}

// export const UserClusterAddSchema = z.object({
//   user_id: z.string({ required_error: 'user_id is required' }),
//   cluster_id: z.string({ required_error: 'cluster_id is required' }),
//   is_active: z.boolean({ required_error: 'is_active is required' }),
//   role: z.enum(Object.values(enum_cluster_user_role) as [string, ...string[]], {
//     required_error: 'role is required',
//   }),
// });

// export const UserClusterSchema = z
//   .object({
//     add: z.array(UserClusterAddSchema).optional(),
//     remove: z.array(
//       z.object({
//         id: z.string({ required_error: 'id is required' }),
//       }),
//     ).optional(),
//   })
//   .strict();

// export type IUserClusterCreate = z.infer<typeof UserClusterSchema>;
// export class UserClusterDto extends createZodDto(UserClusterSchema) {}

// export type IUserClusterDto = z.infer<typeof UserClusterDto>;
