import { z } from 'zod';

// Notification response schema (for findOne)
export const NotificationDetailResponseSchema = z.object({
  id: z.string().uuid(),
  from_user_id: z.string().uuid().nullable().optional(),
  to_user_id: z.string().uuid().nullable().optional(),
  type: z.string(),
  category: z.string(),
  title: z.string().nullable().optional(),
  message: z.string().nullable().optional(),
  metadata: z.record(z.any()).nullable().optional(),
  is_read: z.boolean().nullable().optional(),
  is_sent: z.boolean().nullable().optional(),
  scheduled_at: z.coerce.date().nullable().optional(),
  created_at: z.coerce.date().nullable().optional(),
  updated_at: z.coerce.date().nullable().optional(),
});

export type NotificationDetailResponse = z.infer<typeof NotificationDetailResponseSchema>;

// Notification list item response schema (for findAll)
export const NotificationListItemResponseSchema = z.object({
  id: z.string().uuid(),
  from_user_id: z.string().uuid().nullable().optional(),
  to_user_id: z.string().uuid().nullable().optional(),
  type: z.string(),
  category: z.string(),
  title: z.string().nullable().optional(),
  message: z.string().nullable().optional(),
  is_read: z.boolean().nullable().optional(),
  is_sent: z.boolean().nullable().optional(),
  scheduled_at: z.coerce.date().nullable().optional(),
  created_at: z.coerce.date().nullable().optional(),
});

export type NotificationListItemResponse = z.infer<typeof NotificationListItemResponseSchema>;

// Mutation response schema
export const NotificationMutationResponseSchema = z.object({
  id: z.string().uuid(),
});

export type NotificationMutationResponse = z.infer<typeof NotificationMutationResponseSchema>;

// Bulk create response schema
export const NotificationBulkMutationResponseSchema = z.object({
  ids: z.array(z.string().uuid()),
  count: z.number(),
});

export type NotificationBulkMutationResponse = z.infer<typeof NotificationBulkMutationResponseSchema>;
