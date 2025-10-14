import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransactionResponseDto {
  @ApiProperty({ example: 101, description: 'Unique transaction ID' })
  id: number;

  @ApiProperty({ example: 15000, description: 'Transaction amount' })
  amount: number;

  @ApiProperty({ example: 'revenue', description: 'Type of transaction' })
  transactionType: string;

  @ApiProperty({ example: 'CASH', description: 'Payment method used' })
  paymentMethod: string;

  @ApiProperty({ example: '2025-10-14T10:30:00Z', description: 'Transaction date in ISO format' })
  transactionDate: string;

  @ApiProperty({ example: 'completed', description: 'Status of the transaction' })
  status: string;

  @ApiPropertyOptional({ example: 'Payment received for October', description: 'Optional notes for the transaction' })
  notes: string;

  @ApiProperty({ example: 12, description: 'ID of the employee who created the transaction' })
  employeeId: number;

  @ApiPropertyOptional({ example: 5, description: 'ID of the vendor if applicable' })
  vendorId: number | null;

  @ApiPropertyOptional({ example: 22, description: 'ID of the client if applicable' })
  clientId: number | null;

  @ApiPropertyOptional({ example: 88, description: 'ID of the invoice if linked' })
  invoiceId: number | null;

  @ApiProperty({ example: '2025-10-14T10:30:00Z', description: 'Creation timestamp' })
  createdAt: string;

  @ApiProperty({ example: '2025-10-14T10:35:00Z', description: 'Last update timestamp' })
  updatedAt: string;
}

export class LeadResponseDto {
  @ApiProperty({ example: 301, description: 'Lead ID' })
  id: number;

  @ApiProperty({ example: 'Acme Corp', description: 'Lead name' })
  name: string;

  @ApiProperty({ example: 'lead@example.com', description: 'Lead email' })
  email: string;

  @ApiProperty({ example: '+1234567890', description: 'Lead phone number' })
  phone: string;

  @ApiProperty({ example: 'Referral', description: 'Lead source' })
  source: string;

  @ApiProperty({ example: 'B2B', description: 'Lead type' })
  type: string;

  @ApiProperty({ example: 'active', description: 'Lead status' })
  status: string;

  @ApiProperty({ example: '2025-10-01T09:00:00Z', description: 'Creation timestamp' })
  createdAt: string;

  @ApiProperty({ example: '2025-10-10T12:00:00Z', description: 'Last update timestamp' })
  updatedAt: string;
}

export class InvoiceResponseDto {
  @ApiProperty({ example: 501, description: 'Invoice ID' })
  id: number;

  @ApiProperty({ example: '2025-10-14T00:00:00Z', description: 'Invoice issue date' })
  issueDate: string;

  @ApiProperty({ example: 15000, description: 'Invoice amount' })
  amount: number;

  @ApiPropertyOptional({ example: 'Payment for October services', description: 'Optional notes on invoice' })
  notes: string | null;

  @ApiProperty({ example: '2025-10-14T10:30:00Z', description: 'Invoice creation timestamp' })
  createdAt: string;
}

export class RevenueResponseDto {
  @ApiProperty({ example: 201, description: 'Revenue ID' })
  id: number;

  @ApiProperty({ example: 'Product Sale', description: 'Source of the revenue' })
  source: string;

  @ApiProperty({ example: 'Sales', description: 'Category of the revenue' })
  category: string;

  @ApiProperty({ example: 15000, description: 'Revenue amount received' })
  amount: number;

  @ApiPropertyOptional({ example: 301, description: 'ID of the lead from whom revenue was received' })
  receivedFrom: number | null;

  @ApiPropertyOptional({ example: '2025-10-14T10:30:00Z', description: 'Date revenue was received' })
  receivedOn: string | null;

  @ApiProperty({ example: 'CASH', description: 'Payment method used for the revenue' })
  paymentMethod: string;

  @ApiPropertyOptional({ example: 501, description: 'Related invoice ID, if applicable' })
  relatedInvoiceId: number | null;

  @ApiPropertyOptional({ example: 12, description: 'Employee who created the revenue' })
  createdBy: number | null;

  @ApiPropertyOptional({ example: 101, description: 'Linked transaction ID, if any' })
  transactionId: number | null;

  @ApiProperty({ example: '2025-10-14T10:30:00Z', description: 'Revenue creation timestamp' })
  createdAt: string;

  @ApiProperty({ example: '2025-10-14T10:35:00Z', description: 'Revenue last update timestamp' })
  updatedAt: string;

  @ApiPropertyOptional({ type: () => TransactionResponseDto, description: 'Linked transaction details' })
  transaction: TransactionResponseDto | null;

  @ApiPropertyOptional({ type: () => LeadResponseDto, description: 'Linked lead details' })
  lead: LeadResponseDto | null;

  @ApiPropertyOptional({ type: () => InvoiceResponseDto, description: 'Linked invoice details' })
  invoice: InvoiceResponseDto | null;

  @ApiPropertyOptional({ example: { id: 12 }, description: 'Employee who created the revenue' })
  employee: {
    id: number;
  } | null;
}

export class RevenueListResponseDto {
  @ApiProperty({ example: 'success', description: 'Response status' })
  status: string;

  @ApiProperty({ example: 'Revenues retrieved successfully', description: 'Response message' })
  message: string;

