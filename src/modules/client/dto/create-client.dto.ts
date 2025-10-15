import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsEnum, IsInt, MinLength, MaxLength, IsNotEmpty } from 'class-validator';
import { accStat } from '@prisma/client';

export class CreateClientDto {
  @ApiPropertyOptional({ example: 'B2B', description: 'Type of the client (e.g., B2B, B2C)' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  clientType?: string;

  @ApiPropertyOptional({ example: 'Acme Corporation', description: 'Name of the client company' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  companyName?: string;

  @ApiPropertyOptional({ example: 'John Doe', description: 'Full name of the client' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  clientName?: string;

  @ApiPropertyOptional({ example: 'john.doe@acme.com', description: 'Email address of the client' })
  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string;

  @ApiPropertyOptional({ example: '+1-555-123-4567', description: 'Primary phone number of the client' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({
    example: 'P@ssw0rd!',
    description: 'Hashed password for the client account (will be securely stored)',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @MaxLength(255)
  passwordHash: string;

  @ApiPropertyOptional({ example: '+1-555-987-6543', description: 'Alternate phone number' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  altPhone?: string;

  @ApiPropertyOptional({ example: '123 Main St, Suite 400', description: 'Street address of the client' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({ example: 'New York', description: 'City where the client is based' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: 'NY', description: 'State or province of the client' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional({ example: '10001', description: 'Postal or ZIP code' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @ApiPropertyOptional({ example: 'United States', description: 'Country name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({ example: 3, description: 'Industry ID associated with the client' })
  @IsOptional()
  @IsInt()
  industryId?: number;

  @ApiPropertyOptional({ example: 'TAX-123456', description: 'Tax identification number of the client' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxId?: string;

  @ApiPropertyOptional({
    enum: accStat,
    example: accStat.active,
    description: 'Account status (e.g., active, inactive, suspended)',
  })
  @IsOptional()
  @IsEnum(accStat)
  accountStatus?: accStat;

  @ApiPropertyOptional({ example: 'Important long-term client.', description: 'Additional notes or remarks' })
  @IsOptional()
  @IsString()
  notes?: string;
}
