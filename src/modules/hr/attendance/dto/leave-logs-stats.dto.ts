import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export enum StatsPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}

export class LeaveLogsStatsDto {
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

export class LeaveLogsStatsResponseDto {
  total_leaves: number;
  pending_leaves: number;
  approved_leaves: number;
  rejected_leaves: number;
  total_leave_days: number;
  average_leave_duration: number;
  most_common_leave_type: string;
  period_stats: PeriodStatsDto[];
  employee_breakdown?: EmployeeLeaveStatsDto[];
  leave_type_breakdown?: LeaveTypeStatsDto[];
}

export class PeriodStatsDto {
  period: string;
  total_leaves: number;
  approved_leaves: number;
  rejected_leaves: number;
  pending_leaves: number;
  total_days: number;
}

export class EmployeeLeaveStatsDto {
  employee_id: number;
  employee_name: string;
  total_leaves: number;
  total_days: number;
  approved_leaves: number;
  rejected_leaves: number;
  pending_leaves: number;
}

export class LeaveTypeStatsDto {
  leave_type: string;
  count: number;
  total_days: number;
  approval_rate: number;
}
