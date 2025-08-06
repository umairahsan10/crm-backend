import { IsNumber, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateAttendanceDto {
  @IsNumber()
  @Type(() => Number)
  employee_id: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  present_days?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  absent_days?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  late_days?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  leave_days?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  remote_days?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  quarterly_leaves?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  monthly_lates?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  half_days?: number;
} 