import { IsString, IsOptional, IsNumber, IsEmail } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  zip?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsNumber()
  quarterlyLeavesDays: number;

  @IsNumber()
  monthlyLatesDays: number;

  @IsNumber()
  absentDeduction: number;

  @IsNumber()
  lateDeduction: number;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsNumber()
  lateTime: number;

  @IsNumber()
  halfTime: number;
} 