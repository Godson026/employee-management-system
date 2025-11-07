import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL?.split(',').map(url => url.trim()) || [
      'http://localhost:5173',
      'http://10.246.149.112:5173',
      'http://10.29.93.112:5173',
      'http://127.0.0.1:5173',
    ],
    credentials: true,
  },
  namespace: '/',
})
export class WebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebSocketGateway.name);
  private connectedUsers = new Map<string, string>(); // socketId -> userId

  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findOne(payload.sub);
      
      if (!user) {
        this.logger.warn(`Client ${client.id} connected with invalid user`);
        client.disconnect();
        return;
      }

      this.connectedUsers.set(client.id, user.id);
      this.logger.log(`User ${user.id} connected (socket: ${client.id})`);
      
      // Join user-specific room for targeted updates
      client.join(`user:${user.id}`);
      
      // Join role-based rooms for broadcast updates
      if (user.roles && user.roles.length > 0) {
        user.roles.forEach(role => {
          client.join(`role:${role.name}`);
        });
      }
    } catch (error) {
      this.logger.error(`Connection error for client ${client.id}:`, error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.connectedUsers.get(client.id);
    if (userId) {
      this.logger.log(`User ${userId} disconnected (socket: ${client.id})`);
      this.connectedUsers.delete(client.id);
    }
  }

  // Emit attendance update to all connected clients
  emitAttendanceUpdate(data: any) {
    this.server.emit('attendance:update', data);
  }

  // Emit leave update to specific user or all managers
  emitLeaveUpdate(data: any, targetUserId?: string) {
    if (targetUserId) {
      this.server.to(`user:${targetUserId}`).emit('leave:update', data);
    } else {
      // Broadcast to all managers/admins
      this.server.to('role:SYSTEM_ADMIN').to('role:HR_MANAGER').to('role:BRANCH_MANAGER').to('role:DEPARTMENT_HEAD').emit('leave:update', data);
    }
  }

  // Emit notification to specific user
  emitNotification(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification:new', notification);
  }

  // Emit announcement to all users
  emitAnnouncement(announcement: any) {
    this.server.emit('announcement:new', announcement);
  }

  // Emit dashboard stats update
  emitDashboardStatsUpdate(stats: any, role?: string) {
    if (role) {
      this.server.to(`role:${role}`).emit('dashboard:stats:update', stats);
    } else {
      this.server.emit('dashboard:stats:update', stats);
    }
  }
}

