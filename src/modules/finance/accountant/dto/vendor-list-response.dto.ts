import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VendorListResponseDto {
  @ApiProperty({ example: 'success', description: 'Response status' })
  status: 'success' | 'error';

  @ApiProperty({
    example: 'Vendors retrieved successfully',
    description: 'Response message',
  })
  message: string;

  @ApiPropertyOptional({
    description: 'List of vendors',
    type: [Object],
    example: [
      {
        id: 1,
        name: 'Acme Corp',
        contact_person: 'John Doe',
        email: 'john@acmecorp.com',
        phone: '+1234567890',
        address: '123 Main Street',
        city: 'Karachi',
        country: 'Pakistan',
        bank_account: 'PK00ACME123456',
        status: 'active',
        created_by: 101,
        notes: 'Top vendor for electronics',
        created_at: '2025-10-14T00:00:00.000Z',
        updated_at: '2025-10-14T00:00:00.000Z',
      },
    ],
  })
  vendors?: {
    id: number;
    name?: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    bank_account?: string;
    status?: string;
    created_by?: number;
    notes?: string;
    created_at: Date;
    updated_at: Date;
  }[];

  @ApiPropertyOptional({
    description: 'Pagination metadata',
    example: {
      total_count: 50,
      page: 1,
      limit: 10,
      total_pages: 5,
    },
  })
  metadata?: {
    total_count: number;
    page?: number;
    limit?: number;
    total_pages?: number;
  };

  @ApiPropertyOptional({
    example: 'VENDOR_LIST_ERROR',
    description: 'Error code if request fails',
  })
  error_code?: string;
}
