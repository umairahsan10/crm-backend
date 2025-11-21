import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum StatsPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}

export class LeaveTypeStatsDto {
  @ApiProperty({ example: 'Annual Leave' })
  leave_type: string;

  @ApiProperty({ example: 15 })
  count: number;

  @ApiProperty({ example: 30 })
  total_days: number;

  @ApiProperty({ example: 0.9, description: 'Approval rate (0 to 1)' })
  approval_rate: number;
}

export class LeaveLogsStatsDto {
  @ApiPropertyOptional({ example: 12, description: 'Filter by employee ID' })
  @IsOptional()
  @Type(() => Number)
  employee_id?: number;

  @ApiPropertyOptional({ example: '2025-01-01', description: 'Start date for the range (ISO string)' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ example: '2025-03-31', description: 'End date for the range (ISO string)' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({
    enum: StatsPeriod,
    default: StatsPeriod.MONTHLY,
    description: 'The aggregation period for the statistics',
  })
  @IsOptional()
  @IsEnum(StatsPeriod)
  period?: StatsPeriod = StatsPeriod.MONTHLY;

  @ApiPropertyOptional({
    example: true,
    description: 'Include breakdown by employee and leave type',
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  include_breakdown?: boolean = true;
}

export class PeriodStatsDto {
  @ApiProperty({ example: '2025-01', description: 'Period label (e.g., month, week, or day)' })
  period: string;

  @ApiProperty({ example: 10 })
  total_leaves: number;

  @ApiProperty({ example: 8 })
  approved_leaves: number;

  @ApiProperty({ example: 1 })
  rejected_leaves: number;

  @ApiProperty({ example: 1 })
  pending_leaves: number;

  @ApiProperty({ example: 20, description: 'Total leave days in this period' })
  total_days: number;
}

export class EmployeeLeaveStatsDto {
  @ApiProperty({ example: 101 })
  employee_id: number;

  @ApiProperty({ example: 'John Doe' })
  employee_name: string;

  @ApiProperty({ example: 12 })
  total_leaves: number;

  @ApiProperty({ example: 24 })
  total_days: number;

  @ApiProperty({ example: 10 })
  approved_leaves: number;

  @ApiProperty({ example: 1 })
  rejected_leaves: number;

  @ApiProperty({ example: 1 })
  pending_leaves: number;
}

export class LeaveLogsStatsResponseDto {
  @ApiProperty({ example: 45, description: 'Total number of leave requests in the period' })
  total_leaves: number;

  @ApiProperty({ example: 5, description: 'Total number of pending leaves' })
  pending_leaves: number;

  @ApiProperty({ example: 35, description: 'Total number of approved leaves' })
  approved_leaves: number;

  @ApiProperty({ example: 5, description: 'Total number of rejected leaves' })
  rejected_leaves: number;

  @ApiProperty({ example: 72, description: 'Total number of leave days across all requests' })
  total_leave_days: number;

  @ApiProperty({ example: 2.4, description: 'Average leave duration in days' })
  average_leave_duration: number;

  @ApiProperty({ example: 'Sick Leave', description: 'Most commonly taken leave type' })
  most_common_leave_type: string;

  @ApiProperty({ type: [PeriodStatsDto], description: 'Statistics grouped by period (daily, weekly, etc.)' })
  period_stats: PeriodStatsDto[];

  @ApiPropertyOptional({ type: [EmployeeLeaveStatsDto], description: 'Breakdown by employee (if included)' })
  employee_breakdown?: EmployeeLeaveStatsDto[];

  @ApiPropertyOptional({ type: [LeaveTypeStatsDto], description: 'Breakdown by leave type (if included)' })
  leave_type_breakdown?: LeaveTypeStatsDto[];
}
