import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

const TaxProfileSchema = z.object({
  name: z.string(),
  tax_rate: z.number(),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
  created_by_id: z.string().uuid().optional(),
  updated_by_id: z.string().uuid().optional(),
})

export type TaxProfile = z.infer<typeof TaxProfileSchema>
export class TaxProfileDto implements TaxProfile {
  name: string
  tax_rate: number
  description: string
  is_active: boolean
  created_by_id: string
  updated_by_id: string
}


const CreateTaxProfileSchema = TaxProfileSchema.omit({
  updated_by_id: true,
})

export type CreateTaxProfile = z.infer<typeof CreateTaxProfileSchema>
export class CreateTaxProfileDto extends createZodDto(CreateTaxProfileSchema) { }

const UpdateTaxProfileSchema = TaxProfileSchema.omit({
  updated_by_id: true,
})

export type UpdateTaxProfile = z.infer<typeof UpdateTaxProfileSchema>
export class UpdateTaxProfileDto extends createZodDto(UpdateTaxProfileSchema) { }