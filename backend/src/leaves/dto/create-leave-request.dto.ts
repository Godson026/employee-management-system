import { IsString, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';

export class CreateLeaveRequestDto {
  @IsString()
  @IsNotEmpty()
  leave_type: string;

  @IsDateString()
  start_date: string;
  
  @IsDateString()
  end_date: string;
  
  @IsString()
  @IsOptional()
  reason?: string;
}
