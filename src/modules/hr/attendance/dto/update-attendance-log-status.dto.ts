import { IsString, IsNumber, IsOptional, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateAttendanceLogStatusDto {
  @IsString()
  @IsIn(['present', 'late', 'half_day', 'absent'])
  status: 'present' | 'late' | 'half_day' | 'absent';

  @IsOptional()
  @IsString()
  reason?: string;

  @IsNumber()
  @Type(() => Number)
  reviewer_id: number;

  @IsOptional()
  @IsString()
  checkin?: string;

  @IsOptional()
  @IsString()
  checkout?: string;
}
