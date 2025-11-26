import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType, TransactionStatus, PaymentWays } from '@prisma/client';
import { PaginationDto } from '../../../../../common/dto/pagination.dto';

export class TransactionResponseDto {
  @ApiProperty({ example: 101, description: 'Unique transaction ID' })
  id: number;

  @ApiProperty({ example: 5000, description: 'Transaction amount' })
  amount: number;

  @ApiProperty({ example: TransactionType.expense, description: 'Type of transaction', enum: TransactionType })
  transactionType: TransactionType;

  @ApiProperty({ example: PaymentWays.cash, description: 'Payment method used', enum: PaymentWays })
  paymentMethod: PaymentWays;

  @ApiProperty({ example: '2025-10-14T10:30:00Z', description: 'Transaction date in ISO format' })
  transactionDate: Date;

  @ApiProperty({ example: TransactionStatus.completed, description: 'Status of the transaction', enum: TransactionStatus })
  status: TransactionStatus;

  @ApiPropertyOptional({ example: 'Paid office rent', description: 'Optional notes for the transaction' })
  notes?: string;
}

export class ExpenseResponseDto {
  @ApiProperty({ example: 201, description: 'Expense ID' })
  id: number;

  @ApiProperty({ example: 'Office Supplies', description: 'Title of the expense' })
  title: string;

  @ApiProperty({ example: 'Stationery', description: 'Category of the expense' })
  category: string;

  @ApiProperty({ example: 3000, description: 'Amount of the expense' })
  amount: number;

  @ApiProperty({ example: '2025-10-14T10:30:00Z', description: 'Date when the expense was paid' })
  paidOn: Date;

  @ApiProperty({ example: 'cash', description: 'Payment method used' })
  paymentMethod: string;

  @ApiPropertyOptional({ example: 'Purchased pens and papers', description: 'Optional notes for the expense' })
  notes?: string;
}

export class LiabilityResponseDto {
  @ApiProperty({ example: 301, description: 'Liability ID' })
  id: number;

  @ApiProperty({ example: 'Office Rent October', description: 'Name/title of the liability' })
  name: string;

  @ApiProperty({ example: 'Rent', description: 'Category of the liability' })
  category: string;

  @ApiProperty({ example: 25000, description: 'Amount of the liability' })
  amount: number;

  @ApiProperty({ example: '2025-10-31', description: 'Due date of the liability' })
  dueDate: Date;

  @ApiProperty({ example: false, description: 'Whether the liability is paid or not' })
  isPaid: boolean;

  @ApiProperty({ example: 'Unpaid', description: 'Status of the liability (Paid or Unpaid)' })
  status: string;

  @ApiPropertyOptional({ example: '2025-10-14', description: 'Date when the liability was paid' })
  paidOn?: Date;

  @ApiPropertyOptional({ example: 5, description: 'Optional related vendor ID if applicable' })
  relatedVendorId?: number;

  @ApiProperty({ example: 12, description: 'ID of the employee who created the liability' })
  createdBy: number;

