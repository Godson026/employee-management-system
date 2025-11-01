import { IsOptional, IsDateString, IsEnum } from 'class-validator';
import { AttendanceStatus } from '../entities/attendance-record.entity';

export class UpdateAttendanceDto {
  @IsOptional() @IsDateString() clock_in_time?: Date;
  @IsOptional() @IsDateString() clock_out_time?: Date;
  @IsOptional() @IsEnum(AttendanceStatus) status?: AttendanceStatus;
}