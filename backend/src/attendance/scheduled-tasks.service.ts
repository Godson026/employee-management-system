import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceRecord, AttendanceStatus } from './entities/attendance-record.entity';
import { Employee } from '../employees/entities/employee.entity';

@Injectable()
export class AttendanceScheduledTasksService {
    private readonly logger = new Logger(AttendanceScheduledTasksService.name);

    constructor(
        @InjectRepository(AttendanceRecord)
        private attendanceRepo: Repository<AttendanceRecord>,
        @InjectRepository(Employee)
        private employeeRepo: Repository<Employee>,
    ) {}

    /**
     * Scheduled task that runs every day at 11:59 PM
     * Marks all employees who didn't clock in as ABSENT
     */
    @Cron('59 23 * * *', {
        name: 'mark-absent-employees',
        timeZone: 'Africa/Accra', // Adjust to your timezone
    })
    async markAbsentEmployees() {
        this.logger.log('Starting scheduled task: Mark absent employees');

        const today = new Date().toISOString().split('T')[0];
        
        try {
            // Get all active employees
            const allEmployees = await this.employeeRepo.find({
                select: ['id', 'first_name', 'last_name'],
            });

            // Get all employees who have attendance records for today
            const employeesWithRecords = await this.attendanceRepo
                .createQueryBuilder('attendance')
                .leftJoin('attendance.employee', 'employee')
                .select('employee.id')
                .where('attendance.date = :today', { today })
                .getRawMany();

            const employeeIdsWithRecords = new Set(
                employeesWithRecords.map(record => record.employee_id)
            );

            // Find employees without attendance records
            const absentEmployees = allEmployees.filter(
                emp => !employeeIdsWithRecords.has(emp.id)
            );

            if (absentEmployees.length === 0) {
                this.logger.log('No absent employees to mark for today');
                return;
            }

            // Create ABSENT records for employees who didn't clock in
            const absentRecords = absentEmployees.map(employee => 
                this.attendanceRepo.create({
                    employee: { id: employee.id } as Employee,
                    date: today,
                    status: AttendanceStatus.ABSENT,
                    clock_in_time: null,
                    clock_out_time: null,
                })
            );

            await this.attendanceRepo.save(absentRecords);

            this.logger.log(
                `Successfully marked ${absentEmployees.length} employees as ABSENT for ${today}`
            );
            this.logger.debug(
                `Absent employees: ${absentEmployees.map(e => `${e.first_name} ${e.last_name}`).join(', ')}`
            );

        } catch (error) {
            this.logger.error(
                `Failed to mark absent employees: ${error.message}`,
                error.stack
            );
        }
    }

    /**
     * Manual trigger for testing purposes
     * Can be called via an admin endpoint if needed
     */
    async manuallyMarkAbsentEmployees(date?: string): Promise<{ 
        markedCount: number; 
        absentEmployees: string[] 
    }> {
        const targetDate = date || new Date().toISOString().split('T')[0];
        
        const allEmployees = await this.employeeRepo.find({
            select: ['id', 'first_name', 'last_name'],
        });

        const employeesWithRecords = await this.attendanceRepo
            .createQueryBuilder('attendance')
            .leftJoin('attendance.employee', 'employee')
            .select('employee.id')
            .where('attendance.date = :targetDate', { targetDate })
            .getRawMany();

        const employeeIdsWithRecords = new Set(
            employeesWithRecords.map(record => record.employee_id)
        );

        const absentEmployees = allEmployees.filter(
            emp => !employeeIdsWithRecords.has(emp.id)
        );

        if (absentEmployees.length === 0) {
            return { markedCount: 0, absentEmployees: [] };
        }

        const absentRecords = absentEmployees.map(employee => 
            this.attendanceRepo.create({
                employee: { id: employee.id } as Employee,
                date: targetDate,
                status: AttendanceStatus.ABSENT,
                clock_in_time: null,
                clock_out_time: null,
            })
        );

        await this.attendanceRepo.save(absentRecords);

        return {
            markedCount: absentEmployees.length,
            absentEmployees: absentEmployees.map(e => `${e.first_name} ${e.last_name}`)
        };
    }
}

