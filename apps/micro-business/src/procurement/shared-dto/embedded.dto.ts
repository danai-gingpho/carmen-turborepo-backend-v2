import { z } from 'zod'

export const WorkflowSchema = z.object({
  workflow_id: z.string().uuid().optional(),
  current_workflow_status: z.string().optional(),
  workflow_history: z.array(z.object({
    status: z.string().optional(),
    timestamp: z.string().datetime().pipe(z.coerce.date()).optional(),
    user: z.string().optional(),
  })).optional().nullable(),
  workflow_name: z.string().optional(),
  workflow_next_step: z.string().optional(),
  workflow_previous_step: z.string().optional(),
})

export const DepartmentSchema = z.object({
  department_id: z.string().uuid().optional(),
  department_name: z.string().optional(),
})

export const RequestorSchema = z.object({
  requestor_id: z.string().uuid().optional(),
  requestor_name: z.string().optional(),
})

export const LocationSchema = z.object({
  location_id: z.string().uuid().optional(),
  location_name: z.string().optional(),
})

export const ProductSchema = z.object({
  product_id: z.string().uuid().optional(),
  product_name: z.string().optional(),

  product_local_name: z.string().optional(),

  requested_qty: z.number().optional(),
  approved_qty: z.number().optional(),

  price: z.number().optional(),
  total_price: z.number().optional(),
})

export const VendorSchema = z.object({
  vendor_id: z.string().uuid().optional(),
  vendor_name: z.string().optional(),
})

export const UnitAndQuantitySchema = z.object({
  requested_unit_id: z.string().uuid().optional(),
  requested_unit_name: z.string().optional(),
  requested_base_qty: z.number().optional(),

  requested_base_unit_id: z.string().uuid().optional(),
  requested_base_unit_name: z.string().optional(),

  inventory_unit_id: z.string().uuid().optional(),
  inventory_unit_name: z.string().optional(),

  approved_unit_id: z.string().uuid().optional(),
  approved_unit_name: z.string().optional(),

  approved_base_qty: z.number().optional(),
  approved_base_unit_id: z.string().uuid().optional(),
  approved_base_unit_name: z.string().optional(),

  foc_qty: z.number().optional(),
  foc_unit_id: z.string().uuid().optional(),
  foc_unit_name: z.string().optional(),
})

export const CurrencySchema = z.object({
  approved_conversion_rate: z.number().optional(),
  requested_conversion_rate: z.number().optional(),
  currency_id: z.string().uuid().optional(),
  currency_name: z.string().optional(),
  exchange_rate: z.number().optional(),
})

export const DiscountSchema = z.object({
  // is_discount: z.boolean().optional(),
  discount_rate: z.number().optional(),
  discount_amount: z.number().optional(),
  is_discount_adjustment: z.boolean().optional(),
})

export const TaxSchema = z.object({
  tax_profile_id: z.string().uuid().optional(),
  tax_profile_name: z.string().optional(),
  tax_rate: z.number().optional(),
  tax_amount: z.number().optional(),
  is_tax_adjustment: z.boolean().optional(),
})

export const AuthorizeUserSchema = z.object({
  created_at: z.string().datetime().pipe(z.coerce.date()).optional(),
  created_by_id: z.string().optional(),
  update_by_id: z.string().optional(),
  updated_at: z.string().datetime().pipe(z.coerce.date()).optional(),
})

export const InfoSchema = z.object({
  note: z.string().optional(),
  info: z.object({
    priority: z.string().optional(),
    budget_code: z.string().optional(),
  }).optional().nullable(),
  dimension: z.object({
    cost_center: z.string().optional(),
    project: z.string().optional(),
  }).optional().nullable(),
})