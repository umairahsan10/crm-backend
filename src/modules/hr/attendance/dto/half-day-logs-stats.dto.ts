import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export enum StatsPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}

export class HalfDayLogsStatsDto {
  @IsOptional()
  @Type(() => Number)
  employee_id?: number;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsEnum(StatsPeriod)
  period?: StatsPeriod = StatsPeriod.MONTHLY;

  @IsOptional()
  @Type(() => Boolean)
  include_breakdown?: boolean = true;
}

export class HalfDayLogsStatsResponseDto {
  total_half_day_logs: number;
  pending_half_day_logs: number;
  completed_half_day_logs: number;
  total_minutes_late: number;
  average_minutes_late: number;
  most_common_reason: string;
  paid_half_day_count: number;
  unpaid_half_day_count: number;
  period_stats: PeriodStatsDto[];
  employee_breakdown?: EmployeeHalfDayStatsDto[];
  reason_breakdown?: ReasonStatsDto[];
}

export class PeriodStatsDto {
  period: string;
  total_half_day_logs: number;
  completed_half_day_logs: number;
  pending_half_day_logs: number;
  total_minutes: number;
}

export class EmployeeHalfDayStatsDto {
  employee_id: number;
  employee_name: string;
  total_half_day_logs: number;
  total_minutes: number;
  completed_half_day_logs: number;
  pending_half_day_logs: number;
  average_minutes_late: number;
}

export class ReasonStatsDto {
  reason: string;
  count: number;
  total_minutes: number;
  completion_rate: number;
}
