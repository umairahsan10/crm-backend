export class PnLCategoryResponseDto {
  status: 'success' | 'error';
  message: string;
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
  error_code?: string;
} 