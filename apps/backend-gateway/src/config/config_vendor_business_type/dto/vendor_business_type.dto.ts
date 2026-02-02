import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const VendorBusinessTypeCreate = z.object({
  name: z.string(),
  description: z.string().optional(),
  is_active: z.boolean().default(true).nullable().optional(),
  note: z.string().optional(),
});

export type ICreateVendorBusinessType = z.infer<
  typeof VendorBusinessTypeCreate
>;
export class VendorBusinessTypeCreateDto extends createZodDto(
  VendorBusinessTypeCreate,
) {}

export const VendorBusinessTypeUpdate = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
  note: z.string().optional(),
});

export type IUpdateVendorBusinessType = z.infer<
  typeof VendorBusinessTypeUpdate
> & { id: string };
export class VendorBusinessTypeUpdateDto extends createZodDto(
  VendorBusinessTypeUpdate,
) {}
