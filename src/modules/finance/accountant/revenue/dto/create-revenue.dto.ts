import { IsString, IsNumber, IsPositive, IsDateString, IsOptional, IsEnum } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class CreateRevenueDto {
  @IsString()
  source: string;

  @IsString()
  category: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  receivedFrom?: number; // Lead ID

  @IsOptional()
  @IsDateString()
  receivedOn?: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  relatedInvoiceId?: number; // Invoice ID

  @IsOptional()
  @IsNumber()
  @IsPositive()
  transactionId?: number; // Transaction ID
}
