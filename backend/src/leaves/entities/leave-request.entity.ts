import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Employee } from '../../employees/entities/employee.entity';

export enum LeaveStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
}
export enum ApprovalStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
}
export interface ApprovalStep {
    approverId: string;
    approverName: string;
    status: ApprovalStatus;
    actionedAt?: Date;
    comments?: string;
}

@Entity('leave_requests')
export class LeaveRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Employee, { eager: true }) // Eager load the employee who requested
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column()
  leave_type: string;

  @Column({ type: 'date' })
  start_date: string;
  
  @Column({ type: 'date' })
  end_date: string;
  
  @Column({ type: 'text', nullable: true })
  reason: string;
  
  @Column({ type: 'enum', enum: LeaveStatus, default: LeaveStatus.PENDING })
  status: LeaveStatus;

  // This is the new, structured approval chain
  @Column({ type: 'jsonb', default: [] })
  approval_chain: ApprovalStep[];

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  actioned_at: Date;
}