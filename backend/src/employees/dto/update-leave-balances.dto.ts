import { IsArray, IsUUID, IsNumber, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class EmployeeBalanceDto {
  @IsUUID()
  employeeId: string;

  @IsNumber()
  @Min(0)
  leave_balance: number;
}

export class UpdateLeaveBalancesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmployeeBalanceDto)
  updates: EmployeeBalanceDto[];
}
