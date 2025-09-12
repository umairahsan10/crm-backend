import { IsString, IsEmail, IsOptional, IsEnum, IsInt, MinLength, MaxLength } from 'class-validator';
import { accStat } from '@prisma/client';

export class UpdateClientDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  clientType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  companyName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  clientName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(255)
  passwordHash?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  altPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @IsOptional()
  @IsInt()
  industryId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxId?: string;

  @IsOptional()
  @IsEnum(accStat)
  accountStatus?: accStat;

  @IsOptional()
  @IsString()
  notes?: string;
}
