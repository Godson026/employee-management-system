import { Controller, Get, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleName } from '../roles/entities/role.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService
  ) {}

  @Get('stats')
  getStats() {
    return this.dashboardService.getStats();
  }

  @Get('stats-for-branch')
  @Roles(RoleName.BRANCH_MANAGER)
  getStatsForMyBranch(@Request() req) {
    // req.user.employeeId is reliably available from our JWT payload
    const managerEmployeeId = req.user.employeeId;
    
    if (!managerEmployeeId) {
         throw new UnauthorizedException("User is not linked to an employee profile.");
    }
    
    return this.dashboardService.getStatsForBranch(managerEmployeeId);
  }

  @Get('stats-for-department-head')
  @Roles(RoleName.DEPARTMENT_HEAD) // Only Department Heads can access this
  async getStatsForMyDepartment(@Request() req) {
    // We pass the full user object from the guard
    return this.dashboardService.getStatsForDepartmentHead(req.user);
  }

  @Get('stats-for-branch-manager')
  @Roles(RoleName.BRANCH_MANAGER) // Only Branch Managers can access this
  async getStatsForBranchManager(@Request() req) {
    return this.dashboardService.getStatsForBranchManager(req.user);
  }

  @Get('gender-stats')
  @Roles(RoleName.SYSTEM_ADMIN, RoleName.HR_MANAGER)
  getGenderStats() {
    return this.dashboardService.getGenderStats();
  }
}
