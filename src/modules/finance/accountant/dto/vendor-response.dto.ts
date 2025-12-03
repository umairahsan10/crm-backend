import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VendorResponseDto {
  @ApiProperty({ example: 'success', description: 'Response status' })
  status: 'success' | 'error';

  @ApiProperty({
    example: 'Vendor retrieved successfully',
    description: 'Response message',
  })
  message: string;

  @ApiPropertyOptional({ example: 1, description: 'ID of the vendor' })
  vendor_id?: number;

  @ApiPropertyOptional({
    description: 'Vendor details',
    type: Object,
    example: {
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
  })
  vendor_data?: {
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
  };

  @ApiPropertyOptional({
    example: 'VENDOR_NOT_FOUND',
    description: 'Error code if request fails',
  })
  error_code?: string;
}
