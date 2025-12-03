import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompanySettingsResponseDto {
  @ApiProperty({ description: 'Unique identifier for the company', example: 1 })
  id: number;

  @ApiProperty({ description: 'Name of the company', example: 'ABC Company' })
  name: string;

  @ApiPropertyOptional({
    description: 'Address of the company',
    example: '123 Main Street',
  })
  address?: string;

  @ApiPropertyOptional({
    description: 'City where the company is located',
    example: 'New York',
  })
  city?: string;

  @ApiPropertyOptional({
    description: 'State where the company is located',
    example: 'NY',
  })
  state?: string;

  @ApiPropertyOptional({
    description: 'ZIP code of the company location',
    example: '10001',
  })
  zip?: string;

  @ApiPropertyOptional({
    description: 'Country where the company is located',
    example: 'USA',
  })
  country?: string;

  @ApiPropertyOptional({
    description: 'Contact phone number of the company',
    example: '+1-555-1234',
  })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Contact email of the company',
    example: 'info@example.com',
  })
  email?: string;

  @ApiPropertyOptional({
    description: 'Website of the company',
    example: 'https://www.example.com',
  })
  website?: string;

  @ApiPropertyOptional({
    description: 'Tax identification number of the company',
    example: 'TAX123456',
  })
  taxId?: string;

  @ApiProperty({ description: 'Company status', example: 'active' })
  status: string;

  // Attendance Settings
  @ApiProperty({ description: 'Late time threshold in minutes', example: 30 })
  lateTime: number;

  @ApiProperty({
    description: 'Half-day time threshold in minutes',
    example: 90,
  })
  halfTime: number;

  @ApiProperty({
    description: 'Absent time threshold in minutes',
    example: 180,
  })
  absentTime: number;

  // Leave Policies
  @ApiProperty({
    description: 'Number of quarterly leave days allowed',
    example: 20,
  })
  quarterlyLeavesDays: number;

  @ApiProperty({
    description: 'Number of monthly late days allowed',
    example: 3,
  })
  monthlyLatesDays: number;

  // Deductions
  @ApiProperty({ description: 'Deduction for each absent day', example: 1000 })
  absentDeduction: number;

  @ApiProperty({ description: 'Deduction for each late arrival', example: 500 })
  lateDeduction: number;

  @ApiProperty({
    description: 'Deduction for each half-day absence',
    example: 750,
  })
  halfDeduction: number;

  @ApiProperty({
    description: 'Timestamp when the company was created',
    example: '2023-10-01T12:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the company was last updated',
    example: '2023-10-10T15:30:00Z',
  })
  updatedAt: Date;
}
