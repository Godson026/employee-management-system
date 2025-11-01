import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleName } from '../roles/entities/role.entity';

@Controller('announcements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Post()
  @Roles(RoleName.SYSTEM_ADMIN, RoleName.HR_MANAGER)
  create(@Body() createAnnouncementDto: CreateAnnouncementDto, @Request() req) {
    return this.announcementsService.create(createAnnouncementDto, req.user.id);
  }

  @Get()
  @Roles(RoleName.SYSTEM_ADMIN, RoleName.HR_MANAGER, RoleName.BRANCH_MANAGER, RoleName.DEPARTMENT_HEAD, RoleName.EMPLOYEE)
  findAll() {
    return this.announcementsService.findAll();
  }

  @Get('active')
  @Roles(RoleName.SYSTEM_ADMIN, RoleName.HR_MANAGER, RoleName.BRANCH_MANAGER, RoleName.DEPARTMENT_HEAD, RoleName.EMPLOYEE)
  findActive() {
    return this.announcementsService.findActive();
  }

  @Get(':id')
  @Roles(RoleName.SYSTEM_ADMIN, RoleName.HR_MANAGER, RoleName.BRANCH_MANAGER, RoleName.DEPARTMENT_HEAD, RoleName.EMPLOYEE)
  findOne(@Param('id') id: string) {
    return this.announcementsService.findOne(id);
  }

  @Patch(':id')
  @Roles(RoleName.SYSTEM_ADMIN, RoleName.HR_MANAGER)
  update(@Param('id') id: string, @Body() updateAnnouncementDto: UpdateAnnouncementDto) {
    return this.announcementsService.update(id, updateAnnouncementDto);
  }

  @Delete(':id')
  @Roles(RoleName.SYSTEM_ADMIN, RoleName.HR_MANAGER)
  remove(@Param('id') id: string) {
    return this.announcementsService.delete(id);
  }
}

