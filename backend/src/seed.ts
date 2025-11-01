import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { RolesService } from './roles/roles.service'; // Import RolesService
import { RoleName } from './roles/entities/role.entity'; // Import RoleName enum
import { EmployeesService } from './employees/employees.service';
import { DepartmentsService } from './departments/departments.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const rolesService = app.get(RolesService);
  const employeesService = app.get(EmployeesService);
  const departmentsService = app.get(DepartmentsService);
  
  console.log('Seeding the database with roles...');
  
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
  
  console.log('Roles seeded successfully!');
  
  // Create a default department for admin employee
  console.log('Creating default department...');
  let adminDepartment = await departmentsService.findByName('Administration');
  if (!adminDepartment) {
    adminDepartment = await departmentsService.create({
      name: 'Administration',
      code: 'ADMIN',
      description: 'System administration department'
    });
  }
  
  console.log('Seeding admin user...');
  const adminEmail = 'admin@example.com';
  let existingAdmin = await usersService.findOneByEmail(adminEmail);
  
  if (existingAdmin) {
    console.log('Admin user already exists. Deleting to re-seed with correct roles.');
    await usersService.delete(existingAdmin.id);
  }
  
  // Create admin employee first
  console.log('Creating admin employee...');
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
      createUserAccount: false // We'll create the user manually with roles
    });
  }
  
  const adminRole = await rolesService.findByName(RoleName.SYSTEM_ADMIN);
  if (!adminRole) {
    throw new Error('System Admin role not found. Seeding failed.');
  }
  
  await usersService.create({
    email: adminEmail,
    password: 'password123',
    roles: [adminRole],
    employee: adminEmployee
  });
  
  console.log('Admin user created and assigned System Administrator role!');
  
  console.log('Seeding HR Manager user...');

  // 1. Find the HR Manager Role
  const hrManagerRole = await rolesService.findByName(RoleName.HR_MANAGER);
  if (!hrManagerRole) throw new Error('HR Manager role not found!');
  
  // 2. Create a placeholder employee for the HR user
  const hrEmployeeDetails = {
    employee_id_code: 'HR001',
    first_name: 'Harriet',
    last_name: 'Ross',
    email: 'hr@example.com',
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
    createUserAccount: false // We'll create the user manually with roles
  };

  // 3. Use the employee service to create or find this employee
  let hrEmployee = await employeesService.findOneByEmail(hrEmployeeDetails.email);
  if (!hrEmployee) {
    hrEmployee = await employeesService.create(hrEmployeeDetails);
  }

  // 4. Create the HR User
  const hrUserEmail = 'hr@example.com';
  const existingHrUser = await usersService.findOneByEmail(hrUserEmail);
  if (!existingHrUser) {
    await usersService.create({
      email: hrUserEmail,
      password: 'password123',
      roles: [hrManagerRole],
      employee: hrEmployee,
    });
    console.log('HR Manager user created successfully!');
  } else {
    console.log('HR Manager user already exists.');
  }
  
  await app.close();
}

bootstrap();