import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export enum StatsPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export class LateLogsStatsDto {
  @ApiPropertyOptional({
    description: 'Filter statistics by a specific employee ID',
    example: 42,
  })
  @IsOptional()
  @Type(() => Number)
  employee_id?: number;

  @ApiPropertyOptional({
    description: 'Start date for filtering statistics (ISO format)',
    example: '2025-09-01',
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({
    description: 'End date for filtering statistics (ISO format)',
    example: '2025-09-30',
  })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({
    description: 'Time period grouping for statistics aggregation',
    enum: StatsPeriod,
    example: StatsPeriod.MONTHLY,
    default: StatsPeriod.MONTHLY,
  })
  @IsOptional()
  @IsEnum(StatsPeriod)
  period?: StatsPeriod = StatsPeriod.MONTHLY;

  @ApiPropertyOptional({
    description: 'Whether to include breakdowns (per employee and reason)',
    example: true,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  include_breakdown?: boolean = true;
}

export class LateLogsStatsResponseDto {
  @ApiProperty({
    description: 'Total number of late logs in the given period',
    example: 120,
  })
  total_late_logs: number;

  @ApiProperty({
    description: 'Number of pending late logs',
    example: 25,
  })
  pending_late_logs: number;

  @ApiProperty({
    description: 'Number of completed late logs',
    example: 95,
  })
  completed_late_logs: number;

  @ApiProperty({
    description: 'Total minutes employees were late within the period',
    example: 1780,
  })
  total_minutes_late: number;

  @ApiProperty({
    description: 'Average minutes late per log',
    example: 18.7,
  })
  average_minutes_late: number;

  @ApiProperty({
    description: 'Most common reason provided for lateness',
    example: 'Traffic jam',
  })
  most_common_reason: string;

  @ApiProperty({
    description: 'Count of paid late logs',
    example: 45,
  })
  paid_late_count: number;

  @ApiProperty({
    description: 'Count of unpaid late logs',
    example: 75,
  })
  unpaid_late_count: number;

  @ApiProperty({
    description: 'Statistics grouped by time period (based on selected period)',
    type: [() => PeriodStatsDto],
  })
  period_stats: PeriodStatsDto[];

  @ApiPropertyOptional({
    description: 'Breakdown of late statistics by employee',
    type: [() => EmployeeLateStatsDto],
  })
  employee_breakdown?: EmployeeLateStatsDto[];

  @ApiPropertyOptional({
    description: 'Breakdown of late statistics by reason for lateness',
    type: [() => ReasonStatsDto],
  })
  reason_breakdown?: ReasonStatsDto[];
}

export class PeriodStatsDto {
  @ApiProperty({
    description:
      'The label of the time period (e.g., "September 2025", "Week 41")',
    example: 'September 2025',
  })
  period: string;

  @ApiProperty({
    description: 'Total number of late logs in this period',
    example: 35,
  })
  total_late_logs: number;

  @ApiProperty({
    description: 'Number of completed late logs in this period',
    example: 30,
  })
  completed_late_logs: number;

  @ApiProperty({
    description: 'Number of pending late logs in this period',
    example: 5,
  })
  pending_late_logs: number;

  @ApiProperty({
    description: 'Total minutes late accumulated in this period',
    example: 640,
  })
  total_minutes: number;
}

export class EmployeeLateStatsDto {
  @ApiProperty({
    description: 'Employee ID',
    example: 12,
  })
  employee_id: number;

  @ApiProperty({
    description: 'Full name of the employee',
    example: 'Jane Doe',
  })
  employee_name: string;

  @ApiProperty({
    description: 'Total number of late logs for this employee',
    example: 8,
  })
  total_late_logs: number;

  @ApiProperty({
    description: 'Total minutes late accumulated by this employee',
    example: 140,
  })
  total_minutes: number;

  @ApiProperty({
    description: 'Number of completed late logs for this employee',
    example: 6,
  })
  completed_late_logs: number;

  @ApiProperty({
    description: 'Number of pending late logs for this employee',
    example: 2,
  })
  pending_late_logs: number;

  @ApiProperty({
    description: 'Average minutes late per log for this employee',
    example: 17.5,
  })
  average_minutes_late: number;
}

export class ReasonStatsDto {
  @ApiProperty({
    description: 'Reason for lateness',
    example: 'Traffic delay',
  })
  reason: string;

  @ApiProperty({
    description: 'Number of occurrences for this reason',
    example: 24,
  })
  count: number;

  @ApiProperty({
    description: 'Total minutes late caused by this reason',
    example: 410,
  })
  total_minutes: number;

  @ApiProperty({
    description: 'Percentage of logs with this reason that were completed',
    example: 80,
  })
  completion_rate: number;
}
