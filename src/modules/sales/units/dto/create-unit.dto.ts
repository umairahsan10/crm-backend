import { IsString, IsNotEmpty, IsEmail, IsNumber, IsPositive, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSalesUnitDto {
  @ApiProperty({ description: 'Name of the unit', example: 'Production Unit 1' })
  @IsString()
  @IsNotEmpty({ message: 'Unit name is required' })
  name: string;

  @ApiProperty({ description: 'Email of the unit', example: 'unit@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({ description: 'Phone number of the unit', example: '+92-300-1234567' })
  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  phone: string;

  @ApiProperty({ description: 'Address of the unit', example: '123 Street, City' })
  @IsString()
  @IsNotEmpty({ message: 'Address is required' })
  address: string;

  @ApiPropertyOptional({ description: 'ID of the head of the unit', example: 5 })
  @IsOptional()
  @IsNumber()
  @IsPositive({ message: 'Head ID must be a positive number' })
  headId?: number;

  @ApiPropertyOptional({ description: 'Logo URL of the unit', example: 'https://example.com/logo.png' })
  @IsOptional()
  @IsUrl({}, { message: 'Please provide a valid URL for logo' })
  logoUrl?: string;

  @ApiPropertyOptional({ description: 'Website URL of the unit', example: 'https://example.com' })
  @IsOptional()
  @IsUrl({}, { message: 'Please provide a valid URL for website' })
  website?: string;
}
