import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { Branch } from './entities/branch.entity';
import { Employee } from '../employees/entities/employee.entity';

@Injectable()
export class BranchesService {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  async create(createBranchDto: CreateBranchDto): Promise<Branch> {
    const branch = this.branchRepository.create(createBranchDto);
    return await this.branchRepository.save(branch);
  }

  async findAll(): Promise<Branch[]> {
    return this.branchRepository.find({ relations: ['branch_manager'] });
  }

  async findOne(id: string): Promise<Branch> {
    const branch = await this.branchRepository.findOne({
      where: { id },
      relations: ['branch_manager', 'employees'], // Eager load the manager and employees
    });
    if (!branch) {
      throw new NotFoundException(`Branch with ID #${id} not found`);
    }
    return branch;
  }

  async update(id: string, updateBranchDto: UpdateBranchDto): Promise<Branch> {
    const { branch_manager_id, ...rest } = updateBranchDto;
    const branch = await this.branchRepository.preload({ id, ...rest });
    if (!branch) throw new NotFoundException('Branch not found');

    if (branch_manager_id) {
        const manager = await this.employeeRepository.findOneBy({ id: branch_manager_id });
        if (!manager) throw new NotFoundException('Selected Employee for Manager not found');
        branch.branch_manager = manager;
    } else if (updateBranchDto.branch_manager_id === null) {
        branch.branch_manager = null; // Allow un-assigning
    }
    return this.branchRepository.save(branch);
  }

  async remove(id: string): Promise<void> {
    const branch = await this.findOne(id);
    await this.branchRepository.remove(branch);
  }
}
