import { IsEnum, IsOptional, IsString } from 'class-validator';
import { RoleName } from '../entities/role.entity';

export class CreateRoleDto {
  @IsEnum(RoleName)
  name: RoleName;

  @IsOptional()
  @IsString()
  description?: string;
}
