import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsEnum, IsInt, MinLength, MaxLength } from 'class-validator';
import { accStat } from '@prisma/client';

export class UpdateClientDto {
  @ApiPropertyOptional({ example: 'B2C', description: 'Type of the client (e.g., B2B, B2C)' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  clientType?: string;

  @ApiPropertyOptional({ example: 'Globex Corporation', description: 'Company name of the client' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  companyName?: string;

  @ApiPropertyOptional({ example: 'Jane Smith', description: 'Client full name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  clientName?: string;

  @ApiPropertyOptional({ example: 'jane.smith@globex.com', description: 'Email address of the client' })
  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string;

  @ApiPropertyOptional({ example: '+44-7700-900123', description: 'Primary phone number' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({
    example: 'newP@ssw0rd!',
    description: 'Updated hashed password (optional, if password needs to be changed)',
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(255)
  passwordHash?: string;

  @ApiPropertyOptional({ example: '+44-7700-900999', description: 'Alternate phone number' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  altPhone?: string;

  @ApiPropertyOptional({ example: '456 Market St, Suite 200', description: 'Updated address of the client' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({ example: 'London', description: 'City where the client resides' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: 'England', description: 'State or province of the client' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional({ example: 'SW1A 1AA', description: 'Postal or ZIP code' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @ApiPropertyOptional({ example: 'United Kingdom', description: 'Country of residence' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({ example: 7, description: 'Industry ID associated with the client' })
  @IsOptional()
  @IsInt()
  industryId?: number;

  @ApiPropertyOptional({ example: 'TAX-987654', description: 'Tax identification number' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxId?: string;

  @ApiPropertyOptional({
    enum: accStat,
    example: accStat.active,
    description: 'Updated account status (e.g., active, inactive, suspended)',
  })
  @IsOptional()
  @IsEnum(accStat)
  accountStatus?: accStat;

  @ApiPropertyOptional({ example: 'Client requested billing contact update', description: 'Additional notes or remarks' })
  @IsOptional()
  @IsString()
  notes?: string;
}
