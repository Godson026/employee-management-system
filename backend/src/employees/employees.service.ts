import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { FindEmployeesQueryDto } from './dto/find-employees-query.dto';
import { Employee } from './entities/employee.entity';
import { Department } from '../departments/entities/department.entity';
import { Branch } from '../branches/entities/branch.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    public readonly employeeRepository: Repository<Employee>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    private readonly usersService: UsersService,
  ) {}

  async create(createEmployeeDto: CreateEmployeeDto): Promise<Employee> {
    const { departmentId, branchId, supervisorId, createUserAccount, password, ...employeeDetails } = createEmployeeDto;

    // --- Fetch Related Entities ---
    const department = await this.departmentRepository.findOne({ where: { id: departmentId }, relations: ['department_head'] });
    if (!department) {
      throw new NotFoundException('Department not found');
    }

    let branch: Branch | null = null;
    if (branchId) {
        branch = await this.branchRepository.findOne({ where: { id: branchId }, relations: ['branch_manager'] });
        if (!branch) {
            throw new NotFoundException('Branch not found');
        }
    }

    let supervisor: Employee | null = null;
    if (supervisorId) { // Manual override takes precedence
        supervisor = await this.employeeRepository.findOneBy({ id: supervisorId });
        if (!supervisor) {
            throw new NotFoundException(`Supervisor with ID ${supervisorId} not found`);
        }
    } else {
        // --- Automatic Supervisor Assignment Logic ---
        if (branch?.branch_manager) {
            supervisor = branch.branch_manager;
        } else if (department?.department_head) {
            supervisor = department.department_head;
        }
    }
    
    const newEmployee = this.employeeRepository.create({
      ...employeeDetails,
      department,
      branch,
      supervisor,
    });
    
    let savedEmployee;
    try {
      savedEmployee = await this.employeeRepository.save(newEmployee);
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        if (error.detail?.includes('ssnit_number')) {
          throw new Error('An employee with this SSNIT number already exists.');
        } else if (error.detail?.includes('email')) {
          throw new Error('An employee with this email already exists.');
        } else {
          throw new Error('An employee with this information already exists.');
        }
      }
      throw error;
    }

    // If the toggle is on, create a user and link it
    if (createUserAccount) {
      if (!password) {
        throw new Error('Password is required to create a user account.');
      }
      await this.usersService.create({
        email: savedEmployee.email,
        password: password, // The User entity will hash this automatically
        employee: savedEmployee,
      });
    }

    return savedEmployee;
  }

  async findAll(query: FindEmployeesQueryDto) {
    const { search, departmentId, branchId, status, page = 1, limit = 10 } = query;

    const queryBuilder = this.employeeRepository.createQueryBuilder('employee');
    
    queryBuilder.leftJoinAndSelect('employee.department', 'department');
    queryBuilder.leftJoinAndSelect('employee.branch', 'branch');
    
    if (search) {
      queryBuilder.andWhere(
        '(employee.first_name ILIKE :search OR employee.last_name ILIKE :search)',
        { search: `%${search}%` },
      );
    }
    
    if (departmentId) {
      queryBuilder.andWhere('employee.department_id = :departmentId', { departmentId });
    }
    
    if (branchId) {
      queryBuilder.andWhere('employee.branch_id = :branchId', { branchId });
    }

    if (status) {
        queryBuilder.andWhere('employee.status = :status', { status });
    }

    const skip = (page - 1) * limit;

    queryBuilder.orderBy('employee.created_at', 'DESC');
    queryBuilder.skip(skip).take(limit);

    const [employees, total] = await queryBuilder.getManyAndCount();
    
    return {
        data: employees,
        count: total,
    };
  }

  async findOne(id: string): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({
      where: { id },
      relations: ['department', 'branch', 'supervisor'],
    });
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }
    return employee;
  }

  async findOneById(id: string): Promise<Employee> {
    // Use findOne with explicit field selection to ensure leave_balance is included
    const employee = await this.employeeRepository.findOne({
      where: { id },
      select: [
        'id',
        'employee_id_code',
        'first_name',
        'middle_name',
        'last_name',
        'email',
        'phone_number',
        'date_of_birth',
        'gender',
        'address',
        'national_id',
        'ssnit_number',
        'job_title',
        'start_date',
        'end_date',
        'employment_type',
        'grade_level',
        'bank_name',
        'bank_account_number',
        'emergency_contact_name',
        'emergency_contact_phone',
        'leave_balance', // Explicitly include this
        'status',
        'photo_url',
        'created_at',
        'updated_at'
      ]
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID #${id} not found.`);
    }
    return employee;
  }

  async findOneByEmail(email: string): Promise<Employee | null> {
    return this.employeeRepository.findOne({
      where: { email },
      relations: ['department', 'branch', 'supervisor'],
    });
  }

  async findEmployeeFromUserId(userId: string): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user', 'department', 'branch', 'supervisor']
    });
    if (!employee) {
      throw new NotFoundException(`Employee not found for user ID: ${userId}`);
    }
    return employee;
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto): Promise<Employee> {
    console.log('Update request for employee:', id);
    console.log('Update data:', updateEmployeeDto);
    
    const { departmentId, branchId, supervisorId, ...employeeDetails } = updateEmployeeDto;
    
    // Use preload to safely find the employee and merge the new data
    const employeeToUpdate = await this.employeeRepository.preload({
        id: id,
        ...employeeDetails,
    });

    if (!employeeToUpdate) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    let department: Department | null = null;
    let branch: Branch | null = null;

    // Handle relationship updates
    if (departmentId) {
      department = await this.departmentRepository.findOne({ where: { id: departmentId }, relations: ['department_head'] });
      if (!department) throw new NotFoundException('Department not found');
      employeeToUpdate.department = department;
    }

    if (branchId) {
      branch = await this.branchRepository.findOne({ where: { id: branchId }, relations: ['branch_manager'] });
      if (!branch) throw new NotFoundException('Branch not found');
      employeeToUpdate.branch = branch;
    } else if (updateEmployeeDto.branchId === null) { // Allow un-assigning a branch
        employeeToUpdate.branch = null;
    }

    // --- Automatic Supervisor Assignment Logic for Updates ---
    if (supervisorId) { // Manual override takes precedence
        const supervisor = await this.employeeRepository.findOneBy({ id: supervisorId });
        if (!supervisor) {
            throw new NotFoundException(`Supervisor with ID ${supervisorId} not found`);
        }
        employeeToUpdate.supervisor = supervisor;
    } else if (departmentId || branchId) {
        // Only auto-assign if department or branch changed
        let supervisor: Employee | null = null;
        
        if (branch?.branch_manager) {
            supervisor = branch.branch_manager;
        } else if (department?.department_head) {
            supervisor = department.department_head;
        }
        
        if (supervisor) {
            employeeToUpdate.supervisor = supervisor;
        }
    }
    
    return this.employeeRepository.save(employeeToUpdate);
  }

  async remove(id: string): Promise<void> {
    const result = await this.employeeRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }
  }

  async uploadPhoto(employeeId: string, file: Express.Multer.File) {
    const employee = await this.employeeRepository.findOneBy({ id: employeeId });
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }
    
    // In production, you'd upload to a cloud service (S3, etc.)
    // For development, we just build the local URL.
    const photoUrl = `http://localhost:3000/${file.path.replace(/\\/g, '/')}`;

    employee.photo_url = photoUrl;
    
    return this.employeeRepository.save(employee);
  }

  async findAllWithUsers() {
    return this.employeeRepository.find({
      relations: ['user', 'user.roles', 'department', 'branch', 'supervisor'],
      order: { created_at: 'DESC' }
    });
  }

  async updateLeaveBalances(updates: { employeeId: string; leave_balance: number }[]): Promise<void> {
    const queryRunner = this.employeeRepository.manager.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      for (const update of updates) {
        const employee = await queryRunner.manager.findOneBy(Employee, { id: update.employeeId });
        if (employee) {
          employee.leave_balance = update.leave_balance;
          await queryRunner.manager.save(employee);
        }
      }
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err; // Re-throw the error so the frontend knows something went wrong
    } finally {
      await queryRunner.release();
    }
  }

  async getLeaveBalanceSummary() {
    const statsQuery = this.employeeRepository
      .createQueryBuilder('employee')
      .select('COUNT(employee.id)', 'totalEmployees')
      .addSelect('AVG(employee.leave_balance)::numeric(10,1)', 'averageBalance')
      .addSelect('SUM(employee.leave_balance)', 'totalDays');

    const stats = await statsQuery.getRawOne();

    const employees = await this.employeeRepository.find({
      order: { first_name: 'ASC' },
    });

    return {
      totalEmployees: parseInt(stats?.totalEmployees, 10) || 0,
      averageBalance: parseFloat(stats?.averageBalance) || 0,
      totalDays: parseInt(stats?.totalDays, 10) || 0,
      employees,
    };
  }
}