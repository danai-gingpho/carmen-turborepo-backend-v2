import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { enum_calculation_method } from '@repo/prisma-shared-schema-platform';

export const BusinessUnitCreateSchema = z
  .object({
    cluster_id: z
      .string({
        required_error: 'cluster_id field is required',
      })
      .uuid({ message: 'cluster_id must be a valid UUID' }),
    code: z
      .string({
        required_error: 'code field is required',
      })
      .min(3, 'code must be at least 3 characters'),
    name: z
      .string({
        required_error: 'name field is required',
      })
      .min(3, 'name must be at least 3 characters'),
    alias_name: z
      .string({
        required_error: 'alias_name field is required',
      })
      .min(3, 'alias_name must be at least 3 characters')
      .optional(),
    description: z.string().optional(),
    info: z.any().optional(),
    default_currency_id: z.string().uuid().optional(),
    max_license_users: z.number().int().nullable().optional(),
    is_hq: z.boolean({
      required_error: 'is_hq field is required',
    }),
    is_active: z.boolean({
      required_error: 'is_active field is required',
    }),
    db_connection: z.any().optional(),
    config: z.any().optional(),
    calculation_method: z.enum(
      Object.values(enum_calculation_method) as [string, ...string[]],
    ).optional(),

    // Company info
    branch_no: z.string().optional(),
    company_name: z.string().optional(),
    company_address: z.string().optional(),
    company_email: z.string().email('company_email must be a valid email').optional(),
    company_tel: z.string().optional(),
    company_zip_code: z.string().optional(),
    tax_no: z.string().optional(),

    // Hotel info
    hotel_name: z.string().optional(),
    hotel_address: z.string().optional(),
    hotel_email: z.string().email('hotel_email must be a valid email').optional(),
    hotel_tel: z.string().optional(),
    hotel_zip_code: z.string().optional(),

    // Format settings
    date_format: z.string().optional(),
    date_time_format: z.string().optional(),
    time_format: z.string().optional(),
    short_time_format: z.string().optional(),
    long_time_format: z.string().optional(),
    timezone: z.string().optional(),
    amount_format: z.any().optional(),
    quantity_format: z.any().optional(),
    perpage_format: z.any().optional(),
    recipe_format: z.any().optional(),
  })

export type IBusinessUnitCreate = z.infer<typeof BusinessUnitCreateSchema>;
export class BusinessUnitCreateDto extends createZodDto(BusinessUnitCreateSchema) {}

export const BusinessUnitUpdateSchema = z.object({
    id: z.string().optional(),
    cluster_id: z
      .string({
        required_error: 'cluster_id field is required',
      })
      .min(1, 'cluster_id must be at least 1 characters')
      .optional(),
    code: z
      .string({
        required_error: 'code field is required',
      })
      .min(3, 'code must be at least 3 characters')
      .optional(),
    name: z
      .string({
        required_error: 'name field is required',
      })
      .min(3, 'name must be at least 3 characters')
      .optional(),
    alias_name: z
      .string({
        required_error: 'alias_name field is required',
      })
      .min(3, 'alias_name must be at least 3 characters')
      .optional(),
    description: z.string().optional(),
    info: z.any().optional(),
    default_currency_id: z.string().uuid().optional(),
    max_license_users: z.number().int().nullable().optional(),
    is_hq: z
      .boolean({
        required_error: 'is_hq field is required',
      })
      .optional(),
    is_active: z
      .boolean({
        required_error: 'is_active field is required',
      })
      .optional(),
    db_connection: z.any().optional(),
    config: z.any().optional(),
    calculation_method: z.enum(
      Object.values(enum_calculation_method) as [string, ...string[]],
    ).optional(),

    // Company info
    branch_no: z.string().optional(),
    company_name: z.string().optional(),
    company_address: z.string().optional(),
    company_email: z.string().email('company_email must be a valid email').optional(),
    company_tel: z.string().optional(),
    company_zip_code: z.string().optional(),
    tax_no: z.string().optional(),

    // Hotel info
    hotel_name: z.string().optional(),
    hotel_address: z.string().optional(),
    hotel_email: z.string().email('hotel_email must be a valid email').optional(),
    hotel_tel: z.string().optional(),
    hotel_zip_code: z.string().optional(),

    // Format settings
    date_format: z.string().optional(),
    date_time_format: z.string().optional(),
    time_format: z.string().optional(),
    short_time_format: z.string().optional(),
    long_time_format: z.string().optional(),
    timezone: z.string().optional(),
    amount_format: z.any().optional(),
    quantity_format: z.any().optional(),
    perpage_format: z.any().optional(),
    recipe_format: z.any().optional(),
  });

export type IBusinessUnitUpdate = z.infer<typeof BusinessUnitUpdateSchema>;
export class BusinessUnitUpdateDto extends createZodDto(BusinessUnitUpdateSchema) {}
