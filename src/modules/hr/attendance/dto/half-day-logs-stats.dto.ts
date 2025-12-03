import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum StatsPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export class HalfDayLogsStatsDto {
  @ApiPropertyOptional({
    description: 'Filter statistics by a specific employee ID',
    example: 23,
  })
  @IsOptional()
  @Type(() => Number)
  employee_id?: number;

  @ApiPropertyOptional({
    description: 'Start date for the statistics range (inclusive)',
    example: '2025-09-01',
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({
    description: 'End date for the statistics range (inclusive)',
    example: '2025-09-30',
  })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({
    description:
      'Grouping period for statistics (daily, weekly, monthly, yearly)',
    enum: StatsPeriod,
    default: StatsPeriod.MONTHLY,
  })
  @IsOptional()
  @IsEnum(StatsPeriod)
  period?: StatsPeriod = StatsPeriod.MONTHLY;

  @ApiPropertyOptional({
    description: 'Include breakdowns by employee and reason in the response',
    example: true,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  include_breakdown?: boolean = true;
}

export class HalfDayLogsStatsResponseDto {
  @ApiProperty({ description: 'Total number of half-day logs', example: 120 })
  total_half_day_logs: number;

  @ApiProperty({
    description: 'Total number of pending half-day logs',
    example: 15,
  })
  pending_half_day_logs: number;

  @ApiProperty({
    description: 'Total number of completed half-day logs',
    example: 105,
  })
  completed_half_day_logs: number;

  @ApiProperty({
    description: 'Total minutes late across all half-day logs',
    example: 3200,
  })
  total_minutes_late: number;

  @ApiProperty({
    description: 'Average minutes late per half-day log',
    example: 26.7,
  })
  average_minutes_late: number;

  @ApiProperty({
    description: 'Most common reason for half-day logs',
    example: 'Medical appointment',
  })
  most_common_reason: string;

  @ApiProperty({
    description: 'Total number of paid half-day logs',
    example: 75,
  })
  paid_half_day_count: number;

  @ApiProperty({
    description: 'Total number of unpaid half-day logs',
    example: 45,
  })
  unpaid_half_day_count: number;

  @ApiProperty({
    description: 'Aggregated statistics by period (daily, weekly, etc.)',
    type: () => [PeriodStatsDto],
  })
  period_stats: PeriodStatsDto[];

  @ApiPropertyOptional({
    description: 'Breakdown of statistics per employee',
    type: () => [EmployeeHalfDayStatsDto],
  })
  employee_breakdown?: EmployeeHalfDayStatsDto[];

  @ApiPropertyOptional({
    description: 'Breakdown of statistics per reason',
    type: () => [ReasonStatsDto],
  })
  reason_breakdown?: ReasonStatsDto[];
}

export class PeriodStatsDto {
  @ApiProperty({
    description: 'Period label (e.g., 2025-10, 2025-W40)',
    example: '2025-10',
  })
  period: string;

  @ApiProperty({
    description: 'Total number of half-day logs in this period',
    example: 40,
  })
  total_half_day_logs: number;

  @ApiProperty({
    description: 'Completed half-day logs in this period',
    example: 35,
  })
  completed_half_day_logs: number;

  @ApiProperty({
    description: 'Pending half-day logs in this period',
    example: 5,
  })
  pending_half_day_logs: number;

  @ApiProperty({
    description: 'Total minutes late in this period',
    example: 870,
  })
  total_minutes: number;
}

export class EmployeeHalfDayStatsDto {
  @ApiProperty({ description: 'Employee ID', example: 12 })
  employee_id: number;

  @ApiProperty({
    description: 'Full name of the employee',
    example: 'Ayesha Khan',
  })
  employee_name: string;

  @ApiProperty({
    description: 'Total half-day logs for this employee',
    example: 8,
  })
  total_half_day_logs: number;

  @ApiProperty({
    description: 'Total minutes late for this employee',
    example: 200,
  })
  total_minutes: number;

  @ApiProperty({
    description: 'Completed half-day logs for this employee',
    example: 7,
  })
  completed_half_day_logs: number;

  @ApiProperty({
    description: 'Pending half-day logs for this employee',
    example: 1,
  })
  pending_half_day_logs: number;

  @ApiProperty({ description: 'Average minutes late per log', example: 25 })
  average_minutes_late: number;
}

export class ReasonStatsDto {
  @ApiProperty({
    description: 'Reason for half-day log',
    example: 'Personal errand',
  })
  reason: string;

  @ApiProperty({
    description: 'Total number of occurrences for this reason',
    example: 10,
  })
  count: number;

  @ApiProperty({
    description: 'Total minutes associated with this reason',
    example: 350,
  })
  total_minutes: number;

  @ApiProperty({ description: 'Completion rate (percentage)', example: 92.5 })
  completion_rate: number;
}
