import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { NotificationService, CreateSystemNotificationData, CreateUserNotificationData, CreateBusinessUnitNotificationData } from './notification.service';
import { NotificationGateway } from './notification.gateway';

@Controller()
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  @MessagePattern({ cmd: 'notification.create', service: 'notification' })
  async create(data: any) {
    try {
      console.log('Received notification data:', data);

      if (data.category === 'system') {
        const systemData: CreateSystemNotificationData = {
          title: data.title,
          message: data.message,
          type: data.type,
          metadata: data.metadata,
          userIds: data.userIds,
          scheduled_at: data.scheduled_at ? new Date(data.scheduled_at) : undefined,
        };

        const notifications = await this.notificationService.createSystemNotification(systemData);

        if (!systemData.scheduled_at) {
          this.notificationGateway.broadcastSystemNotification(notifications);
        }

        return { status: 201, data: { notifications, count: notifications.length } };
      } else if (data.category === 'user-to-user') {
        const userData: CreateUserNotificationData = {
          to_user_id: data.to_user_id,
          from_user_id: data.from_user_id,
          title: data.title,
          message: data.message,
          type: data.type,
          scheduled_at: data.scheduled_at ? new Date(data.scheduled_at) : undefined,
        };

        const notification = await this.notificationService.createUserNotification(userData);

        if (!userData.scheduled_at) {
          const user = await this.notificationService.getUserById(userData.to_user_id);
          if (user?.is_online) {
            this.notificationGateway.sendNotificationToUser(userData.to_user_id, notification);
          }
        }

        return { status: 201, data: notification };
      } else if (data.category === 'business-unit') {
        const buData: CreateBusinessUnitNotificationData = {
          bu_code: data.bu_code,
          from_user_id: data.from_user_id,
          title: data.title,
          message: data.message,
          type: data.type || 'BU_INFO',
          metadata: data.metadata,
          scheduled_at: data.scheduled_at ? new Date(data.scheduled_at) : undefined,
        };

        const notifications = await this.notificationService.createBusinessUnitNotification(buData);

        if (!buData.scheduled_at && notifications.length > 0) {
          for (const notification of notifications) {
            if (notification.to_user_id) {
              const user = await this.notificationService.getUserById(notification.to_user_id);
              if (user?.is_online) {
                this.notificationGateway.sendNotificationToUser(notification.to_user_id, notification);
              }
            }
          }
        }

        return {
          status: 201,
          data: {
            notifications,
            count: notifications.length,
            bu_code: buData.bu_code,
          },
        };
      } else {
        return {
          status: 400,
          error: 'Invalid category. Must be "system", "user-to-user", or "business-unit"',
        };
      }
    } catch (error) {
      console.error('Error creating notification:', error);
      return {
        status: 500,
        error: 'Failed to create notification',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  }

  @MessagePattern({ cmd: 'notification.getByUserId', service: 'notification' })
  async getByUserId(data: { user_id: string }) {
    try {
      const notifications = await this.notificationService.getUnreadNotifications(data.user_id);
      return { status: 200, data: { notifications } };
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return { status: 500, error: 'Failed to get notifications' };
    }
  }

  @MessagePattern({ cmd: 'notification.getAllByUserId', service: 'notification' })
  async getAllByUserId(data: { user_id: string }) {
    try {
      const notifications = await this.notificationService.getAllNotifications(data.user_id);
      return { status: 200, data: { notifications } };
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return { status: 500, error: 'Failed to get notifications' };
    }
  }

  @MessagePattern({ cmd: 'notification.markAsRead', service: 'notification' })
  async markAsRead(data: { id: string }) {
    try {
      const notification = await this.notificationService.markNotificationAsRead(data.id);
      return { status: 200, data: { notification } };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { status: 500, error: 'Failed to mark notification as read' };
    }
  }

  @MessagePattern({ cmd: 'notification.markAllAsRead', service: 'notification' })
  async markAllAsRead(data: { user_id: string }) {
    try {
      const result = await this.notificationService.markAllNotificationsAsRead(data.user_id);
      return {
        status: 200,
        data: {
          message: `Marked ${result.count} notifications as read`,
          count: result.count,
        },
      };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return { status: 500, error: 'Failed to mark all notifications as read' };
    }
  }
}
