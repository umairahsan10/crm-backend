import { IsString, IsNumber, IsPositive, IsDateString, IsOptional, IsEnum } from 'class-validator';
import { PaymentMethod, ProcessedByRole } from '@prisma/client';

export class CreateExpenseDto {
  @IsString()
  title: string;

  @IsString()
  category: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsDateString()
  paidOn?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsEnum(ProcessedByRole)
  processedByRole?: ProcessedByRole;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  vendorId?: number;
} 