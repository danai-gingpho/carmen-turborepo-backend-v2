import { optional, z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  enum_data_type,
  enum_vendor_address_type,
} from '@repo/prisma-shared-schema-tenant';

// Re-export validate functions for use with Vendor
export {
  validateVendorIdExists,
  validateVendorIdsExist,
} from '@/common/validate/vendor.validate';

const vendor_business_type = z.object({
  id: z.string(),
  name: z.string(),
});

const vendor_address = z.object({
  address_type: z
    .enum(Object.values(enum_vendor_address_type) as [string, ...string[]])
    .optional(),
  data: z.object({}).passthrough().optional(),
});

const vendor_contact = z.object({
  name: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  is_primary: z.boolean().optional(),
  description: z.string().optional(),
  info: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
        data_type: z
          .nativeEnum(enum_data_type)
          .optional(),
      }),
    )
    .optional(),
});


export const VendorCreate = z.object({
  code: z.string(),
  name: z.string(),
  business_type: z.array(vendor_business_type).optional(),
  description: z.string().optional(),
  info: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
        data_type: z
          .nativeEnum(enum_data_type)
          .optional(),
      }),
    )
    .optional(),
  vendor_address: z.array(vendor_address).optional(),
  vendor_contact: z.array(vendor_contact).optional(),
});

export type ICreateVendor = z.infer<typeof VendorCreate>;

export class VendorCreateDto extends createZodDto(VendorCreate) { }

export const VendorUpdate = z.object({
  code: z.string().optional(),
  name: z.string().optional(),
  business_type: z.array(vendor_business_type).optional(),
  description: z.string().optional(),
  info: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
        data_type: z
          .nativeEnum(enum_data_type)
          .optional(),
      }),
    )
    .optional(),
  vendor_address: z
    .object({
      add: z.array(vendor_address).optional(),
      update: z
        .array(
          z.object({
            vendor_address_id: z.string(),
            ...vendor_address.shape,
          }),
        )
        .optional(),
      remove: z.array(z.object({ vendor_address_id: z.string() })).optional(),
    })
    .optional(),
  vendor_contact: z
    .object({
      add: z.array(vendor_contact).optional(),
      update: z
        .array(
          z.object({
            vendor_contact_id: z.string(),
            ...vendor_contact.shape,
          }),
        )
        .optional(),
      remove: z.array(z.object({ vendor_contact_id: z.string() })).optional(),
    })
    .optional(),
});

export type IUpdateVendor = z.infer<typeof VendorUpdate> & { id: string };

export class VendorUpdateDto extends createZodDto(VendorUpdate) { }
