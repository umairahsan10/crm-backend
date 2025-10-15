import { IsString, IsOptional, IsNumber, IsEmail, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCompanyDto {
  @ApiProperty({ description: 'Name of the company', example: 'ABC Company' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Address of the company', example: '123 Main Street' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'City where the company is located', example: 'New York' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'State where the company is located', example: 'NY' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'ZIP code of the company location', example: '10001' })
  @IsOptional()
  @IsString()
  zip?: string;

  @ApiPropertyOptional({ description: 'Country where the company is located', example: 'USA' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'Contact phone number of the company', example: '+1-555-1234' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Contact email of the company', example: 'Hb9t9@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Website of the company', example: 'https://www.abccompany.com' })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({ description: 'Number of quarterly leave days allowed', example: 10 })
  @IsOptional()
  @IsNumber()
  quarterlyLeavesDays?: number;

  @ApiPropertyOptional({ description: 'Number of monthly late days allowed', example: 5 })
  @IsOptional()
  @IsNumber()
  monthlyLatesDays?: number;

  @ApiPropertyOptional({ description: 'Deduction for each absent day', example: 100 })
  @IsOptional()
  @IsNumber()
  absentDeduction?: number;

  @ApiPropertyOptional({ description: 'Deduction for each late arrival', example: 20 })
  @IsOptional()
  @IsNumber()
  lateDeduction?: number;

  @ApiPropertyOptional({ description: 'Deduction for each half-day absence', example: 50 })
  @IsOptional()
  @IsNumber()
  halfDeduction?: number;

  @ApiPropertyOptional({ description: 'Tax ID of the company', example: '123456789' })
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
