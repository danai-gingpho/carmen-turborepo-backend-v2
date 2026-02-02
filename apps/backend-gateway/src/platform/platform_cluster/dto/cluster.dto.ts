import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ClusterCreateSchema = z.object({
  code: z.string({ required_error: 'Code is required' }).min(3, { message: 'Code must be at least 3 characters long' }),
  name: z.string({ required_error: 'Name is required' }).min(3, { message: 'Name must be at least 3 characters long' }),
  is_active: z.boolean({ required_error: 'Is active is required' }),
});

export type IClusterCreate = z.infer<typeof ClusterCreateSchema>;
export class ClusterCreateDto extends createZodDto(ClusterCreateSchema) {}

export const ClusterUpdateSchema = z.object({
  id: z.string({ required_error: 'Id is required' }).optional(),
  code: z.string({ required_error: 'Code is required' }).min(3, { message: 'Code must be at least 3 characters long' }).optional(),
  name: z.string({ required_error: 'Name is required' }).min(3, { message: 'Name must be at least 3 characters long' }).optional(),
  is_active: z.boolean({ required_error: 'Is active is required' }).optional(),
});

export type IClusterUpdate = z.infer<typeof ClusterUpdateSchema>;
export class ClusterUpdateDto extends createZodDto(ClusterUpdateSchema) {}









