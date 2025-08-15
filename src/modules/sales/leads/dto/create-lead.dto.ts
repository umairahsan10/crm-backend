import { IsEnum, IsNotEmpty, IsOptional, IsString, IsEmail, IsNumber } from 'class-validator';
import { LeadSource, LeadType } from '@prisma/client';

export class CreateLeadDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(LeadSource)
  source?: LeadSource;

  @IsNotEmpty()
  @IsEnum(LeadType)
  type: LeadType;

  @IsNotEmpty()
  @IsNumber()
  salesUnitId: number;
}
