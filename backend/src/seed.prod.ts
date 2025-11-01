// Production seed script - can be run after build
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { RolesService } from './roles/roles.service';
import { RoleName } from './roles/entities/role.entity';
import { EmployeesService } from './employees/employees.service';
import { DepartmentsService } from './departments/departments.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const rolesService = app.get(RolesService);
  const employeesService = app.get(EmployeesService);
  const departmentsService = app.get(DepartmentsService);
  
  try {
    console.log('🌱 Seeding the database...');
    
    // 1. Create Roles
    console.log('Creating roles...');
    const rolesToCreate = [
      { name: RoleName.SYSTEM_ADMIN, description: 'Full system-wide control.' },
      { name: RoleName.HR_MANAGER, description: 'Global employee management & HR policies.' },
      { name: RoleName.BRANCH_MANAGER, description: 'Operations within their assigned branch.' },
      { name: RoleName.DEPARTMENT_HEAD, description: 'Management within their department.' },
      { name: RoleName.EMPLOYEE, description: 'Self-service access.' },
      { name: RoleName.AUDITOR, description: 'View-only for reports and compliance.' },
    ];

    for (const roleData of rolesToCreate) {
      await rolesService.findOrCreate(roleData.name, roleData.description);
    }
    console.log('✅ Roles created successfully!');
    
    // 2. Create default department
    console.log('Creating default department...');
    let adminDepartment = await departmentsService.findByName('Administration');
    if (!adminDepartment) {
      adminDepartment = await departmentsService.create({
        name: 'Administration',
        code: 'ADMIN',
        description: 'System administration department'
      });
      console.log('✅ Administration department created!');
    } else {
      console.log('✅ Administration department already exists.');
    }
    
    // 3. Create Admin Employee
    console.log('Creating admin employee...');
    const adminEmail = 'admin@example.com';
    let adminEmployee = await employeesService.findOneByEmail(adminEmail);
    if (!adminEmployee) {
      adminEmployee = await employeesService.create({
        employee_id_code: 'ADMIN001',
        first_name: 'System',
        last_name: 'Administrator',
        email: adminEmail,
        date_of_birth: new Date('1990-01-01'),
        gender: 'Other',
        address: 'System Address',
        phone_number: '000-000-0000',
        emergency_contact_name: 'Emergency Contact',
        emergency_contact_phone: '000-000-0000',
        bank_name: 'System Bank',
        bank_account_number: '0000000000',
        ssnit_number: 'ADMIN000000',
        job_title: 'System Administrator',
        employment_type: 'Permanent',
        start_date: new Date(),
        departmentId: adminDepartment.id,
        createUserAccount: false
      });
      console.log('✅ Admin employee created!');
    } else {
      console.log('✅ Admin employee already exists.');
    }
    
    // 4. Create Admin User
    const adminRole = await rolesService.findByName(RoleName.SYSTEM_ADMIN);
    if (!adminRole) {
      throw new Error('System Admin role not found.');
    }
    
    let existingAdmin = await usersService.findOneByEmail(adminEmail);
    if (!existingAdmin) {
      await usersService.create({
        email: adminEmail,
        password: 'password123',
        roles: [adminRole],
        employee: adminEmployee
      });
      console.log('✅ Admin user created!');
      console.log('   Email: admin@example.com');
      console.log('   Password: password123');
    } else {
      console.log('✅ Admin user already exists.');
    }
    
    // 5. Create HR Manager Employee
    console.log('Creating HR Manager employee...');
    const hrEmail = 'hr@example.com';
    let hrEmployee = await employeesService.findOneByEmail(hrEmail);
    if (!hrEmployee) {
      hrEmployee = await employeesService.create({
        employee_id_code: 'HR001',
        first_name: 'Harriet',
        last_name: 'Ross',
        email: hrEmail,
        date_of_birth: new Date('1985-05-15'),
        gender: 'Female',
        address: '123 HR Street, City',
        phone_number: '555-0123',
        emergency_contact_name: 'John Ross',
        emergency_contact_phone: '555-0124',
        bank_name: 'HR Bank',
        bank_account_number: '1234567890',
        ssnit_number: 'HR123456789',
        job_title: 'HR Manager',
        employment_type: 'Permanent',
        start_date: new Date(),
        departmentId: adminDepartment.id,
        createUserAccount: false
      });
      console.log('✅ HR Manager employee created!');
    } else {
      console.log('✅ HR Manager employee already exists.');
    }
    
    // 6. Create HR Manager User
    const hrManagerRole = await rolesService.findByName(RoleName.HR_MANAGER);
    if (!hrManagerRole) {
      throw new Error('HR Manager role not found.');
    }
    
    let existingHrUser = await usersService.findOneByEmail(hrEmail);
    if (!existingHrUser) {
      await usersService.create({
        email: hrEmail,
        password: 'password123',
        roles: [hrManagerRole],
        employee: hrEmployee,
      });
      console.log('✅ HR Manager user created!');
      console.log('   Email: hr@example.com');
      console.log('   Password: password123');
    } else {
      console.log('✅ HR Manager user already exists.');
    }
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n⚠️  IMPORTANT: Change default passwords after first login!\n');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await app.close();
  }
}

bootstrap();

