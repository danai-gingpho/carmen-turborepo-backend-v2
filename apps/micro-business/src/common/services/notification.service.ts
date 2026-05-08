import { Injectable, Logger } from '@nestjs/common';
import {
  CreateSystemNotificationModel,
  CreateUserNotificationModel,
  CreateBulkNotificationModel,
  CreateBusinessUnitNotificationModel,
  NotificationResponseModel,
  NotificationType,
  NotificationCategory,
} from '@/notification/dto/notification.dto';

export interface NotificationServiceConfig {
  host?: string;
  port?: string | number;
  timeout?: number;
}

export interface SendNotificationOptions {
  /** Notification title */
  title: string;
  /** Notification message body */
  message: string;
  /** Notification type (default: SYS_INFO) */
  type?: string;
  /** Additional metadata as JSON */
  metadata?: Record<string, unknown>;
  /** Schedule for future delivery (ISO date string) */
  scheduled_at?: string;
}

export interface SendToUserOptions extends SendNotificationOptions {
  /** Sender user ID */
  from_user_id?: string;
  /** Recipient user ID */
  to_user_id: string;
}

export interface SendToUsersOptions extends SendNotificationOptions {
  /** Sender user ID */
  from_user_id?: string;
  /** Recipient user IDs */
  to_user_ids: string[];
}

export interface SendSystemOptions extends SendNotificationOptions {
  /** Specific user IDs to send to (if not specified, sends to all users) */
  userIds?: string[];
}

export interface SendBusinessUnitOptions extends SendNotificationOptions {
  /** Sender user ID */
  from_user_id?: string;
  /** Business Unit code */
  bu_code: string;
}