  @ApiProperty({ example: '2025-10-01T09:00:00Z', description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2025-10-10T12:00:00Z', description: 'Last update timestamp' })
  updatedAt: Date;

  @ApiProperty({ type: () => TransactionResponseDto, description: 'Linked transaction details' })
  transaction: TransactionResponseDto;

  @ApiPropertyOptional({ type: () => ExpenseResponseDto, description: 'Linked expense details, if any' })
  expense?: ExpenseResponseDto;
}

export class LiabilityListResponseDto {
  @ApiProperty({ example: 'success', description: 'Response status' })
  status: string;

  @ApiProperty({ example: 'Liabilities retrieved successfully', description: 'Response message' })
  message: string;

  @ApiProperty({ type: [LiabilityResponseDto], description: 'Array of liabilities' })
  data: LiabilityResponseDto[];

  @ApiProperty({ type: PaginationDto, description: 'Pagination information' })
  pagination: PaginationDto;
}

export class LiabilityDetailResponseDto {
  @ApiProperty({ example: 'success', description: 'Response status' })
  status: string;

  @ApiProperty({ example: 'Liability retrieved successfully', description: 'Response message' })
  message: string;

  @ApiProperty({ type: LiabilityResponseDto, description: 'Single liability details' })
  data: LiabilityResponseDto;
}

export class LiabilityCreateResponseDto {
  @ApiProperty({ example: 'success', description: 'Response status' })
  status: string;

  @ApiProperty({ example: 'Liability created successfully', description: 'Response message' })
  message: string;

  @ApiProperty({
    description: 'Created liability with linked transaction',
    type: Object,
    example: {
      liability: {
        id: 301,
        name: 'Office Rent October',
        category: 'Rent',
        amount: 25000,
        dueDate: '2025-10-31',
        isPaid: false,
        paidOn: null,
        relatedVendorId: 5,
        createdBy: 12,
        createdAt: '2025-10-01T09:00:00Z',
        updatedAt: '2025-10-10T12:00:00Z',
        transaction: {
          id: 101,
          amount: 25000,
          transactionType: 'expense',
          paymentMethod: 'cash',
          transactionDate: '2025-10-14T10:30:00Z',
          status: 'completed',
          notes: 'Paid office rent'
        },
        expense: null
      },
      transaction: {
        id: 101,
        amount: 25000,
        transactionType: 'expense',
        paymentMethod: 'cash',
        transactionDate: '2025-10-14T10:30:00Z',
        status: 'completed',
        notes: 'Paid office rent'
      }
    }
  })
  data: {
    liability: LiabilityResponseDto;
    transaction: TransactionResponseDto;
  };
}

export class LiabilityUpdateResponseDto {
  @ApiProperty({ example: 'success', description: 'Response status' })
  status: string;

  @ApiProperty({ example: 'Liability updated successfully', description: 'Response message' })
  message: string;

  @ApiProperty({
    description: 'Updated liability with optional transaction',
    type: Object,
    example: {
      liability: {
        id: 301,
        name: 'Office Rent October',
        category: 'Rent',
        amount: 25000,
        dueDate: '2025-10-31',
        isPaid: false,
        paidOn: null,
        relatedVendorId: 5,
        createdBy: 12,
        createdAt: '2025-10-01T09:00:00Z',
        updatedAt: '2025-10-10T12:00:00Z',
        transaction: {
          id: 101,
          amount: 25000,
          transactionType: 'expense',
          paymentMethod: 'cash',
          transactionDate: '2025-10-14T10:30:00Z',
          status: 'completed',
          notes: 'Paid office rent'
        },
        expense: null
      },
      transaction: {
        id: 101,
        amount: 25000,
        transactionType: 'expense',
        paymentMethod: 'cash',
        transactionDate: '2025-10-14T10:30:00Z',
        status: 'completed',
        notes: 'Paid office rent'
      }
    }
  })
  data: {
    liability: LiabilityResponseDto;
    transaction?: TransactionResponseDto;
  };
}

export class LiabilityMarkPaidResponseDto {
  @ApiProperty({ example: 'success', description: 'Response status' })
  status: string;

  @ApiProperty({ example: 'Liability marked as paid successfully', description: 'Response message' })
  message: string;

  @ApiProperty({
    description: 'Liability, transaction, and expense details after marking as paid',
    type: Object,
    example: {
      liability: {
        id: 301,
        name: 'Office Rent October',
        category: 'Rent',
        amount: 25000,
        dueDate: '2025-10-31',
        isPaid: true,
        paidOn: '2025-10-14',
        relatedVendorId: 5,
        createdBy: 12,
        createdAt: '2025-10-01T09:00:00Z',
        updatedAt: '2025-10-10T12:00:00Z',
        transaction: {
          id: 101,
          amount: 25000,
          transactionType: 'expense',
          paymentMethod: 'cash',
          transactionDate: '2025-10-14T10:30:00Z',
          status: 'completed',
          notes: 'Paid office rent'
        },
        expense: {
          id: 201,
          title: 'Office Rent Payment',
          category: 'Rent',
          amount: 25000,
          paidOn: '2025-10-14T10:30:00Z',
          paymentMethod: 'cash',
          notes: 'Monthly rent'
        }
      },
      transaction: {
        id: 101,
        amount: 25000,
        transactionType: 'expense',
        paymentMethod: 'cash',
        transactionDate: '2025-10-14T10:30:00Z',
        status: 'completed',
        notes: 'Paid office rent'
      },
      expense: {
        id: 201,
        title: 'Office Rent Payment',
        category: 'Rent',
        amount: 25000,
        paidOn: '2025-10-14T10:30:00Z',
        paymentMethod: 'cash',
        notes: 'Monthly rent'
      }
    }
  })
  data: {
    liability: LiabilityResponseDto;
    transaction: TransactionResponseDto;
    expense: ExpenseResponseDto;
  };
}

export class LiabilityErrorResponseDto {
  @ApiProperty({ example: 'error', description: 'Response status' })
  status: string;

  @ApiProperty({ example: 'Liability not found', description: 'Error message' })
  message: string;

  @ApiProperty({ example: 'LIABILITY_NOT_FOUND', description: 'Application-specific error code' })
  error_code: string;
} 