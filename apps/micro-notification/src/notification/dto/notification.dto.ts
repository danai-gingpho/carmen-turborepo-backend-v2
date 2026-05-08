import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { datetimeField } from '@/common/validation/zod-helpers';

export {
  toISOString,
  toISOStringOrThrow,
  isValidDate,
  toDate,
  toDateOrThrow,
} from '@/common/validate/datetime.validate';

export const NotificationType = {
  SYS_INFO: 'SYS_INFO',
  BU_INFO: 'BU_INFO',
  PR: 'PR',
  PR_COMMENT: 'PR_COMMENT',
  SR: 'SR',
  SR_COMMENT: 'SR_COMMENT',
  PO: 'PO',
  PO_COMMENT: 'PO_COMMENT',
  GRN: 'GRN',
  GRN_COMMENT: 'GRN_COMMENT',
  CN: 'CN',
  CN_COMMENT: 'CN_COMMENT',
} as const;

export type NotificationTypeValue = (typeof NotificationType)[keyof typeof NotificationType];

export const NotificationCategory = {
  SYSTEM: 'system',
  USER_TO_USER: 'user-to-user',
  BUSINESS_UNIT: 'business-unit',
} as const;

export type NotificationCategoryValue = (typeof NotificationCategory)[keyof typeof NotificationCategory];

export const BaseNotificationSchema = z.object({
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  type: z.string().min(1).max(255).default('SYS_INFO'),
  metadata: z.record(z.string(), z.any()).optional(),
  scheduled_at: z.string().datetime().optional(),
});

export const CreateSystemNotificationSchema = z.object({
  category: z.literal('system'),
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  type: z.string().min(1).max(255).default('SYS_INFO'),
  metadata: z.record(z.string(), z.any()).optional(),
  scheduled_at: z.string().datetime().optional(),
  userIds: z.array(z.string().uuid()).optional(),
});

export type CreateSystemNotificationModel = z.infer<typeof CreateSystemNotificationSchema>;
export class CreateSystemNotificationDto extends createZodDto(CreateSystemNotificationSchema) {}

export const CreateUserNotificationSchema = z.object({
  category: z.literal('user-to-user'),
  from_user_id: z.string().uuid(),
  to_user_id: z.string().uuid(),
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  type: z.string().min(1).max(255).default('SYS_INFO'),
  metadata: z.record(z.string(), z.any()).optional(),
  scheduled_at: z.string().datetime().optional(),
});

export type CreateUserNotificationModel = z.infer<typeof CreateUserNotificationSchema>;
export class CreateUserNotificationDto extends createZodDto(CreateUserNotificationSchema) {}

export const CreateBulkNotificationSchema = z.object({
  category: z.literal('user-to-user').optional().default('user-to-user'),
  from_user_id: z.string().uuid().optional(),
  to_user_ids: z.array(z.string().uuid()).min(1),
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  type: z.string().min(1).max(255).default('SYS_INFO'),
  metadata: z.record(z.string(), z.any()).optional(),
  scheduled_at: z.string().datetime().optional(),
});

export type CreateBulkNotificationModel = z.infer<typeof CreateBulkNotificationSchema>;
export class CreateBulkNotificationDto extends createZodDto(CreateBulkNotificationSchema) {}

export const CreateBusinessUnitNotificationSchema = z.object({
  category: z.literal('business-unit'),
  bu_code: z.string().min(1).max(255),
  from_user_id: z.string().uuid().optional(),
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  type: z.string().min(1).max(255).default('BU_INFO'),
  metadata: z.record(z.string(), z.any()).optional(),
  scheduled_at: z.string().datetime().optional(),
});

export type CreateBusinessUnitNotificationModel = z.infer<typeof CreateBusinessUnitNotificationSchema>;
export class CreateBusinessUnitNotificationDto extends createZodDto(CreateBusinessUnitNotificationSchema) {}

export const CreateNotificationSchema = z.union([
  CreateSystemNotificationSchema,
  CreateUserNotificationSchema,
  CreateBusinessUnitNotificationSchema,
]);

export type CreateNotificationModel = z.infer<typeof CreateNotificationSchema>;

export const NotificationResponseSchema = z.object({
  id: z.string().uuid(),
  from_user_id: z.string().uuid().nullable(),
  to_user_id: z.string().uuid().nullable(),
  type: z.string(),
  category: z.string(),
  title: z.string().nullable(),
  message: z.string().nullable(),
  metadata: z.record(z.string(), z.any()).nullable(),
  is_read: z.boolean().nullable(),
  is_sent: z.boolean().nullable(),
  scheduled_at: datetimeField,
  created_at: datetimeField,
});

export type NotificationResponseModel = z.infer<typeof NotificationResponseSchema>;

export const MarkAsReadSchema = z.object({
  notification_id: z.string().uuid(),
});

export type MarkAsReadModel = z.infer<typeof MarkAsReadSchema>;
export class MarkAsReadDto extends createZodDto(MarkAsReadSchema) {}

export const GetNotificationsQuerySchema = z.object({
  user_id: z.string().uuid(),
  unread_only: z.boolean().optional().default(false),
  limit: z.number().int().positive().optional().default(50),
  offset: z.number().int().nonnegative().optional().default(0),
});

export type GetNotificationsQueryModel = z.infer<typeof GetNotificationsQuerySchema>;
