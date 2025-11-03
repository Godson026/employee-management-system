import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { Employee } from './entities/employee.entity';
import { Department } from '../departments/entities/department.entity';
import { Branch } from '../branches/entities/branch.entity';
import { DepartmentsModule } from '../departments/departments.module';
import { UsersModule } from '../users/users.module';
import { LeavesModule } from '../leaves/leaves.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Employee, Department, Branch]),
    DepartmentsModule,
    UsersModule,
    LeavesModule,
    CloudinaryModule,
  ],
  controllers: [EmployeesController],
  providers: [EmployeesService],
  exports: [EmployeesService], // Export the service so other modules can use it
})
export class EmployeesModule {}
