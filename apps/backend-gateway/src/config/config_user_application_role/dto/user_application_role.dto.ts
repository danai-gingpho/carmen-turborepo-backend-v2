import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AssignUserApplicationRoleSchema = z.object({
  user_id: z.string().uuid({ message: 'Invalid user ID' }),
  application_role_id: z.object({
    add: z.array(z.string().uuid({ message: 'Invalid application role ID' })).optional(),
  })
});

export type IAssignUserApplicationRole = z.infer<typeof AssignUserApplicationRoleSchema>;
export class AssignUserApplicationRoleDto extends createZodDto(AssignUserApplicationRoleSchema) { }

export const UpdateUserApplicationRoleSchema = z.object({
  user_id: z.string().uuid({ message: 'Invalid user ID' }),
  application_role_id: z.object({
    add: z.array(z.string().uuid({ message: 'Invalid application role ID' })).optional(),
    remove: z.array(z.string().uuid({ message: 'Invalid application role ID' })).optional(),
  })
});

export type IUpdateUserApplicationRole = z.infer<typeof UpdateUserApplicationRoleSchema>;
export class UpdateUserApplicationRoleDto extends createZodDto(UpdateUserApplicationRoleSchema) { }

export const RemoveUserApplicationRoleSchema = z.object({
  user_id: z.string().uuid({ message: 'Invalid user ID' }),
  application_role_id: z.object({
    remove: z.array(z.string().uuid({ message: 'Invalid application role ID' })),
  })
});

export type IRemoveUserApplicationRole = z.infer<typeof RemoveUserApplicationRoleSchema>;
export class RemoveUserApplicationRoleDto extends createZodDto(RemoveUserApplicationRoleSchema) { }
