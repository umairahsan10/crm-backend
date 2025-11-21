import { ApiProperty } from '@nestjs/swagger';

/**
 * Dashboard API - Comprehensive Finance Metrics for Frontend Widgets and Graphs
 * 
 * This API provides all necessary data for building comprehensive finance dashboards:
 * - Time-based metrics (today, this week, this month, this quarter, this year)
 * - Trend analysis (daily, weekly, monthly time series)
 * - Comparison metrics (vs previous periods)
 * - Widget-ready data structures
 * - Graph-ready time series data
 */

export class TimePeriodMetricsDto {
  @ApiProperty({ description: 'Total count of transactions', example: 45 })
  count: number;

  @ApiProperty({ description: 'Total amount', example: 125000 })
  amount: number;

  @ApiProperty({ description: 'Average transaction amount', example: 2777.78 })
  average: number;

  @ApiProperty({ description: 'Percentage change from previous period', example: 12.5 })
  changePercent: number;
}

export class PeriodComparisonDto {
  @ApiProperty({ description: 'Current period metrics', type: TimePeriodMetricsDto })
  current: TimePeriodMetricsDto;

  @ApiProperty({ description: 'Previous period metrics', type: TimePeriodMetricsDto })
  previous: TimePeriodMetricsDto;

  @ApiProperty({ description: 'Difference amount (current - previous)', example: 15000 })
  difference: number;

  @ApiProperty({ description: 'Percentage change', example: 13.64 })
  changePercent: number;

  @ApiProperty({ description: 'Trend direction (up, down, neutral)', example: 'up' })
  trend: 'up' | 'down' | 'neutral';
}

export class TimeSeriesDataPointDto {
  @ApiProperty({ description: 'Date label (YYYY-MM-DD for daily, YYYY-MM for monthly, etc.)', example: '2024-10-15' })
  date: string;

  @ApiProperty({ description: 'Revenue amount for this period', example: 5000 })
  revenue: number;

  @ApiProperty({ description: 'Expense amount for this period', example: 3000 })
  expense: number;

  @ApiProperty({ description: 'Liability amount for this period', example: 2000 })
  liability: number;

  @ApiProperty({ description: 'Net amount (revenue - expense)', example: 2000 })
  net: number;

  @ApiProperty({ description: 'Net profit amount (revenue - expense)', example: 2000 })
  netProfit: number;

  @ApiProperty({ description: 'Transaction count', example: 12 })
  count: number;
}

export class WidgetMetricDto {
  @ApiProperty({ description: 'Metric title', example: 'Total Revenue' })
  title: string;

  @ApiProperty({ description: 'Current value', example: 150000 })
  value: number;

  @ApiProperty({ description: 'Previous value for comparison', example: 132000 })
  previousValue: number;

  @ApiProperty({ description: 'Change percentage', example: 13.64 })
  changePercent: number;

  @ApiProperty({ description: 'Trend indicator', example: 'up' })
  trend: 'up' | 'down' | 'neutral';

  @ApiProperty({ description: 'Icon name or identifier', example: 'revenue' })
  icon: string;

  @ApiProperty({ description: 'Color theme', example: 'green' })
  color: string;
}

export class CategoryBreakdownDto {
  @ApiProperty({ description: 'Category name', example: 'Office Supplies' })
  name: string;

  @ApiProperty({ description: 'Total amount', example: 5000 })
  amount: number;

  @ApiProperty({ description: 'Transaction count', example: 20 })
  count: number;

  @ApiProperty({ description: 'Percentage of total', example: 25.5 })
  percentage: number;
}

export class RevenueMetricsDto {
  @ApiProperty({ description: 'Today metrics', type: TimePeriodMetricsDto })
  today: TimePeriodMetricsDto;

  @ApiProperty({ description: 'This week metrics', type: TimePeriodMetricsDto })
  thisWeek: TimePeriodMetricsDto;

  @ApiProperty({ description: 'This month metrics', type: TimePeriodMetricsDto })
  thisMonth: TimePeriodMetricsDto;

  @ApiProperty({ description: 'This quarter metrics', type: TimePeriodMetricsDto })
  thisQuarter: TimePeriodMetricsDto;

  @ApiProperty({ description: 'This year metrics', type: TimePeriodMetricsDto })
  thisYear: TimePeriodMetricsDto;

  @ApiProperty({ description: 'Month over month comparison', type: PeriodComparisonDto })
  monthOverMonth: PeriodComparisonDto;

  @ApiProperty({ description: 'Year over year comparison', type: PeriodComparisonDto })
  yearOverYear: PeriodComparisonDto;

  @ApiProperty({ description: 'Top categories breakdown', type: [CategoryBreakdownDto] })
  topCategories: CategoryBreakdownDto[];

  @ApiProperty({ description: 'Top sources breakdown', type: [CategoryBreakdownDto] })
  topSources: CategoryBreakdownDto[];
}

export class ExpenseMetricsDto {
  @ApiProperty({ description: 'Today metrics', type: TimePeriodMetricsDto })
  today: TimePeriodMetricsDto;

  @ApiProperty({ description: 'This week metrics', type: TimePeriodMetricsDto })
  thisWeek: TimePeriodMetricsDto;

  @ApiProperty({ description: 'This month metrics', type: TimePeriodMetricsDto })
  thisMonth: TimePeriodMetricsDto;

  @ApiProperty({ description: 'This quarter metrics', type: TimePeriodMetricsDto })
  thisQuarter: TimePeriodMetricsDto;

  @ApiProperty({ description: 'This year metrics', type: TimePeriodMetricsDto })
  thisYear: TimePeriodMetricsDto;

  @ApiProperty({ description: 'Month over month comparison', type: PeriodComparisonDto })
  monthOverMonth: PeriodComparisonDto;

