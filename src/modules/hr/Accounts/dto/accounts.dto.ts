import { IsNumber, IsOptional, IsString, IsDecimal, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAccountDto {
  @ApiProperty({ description: 'Employee ID', example: 1 })
  @IsNumber()
  employeeId: number;

  @ApiPropertyOptional({ description: 'Account title', example: 'Main Account' })
  @IsOptional()
  @IsString()
  accountTitle?: string;

  @ApiPropertyOptional({ description: 'Bank name', example: 'Chase Bank' })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({ description: 'IBAN number', example: 'US64SVBKUS6S3300958879' })
  @IsOptional()
  @IsString()
  ibanNumber?: string;

  @ApiPropertyOptional({ description: 'Base salary amount', example: 50000.00 })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal()
  @Min(0)
  baseSalary?: number;
}

export class UpdateAccountDto {
  @ApiPropertyOptional({ description: 'Account title', example: 'Main Account' })
  @IsOptional()
  @IsString()
  accountTitle?: string;

  @ApiPropertyOptional({ description: 'Bank name', example: 'Chase Bank' })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({ description: 'IBAN number', example: 'US64SVBKUS6S3300958879' })
  @IsOptional()
  @IsString()
  ibanNumber?: string;

  @ApiPropertyOptional({ description: 'Base salary amount', example: 50000.00 })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal()
  @Min(0)
  baseSalary?: number;
} 