import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from './entities/user.entity';
import { Role, RoleName } from '../roles/entities/role.entity';
import { Employee } from '../employees/entities/employee.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  async findOneByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findUserForAuth(identifier: { id?: string, email?: string }): Promise<User | null> {
    // Use QueryBuilder to ensure all employee fields including leave_balance are loaded
    const queryBuilder = this.userRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles')
      .leftJoinAndSelect('user.employee', 'employee')
      .leftJoinAndSelect('employee.department', 'department')
      .leftJoinAndSelect('employee.branch', 'branch')
      .leftJoinAndSelect('employee.supervisor', 'supervisor');
    
    if (identifier.id) {
      queryBuilder.where('user.id = :id', { id: identifier.id });
    } else if (identifier.email) {
      queryBuilder.where('user.email = :email', { email: identifier.email });
    }
    
    const user = await queryBuilder.getOne();
    return user || null;
  }

  async findOneByEmailWithRoles(email: string): Promise<User | null> {
    return this.findUserForAuth({ email });
  }

  async create(user: Partial<User>): Promise<User> {
    const newUser = this.userRepository.create(user);
    return this.userRepository.save(newUser);
  }

  async delete(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }


  findAll(): Promise<User[]> {
    return this.userRepository.find({
      relations: ['roles', 'employee'],
    });
  }

  async updateRoles(userId: string, roleIds: string[]): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      // CRITICAL: We need the full employee profile for our checks
      relations: ['roles', 'employee', 'employee.department', 'employee.branch'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const newRoles = await this.roleRepository.findBy({ id: In(roleIds) });
    if (newRoles.length !== roleIds.length) {
      throw new BadRequestException('One or more roles were not found');
    }

    const newRoleNames = newRoles.map(role => role.name);

    // --- BUSINESS RULE VALIDATION ---
    if (newRoleNames.includes(RoleName.DEPARTMENT_HEAD)) {
      if (!user.employee.department) {
        throw new BadRequestException('Cannot assign "Department Head" role. The employee is not assigned to any department.');
      }
    }

    if (newRoleNames.includes(RoleName.BRANCH_MANAGER)) {
      if (!user.employee.branch) {
        throw new BadRequestException('Cannot assign "Branch Manager" role. The employee is not assigned to any branch.');
      }
    }
    
    // This rule assumes the HR department is named 'Human Resources'. A more robust check might use a department code.
    if (newRoleNames.includes(RoleName.HR_MANAGER)) {
      if (user.employee.department?.name !== 'Human Resources') {
        throw new BadRequestException('Cannot assign "HR Manager" role. The employee must belong to the Human Resources department.');
      }
    }

    user.roles = newRoles;
    await this.userRepository.save(user);

    // Invalidate old sessions by incrementing the token version
    await this.incrementTokenVersion(userId);
    
    return user; // You can return the user or a success message
  }

  async incrementTokenVersion(userId: string) {
    return this.userRepository.increment({ id: userId }, 'token_version', 1);
  }

  findAllEmployeesWithUsers(): Promise<Employee[]> {
    return this.employeeRepository.find({
        relations: ['user', 'user.roles'], // Join employee with user, and user with roles
    });
  }

  async createUserForEmployee(employeeId: string, password: string): Promise<User> {
    const employee = await this.employeeRepository.findOne({ where: { id: employeeId }, relations: ['user'] });
    if (!employee) throw new NotFoundException('Employee not found');
    if (employee.user) throw new BadRequestException('This employee already has a user account.');
    
    // Fetch the default 'Employee' role
    const employeeRole = await this.roleRepository.findOne({ where: { name: RoleName.EMPLOYEE } });
    if (!employeeRole) throw new Error('Default "Employee" role not found.');

    return this.create({
      email: employee.email,
      password: password,
      employee: employee,
      roles: [employeeRole],
    });
  }

}
