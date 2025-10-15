import { IsString, IsNumber, IsPositive, IsDateString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, ProcessedByRole } from '@prisma/client';

export class UpdateExpenseDto {
  @ApiProperty({ example: 101, description: 'ID of the expense to update' })
  @IsNumber()
  @IsPositive()
  expense_id: number;

  @ApiPropertyOptional({ example: 'Office stationery purchase', description: 'Updated title of the expense' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Office Supplies', description: 'Updated category of the expense' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 5500, description: 'Updated amount of the expense' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;

  @ApiPropertyOptional({ example: '2025-10-15T10:30:00Z', description: 'Updated date when the expense was paid' })
  @IsOptional()
  @IsDateString()
  paidOn?: string;

  @ApiPropertyOptional({ example: 'Bought pens and papers', description: 'Optional notes for the expense' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'CASH', description: 'Updated payment method used', enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ example: 'ACCOUNTANT', description: 'Updated role that processed the expense', enum: ProcessedByRole })
  @IsOptional()
  @IsEnum(ProcessedByRole)
  processedByRole?: ProcessedByRole;

  @ApiPropertyOptional({ example: 5, description: 'Updated vendor ID, if applicable' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  vendorId?: number;
} 