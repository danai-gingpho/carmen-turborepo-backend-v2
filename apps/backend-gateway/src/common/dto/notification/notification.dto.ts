import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// Inline datetime field definition
const datetimeField = z.string().datetime().nullable();

/**
 * Notification Types - ประเภทของ notification
 */
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

/**
 * Notification Categories
 */
export const NotificationCategory = {
  SYSTEM: 'system',
  USER_TO_USER: 'user-to-user',
  BUSINESS_UNIT: 'business-unit',
} as const;

export type NotificationCategoryValue = (typeof NotificationCategory)[keyof typeof NotificationCategory];

/**
 * Base notification fields schema
 */
export const BaseNotificationSchema = z.object({
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  type: z.string().min(1).max(255).default('SYS_INFO'),
  metadata: z.record(z.any()).optional(),
  scheduled_at: z.string().datetime().optional(),
});

/**
 * System notification schema - broadcast ถึงทุกคนหรือกลุ่ม users
 */
export const CreateSystemNotificationSchema = z.object({
  category: z.literal('system'),
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  type: z.string().min(1).max(255).default('SYS_INFO'),
  metadata: z.record(z.any()).optional(),
  scheduled_at: z.string().datetime().optional(),
  userIds: z.array(z.string().uuid()).optional(), // ถ้าไม่ระบุ = ส่งทุกคน
});

export type CreateSystemNotificationModel = z.infer<typeof CreateSystemNotificationSchema>;
export class CreateSystemNotificationDto extends createZodDto(CreateSystemNotificationSchema) {}

/**
 * User-to-user notification schema - ส่งหาคนเฉพาะ
 */
export const CreateUserNotificationSchema = z.object({
  category: z.literal('user-to-user'),
  from_user_id: z.string().uuid(),
  to_user_id: z.string().uuid(),
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  type: z.string().min(1).max(255).default('SYS_INFO'),
  metadata: z.record(z.any()).optional(),
  scheduled_at: z.string().datetime().optional(),
});

export type CreateUserNotificationModel = z.infer<typeof CreateUserNotificationSchema>;
export class CreateUserNotificationDto extends createZodDto(CreateUserNotificationSchema) {}

/**
 * Bulk notification schema - ส่งหาหลายคนพร้อมกัน
 */
export const CreateBulkNotificationSchema = z.object({
  category: z.literal('user-to-user').optional().default('user-to-user'),
  from_user_id: z.string().uuid().optional(),
  to_user_ids: z.array(z.string().uuid()).min(1),
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  type: z.string().min(1).max(255).default('SYS_INFO'),
  metadata: z.record(z.any()).optional(),
  scheduled_at: z.string().datetime().optional(),
});

export type CreateBulkNotificationModel = z.infer<typeof CreateBulkNotificationSchema>;
export class CreateBulkNotificationDto extends createZodDto(CreateBulkNotificationSchema) {}

/**
 * Business Unit notification schema - ส่งหาทุกคนใน Business Unit
 */
export const CreateBusinessUnitNotificationSchema = z.object({
  category: z.literal('business-unit'),
  bu_code: z.string().min(1).max(255),
  from_user_id: z.string().uuid().optional(),
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  type: z.string().min(1).max(255).default('BU_INFO'),
  metadata: z.record(z.any()).optional(),
  scheduled_at: z.string().datetime().optional(),
});

export type CreateBusinessUnitNotificationModel = z.infer<typeof CreateBusinessUnitNotificationSchema>;
export class CreateBusinessUnitNotificationDto extends createZodDto(CreateBusinessUnitNotificationSchema) {}

/**
 * Combined notification schema (union)
 */
export const CreateNotificationSchema = z.union([
  CreateSystemNotificationSchema,
  CreateUserNotificationSchema,
  CreateBusinessUnitNotificationSchema,
]);

export type CreateNotificationModel = z.infer<typeof CreateNotificationSchema>;

/**
 * Notification response schema
 */
export const NotificationResponseSchema = z.object({
  id: z.string().uuid(),
  from_user_id: z.string().uuid().nullable(),
  to_user_id: z.string().uuid().nullable(),
  type: z.string(),
  category: z.string(),
  title: z.string().nullable(),
  message: z.string().nullable(),
  metadata: z.record(z.any()).nullable(),
  is_read: z.boolean().nullable(),
  is_sent: z.boolean().nullable(),
  scheduled_at: datetimeField,
  created_at: datetimeField,
});

export type NotificationResponseModel = z.infer<typeof NotificationResponseSchema>;

/**
 * Mark as read schema
 */
export const MarkAsReadSchema = z.object({
  notification_id: z.string().uuid(),
});

export type MarkAsReadModel = z.infer<typeof MarkAsReadSchema>;
export class MarkAsReadDto extends createZodDto(MarkAsReadSchema) {}

/**
 * Get notifications query schema
 */
export const GetNotificationsQuerySchema = z.object({
  user_id: z.string().uuid(),
  unread_only: z.boolean().optional().default(false),
  limit: z.number().int().positive().optional().default(50),
  offset: z.number().int().nonnegative().optional().default(0),
});

export type GetNotificationsQueryModel = z.infer<typeof GetNotificationsQuerySchema>;
