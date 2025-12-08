import {
  IsString,
  IsOptional,
  IsNumber,
  IsEmail,
  IsUrl,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCompanySettingsDto {
  @ApiPropertyOptional({ description: 'Company name', example: 'Acme Corp' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Company address',
    example: '123 Main St',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'City', example: 'New York' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'State', example: 'NY' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'ZIP code', example: '10001' })
  @IsOptional()
  @IsString()
  zip?: string;

  @ApiPropertyOptional({ description: 'Country', example: 'USA' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '+1-555-1234' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'info@acme.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Website URL',
    example: 'https://www.acme.com',
  })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({
    description: 'Tax ID or registration number',
    example: 'TAX123456',
  })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional({
    description: 'Company status',
    example: 'active',
    enum: ['active', 'inactive'],
  })
  @IsOptional()
  @IsString()
  status?: string;

  // Attendance Settings
  @ApiPropertyOptional({
    description: 'Late time threshold in minutes',
    example: 30,
  })
  @IsOptional()
  @IsNumber()
  lateTime?: number;

  @ApiPropertyOptional({
    description: 'Half-day time threshold in minutes',
    example: 90,
  })
  @IsOptional()
  @IsNumber()
  halfTime?: number;

  @ApiPropertyOptional({
    description: 'Absent time threshold in minutes',
    example: 180,
  })
  @IsOptional()
  @IsNumber()
  absentTime?: number;

  // Leave Policies
  @ApiPropertyOptional({
    description: 'Monthly late days allowed',
    example: 3,
  })
  @IsOptional()
  @IsNumber()
  monthlyLatesDays?: number;

  @ApiPropertyOptional({
    description: 'Leaves accrued per month',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  monthlyLeavesAccrual?: number;

  // Deductions
  @ApiPropertyOptional({
    description: 'Absent deduction amount',
    example: 1000,
  })
  @IsOptional()
  @IsNumber()
  absentDeduction?: number;

  @ApiPropertyOptional({ description: 'Late deduction amount', example: 500 })
  @IsOptional()
  @IsNumber()
  lateDeduction?: number;

  @ApiPropertyOptional({
    description: 'Half-day deduction amount',
    example: 750,
  })
  @IsOptional()
  @IsNumber()
  halfDeduction?: number;
}
