import { IsNumber, IsOptional, IsString, IsDecimal, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateAccountDto {
  @IsNumber()
  employeeId: number;

  @IsOptional()
  @IsString()
  accountTitle?: string;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  ibanNumber?: string;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal()
  @Min(0)
  baseSalary?: number;
}

export class UpdateAccountDto {
  @IsOptional()
  @IsString()
  accountTitle?: string;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  ibanNumber?: string;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal()
  @Min(0)
  baseSalary?: number;
} 