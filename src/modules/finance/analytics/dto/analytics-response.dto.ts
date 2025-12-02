import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Finance Analytics API - Comprehensive Filtering Options
 *
 * The Finance Analytics API supports extensive filtering capabilities:
 *
 * Date & Time Filters:
 * - fromDate, toDate: Date range filtering (YYYY-MM-DD format)
 * - month: Month filtering (1-12)
 * - year: Year filtering (YYYY)
 * - quarter: Quarter filtering (1-4)
 *
 * Status Filters:
 * - status: Status filter (active, inactive, paid, unpaid, etc.)
 *
 * Entity Filters:
 * - employeeId: Filter by specific employee
 * - vendorId: Filter by specific vendor
 * - clientId: Filter by specific client
 *
 * Amount Filters:
 * - minAmount: Minimum amount filter
 * - maxAmount: Maximum amount filter
 *
 * Example API calls:
 * - GET /accountant/analytics?year=2024&month=10
 * - GET /accountant/analytics?fromDate=2024-01-01&toDate=2024-12-31&status=active
 * - GET /accountant/analytics?minAmount=1000&maxAmount=10000&employeeId=123
 * - GET /accountant/analytics?employeeId=123&quarter=4&status=active
 */

export class SummaryStatsDto {
  @ApiProperty({
    description: 'Total income from all revenue sources',
    example: 150000,
  })
  totalIncome: number;

  @ApiProperty({ description: 'Total expenses amount', example: 75000 })
  totalExpenses: number;

  @ApiProperty({
    description: 'Total current value of all assets',
    example: 200000,
  })
  totalAssetValue: number;

  @ApiProperty({ description: 'Total liabilities amount', example: 50000 })
  totalLiabilities: number;

  @ApiProperty({ description: 'Amount of paid liabilities', example: 30000 })
  paidLiabilities: number;

  @ApiProperty({ description: 'Amount of unpaid liabilities', example: 20000 })
  unpaidLiabilities: number;

  @ApiProperty({
    description:
      'Net financial position (income - expenses - unpaid liabilities)',
    example: 55000,
  })
  netPosition: number;
}

export class AssetStatsDto {
  @ApiProperty({ description: 'Total number of assets', example: 25 })
  totalAssets: number;

  @ApiProperty({
    description: 'Total purchase value of all assets',
    example: 180000,
  })
  totalPurchaseValue: number;

  @ApiProperty({
    description: 'Total current value of all assets',
    example: 200000,
  })
  totalCurrentValue: number;

  @ApiProperty({ description: 'Total depreciation amount', example: -20000 })
  totalDepreciation: number;

  @ApiProperty({
    description: 'Average depreciation rate percentage',
    example: 11.11,
  })
  averageDepreciationRate: number;

  @ApiProperty({
    description: 'Assets added this month',
    example: { count: 3, totalValue: 25000 },
  })
  thisMonth: { count: number; totalValue: number };

  @ApiProperty({
    description: 'Assets breakdown by category',
    example: {
      Equipment: {
        count: 10,
        totalPurchaseValue: 100000,
        totalCurrentValue: 110000,
      },
    },
  })
  byCategory: {
    [key: string]: {
      count: number;
      totalPurchaseValue: number;
      totalCurrentValue: number;
    };
  };

  @ApiProperty({ description: 'Assets needing attention', example: [] })
  assetsNeedingAttention: any[];
}

export class ExpenseStatsDto {
  @ApiProperty({ description: 'Total number of expenses', example: 150 })
  totalExpenses: number;

  @ApiProperty({ description: 'Total amount of all expenses', example: 75000 })
  totalAmount: number;

  @ApiProperty({ description: 'Average expense amount', example: 500 })
  averageExpense: number;

  @ApiProperty({
    description: 'Expenses this month',
    example: { count: 12, amount: 8000 },
  })
  thisMonth: { count: number; amount: number };

  @ApiProperty({
    description: 'Expenses breakdown by category',
    example: { 'Office Supplies': { count: 20, amount: 5000 } },
  })
  byCategory: { [key: string]: { count: number; amount: number } };

  @ApiProperty({ description: 'Top expense categories', example: [] })
  topCategories: any[];

  @ApiProperty({
    description: 'Expenses breakdown by payment method',
    example: { cash: { count: 50, amount: 25000 } },
  })
  byPaymentMethod: { [key: string]: { count: number; amount: number } };

