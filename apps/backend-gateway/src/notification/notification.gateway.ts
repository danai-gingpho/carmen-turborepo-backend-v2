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
import { BackendLogger } from '../common/helpers/backend.logger';
import { envConfig } from 'src/libs/config.env';
import WebSocket from 'ws';



@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new BackendLogger(NotificationGateway.name);
  private notificationServiceClient: WebSocket;
  private readonly clientConnections = new Map<string, Socket>();
  private readonly userIdToSocketId = new Map<string, string>();

  constructor() {
    if (process.env.IS_ACTIVE_NOTIFICATION === 'true') {
      this.connectToNotificationService();
    }
  }

  private connectToNotificationService() {
    const notificationServiceUrl = `ws://${envConfig.NOTIFICATION_SERVICE_HOST}:${envConfig.NOTIFICATION_SERVICE_PORT}`;

    this.logger.log(`Connecting to notification service at ${notificationServiceUrl}/ws`);

    // Connect to micro-notification WebSocket using native WebSocket protocol
    const ws = new WebSocket(`${notificationServiceUrl}/ws`);

    ws.on('open', () => {
      this.logger.log('Connected to notification service WebSocket');
    });

    ws.on('message', (data: any) => {
      try {
        const message = JSON.parse(data.toString());
        this.logger.debug('Received from notification service:', message);

        // Broadcast to all connected clients or specific user
        if (message.type === 'notification' && message.data?.user_id) {
          const socketId = this.userIdToSocketId.get(message.data.user_id);
          if (socketId) {
            const clientSocket = this.clientConnections.get(socketId);
            clientSocket?.emit('notification', message.data);
          }
        } else {
          // Broadcast to all
          this.server.emit('notification', message);
        }
      } catch (error) {
        this.logger.error('Error parsing message from notification service', error);
      }
    });

    ws.on('error', (error: any) => {
      this.logger.error('Notification service WebSocket error:', error);
    });

    ws.on('close', () => {
      this.logger.warn('Disconnected from notification service, attempting to reconnect...');
      setTimeout(() => this.connectToNotificationService(), 5000);
    });

    this.notificationServiceClient = ws;
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.clientConnections.set(client.id, client);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Find userId and cleanup
    for (const [user_id, socket_id] of this.userIdToSocketId.entries()) {
      if (socket_id === client.id) {
        this.userIdToSocketId.delete(user_id);

        // Notify notification service about user disconnect
        if (this.notificationServiceClient && this.notificationServiceClient.readyState === 1) {
          this.notificationServiceClient.send(JSON.stringify({
            type: 'disconnect',
            user_id: user_id,
          }));
        }
        break;
      }
    }

    this.clientConnections.delete(client.id);
  }

  @SubscribeMessage('register')
  handleRegister(
    @MessageBody() data: { user_id: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`Registering user: ${data.user_id} with socket: ${client.id}`);

    this.userIdToSocketId.set(data.user_id, client.id);

    // Forward registration to notification service
    if (this.notificationServiceClient && this.notificationServiceClient.readyState === 1) {
      this.notificationServiceClient.send(JSON.stringify({
        type: 'register',
        user_id: data.user_id,
      }));
    }

    return { success: true, message: 'Registered successfully' };
  }

  @SubscribeMessage('markAsRead')
  handleMarkAsRead(
    @MessageBody() data: { notificationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`Marking notification as read: ${data.notificationId}`);

    // Forward to notification service
    if (this.notificationServiceClient && this.notificationServiceClient.readyState === 1) {
      this.notificationServiceClient.send(JSON.stringify({
        type: 'markAsRead',
        notificationId: data.notificationId,
      }));
    }

    return { success: true };
  }

  // Method to send notification to specific user (can be called from controllers)
  sendToUser(user_id: string, notification: any) {
    const socketId = this.userIdToSocketId.get(user_id);
    if (socketId) {
      const client = this.clientConnections.get(socketId);
      client?.emit('notification', notification);
    }
  }

  // Method to broadcast to all users
  broadcast(notification: any) {
    this.server.emit('notification', notification);
  }
}
