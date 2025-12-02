import { ApiProperty } from '@nestjs/swagger';

export class PeriodSummaryDto {
  @ApiProperty({
    description: 'Total revenue for the period',
    example: 5400000,
  })
  totalRevenue: number;

  @ApiProperty({ description: 'Total number of deals closed', example: 47 })
  totalDeals: number;

  @ApiProperty({ description: 'Average deal size', example: 114893 })
  averageDealSize: number;

  @ApiProperty({ description: 'Conversion rate percentage', example: 23.5 })
  conversionRate: number;

  @ApiProperty({ description: 'Best month/period details', required: false })
  bestMonth?: {
    date: string;
    revenue: number;
    label: string;
  };

  @ApiProperty({ description: 'Worst month/period details', required: false })
  worstMonth?: {
    date: string;
    revenue: number;
    label: string;
  };
}

export class ChangeDto {
  @ApiProperty({ description: 'Revenue change amount', example: 600000 })
  revenue: number;

  @ApiProperty({ description: 'Revenue change percentage', example: 12.5 })
  revenuePercentage: number;

  @ApiProperty({ description: 'Deals count change', example: 5 })
  deals: number;

  @ApiProperty({ description: 'Deals change percentage', example: 11.9 })
  dealsPercentage: number;

  @ApiProperty({
    description: 'Trend direction',
    example: 'up',
    enum: ['up', 'down', 'neutral'],
  })
  trend: 'up' | 'down' | 'neutral';
}

export class SalesSummaryDto {
  @ApiProperty({
    description: 'Current period summary',
    type: PeriodSummaryDto,
  })
  currentPeriod: PeriodSummaryDto;

  @ApiProperty({
    description: 'Previous period summary',
    type: PeriodSummaryDto,
  })
  previousPeriod: PeriodSummaryDto;

  @ApiProperty({ description: 'Change comparison', type: ChangeDto })
  change: ChangeDto;
}

export class SalesDataPointDto {
  @ApiProperty({
    description:
      'Date in ISO format (YYYY-MM-DD, YYYY-MM, YYYY-WW, YYYY-Q, or YYYY)',
    example: '2024-01',
  })
  date: string;

  @ApiProperty({ description: 'Short label for chart', example: 'Jan' })
  label: string;

  @ApiProperty({
    description: 'Full label for tooltips',
    example: 'January 2024',
  })
  fullLabel: string;

  @ApiProperty({ description: 'Total revenue for the period', example: 420000 })
  revenue: number;

  @ApiProperty({ description: 'Number of closed deals', example: 8 })
  deals: number;

  @ApiProperty({ description: 'Conversion rate percentage', example: 20.0 })
  conversionRate: number;

  @ApiProperty({ description: 'Average deal size', example: 52500 })
  averageDealSize: number;

  @ApiProperty({ description: 'Value for chart mapping', example: 420000 })
  chartValue: number;

  @ApiProperty({
    description: 'Month number (1-12) for sorting',
    required: false,
    example: 1,
  })
  monthNumber?: number;

  @ApiProperty({
    description: 'Year for sorting',
    required: false,
    example: 2024,
  })
  year?: number;

  @ApiProperty({
    description: 'Week number (for weekly period)',
    required: false,
    example: 5,
  })
  weekNumber?: number;

  @ApiProperty({
    description: 'Quarter number (1-4) for sorting',
    required: false,
    example: 1,
  })
  quarterNumber?: number;
}

export class DateRangeDto {
  @ApiProperty({ description: 'Start date', example: '2024-01-01' })
  start: string;

  @ApiProperty({ description: 'End date', example: '2024-12-31' })
  end: string;
}

export class SalesMetadataDto {
  @ApiProperty({ description: 'Date range', type: DateRangeDto })
  dateRange: DateRangeDto;

  @ApiProperty({
    description: 'Total months in dataset',
    required: false,
    example: 12,
  })
  totalMonths?: number;

  @ApiProperty({
    description: 'Total days in dataset',
    required: false,
    example: 30,
  })
  totalDays?: number;

  @ApiProperty({
    description: 'Total weeks in dataset',
    required: false,
    example: 12,
  })
  totalWeeks?: number;

  @ApiProperty({
    description: 'Total quarters in dataset',
    required: false,
    example: 4,
  })
  totalQuarters?: number;

  @ApiProperty({
    description: 'Total years in dataset',
    required: false,
    example: 5,
  })
  totalYears?: number;

  @ApiProperty({
    description: 'Generation timestamp',
    example: '2024-12-15T10:30:00Z',
  })
  generatedAt: string;
}

export class SalesTrendsResponseDto {
  @ApiProperty({ description: 'Response status', example: 'success' })
  status: string;

  @ApiProperty({ description: 'User department', example: 'Sales' })
  department: string;

  @ApiProperty({ description: 'User role', example: 'dep_manager' })
  role: string;

  @ApiProperty({
    description: 'Period type',
    example: 'monthly',
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
  })
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

  @ApiProperty({ description: 'Summary statistics', type: SalesSummaryDto })
  summary: SalesSummaryDto;

  @ApiProperty({ description: 'Trend data points', type: [SalesDataPointDto] })
  data: SalesDataPointDto[];

  @ApiProperty({ description: 'Response metadata', type: SalesMetadataDto })
  metadata: SalesMetadataDto;
}
