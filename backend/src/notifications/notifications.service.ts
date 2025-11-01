import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async create(createDto: CreateNotificationDto): Promise<Notification> {
    const user = await this.userRepo.findOne({ where: { id: createDto.user_id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${createDto.user_id} not found`);
    }

    const notification = this.notificationRepo.create({
      user,
      type: createDto.type,
      title: createDto.title,
      message: createDto.message,
      link: createDto.link || null,
      metadata: createDto.metadata || null,
    });

    return this.notificationRepo.save(notification);
  }

  async findAll(userId: string, limit: number = 50): Promise<Notification[]> {
    return this.notificationRepo.find({
      where: { user: { id: userId } },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepo.count({
      where: { user: { id: userId }, is_read: false },
    });
  }

  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepo.findOne({
      where: { id: notificationId, user: { id: userId } },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.is_read = true;
    return this.notificationRepo.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepo.update(
      { user: { id: userId }, is_read: false },
      { is_read: true },
    );
  }

  async markAsUnread(notificationId: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepo.findOne({
      where: { id: notificationId, user: { id: userId } },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.is_read = false;
    return this.notificationRepo.save(notification);
  }

  async deleteAll(userId: string): Promise<void> {
    await this.notificationRepo.delete({ user: { id: userId } });
  }

  async findOne(notificationId: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepo.findOne({
      where: { id: notificationId, user: { id: userId } },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  async findUnread(userId: string): Promise<Notification[]> {
    return this.notificationRepo.find({
      where: { user: { id: userId }, is_read: false },
      order: { created_at: 'DESC' },
      take: 20,
    });
  }

  /**
   * Helper method to create a leave-related notification
   */
  async createLeaveNotification(
    userId: string,
    type: NotificationType.LEAVE_REQUEST | NotificationType.LEAVE_SUBMITTED | NotificationType.LEAVE_APPROVED | NotificationType.LEAVE_REJECTED,
    employeeName: string,
    leaveRequestId: string,
    days?: number,
  ): Promise<Notification> {
    const titles = {
      [NotificationType.LEAVE_REQUEST]: 'New Leave Request',
      [NotificationType.LEAVE_SUBMITTED]: 'Leave Request Submitted',
      [NotificationType.LEAVE_APPROVED]: 'Leave Request Approved',
      [NotificationType.LEAVE_REJECTED]: 'Leave Request Rejected',
    };

    const messages = {
      [NotificationType.LEAVE_REQUEST]: `${employeeName} has submitted a leave request${days ? ` for ${days} day${days > 1 ? 's' : ''}` : ''}.`,
      [NotificationType.LEAVE_SUBMITTED]: `Your leave request${days ? ` for ${days} day${days > 1 ? 's' : ''}` : ''} has been submitted successfully and is pending approval.`,
      [NotificationType.LEAVE_APPROVED]: `Your leave request${days ? ` for ${days} day${days > 1 ? 's' : ''}` : ''} has been approved.`,
      [NotificationType.LEAVE_REJECTED]: `Your leave request${days ? ` for ${days} day${days > 1 ? 's' : ''}` : ''} has been rejected.`,
    };

    // Different links for different notification types
    const links = {
      [NotificationType.LEAVE_REQUEST]: `/leave/approvals?id=${leaveRequestId}`,
      [NotificationType.LEAVE_SUBMITTED]: `/personal/leave`,
      [NotificationType.LEAVE_APPROVED]: `/personal/leave`,
      [NotificationType.LEAVE_REJECTED]: `/personal/leave`,
    };

    return this.create({
      user_id: userId,
      type,
      title: titles[type],
      message: messages[type],
      link: links[type],
      metadata: {
        leave_request_id: leaveRequestId,
        employee_name: employeeName,
        days,
      },
    });
  }
}

