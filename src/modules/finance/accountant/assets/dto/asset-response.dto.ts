import { ApiProperty } from '@nestjs/swagger';
import { PaginationDto } from '../../../../../common/dto/pagination.dto';

export class TransactionResponseDto {
  @ApiProperty({ example: 101, description: 'Unique ID of the transaction' })
  id: number;
  @ApiProperty({ example: 5000, description: 'Amount of the transaction' })
  amount: number;
  @ApiProperty({ example: 'credit', description: 'Type of transaction' })
  transactionType: string;
  @ApiProperty({ example: 'bank_transfer', description: 'Payment method used' })
  paymentMethod: string;
  @ApiProperty({
    example: '2025-10-14T12:34:56Z',
    description: 'Date and time of the transaction',
  })
  transactionDate: string;
  @ApiProperty({
    example: 'completed',
    description: 'Current status of the transaction',
  })
  status: string;
  @ApiProperty({
    example: 'Payment for office chairs',
    description: 'Additional notes for the transaction',
  })
  notes: string;
  @ApiProperty({
    example: 12,
    description: 'Employee ID who made the transaction',
  })
  employeeId: number;
  @ApiProperty({
    example: 5,
    description: 'Vendor ID associated with the transaction',
  })
  vendorId: number;
  @ApiProperty({
    example: 8,
    description: 'Client ID if applicable',
    nullable: true,
  })
  clientId: number | null;
  @ApiProperty({
    example: 15,
    description: 'Invoice ID if applicable',
    nullable: true,
  })
  invoiceId: number | null;
  @ApiProperty({
    example: '2025-10-14T12:00:00Z',
    description: 'Creation timestamp',
  })
  createdAt: string;
  @ApiProperty({
    example: '2025-10-14T12:34:56Z',
    description: 'Last updated timestamp',
  })
  updatedAt: string;
}

export class VendorResponseDto {
  @ApiProperty({ example: 5, description: 'Unique ID of the vendor' })
  id: number;
  @ApiProperty({ example: 'ABC Supplies', description: 'Name of the vendor' })
  name: string;
  @ApiProperty({
    example: 'John Doe',
    description: 'Contact person at the vendor',
  })
  contactPerson: string;
  @ApiProperty({
    example: 'contact@abc.com',
    description: 'Email of the vendor',
  })
  email: string;
  @ApiProperty({
    example: '+1234567890',
    description: 'Phone number of the vendor',
  })
  phone: string;
  @ApiProperty({ example: '123 Main St', description: 'Address of the vendor' })
  address: string;
  @ApiProperty({ example: 'New York', description: 'City of the vendor' })
  city: string;
  @ApiProperty({ example: 'USA', description: 'Country of the vendor' })
  country: string;
  @ApiProperty({
    example: '1234567890123456',
    description: 'Bank account number of the vendor',
  })
  bankAccount: string;
  @ApiProperty({
    example: 'active',
    description: 'Current status of the vendor',
  })
  status: string;
  @ApiProperty({
    example: 'Preferred vendor for IT equipment',
    description: 'Additional notes',
  })
  notes: string;
  @ApiProperty({
    example: '2025-10-01T10:00:00Z',
    description: 'Creation timestamp',
  })
  createdAt: string;
  @ApiProperty({
    example: '2025-10-10T14:30:00Z',
    description: 'Last updated timestamp',
  })
  updatedAt: string;
}

export class AssetResponseDto {
  @ApiProperty({ example: 101, description: 'Unique ID of the asset' })
  id: number;
  @ApiProperty({
    example: 'Office Chair',
    description: 'Title or name of the asset',
  })
  title: string;
  @ApiProperty({ example: 'Furniture', description: 'Category of the asset' })
  category: string;
  @ApiProperty({
    example: '2025-01-10',
    description: 'Purchase date of the asset',
  })
  purchaseDate: string;
  @ApiProperty({ example: 5000, description: 'Purchase value of the asset' })
  purchaseValue: number;
  @ApiProperty({ example: 4000, description: 'Current value of the asset' })
  currentValue: number;
  @ApiProperty({ example: 201, description: 'Associated transaction ID' })
  transactionId: number;
  @ApiProperty({
    example: 5,
    description: 'Vendor ID associated with the asset',
  })
  vendorId: number;
  @ApiProperty({
    example: 12,
    description: 'ID of the employee who created the asset entry',
  })
  createdBy: number;
  @ApiProperty({
    example: '2025-01-10T12:00:00Z',
    description: 'Creation timestamp',
  })
  createdAt: string;
  @ApiProperty({
    example: '2025-10-10T12:30:00Z',
    description: 'Last updated timestamp',
  })
  updatedAt: string;
  @ApiProperty({
    type: () => TransactionResponseDto,
    description: 'Associated transaction details',
  })
  transaction: TransactionResponseDto;
  @ApiProperty({
    type: () => VendorResponseDto,
    description: 'Vendor details associated with the asset',
  })
  vendor: VendorResponseDto;
  @ApiProperty({
    type: () => Object,
    description: 'Employee details associated with the asset',
    example: { id: 12, firstName: 'Alice', lastName: 'Smith' },
  })
  employee: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

export class AssetListResponseDto {
  @ApiProperty({ example: 'success', description: 'Status of the response' })
  status: string;
  @ApiProperty({
    example: 'Assets retrieved successfully',
    description: 'Message describing the response',
  })
  message: string;
  @ApiProperty({
    type: [AssetResponseDto],
    description: 'List of assets returned',
  })
  data: AssetResponseDto[];
  @ApiProperty({ type: PaginationDto, description: 'Pagination information' })
  pagination: PaginationDto;
}

export class AssetCreateResponseDto {
  @ApiProperty({ example: 'success', description: 'Status of the response' })
  status: string;
  @ApiProperty({
    example: 'Asset created successfully',
    description: 'Message describing the response',
  })
  message: string;
  @ApiProperty({
    description: 'Created asset and transaction details',
    example: { asset: {}, transaction: {} },
    type: Object,
  })
  data: {
    asset: AssetResponseDto;
    transaction: TransactionResponseDto;
  };
}

export class AssetUpdateResponseDto {
  @ApiProperty({ example: 'success', description: 'Status of the response' })
  status: string;
  @ApiProperty({
    example: 'Asset updated successfully',
    description: 'Message describing the response',
  })
  message: string;
  @ApiProperty({
    description: 'Updated asset details (transaction optional)',
    example: { asset: {}, transaction: {} },
    type: Object,
  })
  data: {
    asset: AssetResponseDto;
    transaction?: TransactionResponseDto;
  };
}

export class AssetSingleResponseDto {
  @ApiProperty({ example: 'success', description: 'Status of the response' })
  status: string;
  @ApiProperty({
    example: 'Asset retrieved successfully',
    description: 'Message describing the response',
  })
  message: string;
  @ApiProperty({
    type: AssetResponseDto,
    description: 'Asset details returned',
  })
  data: AssetResponseDto;
}

export class AssetErrorResponseDto {
  @ApiProperty({ example: 'error', description: 'Status of the response' })
  status: string;
  @ApiProperty({
    example: 'Asset not found',
    description: 'Error message describing the issue',
  })
  message: string;
  @ApiProperty({
    example: 'ASSET_NOT_FOUND',
    description: 'Application-specific error code',
  })
  error_code: string;
}
