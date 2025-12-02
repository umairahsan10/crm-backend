import {
  IsOptional,
  IsString,
  IsEmail,
  IsInt,
  Min,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AddVendorDto {
  @ApiPropertyOptional({
    example: 'Acme Corp',
    description: 'Vendor name (max 255 characters)',
  })
  @IsOptional()
  @IsString({ message: 'Vendor name must be a text string' })
  @MaxLength(255, { message: 'Vendor name cannot exceed 255 characters' })
  name?: string;

  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Contact person name (max 255 characters)',
  })
  @IsOptional()
  @IsString({ message: 'Contact person name must be a text string' })
  @MaxLength(255, {
    message: 'Contact person name cannot exceed 255 characters',
  })
  contact_person?: string;

  @ApiPropertyOptional({
    example: 'vendor@example.com',
    description: 'Valid email address (max 255 characters)',
  })
  @IsOptional()
  @IsEmail(
    {},
    {
      message:
        'Please provide a valid email address format (e.g., vendor@example.com)',
    },
  )
  @MaxLength(255, { message: 'Email address cannot exceed 255 characters' })
  email?: string;

  @ApiPropertyOptional({
    example: '+1-234-567-8900',
    description:
      'Phone number (digits, spaces, hyphens, parentheses, optional +)',
  })
  @IsOptional()
  @IsString({ message: 'Phone number must be a text string' })
  @MaxLength(50, { message: 'Phone number cannot exceed 50 characters' })
  @Matches(/^[\+]?[0-9\s\-\(\)]+$/, {
    message:
      'Phone number can only contain digits, spaces, hyphens, parentheses, and optionally a plus sign at the beginning',
  })
  phone?: string;

  @ApiPropertyOptional({
    example: '123 Main St',
    description: 'Address of the vendor',
  })
  @IsOptional()
  @IsString({ message: 'Address must be a text string' })
  address?: string;

  @ApiPropertyOptional({
    example: 'New York',
    description: 'City (max 100 characters)',
  })
  @IsOptional()
  @IsString({ message: 'City must be a text string' })
  @MaxLength(100, { message: 'City name cannot exceed 100 characters' })
  city?: string;

  @ApiPropertyOptional({
    example: 'USA',
    description: 'Country (max 100 characters)',
  })
  @IsOptional()
  @IsString({ message: 'Country must be a text string' })
  @MaxLength(100, { message: 'Country name cannot exceed 100 characters' })
  country?: string;

  @ApiPropertyOptional({
    example: '123456789012',
    description: 'Bank account number (max 255 characters)',
  })
  @IsOptional()
  @IsString({ message: 'Bank account must be a text string' })
  @MaxLength(255, {
    message: 'Bank account number cannot exceed 255 characters',
  })
  bank_account?: string;

  @ApiPropertyOptional({
    example: 'active',
    description: 'Status of the vendor (max 50 characters)',
  })
  @IsOptional()
  @IsString({ message: 'Status must be a text string' })
  @MaxLength(50, { message: 'Status cannot exceed 50 characters' })
  status?: string;

  @ApiPropertyOptional({
    example: 'Preferred vendor for electronics',
    description: 'Additional notes about the vendor',
  })
  @IsOptional()
  @IsString({ message: 'Notes must be a text string' })
  notes?: string;
}
