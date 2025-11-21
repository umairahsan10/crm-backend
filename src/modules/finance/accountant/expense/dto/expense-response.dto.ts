import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../../../common/dto/pagination.dto';

export class TransactionResponseDto {
  @ApiProperty({ example: 101, description: 'Unique ID of the transaction' })
  id: number;

  @ApiProperty({ example: 5000, description: 'Transaction amount' })
  amount: number;

  @ApiProperty({ example: 'expense', description: 'Type of transaction' })
  transactionType: string;

  @ApiProperty({ example: 'CASH', description: 'Payment method used' })
  paymentMethod: string;

  @ApiProperty({ example: '2025-10-14T10:30:00Z', description: 'Transaction date in ISO format' })
  transactionDate: string;

  @ApiProperty({ example: 'completed', description: 'Status of the transaction' })
  status: string;

  @ApiPropertyOptional({ example: 'Office stationery purchase', description: 'Optional notes for the transaction' })
  notes: string;

  @ApiProperty({ example: 12, description: 'ID of the employee who created the transaction' })
  employeeId: number;

  @ApiPropertyOptional({ example: 5, description: 'ID of the vendor, if applicable' })
  vendorId: number | null;

  @ApiPropertyOptional({ example: 22, description: 'ID of the client, if applicable' })
  clientId: number | null;

  @ApiPropertyOptional({ example: 88, description: 'ID of the invoice, if linked' })
  invoiceId: number | null;

  @ApiProperty({ example: '2025-10-14T10:30:00Z', description: 'Creation timestamp' })
  createdAt: string;

  @ApiProperty({ example: '2025-10-14T10:35:00Z', description: 'Last update timestamp' })
  updatedAt: string;
}

export class VendorResponseDto {
  @ApiProperty({ example: 5, description: 'Vendor ID' })
  id: number;

  @ApiProperty({ example: 'ABC Supplies', description: 'Vendor name' })
  name: string;

  @ApiProperty({ example: 'John Doe', description: 'Vendor contact person' })
  contactPerson: string;

  @ApiProperty({ example: 'vendor@example.com', description: 'Vendor email' })
  email: string;

  @ApiProperty({ example: '+1234567890', description: 'Vendor phone number' })
  phone: string;

  @ApiProperty({ example: '123 Market Street', description: 'Vendor address' })
  address: string;

  @ApiProperty({ example: 'New York', description: 'City of the vendor' })
  city: string;

  @ApiProperty({ example: 'USA', description: 'Country of the vendor' })
  country: string;

  @ApiProperty({ example: '1234567890', description: 'Bank account of vendor' })
  bankAccount: string;

  @ApiProperty({ example: 'active', description: 'Status of the vendor' })
  status: string;

  @ApiPropertyOptional({ example: 'Preferred vendor for office supplies', description: 'Optional notes about the vendor' })
  notes: string;

  @ApiProperty({ example: '2025-10-01T09:00:00Z', description: 'Vendor creation timestamp' })
  createdAt: string;

  @ApiProperty({ example: '2025-10-10T12:00:00Z', description: 'Vendor last update timestamp' })
  updatedAt: string;
}

export class ExpenseResponseDto {
  @ApiProperty({ example: 101, description: 'Expense ID' })
  id: number;

  @ApiProperty({ example: 'Office stationery purchase', description: 'Title of the expense' })
  title: string;

  @ApiProperty({ example: 'Office Supplies', description: 'Category of the expense' })
  category: string;

  @ApiProperty({ example: 5000, description: 'Amount of the expense' })
  amount: number;

  @ApiPropertyOptional({ example: '2025-10-14T10:30:00Z', description: 'Date when the expense was paid' })
  paidOn: string | null;

  @ApiPropertyOptional({ example: 'Purchased pens and papers for HR', description: 'Notes for the expense' })
  notes: string | null;

  @ApiPropertyOptional({ example: 101, description: 'Associated transaction ID, if any' })
  transactionId: number | null;

  @ApiPropertyOptional({ example: 'ACCOUNTANT', description: 'Role that processed the expense' })
  processedByRole: string | null;

  @ApiPropertyOptional({ example: 'CASH', description: 'Payment method used for the expense' })
  paymentMethod: string | null;

  @ApiPropertyOptional({ example: 12, description: 'Employee who created the expense' })
  createdBy: number | null;

  @ApiProperty({ example: '2025-10-14T10:30:00Z', description: 'Creation timestamp' })
  createdAt: string;

  @ApiProperty({ example: '2025-10-14T10:35:00Z', description: 'Last update timestamp' })
  updatedAt: string;

  @ApiPropertyOptional({ type: () => TransactionResponseDto, description: 'Linked transaction details' })
  transaction: TransactionResponseDto | null;

  @ApiPropertyOptional({ type: () => VendorResponseDto, description: 'Linked vendor details' })
  vendor: VendorResponseDto | null;

  @ApiPropertyOptional({ type: () => Object, example: { id: 12 }, description: 'Employee who created the expense' })
  employee: {
    id: number;
  } | null;
}

export class ExpenseListResponseDto {
  @ApiProperty({ example: 'success', description: 'Response status' })
  status: string;

  @ApiProperty({ example: 'Expenses retrieved successfully', description: 'Response message' })
  message: string;

  @ApiProperty({ type: [ExpenseResponseDto], description: 'Array of expenses' })
  data: ExpenseResponseDto[];

  @ApiProperty({ type: PaginationDto, description: 'Pagination information' })
  pagination: PaginationDto;
}

export class ExpenseCreateResponseDto {
  @ApiProperty({ example: 'success', description: 'Response status' })
  status: string;

  @ApiProperty({ example: 'Expense created successfully', description: 'Response message' })
  message: string;

  @ApiProperty({ type: Object, description: 'Created expense with linked transaction' })
  data: {
    expense: ExpenseResponseDto;
    transaction: TransactionResponseDto;
  };
}

export class ExpenseUpdateResponseDto {
  @ApiProperty({ example: 'success', description: 'Response status' })
  status: string;

  @ApiProperty({ example: 'Expense updated successfully', description: 'Response message' })
  message: string;

  @ApiProperty({ type: Object, description: 'Updated expense with optional transaction' })
  data: {
    expense: ExpenseResponseDto;
    transaction?: TransactionResponseDto;
  };
}

export class ExpenseErrorResponseDto {
  @ApiProperty({ example: 'error', description: 'Status of the response' })
  status: string;
  @ApiProperty({
    example: 'Expense not found',
    description: 'Error message describing the issue',
  })
  message: string;
  @ApiProperty({
    example: 'EXPENSE_NOT_FOUND',
    description: 'Application-specific error code',
  })
  error_code: string;
}

export class ExpenseSingleResponseDto {
  @ApiProperty({ example: 'success', description: 'Response status' })
  status: string;

  @ApiProperty({ example: 'Expense retrieved successfully', description: 'Response message' })
  message: string;

  @ApiProperty({ type: ExpenseResponseDto, description: 'Single expense details' })
  data: ExpenseResponseDto;
} 