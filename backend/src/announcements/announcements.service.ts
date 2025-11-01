import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Announcement } from './entities/announcement.entity';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectRepository(Announcement)
    private announcementRepository: Repository<Announcement>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private notificationsService: NotificationsService,
  ) {}

  async create(createDto: CreateAnnouncementDto, createdByUserId: string): Promise<Announcement> {
    const createdBy = await this.userRepository.findOneBy({ id: createdByUserId });
    if (!createdBy) {
      throw new NotFoundException(`User with ID ${createdByUserId} not found`);
    }

    const announcement = this.announcementRepository.create({
      ...createDto,
      created_by: createdBy,
      expires_at: createDto.expires_at ? new Date(createDto.expires_at) : null,
      is_active: createDto.is_active !== undefined ? createDto.is_active : true,
      priority: createDto.priority || 'info',
    });

    const savedAnnouncement = await this.announcementRepository.save(announcement);

    // Send notifications to all users (don't await - let it run in background)
    // This ensures the announcement is created quickly even if there are many users
    this.sendAnnouncementToAllUsers(savedAnnouncement).catch((error) => {
      console.error('Error sending announcement notifications:', error);
    });

    return savedAnnouncement;
  }

  private async sendAnnouncementToAllUsers(announcement: Announcement): Promise<void> {
    try {
      // Get all users in the system (only users with IDs)
      const allUsers = await this.userRepository.find({
        select: ['id'],
        where: {}, // Get all users
      });

      // Send notification to each user
      const notificationPromises = allUsers.map((user) =>
        this.notificationsService.create({
          user_id: user.id,
          type: NotificationType.SYSTEM_ANNOUNCEMENT,
          title: announcement.title,
          message: announcement.message,
          link: `/announcements/${announcement.id}`,
          metadata: {
            announcement_id: announcement.id,
            priority: announcement.priority,
            created_by: announcement.created_by.id,
          },
        }).catch((error) => {
          // Log error but don't fail the whole operation
          console.error(`Failed to send notification to user ${user.id}:`, error);
          return null;
        })
      );

      await Promise.all(notificationPromises);
      console.log(`Sent announcement notification to ${allUsers.length} users`);
    } catch (error) {
      console.error('Error sending announcement notifications:', error);
      // Don't throw - we still want to return the announcement even if notifications fail
    }
  }

  async findAll(): Promise<Announcement[]> {
    return this.announcementRepository.find({
      relations: ['created_by', 'created_by.employee'],
      order: { created_at: 'DESC' },
    });
  }

  async findActive(): Promise<Announcement[]> {
    const now = new Date();
    return this.announcementRepository.find({
      where: {
        is_active: true,
      },
      relations: ['created_by', 'created_by.employee'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Announcement> {
    const announcement = await this.announcementRepository.findOne({
      where: { id },
      relations: ['created_by', 'created_by.employee'],
    });

    if (!announcement) {
      throw new NotFoundException(`Announcement with ID ${id} not found`);
    }

    return announcement;
  }

  async update(id: string, updateDto: UpdateAnnouncementDto): Promise<Announcement> {
    const announcement = await this.findOne(id);

    if (updateDto.expires_at) {
      updateDto.expires_at = new Date(updateDto.expires_at).toISOString();
    }

    Object.assign(announcement, {
      ...updateDto,
      expires_at: updateDto.expires_at ? new Date(updateDto.expires_at) : announcement.expires_at,
    });

    return this.announcementRepository.save(announcement);
  }

  async remove(id: string): Promise<void> {
    const announcement = await this.findOne(id);
    await this.announcementRepository.remove(announcement);
  }

  async delete(id: string): Promise<void> {
    const announcement = await this.findOne(id);
    announcement.is_active = false;
    await this.announcementRepository.save(announcement);
  }
}

