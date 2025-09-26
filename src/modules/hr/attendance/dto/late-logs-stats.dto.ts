import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export enum StatsPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}

export class LateLogsStatsDto {
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

export class LateLogsStatsResponseDto {
  total_late_logs: number;
  pending_late_logs: number;
  completed_late_logs: number;
  total_minutes_late: number;
  average_minutes_late: number;
  most_common_reason: string;
  paid_late_count: number;
  unpaid_late_count: number;
  period_stats: PeriodStatsDto[];
  employee_breakdown?: EmployeeLateStatsDto[];
  reason_breakdown?: ReasonStatsDto[];
}

export class PeriodStatsDto {
  period: string;
  total_late_logs: number;
  completed_late_logs: number;
  pending_late_logs: number;
  total_minutes: number;
}

export class EmployeeLateStatsDto {
  employee_id: number;
  employee_name: string;
  total_late_logs: number;
  total_minutes: number;
  completed_late_logs: number;
  pending_late_logs: number;
  average_minutes_late: number;
}

export class ReasonStatsDto {
  reason: string;
  count: number;
  total_minutes: number;
  completion_rate: number;
}
