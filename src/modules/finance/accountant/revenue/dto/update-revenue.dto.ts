import { IsString, IsNumber, IsPositive, IsDateString, IsOptional, IsEnum } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class UpdateRevenueDto {
  @IsNumber()
  @IsPositive()
  revenue_id: number;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;

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


}
