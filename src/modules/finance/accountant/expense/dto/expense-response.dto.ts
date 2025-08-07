export class TransactionResponseDto {
  id: number;
  amount: number;
  transactionType: string;
  paymentMethod: string;
  transactionDate: string;
  status: string;
  notes: string;
  employeeId: number;
  vendorId: number | null;
  clientId: number | null;
  invoiceId: number | null;
  createdAt: string;
  updatedAt: string;
}

export class VendorResponseDto {
  id: number;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  bankAccount: string;
  status: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export class ExpenseResponseDto {
  id: number;
  title: string;
  category: string;
  amount: number;
  paidOn: string | null;
  notes: string | null;
  transactionId: number | null;
  processedByRole: string | null;
  paymentMethod: string | null;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
  transaction: TransactionResponseDto | null;
  vendor: VendorResponseDto | null;
  employee: {
    id: number;
  } | null;
}

export class ExpenseListResponseDto {
  status: string;
  message: string;
  data: ExpenseResponseDto[];
  total: number;
}

export class ExpenseCreateResponseDto {
  status: string;
  message: string;
  data: {
    expense: ExpenseResponseDto;
    transaction: TransactionResponseDto;
  };
}

export class ExpenseUpdateResponseDto {
  status: string;
  message: string;
  data: {
    expense: ExpenseResponseDto;
    transaction?: TransactionResponseDto;
  };
}

export class ExpenseSingleResponseDto {
  status: string;
  message: string;
  data: ExpenseResponseDto;
} 