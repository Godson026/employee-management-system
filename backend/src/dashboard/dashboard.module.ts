import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from '../employees/entities/employee.entity';
import { LeaveRequest } from '../leaves/entities/leave-request.entity';
import { AttendanceRecord } from '../attendance/entities/attendance-record.entity';
import { LeavesModule } from '../leaves/leaves.module'; // Import LeavesModule
import { Branch } from 'src/branches/entities/branch.entity';
import { Department } from 'src/departments/entities/department.entity';


@Module({
  imports: [
    TypeOrmModule.forFeature([Employee, LeaveRequest, AttendanceRecord, Department, Branch]), // Make sure all entities are here
    LeavesModule, // This is the critical fix
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}