import { IsNotEmpty, IsNumber, IsString, IsOptional, IsEmail, IsEnum } from 'class-validator';
import { TransactionType, PaymentWays } from '@prisma/client';

export class GeneratePaymentLinkDto {
  @IsNotEmpty()
  @IsNumber()
  leadId: number;

  // Client fields
  @IsNotEmpty()
  @IsString()
  clientName: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsNotEmpty()
  @IsString()
  country: string;

  @IsNotEmpty()
  @IsString()
  state: string;

  @IsNotEmpty()
  @IsString()
  postalCode: string;

  // industryId will be retrieved from the cracked lead, not from form

  // Transaction fields
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType = 'payment';

  @IsOptional()
  @IsEnum(PaymentWays)
  method?: PaymentWays = 'bank';
}
