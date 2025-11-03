import { Injectable, NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { AttendanceRecord, AttendanceStatus } from './entities/attendance-record.entity';
import { Employee } from '../employees/entities/employee.entity';
import { KioskService } from '../kiosk/kiosk.service';
import { User } from '../users/entities/user.entity';
import { RoleName } from '../roles/entities/role.entity';
import { FindAttendanceQueryDto } from './dto/find-attendance-query.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';

@Injectable()
export class AttendanceService {
    constructor(
        @InjectRepository(AttendanceRecord) private attendanceRepo: Repository<AttendanceRecord>,
        @InjectRepository(Employee) private employeeRepo: Repository<Employee>,
        private readonly kioskService: KioskService,
    ) {}

    private getTodayDateString(): string {
        return new Date().toISOString().split('T')[0];
    }

    /**
     * Determines attendance status based on clock-in time
     * Rules:
     * - Before 8:00 AM: PRESENT
     * - After 8:00 AM: LATE
     * - No clock-in by end of day: ABSENT
     */
    private determineAttendanceStatus(clockInTime: Date): AttendanceStatus {
        const hour = clockInTime.getHours();
        const minute = clockInTime.getMinutes();
        
        // Convert to total minutes for easier comparison
        const totalMinutes = hour * 60 + minute;
        const eightAM = 8 * 60; // 8:00 AM in minutes
        
        if (totalMinutes <= eightAM) {
            return AttendanceStatus.PRESENT;
        } else {
            return AttendanceStatus.LATE;
        }
    }

    async clockIn(employee: Employee, kioskToken: string): Promise<AttendanceRecord> {
        const isTokenValid = this.kioskService.validateKioskToken(kioskToken);
        if (!isTokenValid) {
            throw new UnauthorizedException('Invalid or expired QR code.');
        }
        
        const today = this.getTodayDateString();
        let record = await this.attendanceRepo.findOne({
            where: { employee: { id: employee.id }, date: today }
        });
        
        if (record && record.clock_in_time) {
            throw new ConflictException('You have already clocked in for today.');
        }

        if (!record) {
            record = this.attendanceRepo.create({ employee, date: today });
        }
        
        const clockInTime = new Date();
        record.clock_in_time = clockInTime;
        
        // Automatically determine status based on clock-in time
        record.status = this.determineAttendanceStatus(clockInTime);
        
        return this.attendanceRepo.save(record);
    }
    
    async clockOut(employee: Employee, kioskToken: string): Promise<AttendanceRecord> {
        const isTokenValid = this.kioskService.validateKioskToken(kioskToken);
        if (!isTokenValid) {
            throw new UnauthorizedException('Invalid or expired QR code.');
        }
        
        const today = this.getTodayDateString();
        const record = await this.attendanceRepo.findOne({
            where: { employee: { id: employee.id }, date: today }
        });
        
        if (!record || !record.clock_in_time) {
            throw new NotFoundException('You have not clocked in yet today.');
        }
        
        if (record.clock_out_time) {
            throw new ConflictException('You have already clocked out for today.');
        }

        record.clock_out_time = new Date();
        return this.attendanceRepo.save(record);
    }
    
    findHistoryForEmployee(employeeId: string): Promise<AttendanceRecord[]> {
        return this.attendanceRepo.find({
            where: { employee: { id: employeeId } },
            order: { date: 'DESC' }, // Show most recent first
        });
    }

    // --- THIS IS THE NEW, UNIFIED METHOD ---
    async findTeamHistory(manager: User, startDate?: string, endDate?: string): Promise<AttendanceRecord[]> {
        // Ensure employee relation is loaded with department and branch
        if (!manager.employee) {
            return [];
        }

        // Ensure employee has department and branch loaded
        // If employee exists but department/branch are null, they might not be assigned
        const managerRoles = manager.roles.map(r => r.name);
        
        // Build base query
        let queryBuilder = this.attendanceRepo
            .createQueryBuilder('attendance')
            .leftJoinAndSelect('attendance.employee', 'employee')
            .leftJoinAndSelect('employee.department', 'department')
            .leftJoinAndSelect('employee.branch', 'branch');
        
        // System Admins and HR Managers can see everyone
        if (managerRoles.includes(RoleName.SYSTEM_ADMIN) || managerRoles.includes(RoleName.HR_MANAGER)) {
            // No filtering needed for admin/HR
        } 
        // Department Heads see their entire department
        else if (managerRoles.includes(RoleName.DEPARTMENT_HEAD)) {
            if (!manager.employee.department?.id) {
                return [];
            }
            queryBuilder = queryBuilder.where('employee.department_id = :departmentId', { 
                departmentId: manager.employee.department.id 
            });
        }
        // Branch Managers see their entire branch
        else if (managerRoles.includes(RoleName.BRANCH_MANAGER)) {
            if (!manager.employee.branch?.id) {
                return [];
            }
            queryBuilder = queryBuilder.where('employee.branch_id = :branchId', { 
                branchId: manager.employee.branch.id 
            });
        }
        // Default for a supervisor who is not a designated head/manager
        else {
            if (!manager.employee?.id) return [];
            
            queryBuilder = queryBuilder
                .leftJoinAndSelect('employee.supervisor', 'supervisor')
                .where('supervisor.id = :supervisorId', { supervisorId: manager.employee.id });
        }
        
        // Apply date filters if provided
        if (startDate && endDate) {
            if (queryBuilder.expressionMap.wheres.length > 0) {
                queryBuilder.andWhere('attendance.date BETWEEN :startDate AND :endDate', { startDate, endDate });
            } else {
                queryBuilder.where('attendance.date BETWEEN :startDate AND :endDate', { startDate, endDate });
            }
        } else if (startDate) {
            if (queryBuilder.expressionMap.wheres.length > 0) {
                queryBuilder.andWhere('attendance.date >= :startDate', { startDate });
            } else {
                queryBuilder.where('attendance.date >= :startDate', { startDate });
            }
        } else if (endDate) {
            if (queryBuilder.expressionMap.wheres.length > 0) {
                queryBuilder.andWhere('attendance.date <= :endDate', { endDate });
            } else {
                queryBuilder.where('attendance.date <= :endDate', { endDate });
            }
        }
        
        // Order by date and clock-in time
        queryBuilder
            .orderBy('attendance.date', 'DESC')
            .addOrderBy('attendance.clock_in_time', 'DESC');
        
        return queryBuilder.getMany();
    }

    // --- NEW POWERFUL FILTERING METHOD FOR HR/ADMIN ---
    async findAll(query: FindAttendanceQueryDto): Promise<AttendanceRecord[]> {
        const { startDate, endDate, branchId, departmentId } = query;

        // Build the where clause dynamically
        const whereClause: any = {};
        if (startDate && endDate) {
            whereClause.date = Between(startDate, endDate);
        }
        if (branchId) {
            whereClause.employee = { ...whereClause.employee, branch: { id: branchId } };
        }
        if (departmentId) {
            whereClause.employee = { ...whereClause.employee, department: { id: departmentId } };
        }

        return this.attendanceRepo.find({
            where: whereClause,
            relations: ['employee', 'employee.department', 'employee.branch'],
            order: { date: 'DESC', clock_in_time: 'ASC' }
        });
    }

    // --- NEW SUMMARY STATS METHOD FOR KPI CARDS ---
    async getSummaryStats(query: FindAttendanceQueryDto): Promise<any> {
        // We reuse the same query DTO and whereClause logic from the `findAll` method
        const { startDate, endDate, branchId, departmentId } = query;
        const whereClause: any = {};
        if (startDate && endDate) { whereClause.date = Between(startDate, endDate); }
        if (branchId) { whereClause.employee = { ...whereClause.employee, branch: { id: branchId } } };
        if (departmentId) { whereClause.employee = { ...whereClause.employee, department: { id: departmentId } } };
        
        // We can run these counts in parallel for efficiency
        const [totalRecords, presentRecords, lateRecords] = await Promise.all([
            this.attendanceRepo.count({ where: whereClause }),
            this.attendanceRepo.count({ where: { ...whereClause, status: In([AttendanceStatus.PRESENT, AttendanceStatus.LATE]) } }),
            this.attendanceRepo.count({ where: { ...whereClause, status: AttendanceStatus.LATE } })
        ]);
        
        // To get total employees for the filter, we'd need to query the employees table
        const totalEmployees = await this.employeeRepo.count({ where: { 
            branch: branchId ? { id: branchId } : undefined,
            department: departmentId ? { id: departmentId } : undefined
        }});
        
        const absent = totalEmployees - presentRecords; // This is a simplified calculation

        return { totalEmployees, present: presentRecords, absent, late: lateRecords };
    }

    // --- NEW UPDATE METHOD FOR EDITING ATTENDANCE RECORDS ---
    async update(id: string, updateDto: UpdateAttendanceDto): Promise<AttendanceRecord> {
        const record = await this.attendanceRepo.findOne({
            where: { id },
            relations: ['employee']
        });

        if (!record) {
            throw new NotFoundException(`Attendance record with ID ${id} not found`);
        }

        // Update only the fields that are provided
        if (updateDto.clock_in_time !== undefined) {
            record.clock_in_time = updateDto.clock_in_time;
        }
        if (updateDto.clock_out_time !== undefined) {
            record.clock_out_time = updateDto.clock_out_time;
        }
        if (updateDto.status !== undefined) {
            record.status = updateDto.status;
        }

        return this.attendanceRepo.save(record);
    }

    // --- NEW DEPARTMENTAL OVERVIEW METHOD ---
    async getOverviewByDepartment(query: FindAttendanceQueryDto): Promise<any> {
        const { startDate, endDate, branchId } = query;

        try {
            console.log('Starting getOverviewByDepartment with query:', query);
            
            // First, get all employees grouped by department
            const employeeQuery = this.employeeRepo.createQueryBuilder('employee')
                .leftJoin('employee.department', 'department')
                .leftJoin('employee.branch', 'branch')
                .select('department.name', 'departmentName')
                .addSelect('COUNT(employee.id)', 'totalEmployees')
                .where(branchId ? 'employee.branchId = :branchId' : '1=1', { branchId })
                .groupBy('department.name');

            console.log('Executing employee query...');
            const departments = await employeeQuery.getRawMany();
            console.log('Employee query result:', departments);

            // If no date range provided, return basic department info
            if (!startDate || !endDate) {
                console.log('No date range provided, returning basic department info');
                return departments.map(dept => ({
                    departmentName: dept.departmentName,
                    totalEmployees: parseInt(dept.totalEmployees, 10),
                    present: 0,
                    late: 0,
                    onLeave: 0,
                    absent: parseInt(dept.totalEmployees, 10),
                    attendanceRate: '0.0%'
                }));
            }

            console.log('Getting attendance data for date range:', startDate, 'to', endDate);
            
            // Get attendance data for the date range
            const attendanceQuery = this.attendanceRepo.createQueryBuilder('attendance')
                .leftJoin('attendance.employee', 'employee')
                .leftJoin('employee.department', 'department')
                .leftJoin('employee.branch', 'branch')
                .select('department.name', 'departmentName')
                .addSelect('attendance.status', 'status')
                .addSelect('COUNT(*)', 'count')
                .where('attendance.date BETWEEN :startDate AND :endDate', { startDate, endDate })
                .andWhere(branchId ? 'employee.branchId = :branchId' : '1=1', { branchId })
                .groupBy('department.name, attendance.status');

            console.log('Executing attendance query...');
            const attendanceData = await attendanceQuery.getRawMany();
            console.log('Attendance query result:', attendanceData);

            // Process the results
            const result = departments.map(dept => {
                const deptAttendance = attendanceData.filter(att => att.departmentName === dept.departmentName);
                
                const present = deptAttendance
                    .filter(att => att.status === 'Present')
                    .reduce((sum, att) => sum + parseInt(att.count, 10), 0);
                
                const late = deptAttendance
                    .filter(att => att.status === 'Late')
                    .reduce((sum, att) => sum + parseInt(att.count, 10), 0);
                
                const onLeave = deptAttendance
                    .filter(att => att.status === 'On Leave')
                    .reduce((sum, att) => sum + parseInt(att.count, 10), 0);

                const totalEmployees = parseInt(dept.totalEmployees, 10);
                const totalPresent = present + late;
                const absent = totalEmployees - totalPresent;
                const attendanceRate = totalEmployees > 0 ? (totalPresent / totalEmployees * 100).toFixed(1) + '%' : '0.0%';

                return {
                    departmentName: dept.departmentName,
                    totalEmployees,
                    present: totalPresent,
                    late,
                    onLeave,
                    absent,
                    attendanceRate
                };
            });

            console.log('Final result:', result);
            return result;
        } catch (error) {
            console.error('Error in getOverviewByDepartment:', error);
            console.error('Error stack:', error.stack);
            throw error;
        }
    }
}