  @ApiProperty({
    description: 'Expenses breakdown by processed role',
    example: { Employee: { count: 100, amount: 50000 } },
  })
  byProcessedByRole: { [key: string]: { count: number; amount: number } };
}

export class RevenueStatsDto {
  @ApiProperty({ description: 'Total number of revenue entries', example: 80 })
  totalRevenue: number;

  @ApiProperty({ description: 'Total amount of all revenues', example: 150000 })
  totalAmount: number;

  @ApiProperty({ description: 'Average revenue amount', example: 1875 })
  averageRevenue: number;

  @ApiProperty({
    description: 'Revenue this month',
    example: { count: 8, amount: 15000 },
  })
  thisMonth: { count: number; amount: number };

  @ApiProperty({
    description: 'Revenue breakdown by category',
    example: { 'Project Revenue': { count: 50, amount: 100000 } },
  })
  byCategory: { [key: string]: { count: number; amount: number } };

  @ApiProperty({
    description: 'Revenue breakdown by source',
    example: { 'Lead Revenue': { count: 40, amount: 80000 } },
  })
  bySource: { [key: string]: { count: number; amount: number } };

  @ApiProperty({
    description: 'Revenue breakdown by payment method',
    example: { bank: { count: 60, amount: 120000 } },
  })
  byPaymentMethod: { [key: string]: { count: number; amount: number } };

  @ApiProperty({ description: 'Top revenue generators', example: [] })
  topGenerators: any[];
}

export class LiabilityStatsDto {
  @ApiProperty({ description: 'Total number of liabilities', example: 30 })
  totalLiabilities: number;

  @ApiProperty({
    description: 'Total amount of all liabilities',
    example: 50000,
  })
  totalAmount: number;

  @ApiProperty({ description: 'Number of paid liabilities', example: 18 })
  paidCount: number;

  @ApiProperty({ description: 'Number of unpaid liabilities', example: 12 })
  unpaidCount: number;

  @ApiProperty({
    description: 'Total amount of paid liabilities',
    example: 30000,
  })
  paidAmount: number;

  @ApiProperty({
    description: 'Total amount of unpaid liabilities',
    example: 20000,
  })
  unpaidAmount: number;

  @ApiProperty({
    description: 'Liabilities breakdown by category',
    example: {
      'Vendor Payments': {
        count: 15,
        amount: 25000,
        paidCount: 10,
        unpaidCount: 5,
        paidAmount: 15000,
        unpaidAmount: 10000,
      },
    },
  })
  byCategory: {
    [key: string]: {
      count: number;
      amount: number;
      paidCount: number;
      unpaidCount: number;
      paidAmount: number;
      unpaidAmount: number;
    };
  };

  @ApiProperty({ description: 'Overdue liabilities', example: [] })
  overdueLiabilities: any[];
}

export class FinanceAnalyticsDataDto {
  @ApiProperty({
    description: 'Financial summary metrics',
    type: SummaryStatsDto,
  })
  summary: SummaryStatsDto;

  @ApiProperty({ description: 'Asset statistics', type: AssetStatsDto })
  assets: AssetStatsDto;

  @ApiProperty({ description: 'Expense statistics', type: ExpenseStatsDto })
  expenses: ExpenseStatsDto;

  @ApiProperty({ description: 'Revenue statistics', type: RevenueStatsDto })
  revenues: RevenueStatsDto;

  @ApiProperty({ description: 'Liability statistics', type: LiabilityStatsDto })
  liabilities: LiabilityStatsDto;
}

export class FinanceAnalyticsResponseDto {
  @ApiProperty({ description: 'Response status', example: 'success' })
  status: string;

  @ApiProperty({
    description: 'Response message',
    example: 'Finance analytics retrieved successfully',
  })
  message: string;

  @ApiProperty({ description: 'Analytics data', type: FinanceAnalyticsDataDto })
  data: FinanceAnalyticsDataDto;
}

export class ErrorResponseDto {
  @ApiProperty({ description: 'Error status', example: 'error' })
  status: string;

  @ApiProperty({
    description: 'Error message',
    example: 'Failed to retrieve finance analytics',
  })
  message: string;

  @ApiProperty({ description: 'Error code', example: 'ANALYTICS_ERROR' })
  error_code: string;
}
