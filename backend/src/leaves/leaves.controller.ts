import { Controller, Get, Post, Body, UseGuards, Request, Patch, Param, NotFoundException, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LeavesService } from './leaves.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleName } from '../roles/entities/role.entity';
import { UpdateLeaveStatusDto } from './dto/update-leave-status.dto';
import { UsersService } from '../users/users.service';


@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('leaves')
export class LeavesController {
  constructor(
    private readonly leavesService: LeavesService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  async create(@Body() createDto: CreateLeaveRequestDto, @Request() req) {
    // This finds the employee linked to the logged-in user
    const employee = await this.leavesService.findEmployeeFromUserId(req.user.id);
    return this.leavesService.create(createDto, employee);
  }

  @Patch(':id/action')
  @Roles(RoleName.BRANCH_MANAGER, RoleName.DEPARTMENT_HEAD, RoleName.HR_MANAGER, RoleName.SYSTEM_ADMIN)
  async takeAction(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateLeaveStatusDto,
    @Request() req
  ) {
    // THIS IS THE FIX: Pass the correct employee ID of the manager
    const managerEmployee = await this.leavesService.findEmployeeFromUserId(req.user.id);
    return this.leavesService.takeAction(id, updateStatusDto.status, managerEmployee);
  }

  @Get('my-requests')
  async findMyRequests(@Request() req) {
    // THIS IS THE FIX: Pass the correct employee ID
     const employee = await this.leavesService.findEmployeeFromUserId(req.user.id);
    return this.leavesService.findForEmployee(employee.id);
  }

  @Get('pending-approval')
  @Roles(RoleName.BRANCH_MANAGER, RoleName.DEPARTMENT_HEAD, RoleName.HR_MANAGER, RoleName.SYSTEM_ADMIN)
  async findPending(@Request() req) {
    // THIS IS THE FIX: Use the manager's EMPLOYEE ID from the token
     const managerEmployee = await this.leavesService.findEmployeeFromUserId(req.user.id);
    return this.leavesService.findPendingForManager(managerEmployee.id);
  }

  @Get('team-history')
  @Roles(RoleName.BRANCH_MANAGER, RoleName.DEPARTMENT_HEAD, RoleName.HR_MANAGER, RoleName.SYSTEM_ADMIN)
  async findTeamHistory(@Request() req) {
    const managerEmployee = await this.leavesService.findEmployeeFromUserId(req.user.id);
    return this.leavesService.findTeamHistory(managerEmployee);
  }

  @Get('debug-pending')
  @Roles(RoleName.BRANCH_MANAGER, RoleName.DEPARTMENT_HEAD, RoleName.HR_MANAGER, RoleName.SYSTEM_ADMIN)
  async debugPending(@Request() req) {
    const managerEmployee = await this.leavesService.findEmployeeFromUserId(req.user.id);
    return this.leavesService.debugPendingForManager(managerEmployee.id);
  }

  @Get('stats')
  @Roles(
    RoleName.BRANCH_MANAGER,
    RoleName.DEPARTMENT_HEAD,
    RoleName.HR_MANAGER,
    RoleName.SYSTEM_ADMIN,
  )
  async getStats(@Request() req) {
    const user = await this.usersService.findUserForAuth({ id: req.user.id });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.leavesService.getStats(user);
  }

  @Get('on-leave')
  @Roles(RoleName.BRANCH_MANAGER, RoleName.DEPARTMENT_HEAD, RoleName.HR_MANAGER, RoleName.SYSTEM_ADMIN)
  async findEmployeesOnLeave(@Request() req, @Query('date') date?: string) {
    const managerEmployee = await this.leavesService.findEmployeeFromUserId(req.user.id);
    // Default to today if no date provided
    const targetDate = date || new Date().toISOString().split('T')[0];
    return this.leavesService.findEmployeesOnLeave(managerEmployee, targetDate);
  }
}