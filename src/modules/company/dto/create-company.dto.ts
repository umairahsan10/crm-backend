import { IsString, IsOptional, IsNumber, IsEmail, IsUrl } from 'class-validator';

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
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsNumber()
  quarterlyLeavesDays?: number;

  @IsOptional()
  @IsNumber()
  monthlyLatesDays?: number;

  @IsOptional()
  @IsNumber()
  absentDeduction?: number;

  @IsOptional()
  @IsNumber()
  lateDeduction?: number;

  @IsOptional()
  @IsNumber()
  halfDeduction?: number;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsOptional()
  @IsNumber()
  lateTime?: number;

  @IsOptional()
  @IsNumber()
  halfTime?: number;

  @IsOptional()
  @IsNumber()
  absentTime?: number;
}
