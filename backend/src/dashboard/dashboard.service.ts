import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Employee } from '../employees/entities/employee.entity';
import { LeaveRequest, LeaveStatus } from '../leaves/entities/leave-request.entity';
import { AttendanceRecord, AttendanceStatus } from '../attendance/entities/attendance-record.entity';
import { LeavesService } from '../leaves/leaves.service'; // IMPORT THE SERVICE
import { MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Department } from '../departments/entities/department.entity';
import { Branch } from '../branches/entities/branch.entity';

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(Employee) private employeeRepo: Repository<Employee>,
        @InjectRepository(LeaveRequest) private leaveRequestRepo: Repository<LeaveRequest>,
        @InjectRepository(AttendanceRecord) private attendanceRecordRepo: Repository<AttendanceRecord>,
        @InjectRepository(Department) private departmentRepo: Repository<Department>,
        @InjectRepository(Branch) private branchRepo: Repository<Branch>,
        private leavesService: LeavesService, // INJECT THE SERVICE
    ) {}

  async getStatsForBranch(managerEmployeeId: string) {
    // Step 1: Find the manager and their branch
    const manager = await this.employeeRepo.findOne({
      where: { id: managerEmployeeId },
      relations: ['branch']
    });

    if (!manager || !manager.branch) {
      throw new BadRequestException("The logged-in manager is not assigned to a branch.");
    }
    const branchId = manager.branch.id;

    // Step 2: All subsequent queries remain the same, using the found branchId
    const today = new Date().toISOString().split('T')[0];
    
    // THIS IS THE FIX: We now call our unified, correct logic
    const pendingLeaveRequests = await this.leavesService.countPendingForManager(managerEmployeeId);

    // Other queries
    const [totalEmployees, onLeave] = await Promise.all([
        this.employeeRepo.count({ where: { branch: { id: branchId } } }),
        this.leaveRequestRepo.count({ where: { employee: { branch: { id: branchId } }, status: LeaveStatus.APPROVED, start_date: LessThanOrEqual(today), end_date: MoreThanOrEqual(today) }})
    ]);

    const presentToday = 0; // Placeholder
    const absentToday = totalEmployees - presentToday; // Placeholder

    return { totalEmployees, presentToday, absentToday, onLeave, pendingLeaveRequests };
  }
  
  async getStatsForDepartmentHead(manager: User) {
    if (!manager.employee?.department) {
      throw new BadRequestException('You are not assigned to a department.');
    }
    const departmentId = manager.employee.department.id;

    const today = new Date().toISOString().split('T')[0];
    const todayForQuery = new Date();

    const [
      totalStaff,
      activeBranches,
      presentToday,
      onLeaveToday,
      pendingLeaves
    ] = await Promise.all([
      // Total Staff in Department
      this.employeeRepo.count({ where: { department: { id: departmentId } } }),
      
      // Active Branches (distinct branches of present employees)
      this.attendanceRecordRepo.createQueryBuilder('attendance')
        .select('COUNT(DISTINCT employee.branch_id)', 'count')
        .innerJoin('attendance.employee', 'employee')
        .where('employee.department_id = :departmentId', { departmentId })
        .andWhere('attendance.date = :today', { today: todayForQuery })
        .andWhere("attendance.status IN ('Present', 'Late')")
        .getRawOne(),

      // Present Today in Department
      this.attendanceRecordRepo.count({ where: { employee: { department: { id: departmentId } }, date: today } }),

      // On Leave Today in Department
      this.leaveRequestRepo.count({ where: { employee: { department: { id: departmentId } }, status: LeaveStatus.APPROVED, start_date: LessThanOrEqual(today), end_date: MoreThanOrEqual(today) }}),

      // Pending Leave Requests for this Department Head to approve
      this.leavesService.countPendingForManager(manager.employee.id),
    ]);

    const attendanceRate = totalStaff > 0 ? (presentToday / totalStaff) * 100 : 0;

    return {
      totalStaff,
      activeBranches: parseInt(activeBranches.count, 10) || 0,
      attendanceRateToday: attendanceRate.toFixed(0),
      onLeaveToday,
      pendingLeaveRequests: pendingLeaves
    };
  }

  async getStatsForBranchManager(manager: User) {
    if (!manager.employee?.branch) {
      throw new BadRequestException('You are not assigned to a branch to manage.');
    }
    const branchId = manager.employee.branch.id;

    const today = new Date().toISOString().split('T')[0];
    const todayForQuery = new Date();

    const [
      totalEmployees,
      presentToday,
      onLeaveToday,
      pendingLeaves,
      activeDepartmentsResult
    ] = await Promise.all([
      this.employeeRepo.count({ where: { branch: { id: branchId } } }),
      this.attendanceRecordRepo.count({ where: { employee: { branch: { id: branchId } }, date: today, status: In([AttendanceStatus.PRESENT, AttendanceStatus.LATE]) } }),
      this.leaveRequestRepo.count({ where: { employee: { branch: { id: branchId } }, status: LeaveStatus.APPROVED, start_date: LessThanOrEqual(today), end_date: MoreThanOrEqual(today) }}),
      this.leavesService.countPendingForManager(manager.employee.id),
      // Query to count distinct departments within the branch for "Active Departments"
      this.employeeRepo.createQueryBuilder('employee')
        .select('COUNT(DISTINCT employee.department_id)', 'count')
        .where('employee.branch_id = :branchId', { branchId })
        .getRawOne(),
    ]);
    
    const absentToday = totalEmployees - presentToday; // Simplified calculation
    const attendanceRate = totalEmployees > 0 ? (presentToday / totalEmployees) * 100 : 0;
    
    return {
      totalEmployees,
      attendanceRateToday: attendanceRate.toFixed(0),
      onLeaveToday,
      absentToday,
      activeDepartments: parseInt(activeDepartmentsResult.count, 10) || 0,
      pendingLeaveRequests: pendingLeaves,
    };
  }

  // Admin dashboard stats
  async getStats() {
    const [totalEmployees, totalDepartments, totalBranches, activeEmployees] = await Promise.all([
      this.employeeRepo.count(),
      this.departmentRepo.count(), // Properly count departments
      this.branchRepo.count(), // Properly count branches
      this.employeeRepo.count({ where: { status: 'active' } }),
    ]);

    return {
      totalEmployees,
      totalDepartments,
      totalBranches,
      activeEmployees,
    };
  }

  // Get gender statistics
  async getGenderStats() {
    const employees = await this.employeeRepo.find({
      select: ['gender'],
      where: { status: 'active' },
    });

    const genderCounts = employees.reduce((acc, employee) => {
      const gender = employee.gender || 'Unknown';
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = employees.length;
    
    // Normalize gender values to standardize the data
    const normalizedCounts: Record<string, number> = {
      Male: genderCounts['Male'] || genderCounts['male'] || genderCounts['M'] || 0,
      Female: genderCounts['Female'] || genderCounts['female'] || genderCounts['F'] || 0,
      Other: genderCounts['Other'] || genderCounts['other'] || 
             (genderCounts['Unknown'] || 0) + 
             (Object.keys(genderCounts).filter(g => 
               !['Male', 'male', 'M', 'Female', 'female', 'F', 'Other', 'other', 'Unknown'].includes(g)
             ).reduce((sum, g) => sum + (genderCounts[g] || 0), 0)),
    };

    return {
      male: normalizedCounts.Male,
      female: normalizedCounts.Female,
      other: normalizedCounts.Other,
      total,
      percentages: {
        male: total > 0 ? ((normalizedCounts.Male / total) * 100).toFixed(1) : '0',
        female: total > 0 ? ((normalizedCounts.Female / total) * 100).toFixed(1) : '0',
        other: total > 0 ? ((normalizedCounts.Other / total) * 100).toFixed(1) : '0',
      },
    };
  }
}