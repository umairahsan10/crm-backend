import { ApiProperty } from '@nestjs/swagger';

// Department-specific metrics structure varies by department:
// Sales: { deals, revenue, leads, conversionRate }
// Marketing: { campaignsRun, leadQualityScore, leadGeneration }
// Production: { projectsCompleted, taskCompletion, tasksCompleted, totalTasks }
// HR: { recruitments, requestProcessing, employeeSatisfaction }
// Accounting: { transactionsProcessed, transactionAmount, invoicesProcessed }
export class DepartmentSpecificMetricsDto {
  [key: string]: any;
}

export class CrossDepartmentTopPerformerDto {
  @ApiProperty({ description: 'Employee ID', example: 123 })
  employeeId: number;

  @ApiProperty({ description: 'Employee full name', example: 'Sarah Johnson' })
  employeeName: string;

  @ApiProperty({ description: 'Employee department', example: 'Sales' })
  department: string;

  @ApiProperty({ description: 'Employee role', example: 'Senior Sales Rep' })
  role: string;

  @ApiProperty({ description: 'Overall performance percentage', example: 123 })
  performancePercentage: number;

  @ApiProperty({ description: 'Ranking position (1 = best)', example: 1 })
  rank: number;

  @ApiProperty({
    description:
      'Department-specific performance metrics. Structure varies by department: Sales (deals, revenue, leads, conversionRate), Marketing (campaignsRun, leadQualityScore, leadGeneration), Production (projectsCompleted, taskCompletion, tasksCompleted, totalTasks), HR (recruitments, requestProcessing, employeeSatisfaction), Accounting (transactionsProcessed, transactionAmount, invoicesProcessed)',
    type: DepartmentSpecificMetricsDto,
    example: { deals: 18, revenue: 450000, conversionRate: 40.0, leads: 45 },
  })
  metrics: DepartmentSpecificMetricsDto;
}

export class CrossDepartmentTopPerformersSummaryDto {
  @ApiProperty({
    description: 'Total number of departments analyzed',
    example: 5,
  })
  totalDepartments: number;

  @ApiProperty({
    description: 'Start date of the performance period',
    example: '2024-01-01',
  })
  periodStart: string;

  @ApiProperty({
    description: 'End date of the performance period',
    example: '2024-01-31',
  })
  periodEnd: string;

  @ApiProperty({
    description: 'Average performance percentage across all top performers',
    example: 110.5,
  })
  averagePerformance: number;
}

export class CrossDepartmentTopPerformersMetadataDto {
  @ApiProperty({
    description: 'Generation timestamp',
    example: '2024-12-15T10:30:00Z',
  })
  generatedAt: string;
}

export class CrossDepartmentTopPerformersResponseDto {
  @ApiProperty({ description: 'Response status', example: 'success' })
  status: string;

  @ApiProperty({
    description: 'Period type',
    example: 'monthly',
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
  })
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

  @ApiProperty({
    description: 'Summary statistics',
    type: CrossDepartmentTopPerformersSummaryDto,
  })
  summary: CrossDepartmentTopPerformersSummaryDto;

  @ApiProperty({
    description: 'Top performers from each department',
    type: [CrossDepartmentTopPerformerDto],
  })
  data: CrossDepartmentTopPerformerDto[];

  @ApiProperty({
    description: 'Response metadata',
    type: CrossDepartmentTopPerformersMetadataDto,
  })
  metadata: CrossDepartmentTopPerformersMetadataDto;
}
