import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PnLCategoryResponseDto {
  @ApiProperty({ example: 'success', description: 'Response status' })
  status: 'success' | 'error';

  @ApiProperty({
    example: 'PnL calculated successfully',
    description: 'Response message',
  })
  message: string;

  @ApiPropertyOptional({
    description: 'PnL calculation results for a given month and year',
    type: Object,
    example: {
      month: '09',
      year: '2025',
      totalIncome: 50000,
      totalExpenses: 30000,
      netProfit: 20000,
      revenueBreakdown: [
        { category: 'Sales', totalAmount: 30000, count: 10 },
        { category: 'Services', totalAmount: 20000, count: 5 },
      ],
      expenseBreakdown: [
        { category: 'Salaries', totalAmount: 20000, count: 2 },
        { category: 'Rent', totalAmount: 10000, count: 1 },
      ],
      calculationDate: '2025-10-14T12:00:00.000Z',
    },
  })
  data?: {
    month: string;
    year: string;
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    revenueBreakdown: Array<{
      category: string;
      totalAmount: number;
      count: number;
    }>;
    expenseBreakdown: Array<{
      category: string;
      totalAmount: number;
      count: number;
    }>;
    calculationDate: string;
  };

  @ApiPropertyOptional({
    example: 'CALCULATION_ERROR',
    description: 'Error code if any',
  })
  error_code?: string;
}
