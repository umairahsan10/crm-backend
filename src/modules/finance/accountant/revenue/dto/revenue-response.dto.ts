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

export class LeadResponseDto {
  id: number;
  name: string;
  email: string;
  phone: string;
  source: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export class InvoiceResponseDto {
  id: number;
  issueDate: string;
  amount: number;
  notes: string | null;
  createdAt: string;
}

export class RevenueResponseDto {
  id: number;
  source: string;
  category: string;
  amount: number;
  receivedFrom: number | null;
  receivedOn: string | null;
  paymentMethod: string;
  relatedInvoiceId: number | null;
  createdBy: number | null;
  transactionId: number | null;
  createdAt: string;
  updatedAt: string;
  transaction: TransactionResponseDto | null;
  lead: LeadResponseDto | null;
  invoice: InvoiceResponseDto | null;
  employee: {
    id: number;
  } | null;
}

export class RevenueListResponseDto {
  status: string;
  message: string;
  data: RevenueResponseDto[];
  total: number;
}

export class RevenueCreateResponseDto {
  status: string;
  message: string;
  data: {
    revenue: RevenueResponseDto;
    transaction: TransactionResponseDto;
  };
}

export class RevenueUpdateResponseDto {
  status: string;
  message: string;
  data: {
    revenue: RevenueResponseDto;
    transaction?: TransactionResponseDto;
  };
}

export class RevenueSingleResponseDto {
  status: string;
  message: string;
  data: RevenueResponseDto;
}
