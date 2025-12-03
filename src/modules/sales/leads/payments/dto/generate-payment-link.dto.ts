import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  ValidateIf,
} from 'class-validator';
import { TransactionType, PaymentWays } from '@prisma/client';

export class GeneratePaymentLinkDto {
  @IsNotEmpty()
  @IsNumber()
  leadId: number;

  // Optional client ID - if provided, use existing client
  @IsOptional()
  @IsNumber()
  clientId?: number;

  // Client fields - required only if clientId is not provided
  @ValidateIf((o) => !o.clientId)
  @IsNotEmpty()
  @IsString()
  clientName?: string;

  @ValidateIf((o) => !o.clientId)
  @IsOptional()
  @IsString()
  companyName?: string;

  @ValidateIf((o) => !o.clientId)
  @IsNotEmpty()
  @IsEmail()
  email?: string;

  @ValidateIf((o) => !o.clientId)
  @IsNotEmpty()
  @IsString()
  phone?: string;

  @ValidateIf((o) => !o.clientId)
  @IsNotEmpty()
  @IsString()
  country?: string;

  @ValidateIf((o) => !o.clientId)
  @IsNotEmpty()
  @IsString()
  state?: string;

  @ValidateIf((o) => !o.clientId)
  @IsNotEmpty()
  @IsString()
  postalCode?: string;

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
