import { IsArray, IsUUID } from 'class-validator';

export class UpdateUserRolesDto {
  @IsArray()
  @IsUUID('all', { each: true })
  roleIds: string[];
}
