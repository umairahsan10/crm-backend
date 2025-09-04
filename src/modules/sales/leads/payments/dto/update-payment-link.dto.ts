import { IsOptional, IsString, IsEmail, IsNumber, IsEnum } from 'class-validator';
import { TransactionType, PaymentWays } from '@prisma/client';

export class UpdatePaymentLinkDto {
  // Client fields that can be updated
  @IsOptional()
  @IsString()
  clientName?: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  // Transaction fields that can be updated
  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @IsOptional()
  @IsEnum(PaymentWays)
  method?: PaymentWays;
}
