import { IsString, IsEmail, IsDateString, IsOptional, IsUUID, ValidateIf } from 'class-validator';

export class UpdateEmployeeDto {
  @IsOptional()
  @IsString()
  employee_id_code?: string;

  @IsOptional()
  @IsString()
  first_name?: string;
  
  @IsOptional()
  @IsString()
  middle_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsDateString()
  date_of_birth?: Date;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  address?: string;
  
  @IsOptional()
  @IsString()
  phone_number?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  emergency_contact_name?: string;
  
  @IsOptional()
  @IsString()
  emergency_contact_phone?: string;

  @IsOptional()
  @IsString()
  bank_name?: string;

  @IsOptional()
  @IsString()
  bank_account_number?: string;

  @IsOptional()
  @IsString()
  ssnit_number?: string;

  @IsOptional()
  @IsString()
  job_title?: string;

  @IsOptional()
  @IsString()
  employment_type?: string;

  @IsOptional()
  @IsDateString()
  start_date?: Date;

  @IsOptional()
  @IsDateString()
  end_date?: Date;

  @IsOptional()
  @IsString()
  grade_level?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  photo_url?: string;

  @IsOptional()
  @IsString()
  national_id?: string;

  // ID for the department relationship
  @IsOptional()
  @IsUUID()
  departmentId?: string;
  
  // Optional ID for the branch relationship
  // Allow null to unassign, undefined to skip, or a valid UUID
  @ValidateIf((o) => o.branchId !== null && o.branchId !== undefined)
  @IsUUID()
  branchId?: string | null;

  // Optional ID for the supervisor relationship
  @IsOptional()
  @IsUUID()
  supervisorId?: string;
}