/**
 * NotificationService - Injectable service for sending notifications
 *
 * Usage in NestJS microservice:
 * ```typescript
 * @Injectable()
 * export class MyService {
 *   private notificationService: NotificationService;
 *
 *   constructor() {
 *     this.notificationService = new NotificationService({
 *       host: process.env.NOTIFICATION_SERVICE_HOST,
 *       port: process.env.NOTIFICATION_SERVICE_HTTP_PORT,
 *     });
 *   }
 *
 *   async doSomething() {
 *     await this.notificationService.sendToUser({
 *       to_user_id: 'user-uuid',
 *       title: 'Hello',
 *       message: 'Your request has been approved',
 *       type: 'PR',
 *     });
 *   }
 * }
 * ```
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(config?: NotificationServiceConfig) {
    const host = config?.host || process.env.NOTIFICATION_SERVICE_HOST || 'localhost';
    const port = config?.port || process.env.NOTIFICATION_SERVICE_HTTP_PORT || '6006';
    this.baseUrl = `http://${host}:${port}/api/notifications`;
    this.timeout = config?.timeout || 10000;
  }

  /**
   * Send notification to a specific user
   * ส่งการแจ้งเตือนไปยังผู้ใช้ที่ระบุ
   * @param options - Notification options including recipient / ตัวเลือกการแจ้งเตือนรวมถึงผู้รับ
   * @returns Notification response or null / การตอบกลับการแจ้งเตือนหรือ null
   */
  async sendToUser(options: SendToUserOptions): Promise<NotificationResponseModel | null> {
    const payload: CreateUserNotificationModel = {
      category: 'user-to-user',
      from_user_id: options.from_user_id || '00000000-0000-0000-0000-000000000000',
      to_user_id: options.to_user_id,
      title: options.title,
      message: options.message,
      type: options.type || NotificationType.SYS_INFO,
      metadata: options.metadata,
      scheduled_at: options.scheduled_at,
    };

    return this.send(payload);
  }

  /**
   * Send notification to multiple users
   * ส่งการแจ้งเตือนไปยังผู้ใช้หลายคน
   * @param options - Notification options including recipient IDs / ตัวเลือกการแจ้งเตือนรวมถึง ID ผู้รับ
   * @returns Array of notification responses / อาร์เรย์ของการตอบกลับการแจ้งเตือน
   */
  async sendToUsers(options: SendToUsersOptions): Promise<(NotificationResponseModel | null)[]> {
    const results: (NotificationResponseModel | null)[] = [];

    for (const to_user_id of options.to_user_ids) {
      const result = await this.sendToUser({
        ...options,
        to_user_id,
      });
      results.push(result);
    }

    return results;
  }

  /**
   * Send system-wide notification (broadcast)
   * ส่งการแจ้งเตือนทั่วทั้งระบบ (ประกาศ)
   * @param options - System notification options / ตัวเลือกการแจ้งเตือนระบบ
   * @returns Array of notification responses or null / อาร์เรย์ของการตอบกลับการแจ้งเตือนหรือ null
   */
  async sendSystem(options: SendSystemOptions): Promise<NotificationResponseModel[] | null> {
    const payload: CreateSystemNotificationModel = {
      category: 'system',
      title: options.title,
      message: options.message,
      type: options.type || NotificationType.SYS_INFO,
      metadata: options.metadata,
      scheduled_at: options.scheduled_at,
      userIds: options.userIds,
    };

    return this.send(payload);
  }

  /**
   * Send notification to all users in a Business Unit
   * ส่งการแจ้งเตือนไปยังผู้ใช้ทั้งหมดในหน่วยธุรกิจ
   * @param options - Business unit notification options / ตัวเลือกการแจ้งเตือนหน่วยธุรกิจ
   * @returns Array of notification responses or null / อาร์เรย์ของการตอบกลับการแจ้งเตือนหรือ null
   */
  async sendToBusinessUnit(options: SendBusinessUnitOptions): Promise<NotificationResponseModel[] | null> {
    const payload: CreateBusinessUnitNotificationModel = {
      category: 'business-unit',
      bu_code: options.bu_code,
      from_user_id: options.from_user_id,
      title: options.title,
      message: options.message,
      type: options.type || NotificationType.BU_INFO,
      metadata: options.metadata,
      scheduled_at: options.scheduled_at,
    };

    return this.send(payload);
  }

  // ============================================================
  // Simplified API Methods
  // ============================================================

  /**
   * Send direct 1-to-1 notification
   * ส่งการแจ้งเตือนโดยตรงแบบ 1 ต่อ 1
   * @param type - Notification type (e.g., 'PR', 'PO', 'SR', 'GRN', 'CN', 'SYS_INFO') / ประเภทการแจ้งเตือน
   * @param from - Sender user ID / ID ผู้ส่ง
   * @param to - Recipient user ID / ID ผู้รับ
   * @param title - Notification title / หัวข้อการแจ้งเตือน
   * @param message - Notification message / ข้อความการแจ้งเตือน
   * @param metadata - Optional additional data / ข้อมูลเพิ่มเติม (ถ้ามี)
   * @param schedule - Optional scheduled time (ISO date string) / เวลาที่กำหนดส่ง (ถ้ามี)
   * @returns Notification response or null / การตอบกลับการแจ้งเตือนหรือ null
   */
  async sendNoti(
    type: string,
    from: string,
    to: string,
    title: string,
    message: string,
    metadata?: Record<string, unknown>,
    schedule?: string,
  ): Promise<NotificationResponseModel | null> {
    return this.sendToUser({
      from_user_id: from,
      to_user_id: to,
      title,
      message,
      type,
      metadata,
      scheduled_at: schedule,
    });
  }

  /**
   * Send system notification to all users
   * ส่งการแจ้งเตือนระบบไปยังผู้ใช้ทั้งหมด
   * @param type - Notification type (e.g., 'SYS_INFO', 'BU_INFO') / ประเภทการแจ้งเตือน
   * @param from - Sender identifier (for logging/tracking) / ตัวระบุผู้ส่ง (สำหรับบันทึก/ติดตาม)
   * @param title - Notification title / หัวข้อการแจ้งเตือน
   * @param message - Notification message / ข้อความการแจ้งเตือน
   * @param metadata - Optional additional data / ข้อมูลเพิ่มเติม (ถ้ามี)
   * @param schedule - Optional scheduled time (ISO date string) / เวลาที่กำหนดส่ง (ถ้ามี)
   * @returns Array of notification responses or null / อาร์เรย์ของการตอบกลับการแจ้งเตือนหรือ null
   */
  async sendNoti_SYS(
    type: string,
    from: string,
    title: string,
    message: string,
    metadata?: Record<string, unknown>,
    schedule?: string,
  ): Promise<NotificationResponseModel[] | null> {
    return this.sendSystem({
      title,
      message,
      type,
      metadata: { ...metadata, from_system: from },
      scheduled_at: schedule,
    });
  }

  /**
   * Send notification to all users in a Business Unit
   * ส่งการแจ้งเตือนไปยังผู้ใช้ทั้งหมดในหน่วยธุรกิจ
   * @param type - Notification type (e.g., 'BU_INFO', 'SYS_INFO') / ประเภทการแจ้งเตือน
   * @param from - Sender user ID / ID ผู้ส่ง
   * @param bu - Business Unit code / รหัสหน่วยธุรกิจ
   * @param title - Notification title / หัวข้อการแจ้งเตือน
   * @param message - Notification message / ข้อความการแจ้งเตือน
   * @param metadata - Optional additional data / ข้อมูลเพิ่มเติม (ถ้ามี)
   * @param schedule - Optional scheduled time (ISO date string) / เวลาที่กำหนดส่ง (ถ้ามี)
   * @returns Array of notification responses or null / อาร์เรย์ของการตอบกลับการแจ้งเตือนหรือ null
   */
  async sendNoti_BU(
    type: string,
    from: string,
    bu: string,
    title: string,
    message: string,
    metadata?: Record<string, unknown>,
    schedule?: string,
  ): Promise<NotificationResponseModel[] | null> {
    return this.sendToBusinessUnit({
      from_user_id: from,
      bu_code: bu,
      title,
      message,
      type,
      metadata,
      scheduled_at: schedule,
    });
  }

  /**
   * Send Purchase Request notification
   * ส่งการแจ้งเตือนใบขอซื้อ
   * @param to_user_id - Recipient user ID / ID ผู้รับ
   * @param title - Notification title / หัวข้อการแจ้งเตือน
   * @param message - Notification message / ข้อความการแจ้งเตือน
   * @param metadata - Optional additional data / ข้อมูลเพิ่มเติม (ถ้ามี)
   * @param from_user_id - Sender user ID / ID ผู้ส่ง
   * @returns Notification response or null / การตอบกลับการแจ้งเตือนหรือ null
   */
  async sendPRNotification(
    to_user_id: string,
    title: string,
    message: string,
    metadata?: Record<string, unknown>,
    from_user_id?: string,
  ): Promise<NotificationResponseModel | null> {
    return this.sendToUser({
      to_user_id,
      title,
      message,
      type: NotificationType.PR,
      metadata,
      from_user_id,
    });
  }

  /**
   * Send Purchase Order notification
   * ส่งการแจ้งเตือนใบสั่งซื้อ
   * @param to_user_id - Recipient user ID / ID ผู้รับ
   * @param title - Notification title / หัวข้อการแจ้งเตือน
   * @param message - Notification message / ข้อความการแจ้งเตือน
   * @param metadata - Optional additional data / ข้อมูลเพิ่มเติม (ถ้ามี)
   * @param from_user_id - Sender user ID / ID ผู้ส่ง
   * @returns Notification response or null / การตอบกลับการแจ้งเตือนหรือ null
   */
  async sendPONotification(
    to_user_id: string,
    title: string,
    message: string,
    metadata?: Record<string, unknown>,
    from_user_id?: string,
  ): Promise<NotificationResponseModel | null> {
    return this.sendToUser({
      to_user_id,
      title,
      message,
      type: NotificationType.PO,
      metadata,
      from_user_id,
    });
  }

  /**
   * Send Store Requisition notification
   * ส่งการแจ้งเตือนใบเบิกสินค้า
   * @param to_user_id - Recipient user ID / ID ผู้รับ
   * @param title - Notification title / หัวข้อการแจ้งเตือน
   * @param message - Notification message / ข้อความการแจ้งเตือน
   * @param metadata - Optional additional data / ข้อมูลเพิ่มเติม (ถ้ามี)
   * @param from_user_id - Sender user ID / ID ผู้ส่ง
   * @returns Notification response or null / การตอบกลับการแจ้งเตือนหรือ null
   */
  async sendSRNotification(
    to_user_id: string,
    title: string,
    message: string,
    metadata?: Record<string, unknown>,
    from_user_id?: string,
  ): Promise<NotificationResponseModel | null> {
    return this.sendToUser({
      to_user_id,
      title,
      message,
      type: NotificationType.SR,
      metadata,
      from_user_id,
    });
  }

  /**
   * Send Good Received Note notification
   * ส่งการแจ้งเตือนใบรับสินค้า
   * @param to_user_id - Recipient user ID / ID ผู้รับ
   * @param title - Notification title / หัวข้อการแจ้งเตือน
   * @param message - Notification message / ข้อความการแจ้งเตือน
   * @param metadata - Optional additional data / ข้อมูลเพิ่มเติม (ถ้ามี)
   * @param from_user_id - Sender user ID / ID ผู้ส่ง
   * @returns Notification response or null / การตอบกลับการแจ้งเตือนหรือ null
   */
  async sendGRNNotification(
    to_user_id: string,
    title: string,
    message: string,
    metadata?: Record<string, unknown>,
    from_user_id?: string,
  ): Promise<NotificationResponseModel | null> {
    return this.sendToUser({
      to_user_id,
      title,
      message,
      type: NotificationType.GRN,
      metadata,
      from_user_id,
    });
  }

  /**
   * Send Credit Note notification
   * ส่งการแจ้งเตือนใบลดหนี้
   * @param to_user_id - Recipient user ID / ID ผู้รับ
   * @param title - Notification title / หัวข้อการแจ้งเตือน
   * @param message - Notification message / ข้อความการแจ้งเตือน
   * @param metadata - Optional additional data / ข้อมูลเพิ่มเติม (ถ้ามี)
   * @param from_user_id - Sender user ID / ID ผู้ส่ง
   * @returns Notification response or null / การตอบกลับการแจ้งเตือนหรือ null
   */
  async sendCNNotification(
    to_user_id: string,
    title: string,
    message: string,
    metadata?: Record<string, unknown>,
    from_user_id?: string,
  ): Promise<NotificationResponseModel | null> {
    return this.sendToUser({
      to_user_id,
      title,
      message,
      type: NotificationType.CN,
      metadata,
      from_user_id,
    });
  }

  /**
   * Get unread notifications for a user
   * ดึงการแจ้งเตือนที่ยังไม่ได้อ่านของผู้ใช้
   * @param user_id - User ID / ID ผู้ใช้
   * @returns List of unread notifications or null / รายการการแจ้งเตือนที่ยังไม่ได้อ่านหรือ null
   */
  async getUnread(user_id: string): Promise<NotificationResponseModel[] | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${user_id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        this.logger.error(`Failed to get notifications: ${response.statusText}`);
        return null;
      }

      return response.json();
    } catch (error) {
      this.logger.error('Error getting notifications:', error);
      return null;
    }
  }

  /**
   * Get all notifications for a user
   * ดึงการแจ้งเตือนทั้งหมดของผู้ใช้
   * @param user_id - User ID / ID ผู้ใช้
   * @returns List of all notifications or null / รายการการแจ้งเตือนทั้งหมดหรือ null
   */
  async getAll(user_id: string): Promise<NotificationResponseModel[] | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${user_id}/all`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        this.logger.error(`Failed to get all notifications: ${response.statusText}`);
        return null;
      }

      return response.json();
    } catch (error) {
      this.logger.error('Error getting all notifications:', error);
      return null;
    }
  }

  /**
   * Mark notification as read
   * ทำเครื่องหมายว่าอ่านการแจ้งเตือนแล้ว
   * @param notification_id - Notification ID / ID การแจ้งเตือน
   * @returns Success status / สถานะความสำเร็จ
   */
  async markAsRead(notification_id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${notification_id}/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        this.logger.error(`Failed to mark as read: ${response.statusText}`);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('Error marking notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read for a user
   * ทำเครื่องหมายว่าอ่านการแจ้งเตือนทั้งหมดของผู้ใช้แล้ว
   * @param user_id - User ID / ID ผู้ใช้
   * @returns Success status / สถานะความสำเร็จ
   */
  async markAllAsRead(user_id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/mark-all-read/${user_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        this.logger.error(`Failed to mark all as read: ${response.statusText}`);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  /**
   * Internal method to send notification via HTTP
   * เมธอดภายในสำหรับส่งการแจ้งเตือนผ่าน HTTP
   * @param payload - Notification payload / ข้อมูลการแจ้งเตือน
   * @returns Notification response or null / การตอบกลับการแจ้งเตือนหรือ null
   */
  private async send<T>(payload: Record<string, unknown>): Promise<T | null> {
    try {
      this.logger.debug(`Sending notification: ${JSON.stringify(payload)}`);

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        this.logger.error(`Failed to send notification: ${response.statusText}`);
        return null;
      }

      this.logger.log('Notification sent successfully');
      return response.json();
    } catch (error) {
      this.logger.error('Error sending notification:', error);
      return null;
    }
  }
}

/**
 * Create a notification service instance with custom config
 * สร้างอินสแตนซ์บริการการแจ้งเตือนพร้อมการตั้งค่าที่กำหนดเอง
 * @param config - Optional service configuration / การตั้งค่าบริการ (ถ้ามี)
 * @returns NotificationService instance / อินสแตนซ์ NotificationService
 */
export function createNotificationService(config?: NotificationServiceConfig): NotificationService {
  return new NotificationService(config);
}

/**
 * Default notification service instance using environment variables
 */
export const notificationService = new NotificationService();
