import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export enum StatsPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}

export class ProjectLogsStatsDto {
  @ApiPropertyOptional({
    description: 'Filter statistics by a specific project ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  project_id?: number;

  @ApiPropertyOptional({
    description: 'Filter statistics by a specific developer/employee ID',
    example: 42,
  })
  @IsOptional()
  @Type(() => Number)
  developer_id?: number;

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
    description: 'Whether to include breakdowns (per developer and project)',
    example: true,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  include_breakdown?: boolean = true;
}

export class ProjectLogsStatsResponseDto {
  @ApiProperty({
    description: 'Total number of project logs in the given period',
    example: 250,
  })
  total_project_logs: number;

  @ApiProperty({
    description: 'Number of unique projects with logs',
    example: 15,
  })
  unique_projects: number;

  @ApiProperty({
    description: 'Number of unique developers who created logs',
    example: 8,
  })
  unique_developers: number;

  @ApiProperty({
    description: 'Average logs per project',
    example: 16.67,
  })
  average_logs_per_project: number;

  @ApiProperty({
    description: 'Average logs per developer',
    example: 31.25,
  })
  average_logs_per_developer: number;

  @ApiProperty({
    description: 'Statistics grouped by time period (based on selected period)',
    type: [() => PeriodStatsDto],
  })
  period_stats: PeriodStatsDto[];

  @ApiPropertyOptional({
    description: 'Breakdown of project logs statistics by developer',
    type: [() => DeveloperStatsDto],
  })
  developer_breakdown?: DeveloperStatsDto[];

  @ApiPropertyOptional({
    description: 'Breakdown of project logs statistics by project',
    type: [() => ProjectStatsDto],
  })
  project_breakdown?: ProjectStatsDto[];
}

export class PeriodStatsDto {
  @ApiProperty({
    description: 'The label of the time period (e.g., "September 2025", "Week 41")',
    example: 'September 2025',
  })
  period: string;

  @ApiProperty({
    description: 'Total number of project logs in this period',
    example: 85,
  })
  total_project_logs: number;

  @ApiProperty({
    description: 'Number of unique projects in this period',
    example: 6,
  })
  unique_projects: number;

  @ApiProperty({
    description: 'Number of unique developers in this period',
    example: 5,
  })
  unique_developers: number;
}

export class DeveloperStatsDto {
  @ApiProperty({
    description: 'Developer/Employee ID',
    example: 12,
  })
  developer_id: number;

  @ApiProperty({
    description: 'Full name of the developer',
    example: 'Jane Doe',
  })
  developer_name: string;

  @ApiProperty({
    description: 'Total number of project logs created by this developer',
    example: 45,
  })
  total_project_logs: number;

  @ApiProperty({
    description: 'Number of unique projects this developer worked on',
    example: 5,
  })
  unique_projects: number;

  @ApiProperty({
    description: 'Average logs per project for this developer',
    example: 9.0,
  })
  average_logs_per_project: number;
}

export class ProjectStatsDto {
  @ApiProperty({
    description: 'Project ID',
    example: 5,
  })
  project_id: number;

  @ApiProperty({
    description: 'Project name or identifier',
    example: 'E-commerce Platform',
  })
  project_name: string;

  @ApiProperty({
    description: 'Total number of project logs for this project',
    example: 32,
  })
  total_project_logs: number;

  @ApiProperty({
    description: 'Number of unique developers who worked on this project',
    example: 4,
  })
  unique_developers: number;

  @ApiProperty({
    description: 'Average logs per developer for this project',
    example: 8.0,
  })
  average_logs_per_developer: number;
}

