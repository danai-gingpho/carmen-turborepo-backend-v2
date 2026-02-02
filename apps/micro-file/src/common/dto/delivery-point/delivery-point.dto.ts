import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// Re-export validate functions for use with DeliveryPoint
export {
  validateDeliveryPointIdExists,
  validateDeliveryPointIdsExist,
} from '../../validate/delivery-point.validate';

export const DeliveryPointCreate = z.object({
  name: z.string(),
  is_active: z.boolean().default(true).nullable().optional(),
});

export type ICreateDeliveryPoint = z.infer<typeof DeliveryPointCreate>;
export class DeliveryPointCreateDto extends createZodDto(DeliveryPointCreate) {}

export const DeliveryPointUpdate = z.object({
  name: z.string().optional(),
  is_active: z.boolean().optional(),
});

export type IUpdateDeliveryPoint = z.infer<typeof DeliveryPointUpdate> & { id: string };
export class DeliveryPointUpdateDto extends createZodDto(DeliveryPointUpdate) {}
