import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NotificationService } from './notification.service';

interface WebSocketMessage {
  type: 'register' | 'markAsRead';
  user_id?: string;
  notificationId?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/ws',
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userConnections = new Map<string, Socket>();
  private socketToUser = new Map<string, string>();

  constructor(private readonly notificationService: NotificationService) {}

  /**
   * Handle new WebSocket client connection
   * จัดการการเชื่อมต่อ WebSocket ของไคลเอนต์ใหม่
   * @param client - Connected socket client / ไคลเอนต์ socket ที่เชื่อมต่อ
   */
  async handleConnection(client: Socket) {
  }

  /**
   * Handle WebSocket client disconnection and update user online status
   * จัดการการตัดการเชื่อมต่อ WebSocket และอัปเดตสถานะออนไลน์ของผู้ใช้
   * @param client - Disconnected socket client / ไคลเอนต์ socket ที่ตัดการเชื่อมต่อ
   */
  async handleDisconnect(client: Socket) {
    const user_id = this.socketToUser.get(client.id);
    if (user_id) {
      this.userConnections.delete(user_id);
      this.socketToUser.delete(client.id);
      await this.notificationService.updateUserOnlineStatus(user_id, false);
    }
  }

  /**
   * Handle incoming WebSocket messages (register or markAsRead)
   * จัดการข้อความ WebSocket ที่เข้ามา (ลงทะเบียนหรือทำเครื่องหมายว่าอ่านแล้ว)
   * @param client - Connected socket client / ไคลเอนต์ socket ที่เชื่อมต่อ
   * @param message - Message data (string or object) / ข้อมูลข้อความ (สตริงหรืออ็อบเจกต์)
   */
  @SubscribeMessage('message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: string | WebSocketMessage,
  ) {
    try {
      let data: WebSocketMessage;

      if (typeof message === 'string') {
        try {
          data = JSON.parse(message);
        } catch (parseError) {
          return;
        }
      } else {
        data = message;
      }

      if (!data || typeof data !== 'object' || !data.type) {
        return;
      }

      switch (data.type) {
        case 'register':
          if (data.user_id) {
            await this.handleUserRegister(client, data.user_id);
          }
          break;

        case 'markAsRead':
          if (data.notificationId) {
            await this.handleMarkAsRead(data.notificationId);
          }
          break;

        default:
      }
    } catch {
      // ignore
    }
  }

  /**
   * Handle user registration via WebSocket
   * จัดการการลงทะเบียนผู้ใช้ผ่าน WebSocket
   * @param client - Connected socket client / ไคลเอนต์ socket ที่เชื่อมต่อ
   * @param data - Registration data with user_id / ข้อมูลการลงทะเบียนพร้อม user_id
   */
  @SubscribeMessage('register')
  async handleRegister(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { user_id: string },
  ) {
    if (data.user_id) {
      await this.handleUserRegister(client, data.user_id);
    }
  }

  /**
   * Handle mark-as-read event via WebSocket
   * จัดการเหตุการณ์ทำเครื่องหมายว่าอ่านแล้วผ่าน WebSocket
   * @param client - Connected socket client / ไคลเอนต์ socket ที่เชื่อมต่อ
   * @param data - Data with notificationId / ข้อมูลพร้อม ID การแจ้งเตือน
   */
  @SubscribeMessage('markAsRead')
  async handleMarkAsReadEvent(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { notificationId: string },
  ) {
    if (data.notificationId) {
      await this.handleMarkAsRead(data.notificationId);
    }
  }

  /**
   * Register user connection and send pending unread notifications
   * ลงทะเบียนการเชื่อมต่อผู้ใช้และส่งการแจ้งเตือนที่ยังไม่ได้อ่าน
   * @param client - Socket client / ไคลเอนต์ socket
   * @param user_id - User ID / ID ผู้ใช้
   */
  private async handleUserRegister(client: Socket, user_id: string) {
    this.userConnections.set(user_id, client);
    this.socketToUser.set(client.id, user_id);

    // Without this, NotificationController.create's `if (user.is_online)`
    // guard skips the socket emit, so the client never sees the real-time
    // push even though the notification row is in DB.
    await this.notificationService.updateUserOnlineStatus(user_id, true);

    const unreadNotifications = await this.notificationService.getUnreadNotifications(user_id);

    for (const notification of unreadNotifications) {
      this.sendNotificationToUser(user_id, notification);
    }
  }

  /**
   * Mark a notification as read in the database
   * ทำเครื่องหมายการแจ้งเตือนว่าอ่านแล้วในฐานข้อมูล
   * @param notificationId - Notification ID / ID การแจ้งเตือน
   */
  private async handleMarkAsRead(notificationId: string) {
    await this.notificationService.markNotificationAsRead(notificationId);
  }

  /**
   * Send a notification to a specific user via WebSocket
   * ส่งการแจ้งเตือนไปยังผู้ใช้ที่ระบุผ่าน WebSocket
   * @param user_id - Target user ID / ID ผู้ใช้เป้าหมาย
   * @param notification - Notification data / ข้อมูลการแจ้งเตือน
   */
  sendNotificationToUser(user_id: string, notification: Record<string, unknown>) {
    const client = this.userConnections.get(user_id);

    if (client) {
      const message = {
        type: 'notification',
        data: {
          id: notification.id,
          user_id, // needed by backend-gateway bridge to route to the right browser WS client
          title: notification.title,
          message: notification.message,
          type: notification.type,
          category: notification.category,
          metadata: notification.metadata,
          created_at: notification.created_at,
        },
      };

      client.emit('notification', message);
    }
  }

  /**
   * Broadcast system notifications to all target users via WebSocket
   * กระจายการแจ้งเตือนระบบไปยังผู้ใช้เป้าหมายทั้งหมดผ่าน WebSocket
   * @param notifications - Array of notification data / อาร์เรย์ของข้อมูลการแจ้งเตือน
   */
  broadcastSystemNotification(notifications: Record<string, unknown>[]) {
    for (const notification of notifications) {
      this.sendNotificationToUser(notification.to_user_id as string, notification);
    }
  }

  /**
   * Find user ID associated with a socket connection
   * ค้นหา ID ผู้ใช้ที่เชื่อมโยงกับการเชื่อมต่อ socket
   * @param socketId - Socket connection ID / ID การเชื่อมต่อ socket
   * @returns User ID or null if not found / ID ผู้ใช้หรือ null ถ้าไม่พบ
   */
  findUserIdBySocket(socketId: string): string | null {
    return this.socketToUser.get(socketId) || null;
  }
}
