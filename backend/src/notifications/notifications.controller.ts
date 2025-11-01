import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findAll(@Request() req, @Query('limit') limit?: number) {
    const userId = req.user.id;
    return this.notificationsService.findAll(userId, limit ? parseInt(limit.toString()) : 50);
  }

  @Get('unread')
  async getUnread(@Request() req) {
    const userId = req.user.id;
    return this.notificationsService.findUnread(userId);
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    const userId = req.user.id;
    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.notificationsService.findOne(id, userId);
  }

  @Put(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.notificationsService.markAsRead(id, userId);
  }

  @Put('read-all')
  async markAllAsRead(@Request() req) {
    const userId = req.user.id;
    await this.notificationsService.markAllAsRead(userId);
    return { message: 'All notifications marked as read' };
  }

  @Put(':id/unread')
  async markAsUnread(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.notificationsService.markAsUnread(id, userId);
  }

  @Delete('clear-all')
  async deleteAll(@Request() req) {
    const userId = req.user.id;
    await this.notificationsService.deleteAll(userId);
    return { message: 'All notifications deleted' };
  }
}

