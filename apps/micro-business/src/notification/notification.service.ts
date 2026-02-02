import { Injectable } from '@nestjs/common';
import { PrismaClient_SYSTEM_CUSTOM } from '@repo/prisma-shared-schema-platform';

export interface CreateSystemNotificationData {
  title: string;
  message: string;
  type: string;
  metadata?: any;
  scheduled_at?: Date;
  userIds?: string[];
}

export interface CreateUserNotificationData {
  from_user_id: string;
  to_user_id: string;
  title: string;
  message: string;
  type: string;
  metadata?: any;
  scheduled_at?: Date;
}

export interface CreateBusinessUnitNotificationData {
  bu_code: string;
  from_user_id?: string;
  title: string;
  message: string;
  type: string;
  metadata?: any;
  scheduled_at?: Date;
}

@Injectable()
export class NotificationService {
  private prisma: any;

  constructor() {
    this.initPrisma();
  }

  private async initPrisma() {
    this.prisma = await PrismaClient_SYSTEM_CUSTOM(process.env.SYSTEM_DATABASE_URL!);
  }

  private async getPrisma() {
    if (!this.prisma) {
      this.prisma = await PrismaClient_SYSTEM_CUSTOM(process.env.SYSTEM_DATABASE_URL!);
    }
    return this.prisma;
  }

  async createSystemNotification(data: CreateSystemNotificationData) {
    const prisma = await this.getPrisma();
    console.log('Creating system notification with data:', data);

    let users;
    if (data.userIds && data.userIds.length > 0) {
      users = await prisma.tb_user.findMany({
        where: {
          id: { in: data.userIds },
        },
      });
      console.log(`Sending to ${users.length} specific users`);
    } else {
      users = await prisma.tb_user.findMany();
      console.log(`Sending to all ${users.length} users`);
    }

    const notifications = [];

    for (const user of users) {
      const notification = await prisma.tb_notification.create({
        data: {
          to_user_id: user.id,
          from_user_id: null,
          title: data.title,
          message: data.message,
          type: data.type,
          category: 'system',
          scheduled_at: data.scheduled_at,
          metadata: data.metadata,
        },
      });
      notifications.push(notification);
    }

    return notifications;
  }

  async createUserNotification(data: CreateUserNotificationData) {
    const prisma = await this.getPrisma();
    console.log('Creating user-to-user notification with data:', data);

    return await prisma.tb_notification.create({
      data: {
        to_user_id: data.to_user_id,
        from_user_id: data.from_user_id,
        title: data.title,
        message: data.message,
        metadata: data.metadata,
        type: data.type,
        category: 'user-to-user',
        scheduled_at: data.scheduled_at,
      },
    });
  }

  async getUsersByBusinessUnitCode(bu_code: string) {
    const prisma = await this.getPrisma();
    console.log('Getting users by business unit code:', bu_code);

    const businessUnit = await prisma.tb_business_unit.findFirst({
      where: {
        code: bu_code,
      },
    });

    if (!businessUnit) {
      console.log('Business unit not found:', bu_code);
      return [];
    }

    const userBusinessUnits = await prisma.tb_user_tb_business_unit.findMany({
      where: {
        business_unit_id: businessUnit.id,
      },
      include: {
        tb_user_tb_user_tb_business_unit_user_idTotb_user: true,
      },
    });

    const users = userBusinessUnits
      .filter((ub: any) => ub.tb_user_tb_user_tb_business_unit_user_idTotb_user !== null)
      .map((ub: any) => ub.tb_user_tb_user_tb_business_unit_user_idTotb_user!);

    console.log(`Found ${users.length} users in business unit ${bu_code}`);
    return users;
  }

  async createBusinessUnitNotification(data: CreateBusinessUnitNotificationData) {
    const prisma = await this.getPrisma();
    console.log('Creating business unit notification with data:', data);

    const users = await this.getUsersByBusinessUnitCode(data.bu_code);
    const notifications = [];

    for (const user of users) {
      const notification = await prisma.tb_notification.create({
        data: {
          to_user_id: user.id,
          from_user_id: data.from_user_id || null,
          title: data.title,
          message: data.message,
          type: data.type,
          category: 'business-unit',
          metadata: {
            ...data.metadata,
            bu_code: data.bu_code,
          },
          scheduled_at: data.scheduled_at,
        },
      });
      notifications.push(notification);
    }

    console.log(`Created ${notifications.length} notifications for business unit ${data.bu_code}`);
    return notifications;
  }

  async getUnreadNotifications(user_id: string) {
    const prisma = await this.getPrisma();
    return await prisma.tb_notification.findMany({
      where: {
        to_user_id: user_id,
        is_read: false,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async markNotificationAsRead(notificationId: string) {
    const prisma = await this.getPrisma();
    return await prisma.tb_notification.update({
      where: { id: notificationId },
      data: { is_read: true },
    });
  }

  async markAllNotificationsAsRead(user_id: string) {
    const prisma = await this.getPrisma();
    return await prisma.tb_notification.updateMany({
      where: {
        to_user_id: user_id,
        is_read: false,
      },
      data: { is_read: true },
    });
  }

  async getScheduledNotifications() {
    const prisma = await this.getPrisma();
    const now = new Date();
    return await prisma.tb_notification.findMany({
      where: {
        scheduled_at: {
          lte: now,
        },
        is_sent: false,
      },
      include: {
        tb_user_tb_notification_to_user_idTotb_user: true,
      },
    });
  }

  async markNotificationAsSent(notificationId: string) {
    const prisma = await this.getPrisma();
    return await prisma.tb_notification.update({
      where: { id: notificationId },
      data: { is_sent: true },
    });
  }

  async getUsersWithUnreadNotifications() {
    const prisma = await this.getPrisma();
    return await prisma.tb_user.findMany({
      where: {
        tb_notification_tb_notification_to_user_idTotb_user: {
          some: {
            is_read: false,
          },
        },
      },
      include: {
        tb_notification_tb_notification_to_user_idTotb_user: {
          where: {
            is_read: false,
          },
        },
      },
    });
  }

  async getAllUsers() {
    const prisma = await this.getPrisma();
    return await prisma.tb_user.findMany();
  }

  async getUserById(userId: string) {
    const prisma = await this.getPrisma();
    return await prisma.tb_user.findFirst({
      where: { id: userId },
    });
  }

  async getAllNotifications(userId: string) {
    const prisma = await this.getPrisma();
    return await prisma.tb_notification.findMany({
      where: { to_user_id: userId },
    });
  }

  async updateUserOnlineStatus(user_id: string, isOnline: boolean) {
    const prisma = await this.getPrisma();
    return await prisma.tb_user.update({
      where: { id: user_id },
      data: { is_online: isOnline },
    }).catch(() => {});
  }
}
