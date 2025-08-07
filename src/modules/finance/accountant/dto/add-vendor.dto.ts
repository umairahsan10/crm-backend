import { IsOptional, IsString, IsEmail, IsInt, Min, MaxLength, Matches } from 'class-validator';

export class AddVendorDto {
  @IsOptional()
  @IsString({ message: 'Vendor name must be a text string' })
  @MaxLength(255, { message: 'Vendor name cannot exceed 255 characters' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'Contact person name must be a text string' })
  @MaxLength(255, { message: 'Contact person name cannot exceed 255 characters' })
  contact_person?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address format (e.g., vendor@example.com)' })
  @MaxLength(255, { message: 'Email address cannot exceed 255 characters' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'Phone number must be a text string' })
  @MaxLength(50, { message: 'Phone number cannot exceed 50 characters' })
  @Matches(/^[\+]?[0-9\s\-\(\)]+$/, { 
    message: 'Phone number can only contain digits, spaces, hyphens, parentheses, and optionally a plus sign at the beginning' 
  })
  phone?: string;

  @IsOptional()
  @IsString({ message: 'Address must be a text string' })
  address?: string;

  @IsOptional()
  @IsString({ message: 'City must be a text string' })
  @MaxLength(100, { message: 'City name cannot exceed 100 characters' })
  city?: string;

  @IsOptional()
  @IsString({ message: 'Country must be a text string' })
  @MaxLength(100, { message: 'Country name cannot exceed 100 characters' })
  country?: string;

  @IsOptional()
  @IsString({ message: 'Bank account must be a text string' })
  @MaxLength(255, { message: 'Bank account number cannot exceed 255 characters' })
  bank_account?: string;

  @IsOptional()
  @IsString({ message: 'Status must be a text string' })
  @MaxLength(50, { message: 'Status cannot exceed 50 characters' })
  status?: string;

  @IsOptional()
  @IsString({ message: 'Notes must be a text string' })
  notes?: string;
} 