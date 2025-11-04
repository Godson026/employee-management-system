import { IsNotEmpty, IsString, MaxLength, IsOptional, IsUUID, ValidateIf } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  code: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  @ValidateIf((o, value) => value !== null && value !== undefined && value !== '')
  @IsUUID()
  department_head_id?: string | null;
}