  @ApiProperty({ description: 'Year over year comparison', type: PeriodComparisonDto })
  yearOverYear: PeriodComparisonDto;

  @ApiProperty({ description: 'Top categories breakdown', type: [CategoryBreakdownDto] })
  topCategories: CategoryBreakdownDto[];

  @ApiProperty({ description: 'Top payment methods breakdown', type: [CategoryBreakdownDto] })
  topPaymentMethods: CategoryBreakdownDto[];
}

export class LiabilityMetricsDto {
  @ApiProperty({ description: 'Today metrics', type: TimePeriodMetricsDto })
  today: TimePeriodMetricsDto;

  @ApiProperty({ description: 'This week metrics', type: TimePeriodMetricsDto })
  thisWeek: TimePeriodMetricsDto;

  @ApiProperty({ description: 'This month metrics', type: TimePeriodMetricsDto })
  thisMonth: TimePeriodMetricsDto;

  @ApiProperty({ description: 'This quarter metrics', type: TimePeriodMetricsDto })
  thisQuarter: TimePeriodMetricsDto;

  @ApiProperty({ description: 'This year metrics', type: TimePeriodMetricsDto })
  thisYear: TimePeriodMetricsDto;

  @ApiProperty({ description: 'Month over month comparison', type: PeriodComparisonDto })
  monthOverMonth: PeriodComparisonDto;

  @ApiProperty({ description: 'Year over year comparison', type: PeriodComparisonDto })
  yearOverYear: PeriodComparisonDto;

  @ApiProperty({ description: 'Top categories breakdown', type: [CategoryBreakdownDto] })
  topCategories: CategoryBreakdownDto[];
}

export class FinancialSummaryDto {
  @ApiProperty({ description: 'Total revenue (all time)', example: 1500000 })
  totalRevenue: number;

  @ApiProperty({ description: 'Total expenses (all time)', example: 750000 })
  totalExpenses: number;

  @ApiProperty({ description: 'Net profit (revenue - expenses)', example: 750000 })
  netProfit: number;

  @ApiProperty({ description: 'Profit margin percentage', example: 50.0 })
  profitMargin: number;

  @ApiProperty({ description: 'Total assets value', example: 200000 })
  totalAssets: number;

  @ApiProperty({ description: 'Total liabilities', example: 50000 })
  totalLiabilities: number;

  @ApiProperty({ description: 'Net position (assets - liabilities)', example: 150000 })
  netPosition: number;

  @ApiProperty({ description: 'Unpaid liabilities amount', example: 20000 })
  unpaidLiabilities: number;

  @ApiProperty({ description: 'Available cash (revenue - expenses - unpaid liabilities)', example: 730000 })
  availableCash: number;

  @ApiProperty({ description: 'Monthly net profit (revenue - expenses for this month)', example: 75000 })
  monthlyNetProfit: number;

  @ApiProperty({ description: 'Monthly profit margin percentage', example: 50.0 })
  monthlyProfitMargin: number;
}

export class TrendDataDto {
  @ApiProperty({ description: 'Daily trend data (last 30 days)', type: [TimeSeriesDataPointDto] })
  daily: TimeSeriesDataPointDto[];

  @ApiProperty({ description: 'Weekly trend data (last 12 weeks)', type: [TimeSeriesDataPointDto] })
  weekly: TimeSeriesDataPointDto[];

  @ApiProperty({ description: 'Monthly trend data (January to current month of current year)', type: [TimeSeriesDataPointDto] })
  monthly: TimeSeriesDataPointDto[];
}

export class DashboardWidgetsDto {
  @ApiProperty({ description: 'Key financial metrics widgets', type: [WidgetMetricDto] })
  keyMetrics: WidgetMetricDto[];

  @ApiProperty({ description: 'Revenue breakdown widget data', type: [CategoryBreakdownDto] })
  revenueBreakdown: CategoryBreakdownDto[];

  @ApiProperty({ description: 'Expense breakdown widget data', type: [CategoryBreakdownDto] })
  expenseBreakdown: CategoryBreakdownDto[];

  @ApiProperty({ description: 'Payment method distribution', type: [CategoryBreakdownDto] })
  paymentMethodDistribution: CategoryBreakdownDto[];
}

export class DashboardDataDto {
  @ApiProperty({ description: 'Financial summary overview', type: FinancialSummaryDto })
  summary: FinancialSummaryDto;

  @ApiProperty({ description: 'Revenue metrics by time period', type: RevenueMetricsDto })
  revenues: RevenueMetricsDto;

  @ApiProperty({ description: 'Expense metrics by time period', type: ExpenseMetricsDto })
  expenses: ExpenseMetricsDto;

  @ApiProperty({ description: 'Liability metrics by time period', type: LiabilityMetricsDto })
  liabilities: LiabilityMetricsDto;

  @ApiProperty({ description: 'Trend data for graphs', type: TrendDataDto })
  trends: TrendDataDto;

  @ApiProperty({ description: 'Widget data for dashboard components', type: DashboardWidgetsDto })
  widgets: DashboardWidgetsDto;

  @ApiProperty({ description: 'Date range information', example: { currentPeriod: '2024-10', previousPeriod: '2024-09' } })
  periodInfo: {
    currentPeriod: string;
    previousPeriod: string;
    generatedAt: string;
  };
}

export class DashboardResponseDto {
  @ApiProperty({ description: 'Response status', example: 'success' })
  status: string;

  @ApiProperty({ description: 'Response message', example: 'Dashboard data retrieved successfully' })
  message: string;

  @ApiProperty({ description: 'Dashboard data', type: DashboardDataDto })
  data: DashboardDataDto;
}

