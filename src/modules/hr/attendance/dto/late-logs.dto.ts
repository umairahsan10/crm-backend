import { IsOptional, IsString, IsNumber, IsBoolean, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class GetLateLogsDto {
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

export class LateLogItemDto {
  id: number;
  employee_id: number;
  employee_first_name?: string;
  employee_last_name?: string;
  date: string; // YYYY-MM-DD
  checkin?: string | null; // ISO datetime
  minutes_late: number;
  requires_reason: boolean;
  reason?: string | null;
  action_taken?: 'pending' | 'approved' | 'rejected';
  reviewer_id?: number | null;
  reviewer_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export class LateLogsResponseDto {
  data: LateLogItemDto[];
  meta?: { page: number; limit: number; total: number };
}

export class GetLateLogsStatsDto {
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

export class LateLogsStatsItemDto {
  total_lates: number;
  pending: number;
  approved: number;
  rejected: number;
  average_minutes_late?: number;
  by_employee?: Array<{ employee_id: number; name: string; total_lates: number }>;
}

export class LateLogActionDto {
  @IsEnum(['approve', 'reject', 'mark_justified'])
  action: 'approve' | 'reject' | 'mark_justified';

  @Type(() => Number)
  @IsNumber()
  reviewer_id: number;

  @IsOptional()
  @IsString()
  reviewer_notes?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  adjusted_minutes_late?: number;

  @IsOptional()
  @IsBoolean()
  justified?: boolean;
}

export class LateLogActionResponseDto {
  message: string;
  data: LateLogItemDto;
}
