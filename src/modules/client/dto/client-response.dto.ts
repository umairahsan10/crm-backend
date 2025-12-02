import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { accStat } from '@prisma/client';

export class ClientResponseDto {
  @ApiProperty({ example: 1, description: 'Unique identifier for the client' })
  id: number;

  @ApiPropertyOptional({
    example: 'B2B',
    description: 'Type of the client (e.g., B2B, B2C)',
  })
  clientType?: string;

  @ApiPropertyOptional({
    example: 'Acme Corporation',
    description: 'Company name of the client',
  })
  companyName?: string;

  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Full name of the client',
  })
  clientName?: string;

  @ApiPropertyOptional({
    example: 'john.doe@acme.com',
    description: 'Email address of the client',
  })
  email?: string;

  @ApiPropertyOptional({
    example: '+1-555-123-4567',
    description: 'Primary phone number of the client',
  })
  phone?: string;

  @ApiPropertyOptional({
    example: '+1-555-765-4321',
    description: 'Alternate phone number',
  })
  altPhone?: string;

  @ApiPropertyOptional({
    example: '123 Market St',
    description: 'Street address of the client',
  })
  address?: string;

  @ApiPropertyOptional({ example: 'San Francisco', description: 'City name' })
  city?: string;

  @ApiPropertyOptional({
    example: 'California',
    description: 'State or province',
  })
  state?: string;

  @ApiPropertyOptional({ example: '94103', description: 'Postal or ZIP code' })
  postalCode?: string;

  @ApiPropertyOptional({
    example: 'United States',
    description: 'Country name',
  })
  country?: string;

  @ApiPropertyOptional({
    example: 3,
    description: 'Industry ID associated with this client',
  })
  industryId?: number;

  @ApiPropertyOptional({
    example: 'TAX-123456',
    description: 'Tax identification number',
  })
  taxId?: string;

  @ApiProperty({
    enum: accStat,
    example: accStat.active,
    description: 'Account status of the client',
  })
  accountStatus: accStat;

  @ApiPropertyOptional({
    example: 12,
    description: 'ID of the user who created this client record',
  })
  createdBy?: number;

  @ApiPropertyOptional({
    example: 'Preferred communication via email.',
    description: 'Additional notes about the client',
  })
  notes?: string;

  @ApiProperty({
    example: '2025-10-10T12:00:00Z',
    description: 'Date when the client record was created',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2025-10-12T08:30:00Z',
    description: 'Date when the client record was last updated',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    type: () => Object,
    description: 'Industry details associated with the client',
    example: {
      id: 3,
      name: 'Technology',
      description: 'Companies in the tech industry',
    },
  })
  industry?: {
    id: number;
    name: string;
    description?: string;
  };

  @ApiPropertyOptional({
    type: () => Object,
    description: 'Employee assigned to manage this client',
    example: {
      id: 7,
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'alice.johnson@company.com',
    },
  })
  employee?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export class ClientListResponseDto {
  @ApiProperty({
    type: [ClientResponseDto],
    description: 'List of clients in the response',
  })
  clients: ClientResponseDto[];

  @ApiProperty({
    example: 120,
    description: 'Total number of clients matching the query',
  })
  total: number;

  @ApiProperty({ example: 1, description: 'Current page number' })
  page: number;

  @ApiProperty({ example: 10, description: 'Number of clients per page' })
  limit: number;

  @ApiProperty({ example: 12, description: 'Total number of pages available' })
  totalPages: number;
}
