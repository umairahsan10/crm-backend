import { TransactionType, TransactionStatus, PaymentWays } from '@prisma/client';

export class TransactionResponseDto {
  id: number;
  amount: number;
  transactionType: TransactionType;
  paymentMethod: PaymentWays;
  transactionDate: Date;
  status: TransactionStatus;
  notes?: string;
}

export class ExpenseResponseDto {
  id: number;
  title: string;
  category: string;
  amount: number;
  paidOn: Date;
  paymentMethod: string;
  notes?: string;
}

export class LiabilityResponseDto {
  id: number;
  name: string;
  category: string;
  amount: number;
  dueDate: Date;
  isPaid: boolean;
  paidOn?: Date;
  relatedVendorId?: number;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
  transaction: TransactionResponseDto;
  expense?: ExpenseResponseDto;
}

export class LiabilityListResponseDto {
  status: string;
  message: string;
  data: LiabilityResponseDto[];
  total: number;
}

export class LiabilityDetailResponseDto {
  status: string;
  message: string;
  data: LiabilityResponseDto;
}

export class LiabilityCreateResponseDto {
  status: string;
  message: string;
  data: {
    liability: LiabilityResponseDto;
    transaction: TransactionResponseDto;
  };
}

export class LiabilityUpdateResponseDto {
  status: string;
  message: string;
  data: {
    liability: LiabilityResponseDto;
    transaction?: TransactionResponseDto;
  };
}

export class LiabilityMarkPaidResponseDto {
  status: string;
  message: string;
  data: {
    liability: LiabilityResponseDto;
    transaction: TransactionResponseDto;
    expense: ExpenseResponseDto;
  };
}

export class ErrorResponseDto {
  status: string;
  message: string;
  error_code: string;
} 