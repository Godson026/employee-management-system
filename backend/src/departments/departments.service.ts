import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { Department } from './entities/department.entity';
import { Employee } from '../employees/entities/employee.entity';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  async create(createDepartmentDto: CreateDepartmentDto): Promise<Department> {
    try {
      const { department_head_id, ...rest } = createDepartmentDto;
      
      // Check if department with same name already exists
      const existingDepartment = await this.departmentRepository.findOne({
        where: [
          { name: createDepartmentDto.name },
          { code: createDepartmentDto.code }
        ]
      });

      if (existingDepartment) {
        if (existingDepartment.name === createDepartmentDto.name) {
          throw new Error('A department with this name already exists');
        }
        if (existingDepartment.code === createDepartmentDto.code) {
          throw new Error('A department with this code already exists');
        }
      }

      const newDepartment = this.departmentRepository.create(rest);
      
      if (department_head_id) {
        const head = await this.employeeRepository.findOneBy({ id: department_head_id });
        if (!head) throw new NotFoundException('Selected Employee for Head not found');
        newDepartment.department_head = head;
      }
      
      return this.departmentRepository.save(newDepartment);
    } catch (error) {
      console.error('Error creating department:', error);
      throw error;
    }
  }

  async findAll(): Promise<Department[]> {
    return this.departmentRepository.find({ relations: ['department_head'] });
  }

  async findOne(id: string): Promise<Department> {
    const department = await this.departmentRepository.findOne({
      where: { id },
      relations: ['department_head', 'employees'], // Eager load the relationships
    });
    if (!department) {
      throw new NotFoundException(`Department with ID #${id} not found`);
    }
    return department;
  }

  async update(id: string, updateDepartmentDto: UpdateDepartmentDto): Promise<Department> {
    const { department_head_id, ...rest } = updateDepartmentDto;
    const department = await this.departmentRepository.preload({ id, ...rest });
    if (!department) throw new NotFoundException('Department not found');

    // Handle department_head_id: can be a valid UUID, null, undefined, or empty string
    if (department_head_id && department_head_id.trim() !== '') {
        const head = await this.employeeRepository.findOneBy({ id: department_head_id });
        if (!head) throw new NotFoundException('Selected Employee for Head not found');
        department.department_head = head;
    } else if (department_head_id === null || department_head_id === '') {
        // Allow un-assigning if explicitly set to null or empty string
        department.department_head = null;
    }
    // If department_head_id is undefined, don't change the existing value
    
    return this.departmentRepository.save(department);
  }

  async remove(id: string): Promise<void> {
    const department = await this.findOne(id);
    await this.departmentRepository.remove(department);
  }

  async findByName(name: string): Promise<Department | null> {
    return this.departmentRepository.findOne({ where: { name } });
  }
}
