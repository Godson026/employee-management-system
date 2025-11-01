import { Controller, Get, UseGuards, Body, Param, Patch, Post, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserRolesDto } from './dto/update-user-roles.dto';
import { CreateUserForEmployeeDto } from './dto/create-user-for-employee.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleName } from '../roles/entities/role.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(RoleName.SYSTEM_ADMIN, RoleName.HR_MANAGER)
  findAll() {
    return this.usersService.findAll();
  }

  @Get('all-employees')
  @Roles(RoleName.SYSTEM_ADMIN, RoleName.HR_MANAGER)
  findAllEmployeesWithUsers() {
    return this.usersService.findAllEmployeesWithUsers();
  }

  @Patch(':id/roles')
  @Roles(RoleName.SYSTEM_ADMIN)
  updateRoles(@Param('id') id: string, @Body() updateUserRolesDto: UpdateUserRolesDto) {
    return this.usersService.updateRoles(id, updateUserRolesDto.roleIds);
  }

  @Post('create-for-employee/:employeeId')
  @Roles(RoleName.SYSTEM_ADMIN, RoleName.HR_MANAGER)
  createUserForEmployee(@Param('employeeId') employeeId: string, @Body() createUserDto: CreateUserForEmployeeDto) {
    return this.usersService.createUserForEmployee(employeeId, createUserDto.password);
  }

  @Get('me')
  getProfile(@Request() req) {
    return this.usersService.findUserForAuth({ id: req.user.id });
  }
}