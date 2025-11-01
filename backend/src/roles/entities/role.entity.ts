import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum RoleName {
    SYSTEM_ADMIN = 'System Administrator',
    HR_MANAGER = 'HR Manager',
    BRANCH_MANAGER = 'Branch Manager',
    DEPARTMENT_HEAD = 'Department Head',
    EMPLOYEE = 'Employee',
    AUDITOR = 'Auditor',
}

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: RoleName,
    unique: true,
  })
  name: RoleName;

  @Column({ type: 'text', nullable: true })
  description: string;

  // This sets up the other side of the many-to-many relationship with User
  @ManyToMany(() => User, (user) => user.roles)
  users: User[];
}