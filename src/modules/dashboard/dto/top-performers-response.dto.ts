import { ApiProperty } from '@nestjs/swagger';

export class AdditionalMetricsDto {
  @ApiProperty({ description: 'Total revenue generated', example: 450000 })
  revenue: number;

  @ApiProperty({ description: 'Total leads handled', example: 45 })
  leads: number;

  @ApiProperty({ description: 'Conversion rate percentage', example: 40.0 })
  conversionRate: number;

  @ApiProperty({ description: 'Average deal size', example: 25000 })
  averageDealSize: number;
}

export class ChangeDto {
  @ApiProperty({ description: 'Absolute change value', example: 3 })
  value: number;

  @ApiProperty({ description: 'Percentage change', example: 20.0 })
  percentage: number;

  @ApiProperty({ description: 'Trend direction', example: 'up', enum: ['up', 'down', 'neutral'] })
  trend: 'up' | 'down' | 'neutral';
}

export class TopPerformerDto {
  @ApiProperty({ description: 'Employee ID', example: 123 })
  employeeId: number;

  @ApiProperty({ description: 'Employee full name', example: 'Sarah Johnson' })
  employeeName: string;

  @ApiProperty({ description: 'Primary performance metric value', example: 18 })
  value: number;

  @ApiProperty({ description: 'The metric being used for ranking', example: 'deals', enum: ['deals', 'revenue', 'conversion_rate', 'leads'] })
  metric: string;

  @ApiProperty({ description: 'Additional performance metrics', type: AdditionalMetricsDto })
  additionalMetrics: AdditionalMetricsDto;

  @ApiProperty({ description: 'Ranking position (1 = best)', example: 1 })
  rank: number;

  @ApiProperty({ description: 'Comparison with previous period', type: ChangeDto })
  change: ChangeDto;
}

export class TopPerformersSummaryDto {
  @ApiProperty({ description: 'Total number of team members in scope', example: 25 })
  totalTeamMembers: number;

  @ApiProperty({ description: 'Start date of the performance period', example: '2024-01-01' })
  periodStart: string;

  @ApiProperty({ description: 'End date of the performance period', example: '2024-01-31' })
  periodEnd: string;

  @ApiProperty({ description: 'Average performance value across all team members', example: 8.5 })
  averagePerformance: number;
}

export class TopPerformersMetadataDto {
  @ApiProperty({ description: 'Generation timestamp', example: '2024-12-15T10:30:00Z' })
  generatedAt: string;
}

export class TopPerformersResponseDto {
  @ApiProperty({ description: 'Response status', example: 'success' })
  status: string;

  @ApiProperty({ description: 'User department', example: 'Sales' })
  department: string;

  @ApiProperty({ description: 'User role', example: 'dep_manager' })
  role: string;

  @ApiProperty({ description: 'Period type', example: 'monthly', enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] })
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

  @ApiProperty({ description: 'Performance metric used for ranking', example: 'deals', enum: ['deals', 'revenue', 'conversion_rate', 'leads'] })
  metric: string;

  @ApiProperty({ description: 'Summary statistics', type: TopPerformersSummaryDto })
  summary: TopPerformersSummaryDto;

  @ApiProperty({ description: 'Top performers data', type: [TopPerformerDto] })
  data: TopPerformerDto[];

  @ApiProperty({ description: 'Response metadata', type: TopPerformersMetadataDto })
  metadata: TopPerformersMetadataDto;
}

