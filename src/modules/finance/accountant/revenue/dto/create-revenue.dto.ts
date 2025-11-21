import { IsString, IsNumber, IsPositive, IsDateString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';

export class CreateRevenueDto {
  @ApiProperty({ example: 'Product Sale', description: 'Source of the revenue' })
  @IsString()
  source: string;

  @ApiProperty({ example: 'Sales', description: 'Category of the revenue' })
  @IsString()
  category: string;

  @ApiProperty({ example: 15000, description: 'Amount of revenue received' })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional({ example: 45, description: 'ID of the lead from whom revenue was received' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  receivedFrom?: number; // Lead ID

  @ApiPropertyOptional({ example: '2025-10-14T10:30:00Z', description: 'Date when revenue was received in ISO format' })
  @IsOptional()
  @IsDateString()
  receivedOn?: string;

  @ApiPropertyOptional({ example: PaymentMethod.cash, description: 'Payment method used', enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ example: 101, description: 'Related invoice ID, if applicable' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  relatedInvoiceId?: number; // Invoice ID

  @ApiPropertyOptional({ example: 201, description: 'Transaction ID if already linked' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  transactionId?: number; // Transaction ID
}
