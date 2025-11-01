import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApprovalStatus } from '../entities/leave-request.entity';

export class UpdateLeaveStatusDto {
  @IsNotEmpty()
  @IsEnum([ApprovalStatus.APPROVED, ApprovalStatus.REJECTED]) // Only allow these two actions
  status: ApprovalStatus.APPROVED | ApprovalStatus.REJECTED;
}
