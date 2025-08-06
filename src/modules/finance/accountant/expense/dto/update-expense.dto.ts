import { IsString, IsNumber, IsPositive, IsDateString, IsOptional, IsEnum } from 'class-validator';
import { PaymentMethod, ProcessedByRole } from '@prisma/client';

export class UpdateExpenseDto {
  @IsNumber()
  @IsPositive()
  expense_id: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;

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