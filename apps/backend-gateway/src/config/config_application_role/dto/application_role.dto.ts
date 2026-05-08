import { z } from 'zod'
import { createZodDto } from 'nestjs-zod'

const CreateConfigApplicationRoleSchema = z.object({
  application_role_name: z.string({ required_error: 'Role name is required' }),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
  permissions:
    z.object({
      add: z.array(z.string().uuid()),
    }).optional(),
})

const UpdateConfigApplicationRoleSchema = z.object({
  id: z.string().optional(),
  application_role_name: z.string().optional(),
  is_active: z.boolean().optional(),
  permissions: z.object({
    add: z.array(z.string().uuid()).optional(),
    remove: z.array(z.string().uuid()).optional(),
  }).optional(),

})

export type ICreateConfigApplicationRole = z.infer<typeof CreateConfigApplicationRoleSchema>
export type IUpdateConfigApplicationRole = z.infer<typeof UpdateConfigApplicationRoleSchema>

export class CreateConfigApplicationRoleDto extends createZodDto(CreateConfigApplicationRoleSchema) { }
export class UpdateConfigApplicationRoleDto extends createZodDto(UpdateConfigApplicationRoleSchema) { }