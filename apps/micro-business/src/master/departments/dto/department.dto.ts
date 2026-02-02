import { de } from "zod/v4/locales";
import { z } from "zod";
import { createZodDto } from "nestjs-zod";

// Re-export validate functions for use with Department

export const DepartmentsCreate = z.object({
  code: z.string(),
  name: z.string(),
  description: z.string().optional(),
  is_active: z.boolean().default(true).nullable().optional(),
  department_users: z
    .object({
      add: z.array(
        z.object({
          id: z.string().uuid(),
        }),
      ),
    })
    .optional(),
  hod_users: z
    .object({
      add: z
        .array(
          z.object({
            id: z.string().uuid(),
          }),
        )
        .optional(),
    })
    .optional(),
});

export type ICreateDepartments = z.infer<typeof DepartmentsCreate>;
export class DepartmentsCreateDto extends createZodDto(DepartmentsCreate) {}

export const DepartmentsUpdate = z.object({
  code: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
  department_users: z
    .object({
      add: z
        .array(
          z.object({
            id: z.string().uuid(),
          }),
        )
        .optional(),
      remove: z
        .array(
          z.object({
            id: z.string().uuid(),
          }),
        )
        .optional(),
    })
    .optional(),
  hod_users: z
    .object({
      add: z
        .array(
          z.object({
            id: z.string().uuid(),
          }),
        )
        .optional(),
      remove: z
        .array(
          z.object({
            id: z.string().uuid().optional(),
          }),
        )
        .optional(),
    })
    .optional(),
});

export type IUpdateDepartments = z.infer<typeof DepartmentsUpdate> & { id: string };
export class DepartmentsUpdateDto extends createZodDto(DepartmentsUpdate) {}
