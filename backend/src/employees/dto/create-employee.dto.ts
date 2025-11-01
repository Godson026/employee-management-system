import { IsString, IsNotEmpty, IsEmail, IsDateString, IsOptional, IsUUID, IsBoolean, MinLength } from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty()
  employee_id_code: string;

  @IsString()
  @IsNotEmpty()
  first_name: string;
  
  @IsString()
  @IsOptional()
  middle_name?: string;
  
  @IsString()
  @IsNotEmpty()
  last_name: string;

  @IsDateString()
  date_of_birth: Date;

  @IsString()
  @IsNotEmpty()
  gender: string;

  @IsString()
  @IsNotEmpty()
  address: string;
  
  @IsString()
  @IsNotEmpty()
  phone_number: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  emergency_contact_name: string;
  
  @IsString()
  @IsNotEmpty()
  emergency_contact_phone: string;
  
  @IsString()
  @IsNotEmpty()
  bank_name: string;

  @IsString()
  @IsNotEmpty()
  bank_account_number: string;
  
  @IsString()
  @IsNotEmpty()
  ssnit_number: string;
  
  @IsString()
  @IsNotEmpty()
  job_title: string;

  @IsString()
  @IsNotEmpty()
  employment_type: string;

  @IsDateString()
  start_date: Date;
  
  // ID for the department relationship
  @IsUUID()
  @IsNotEmpty()
  departmentId: string;
  
  // Optional ID for the branch relationship
  @IsUUID()
  @IsOptional()
  branchId?: string;

  // Optional ID for the supervisor relationship
  @IsUUID()
  @IsOptional()
  supervisorId?: string;

  // User account creation fields
  @IsOptional()
  @IsBoolean()
  createUserAccount?: boolean;

  @IsOptional()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password?: string;

  @IsString()
  @IsOptional()
  user_role?: string;
}
