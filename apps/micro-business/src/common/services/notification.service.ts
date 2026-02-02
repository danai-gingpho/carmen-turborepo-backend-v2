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
  metadata?: Record<string, any>;
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
 *       port: process.env.NOTIFICATION_SERVICE_PORT,
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
    const port = config?.port || process.env.NOTIFICATION_SERVICE_PORT || '5006';
    this.baseUrl = `http://${host}:${port}/api/notifications`;
    this.timeout = config?.timeout || 10000;
  }

  /**
   * Send notification to a specific user
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
   * @param type Notification type (e.g., 'PR', 'PO', 'SR', 'GRN', 'CN', 'SYS_INFO')
   * @param from Sender user ID
   * @param to Recipient user ID
   * @param title Notification title
   * @param message Notification message
   * @param metadata Optional additional data
   * @param schedule Optional scheduled time (ISO date string)
   */
  async sendNoti(
    type: string,
    from: string,
    to: string,
    title: string,
    message: string,
    metadata?: Record<string, any>,
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
   * @param type Notification type (e.g., 'SYS_INFO', 'BU_INFO')
   * @param from Sender identifier (for logging/tracking, not used in notification)
   * @param title Notification title
   * @param message Notification message
   * @param metadata Optional additional data
   * @param schedule Optional scheduled time (ISO date string)
   */
  async sendNoti_SYS(
    type: string,
    from: string,
    title: string,
    message: string,
    metadata?: Record<string, any>,
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
   * @param type Notification type (e.g., 'BU_INFO', 'SYS_INFO')
   * @param from Sender user ID
   * @param bu Business Unit code
   * @param title Notification title
   * @param message Notification message
   * @param metadata Optional additional data
   * @param schedule Optional scheduled time (ISO date string)
   */
  async sendNoti_BU(
    type: string,
    from: string,
    bu: string,
    title: string,
    message: string,
    metadata?: Record<string, any>,
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
   */
  async sendPRNotification(
    to_user_id: string,
    title: string,
    message: string,
    metadata?: Record<string, any>,
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
   */
  async sendPONotification(
    to_user_id: string,
    title: string,
    message: string,
    metadata?: Record<string, any>,
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
   */
  async sendSRNotification(
    to_user_id: string,
    title: string,
    message: string,
    metadata?: Record<string, any>,
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
   */
  async sendGRNNotification(
    to_user_id: string,
    title: string,
    message: string,
    metadata?: Record<string, any>,
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
   */
  async sendCNNotification(
    to_user_id: string,
    title: string,
    message: string,
    metadata?: Record<string, any>,
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
   * Internal method to send notification
   */
  private async send<T>(payload: any): Promise<T | null> {
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
 */
export function createNotificationService(config?: NotificationServiceConfig): NotificationService {
  return new NotificationService(config);
}

/**
 * Default notification service instance using environment variables
 */
export const notificationService = new NotificationService();
