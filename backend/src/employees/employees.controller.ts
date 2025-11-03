import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UploadedFile, UseInterceptors, UseGuards, Request } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { FindEmployeesQueryDto } from './dto/find-employees-query.dto';
import { UpdateLeaveBalancesDto } from './dto/update-leave-balances.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleName } from '../roles/entities/role.entity';
import { LeavesService } from '../leaves/leaves.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('employees')
export class EmployeesController {
  constructor(
    private readonly employeesService: EmployeesService,
    private readonly leavesService: LeavesService
  ) {}

  @Post()
  create(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.employeesService.create(createEmployeeDto);
  }

  @Get()
  findAll(@Query() query: FindEmployeesQueryDto) {
    return this.employeesService.findAll(query);
  }

  @Get('with-users')
  findAllWithUsers() {
    return this.employeesService.findAllWithUsers();
  }

  @Patch('balances')
  @Roles(RoleName.SYSTEM_ADMIN, RoleName.HR_MANAGER)
  updateLeaveBalances(@Body() updateLeaveBalancesDto: UpdateLeaveBalancesDto) {
    return this.employeesService.updateLeaveBalances(updateLeaveBalancesDto.updates);
  }

  @Get('leave-balance-summary')
  @Roles(RoleName.SYSTEM_ADMIN, RoleName.HR_MANAGER)
  getLeaveBalanceSummary() {
    return this.employeesService.getLeaveBalanceSummary();
  }

  @Get('my-profile')
  async getMyProfile(@Request() req) {
    // Return the employee data that's already loaded in req.user from JwtStrategy
    // This ensures we get the freshest data with all fields including leave_balance
    const employee = await this.employeesService.findOneById(req.user.employee.id);
    console.log('Returning employee profile with leave_balance:', employee.leave_balance);
    return employee;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.employeesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEmployeeDto: UpdateEmployeeDto) {
    return this.employeesService.update(id, updateEmployeeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.employeesService.remove(id);
  }

  @Post(':id/photo')
  @UseInterceptors(FileInterceptor('photo', { 
    storage: memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  }))
  uploadPhoto(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    return this.employeesService.uploadPhoto(id, file);
  }

  @Get(':id/leave-history')
  @Roles(RoleName.SYSTEM_ADMIN, RoleName.HR_MANAGER, RoleName.BRANCH_MANAGER, RoleName.DEPARTMENT_HEAD)
  findLeaveHistory(@Param('id') id: string) {
    // We'll call a method on the LeavesService for this
    return this.leavesService.findAllForEmployee(id);
  }
}
