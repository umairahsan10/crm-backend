import { IsOptional, IsString, IsNumber, IsBoolean, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class GetHalfDayLogsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  employee_id?: number;

  @IsOptional()
  @IsString()
  start_date?: string; // YYYY-MM-DD

  @IsOptional()
  @IsString()
  end_date?: string; // YYYY-MM-DD

  @IsOptional()
  @IsString()
  action_taken?: string; // 'pending', 'approved', 'rejected'

  @IsOptional()
  @IsBoolean()
  justified?: boolean;

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

export class HalfDayLogItemDto {
  id: number;
  employee_id: number;
  employee_first_name?: string;
  employee_last_name?: string;
  date: string; // YYYY-MM-DD
  checkin?: string | null;
  checkout?: string | null;
  half_day_type?: 'first_half' | 'second_half' | null;
  reason?: string | null;
  action_taken?: 'pending' | 'approved' | 'rejected';
  reviewer_id?: number | null;
  reviewer_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export class HalfDayLogsResponseDto {
  data: HalfDayLogItemDto[];
  meta?: { page: number; limit: number; total: number };
}

export class GetHalfDayLogsStatsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  employee_id?: number;

  @IsOptional()
  @IsString()
  start_date?: string;

  @IsOptional()
  @IsString()
  end_date?: string;

  @IsOptional()
  @IsString()
  period?: string; // 'daily', 'weekly', 'monthly', 'yearly'

  @IsOptional()
  @Type(() => Boolean)
  include_breakdown?: boolean;
}

export class HalfDayLogsStatsDto {
  total_half_days: number;
  pending: number;
  approved: number;
  rejected: number;
  by_employee?: Array<{ employee_id: number; name: string; total_half_days: number }>;
}

export class HalfDayLogActionDto {
  @IsEnum(['approve', 'reject'])
  action: 'approve' | 'reject';

  @Type(() => Number)
  @IsNumber()
  reviewer_id: number;

  @IsOptional()
  @IsString()
  reviewer_notes?: string;

  @IsOptional()
  @IsEnum(['present', 'absent', 'half_day'])
  adjust_status?: 'present' | 'absent' | 'half_day';
}

export class HalfDayLogActionResponseDto {
  message: string;
  data: HalfDayLogItemDto;
}
