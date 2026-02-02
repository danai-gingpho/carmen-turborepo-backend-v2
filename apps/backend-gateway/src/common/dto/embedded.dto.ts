import { z } from 'zod'

// Import validate functions

export const ValidateSchema = z.object({
  quantity: z.number().int(),
  price: z.number().min(0), // allows 0 and positive numbers
  uuid: z.string().uuid(),
  date: z.string().datetime().pipe(z.coerce.date()),
  factor: z.number(), // for unit conversion
})

export const EmbeddedDepartmentSchema = z.object({
  department_id: ValidateSchema.shape.uuid.optional()
})

export const EmbeddedLocationSchema = z.object({
  location_id: ValidateSchema.shape.uuid.optional()
})

export const EmbeddedVendorSchema = z.object({
  vendor_id: ValidateSchema.shape.uuid.optional()
})

export const EmbeddedProductSchema = z.object({
  product_id: ValidateSchema.shape.uuid.optional(),
})

export const EmbeddedWorkflowSchema = z.object({
  workflow_id: ValidateSchema.shape.uuid.optional(),
})

export const EmbeddedCurrencySchema = z.object({
  currency_id: z.string().uuid().optional(),
  exchange_rate: z.number().optional(),
  exchange_rate_date: ValidateSchema.shape.date.optional(),
})

export const EmbeddedDiscountSchema = z.object({
  discount_rate: ValidateSchema.shape.factor.optional(),
  discount_amount: z.number().min(-1).optional(),
  is_discount_adjustment: z.boolean().optional(),
  base_discount_amount: ValidateSchema.shape.price.optional(),
})

export const EmbeddedTaxSchema = z.object({
  tax_profile_id: z.string().uuid().optional(),
  tax_profile_name: z.string().optional(),
  tax_rate: ValidateSchema.shape.price.optional(),
  tax_amount: ValidateSchema.shape.price.optional(),
  is_tax_adjustment: z.boolean(),
  base_tax_amount: ValidateSchema.shape.price.optional(),
  total_amount: ValidateSchema.shape.price.optional()
})

export const InfoSchema = z.object({
  note: z.string().optional().nullable(),
  info: z.any().optional().nullable(), // Accept any object
  dimension: z.any().optional().nullable(), // Accept any object
})

export const EmbeddedPriceListSchema = z.object({
  pricelist_detail_id: z.string().uuid(),
  pricelist_no: z.string().optional(),
  pricelist_price: ValidateSchema.shape.price.optional()
})

export const FocSchema = z.object({
  foc_qty: ValidateSchema.shape.quantity,
  foc_unit_id: z.string().uuid().optional(),
  foc_unit_conversion_rate: ValidateSchema.shape.price.optional(),
  foc_base_qty: ValidateSchema.shape.quantity.optional(),
})

export const ApproveQuantityAndUnitSchema = z.object({
  approved_qty: ValidateSchema.shape.quantity.optional(),
  approved_unit_id: ValidateSchema.shape.uuid.optional(),
  approved_base_qty: ValidateSchema.shape.quantity.optional(),
  approved_unit_conversion_factor: ValidateSchema.shape.factor.optional()
})

export const RequestedQuantityAndUnitSchema = z.object({
  requested_qty: ValidateSchema.shape.quantity.optional(),
  requested_unit_id: ValidateSchema.shape.uuid.optional(),
  requested_unit_conversion_factor: ValidateSchema.shape.factor.optional(),
})

export const OrderQuantityAndUnitSchema = z.object({
  order_qty: ValidateSchema.shape.quantity.optional(),
  order_unit_id: ValidateSchema.shape.uuid.optional(),
  order_base_qty: ValidateSchema.shape.quantity.optional(),
  order_unit_conversion_factor: ValidateSchema.shape.factor.optional(),
})

export const ReceivedQuantityAndUnitSchema = z.object({
  received_qty: ValidateSchema.shape.quantity.optional(),
  received_unit_id: ValidateSchema.shape.uuid.optional(),
  received_base_qty: ValidateSchema.shape.quantity.optional(),
  received_unit_conversion_factor: ValidateSchema.shape.factor.optional()
})

export const PriceSchema = z.object({
  total_price: ValidateSchema.shape.price.optional(),
  sub_total_price: ValidateSchema.shape.price.optional(),
  net_amount: ValidateSchema.shape.price.optional(),
  // price:  ValidateSchema.shape.price.optional(),

  base_sub_total_price: ValidateSchema.shape.price.optional(),
  base_total_price: ValidateSchema.shape.price.optional(),
  base_net_amount: ValidateSchema.shape.price.optional(),
  base_price: ValidateSchema.shape.price.optional(),
})

export const EmbeddedInventorySchema = z.object({
  inventory_unit_id: z.string().uuid().optional(),
});