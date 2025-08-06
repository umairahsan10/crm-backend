import { IsNumber, IsOptional, IsInt, Min, IsString, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateMonthlyAttendanceDto {
  @IsNumber()
  @Type(() => Number)
  employee_id: number;

  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'Month must be in YYYY-MM format (e.g., 2025-01)' })
  month: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  total_present?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  total_absent?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  total_leave_days?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  total_late_days?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  total_half_days?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  total_remote_days?: number;
} 