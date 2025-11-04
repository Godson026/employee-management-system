import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsUUID, ValidateIf } from 'class-validator';
import { CreateDepartmentDto } from './create-department.dto';

export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {
  @IsOptional()
  @ValidateIf((o, value) => value !== null && value !== undefined && value !== '')
  @IsUUID()
  department_head_id?: string | null;
}
