import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Department } from '../../departments/entities/department.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { User } from '../../users/entities/user.entity';

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // --- Personal Information ---
  @Column({ unique: true })
  employee_id_code: string;

  @Column()
  first_name: string;

  @Column({ nullable: true })
  middle_name: string;

  @Column()
  last_name: string;
  
  @Column({ type: 'date' })
  date_of_birth: Date;

  @Column()
  gender: string;
  
  @Column({ type: 'text' })
  address: string;

  @Column()
  phone_number: string;
  
  @Column({ unique: true })
  email: string;

  @Column()
  emergency_contact_name: string;
  
  @Column()
  emergency_contact_phone: string;

  @Column({ nullable: true })
  photo_url: string;

  // --- Identification & Legal ---
  @Column({ nullable: true })
  national_id: string;

  @Column()
  bank_name: string;

  @Column()
  bank_account_number: string;
  
  @Column({ unique: true })
  ssnit_number: string;
  
  // --- Employment Details ---
  @Column()
  job_title: string;

  @Column()
  employment_type: string;

  @Column({ default: 'active' })
  status: string;
  
  @Column({ type: 'date' })
  start_date: Date;
  
  @Column({ type: 'date', nullable: true })
  end_date: Date;

  @Column({ nullable: true })
  grade_level: string;

  @Column({ type: 'int', default: 21 })
  leave_balance: number;
  
  // --- Relationships ---
  @ManyToOne(() => Employee, (employee) => employee.direct_reports, { nullable: true })
  @JoinColumn({ name: 'supervisor_id' })
  supervisor: Employee | null;
  
  @OneToMany(() => Employee, (employee) => employee.supervisor)
  direct_reports: Employee[];
  
  @ManyToOne(() => Department, (department) => department.employees)
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @ManyToOne(() => Branch, (branch) => branch.employees, { nullable: true })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch | null;

  @OneToOne(() => User, (user) => user.employee, { nullable: true })
  user: User;

  // --- Timestamps ---
  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}