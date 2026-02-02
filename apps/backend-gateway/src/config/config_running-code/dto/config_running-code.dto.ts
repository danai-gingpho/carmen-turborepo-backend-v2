import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const runningCodeCreate = z.object({
  type: z.string().optional(),
  config: z
    .object({
      A: z.string().optional(),
      B: z.string().optional(),
      C: z.string().optional(),
      D: z.string().optional(),
      format: z
        .string()
        .regex(/^({[ABCD]}){1,4}$/)
        .optional(),
    })
    .optional(),
});

export type IRunningCodeCreate = z.infer<typeof runningCodeCreate>;
export class RunningCodeCreateDto extends createZodDto(runningCodeCreate) {}

export const runningCodeUpdate = z.object({
  type: z.string().optional(),
  config: z
    .object({
      A: z.string().optional(),
      B: z.string().optional(),
      C: z.string().optional(),
      D: z.string().optional(),
      format: z
        .string()
        .regex(/^({[ABCD]}){1,4}$/)
        .optional(),
    })
    .optional(),
});

export type IRunningCodeUpdate = z.infer<typeof runningCodeUpdate> & {
  id: string;
};
export class RunningCodeUpdateDto extends createZodDto(runningCodeUpdate) {}