  @ApiProperty({ type: [RevenueResponseDto], description: 'Array of revenues' })
  data: RevenueResponseDto[];

  @ApiProperty({ example: 25, description: 'Total number of revenue records' })
  total: number;
}

export class RevenueCreateResponseDto {
  @ApiProperty({ example: 'success', description: 'Response status' })
  status: string;

  @ApiProperty({ example: 'Revenue created successfully', description: 'Response message' })
  message: string;

  @ApiProperty({
    description: 'Created revenue with linked transaction',
    example: {
      revenue: {
        id: 101,
        source: 'Website Subscription',
        category: 'Subscription',
        amount: 5000,
        receivedFrom: 12,
        receivedOn: '2025-10-14T10:30:00Z',
        paymentMethod: 'CASH',
        relatedInvoiceId: 55,
        createdBy: 3,
        transactionId: 201,
        createdAt: '2025-10-14T10:30:00Z',
        updatedAt: '2025-10-14T10:35:00Z',
        transaction: {
          id: 201,
          amount: 5000,
          transactionType: 'revenue',
          paymentMethod: 'CASH',
          transactionDate: '2025-10-14T10:30:00Z',
          status: 'completed',
          notes: 'Received payment from client',
          employeeId: 3,
          vendorId: null,
          clientId: 12,
          invoiceId: 55,
          createdAt: '2025-10-14T10:30:00Z',
          updatedAt: '2025-10-14T10:35:00Z'
        },
        lead: {
          id: 12,
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          source: 'Website',
          type: 'Client',
          status: 'active',
          createdAt: '2025-09-01T09:00:00Z',
          updatedAt: '2025-09-10T12:00:00Z'
        },
        invoice: {
          id: 55,
          issueDate: '2025-10-10T09:00:00Z',
          amount: 5000,
          notes: 'October invoice',
          createdAt: '2025-10-10T09:00:00Z'
        },
        employee: {
          id: 3
        }
      },
      transaction: {
        id: 201,
        amount: 5000,
        transactionType: 'revenue',
        paymentMethod: 'CASH',
        transactionDate: '2025-10-14T10:30:00Z',
        status: 'completed',
        notes: 'Received payment from client',
        employeeId: 3,
        vendorId: null,
        clientId: 12,
        invoiceId: 55,
        createdAt: '2025-10-14T10:30:00Z',
        updatedAt: '2025-10-14T10:35:00Z'
      }
    }
  })
  data: {
    revenue: RevenueResponseDto;
    transaction: TransactionResponseDto;
  };
}

export class RevenueUpdateResponseDto {
  @ApiProperty({ example: 'success', description: 'Response status' })
  status: string;

  @ApiProperty({ example: 'Revenue updated successfully', description: 'Response message' })
  message: string;

  @ApiProperty({
    description: 'Updated revenue with optional transaction',
    example: {
      revenue: {
        id: 101,
        source: 'Website Subscription',
        category: 'Subscription',
        amount: 6000,
        receivedFrom: 12,
        receivedOn: '2025-10-14T11:00:00Z',
        paymentMethod: 'BANK_TRANSFER',
        relatedInvoiceId: 55,
        createdBy: 3,
        transactionId: 201,
        createdAt: '2025-10-14T10:30:00Z',
        updatedAt: '2025-10-14T11:00:00Z',
        transaction: {
          id: 201,
          amount: 6000,
          transactionType: 'revenue',
          paymentMethod: 'BANK_TRANSFER',
          transactionDate: '2025-10-14T11:00:00Z',
          status: 'completed',
          notes: 'Updated payment received',
          employeeId: 3,
          vendorId: null,
          clientId: 12,
          invoiceId: 55,
          createdAt: '2025-10-14T10:30:00Z',
          updatedAt: '2025-10-14T11:00:00Z'
        },
        lead: {
          id: 12,
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          source: 'Website',
          type: 'Client',
          status: 'active',
          createdAt: '2025-09-01T09:00:00Z',
          updatedAt: '2025-09-10T12:00:00Z'
        },
        invoice: {
          id: 55,
          issueDate: '2025-10-10T09:00:00Z',
          amount: 6000,
          notes: 'October invoice updated',
          createdAt: '2025-10-10T09:00:00Z'
        },
        employee: {
          id: 3
        }
      },
      transaction: {
        id: 201,
        amount: 6000,
        transactionType: 'revenue',
        paymentMethod: 'BANK_TRANSFER',
        transactionDate: '2025-10-14T11:00:00Z',
        status: 'completed',
        notes: 'Updated payment received',
        employeeId: 3,
        vendorId: null,
        clientId: 12,
        invoiceId: 55,
        createdAt: '2025-10-14T10:30:00Z',
        updatedAt: '2025-10-14T11:00:00Z'
      }
    }
  })
  data: {
    revenue: RevenueResponseDto;
    transaction?: TransactionResponseDto;
  };
}

export class RevenueSingleResponseDto {
  @ApiProperty({ example: 'success', description: 'Response status' })
  status: string;

  @ApiProperty({ example: 'Revenue retrieved successfully', description: 'Response message' })
  message: string;

  @ApiProperty({ type: RevenueResponseDto, description: 'Single revenue details' })
  data: RevenueResponseDto;
}
