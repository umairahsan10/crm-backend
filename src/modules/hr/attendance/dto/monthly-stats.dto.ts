import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GetMonthlyAttendanceStatsDto {
  @IsOptional()
  @IsString()
  month?: string; // YYYY-MM or YYYY-MM-DD first day

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  year?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class MonthlySummaryDto {
  month: string; // "2025-11"
  total_employees: number;
  total_present_days: number;
  average_attendance_rate: number; // 0-100
  most_present_day?: { date: string; present_count: number };
  least_present_day?: { date: string; present_count: number };
}

export class MonthlySummaryResponseDto {
  data: MonthlySummaryDto[];
  meta?: { page: number; limit: number; total: number };
}
