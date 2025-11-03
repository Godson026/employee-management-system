import { Controller, Post, Get, UseGuards, Request, Body, BadRequestException, Query, Patch, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleName } from '../roles/entities/role.entity';
import { AttendanceService } from './attendance.service';
import { AttendanceScheduledTasksService } from './scheduled-tasks.service';
import { EmployeesService } from '../employees/employees.service'; // We need this to get the Employee object
import { FindAttendanceQueryDto } from './dto/find-attendance-query.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';

@Controller('attendance')
@UseGuards(JwtAuthGuard) // Protect all attendance endpoints
export class AttendanceController {
  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly scheduledTasksService: AttendanceScheduledTasksService,
    private readonly employeesService: EmployeesService // Inject EmployeesService
  ) {}

  @Post('clock-in')
  async clockIn(@Request() req, @Body() body: { kiosk_token: string }) {
    if (!body || !body.kiosk_token) {
      throw new BadRequestException('kiosk_token is required in request body');
    }
    const employee = await this.employeesService.findEmployeeFromUserId(req.user.id);
    return this.attendanceService.clockIn(employee, body.kiosk_token);
  }

  @Post('clock-out')
  async clockOut(@Request() req, @Body() body: { kiosk_token: string }) {
    if (!body || !body.kiosk_token) {
      throw new BadRequestException('kiosk_token is required in request body');
    }
    const employee = await this.employeesService.findEmployeeFromUserId(req.user.id);
    return this.attendanceService.clockOut(employee, body.kiosk_token);
  }

  @Get('my-history')
  async findMyHistory(@Request() req) {
    const employee = await this.employeesService.findEmployeeFromUserId(req.user.id);
    return this.attendanceService.findHistoryForEmployee(employee.id);
  }

  @Get('team-history')
  @Roles(RoleName.BRANCH_MANAGER, RoleName.DEPARTMENT_HEAD, RoleName.HR_MANAGER, RoleName.SYSTEM_ADMIN)
  findTeamHistory(@Request() req, @Query() query: FindAttendanceQueryDto) {
    // We pass the full user object (which has roles and employee info) to the service.
    // The service now contains all the logic.
    // Also pass date filters from query params if provided
    return this.attendanceService.findTeamHistory(req.user, query.startDate, query.endDate);
  }

  @Get()
  @Roles(RoleName.SYSTEM_ADMIN, RoleName.HR_MANAGER)
  findAll(@Query() query: FindAttendanceQueryDto) {
    return this.attendanceService.findAll(query);
  }

  @Get('summary-stats')
  @Roles(RoleName.SYSTEM_ADMIN, RoleName.HR_MANAGER)
  getSummaryStats(@Query() query: FindAttendanceQueryDto) {
    return this.attendanceService.getSummaryStats(query);
  }

  @Patch(':id')
  @Roles(RoleName.SYSTEM_ADMIN, RoleName.HR_MANAGER)
  update(@Param('id') id: string, @Body() updateDto: UpdateAttendanceDto) {
    return this.attendanceService.update(id, updateDto);
  }

  @Get('overview-by-department')
  @Roles(RoleName.SYSTEM_ADMIN, RoleName.HR_MANAGER)
  async getOverviewByDepartment(@Query() query: FindAttendanceQueryDto) {
    try {
      console.log('Departmental overview query:', query);
      const result = await this.attendanceService.getOverviewByDepartment(query);
      console.log('Departmental overview result:', result);
      return result;
    } catch (error) {
      console.error('Error in getOverviewByDepartment controller:', error);
      throw error;
    }
  }

  @Post('mark-absent')
  @Roles(RoleName.SYSTEM_ADMIN, RoleName.HR_MANAGER)
  async manuallyMarkAbsent(@Body() body: { date?: string }) {
    return this.scheduledTasksService.manuallyMarkAbsentEmployees(body?.date);
  }
}