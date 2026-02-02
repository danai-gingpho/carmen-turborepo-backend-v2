import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { BackendLogger } from '../common/helpers/backend.logger';
import { envConfig } from 'src/libs/config.env';
import WebSocket from 'ws';
import * as http from 'http';
import { io, Socket as SocketIOClient } from 'socket.io-client';

@Injectable()
export class NotificationNativeGateway implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new BackendLogger(NotificationNativeGateway.name);
  private wss: WebSocket.Server;
  private notificationServiceClient: SocketIOClient;
  private readonly clientConnections = new Map<WebSocket, string>(); // WebSocket -> userId
  private readonly userIdToClient = new Map<string, WebSocket>(); // userId -> WebSocket
  private httpServer: http.Server;

  constructor() { }

  onModuleInit() {
    if (process.env.IS_ACTIVE_NOTIFICATION === 'true') {
      this.setupWebSocketServer();
      this.connectToNotificationService();
    }
  }

  onModuleDestroy() {
    this.logger.log('Shutting down WebSocket gateway...');
    if (this.notificationServiceClient) {
      this.notificationServiceClient.disconnect();
    }
    if (this.wss) {
      this.wss.close();
    }
  }

  private setupWebSocketServer() {
    // Get the HTTP server from the main.ts NestJS app
    // For now, create a standalone WebSocket server
    const port = envConfig.GATEWAY_SERVICE_PORT || 4000;

    this.logger.log(`Setting up native WebSocket server on port ${port}/ws`);

    // We'll attach this to the existing HTTP server in main.ts
    // For now, this is a placeholder - actual implementation needs to be done in main.ts
  }

  attachToServer(httpServer: http.Server) {
    this.httpServer = httpServer;

    // Create WebSocket server attached to the existing HTTP server
    this.wss = new WebSocket.Server({
      server: httpServer,
      path: '/ws'
    });

    this.wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
      this.logger.log(`Client connected from ${req.socket.remoteAddress}`);

      ws.on('message', (data: any) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleClientMessage(ws, message);
        } catch (error) {
          this.logger.error('Error parsing client message:', error);
        }
      });

      ws.on('close', () => {
        this.handleClientDisconnect(ws);
      });

      ws.on('error', (error) => {
        this.logger.error('Client WebSocket error:', error);
      });
    });

    this.logger.log('Native WebSocket server attached successfully');
  }

  private handleClientMessage(client: WebSocket, message: any) {
    this.logger.debug('Received from client:', message);

    if (message.type === 'register') {
      const user_id = message.user_id;
      this.clientConnections.set(client, user_id);
      this.userIdToClient.set(user_id, client);
      this.logger.log(`User registered: ${user_id}`);

      // Forward registration to notification service
      if (this.notificationServiceClient?.connected) {
        this.notificationServiceClient.emit('register', { user_id });
      }

      // Send confirmation
      client.send(JSON.stringify({
        type: 'registered',
        user_id: user_id,
      }));
    } else if (message.type === 'markAsRead') {
      // Forward to notification service
      if (this.notificationServiceClient?.connected) {
        this.notificationServiceClient.emit('markAsRead', { notificationId: message.notificationId });
      }
    }
  }

  private handleClientDisconnect(client: WebSocket) {
    const user_id = this.clientConnections.get(client);
    if (user_id) {
      this.logger.log(`Client disconnected: ${user_id}`);
      this.clientConnections.delete(client);
      this.userIdToClient.delete(user_id);

      // Notify notification service
      if (this.notificationServiceClient?.connected) {
        this.notificationServiceClient.emit('disconnect_user', { user_id });
      }
    }
  }

  private connectToNotificationService() {
    const notificationServiceUrl = `http://${envConfig.NOTIFICATION_SERVICE_HOST}:${envConfig.NOTIFICATION_SERVICE_HTTP_PORT}/ws`;

    this.logger.log(`Connecting to notification service at ${notificationServiceUrl}`);

    const socket = io(notificationServiceUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 5000,
    });

    socket.on('connect', () => {
      this.logger.log('Connected to notification service Socket.IO');
    });

    socket.on('notification', (message: any) => {
      this.logger.debug('Received notification from service:', message);

      // Forward notification to specific user or broadcast
      if (message.data?.user_id) {
        // Send to specific user
        const client = this.userIdToClient.get(message.data.user_id);
        if (client && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(message));
        }
      } else {
        // Broadcast to all connected clients
        this.wss?.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
          }
        });
      }
    });

    socket.on('connect_error', (error: any) => {
      this.logger.error('Notification service Socket.IO connection error:', error.message);
    });

    socket.on('disconnect', (reason: string) => {
      this.logger.warn(`Disconnected from notification service: ${reason}`);
    });

    this.notificationServiceClient = socket;
  }
}
