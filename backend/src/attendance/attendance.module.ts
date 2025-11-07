import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { AttendanceScheduledTasksService } from './scheduled-tasks.service';
import { AttendanceRecord } from './entities/attendance-record.entity';
import { Employee } from '../employees/entities/employee.entity';
import { EmployeesModule } from '../employees/employees.module';
import { KioskModule } from '../kiosk/kiosk.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AttendanceRecord, Employee]),
    EmployeesModule,
    KioskModule,
    WebSocketModule,
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService, AttendanceScheduledTasksService],
})
export class AttendanceModule {}
