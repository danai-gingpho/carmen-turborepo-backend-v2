import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { enum_location_type } from '@repo/prisma-shared-schema-tenant';

interface Users {
  add?: {
    id: string;
  }[];
  remove: {
    id: string;
  }[];
}

interface Products {
  add?: {
    id: string;
  }[];
  remove: {
    id: string;
  }[];
}

export const location_info = z.object({
  floor: z.number().optional(),
  building: z.string().optional(),
  capacity: z.number().optional(),
  responsibleDepartment: z.string().optional(),
  itemCount: z.number().optional(),
  lastCount: z.string().optional(),
});

export const LocationCreate = z.object({
  code: z.string(),
  name: z.string(),
  location_type: z.enum(
    Object.values(enum_location_type) as [string, ...string[]],
  ),
  description: z.string().optional(),
  is_active: z.boolean().default(true).nullable().optional(),
  delivery_point_id: z.string().uuid().nullable().optional(),
  info: location_info.optional(),
  users: z
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
  products: z
    .object({
      add: z
        .array(
          z.object({
            id: z.string().uuid(),
            min_qty: z.number().optional(),
            max_qty: z.number().optional(),
            re_order_qty: z.number().optional(),
            par_qty: z.number().optional(),
          }),
        )
        .optional(),
    })
    .optional(),
});

export type ICreateLocation = z.infer<typeof LocationCreate>;
export class LocationCreateDto extends createZodDto(LocationCreate) { }

export const LocationUpdate = z.object({
  code: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
  location_type: z
    .enum(Object.values(enum_location_type) as [string, ...string[]])
    .optional(),
  delivery_point_id: z.string().uuid().nullable().optional(),
  info: location_info.optional(),
  users: z
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
  products: z
    .object({
      add: z
        .array(
          z.object({
            id: z.string().uuid(),
            min_qty: z.number().optional(),
            max_qty: z.number().optional(),
            re_order_qty: z.number().optional(),
            par_qty: z.number().optional(),
          }),
        )
        .optional(),
      update: z
        .array(
          z.object({
            id: z.string().uuid(),
            min_qty: z.number().optional(),
            max_qty: z.number().optional(),
            re_order_qty: z.number().optional(),
            par_qty: z.number().optional(),
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
});
export type IUpdateLocation = z.infer<typeof LocationUpdate> & { id: string };
export class LocationUpdateDto extends createZodDto(LocationUpdate) { }
