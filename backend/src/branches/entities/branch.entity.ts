import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Employee } from '../../employees/entities/employee.entity';

@Entity('branches')
export class Branch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  code: string;

  @Column()
  region: string;

  @Column({ type: 'text' })
  address: string;

  @OneToMany(() => Employee, (employee) => employee.branch)
  employees: Employee[];

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'branch_manager_id' })
  branch_manager: Employee | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}