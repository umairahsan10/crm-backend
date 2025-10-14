import { IsString, IsOptional, IsNumber, IsEmail, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCompanyDto {
  @ApiPropertyOptional({ description: 'Company name', example: 'Acme Corp' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Company address', example: '123 Main St' })
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

  @ApiPropertyOptional({ description: 'Email address', example: 'info@acme.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Website URL', example: 'https://www.acme.com' })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({ description: 'Quarterly leave days', example: 10 })
  @IsOptional()
  @IsNumber()
  quarterlyLeavesDays?: number;

  @ApiPropertyOptional({ description: 'Monthly lates allowed', example: 3 })
  @IsOptional()
  @IsNumber()
  monthlyLatesDays?: number;

  @ApiPropertyOptional({ description: 'Absent deduction in salary', example: 500 })
  @IsOptional()
  @IsNumber()
  absentDeduction?: number;

  @ApiPropertyOptional({ description: 'Late deduction in salary', example: 50 })
  @IsOptional()
  @IsNumber()
  lateDeduction?: number;

  @ApiPropertyOptional({ description: 'Half-day deduction in salary', example: 250 })
  @IsOptional()
  @IsNumber()
  halfDeduction?: number;

  @ApiPropertyOptional({ description: 'Tax ID or registration number', example: 'TAX123456' })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional({ description: 'Late time threshold in minutes', example: 15 })
  @IsOptional()
  @IsNumber()
  lateTime?: number;

  @ApiPropertyOptional({ description: 'Half-day time threshold in hours', example: 4 })
  @IsOptional()
  @IsNumber()
  halfTime?: number;

  @ApiPropertyOptional({ description: 'Absent time threshold in hours', example: 8 })
  @IsOptional()
  @IsNumber()
  absentTime?: number;
}
