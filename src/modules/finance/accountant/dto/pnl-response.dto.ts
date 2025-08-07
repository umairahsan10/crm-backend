export class PnLResponseDto {
  status: 'success' | 'error';
  message: string;
  data?: {
    month: string;
    year: string;
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    calculationDate: string;
  };
  error_code?: string;
} 