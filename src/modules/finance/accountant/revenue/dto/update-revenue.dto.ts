import {
  IsString,
  IsNumber,
  IsPositive,
  IsDateString,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { PaymentMethod } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRevenueDto {
  @ApiProperty({ example: 401, description: 'ID of the revenue to update' })
  @IsNumber()
  @IsPositive()
  revenue_id: number;

  @ApiPropertyOptional({
    example: 'Product Sale',
    description: 'Updated source of the revenue',
  })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({
    example: 'Sales',
    description: 'Updated category of the revenue',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    example: 15000,
    description: 'Updated amount of revenue received',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;

  @ApiPropertyOptional({
    example: 45,
    description: 'Updated ID of the lead from whom revenue was received',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  receivedFrom?: number; // Lead ID

  @ApiPropertyOptional({
    example: '2025-10-14T10:30:00Z',
    description: 'Updated date when revenue was received in ISO format',
  })
  @IsOptional()
  @IsDateString()
  receivedOn?: string;

  @ApiPropertyOptional({
    example: PaymentMethod.cash,
    description: 'Updated payment method used',
    enum: PaymentMethod,
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({
    example: 101,
    description: 'Updated related invoice ID, if applicable',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  relatedInvoiceId?: number; // Invoice ID
}
