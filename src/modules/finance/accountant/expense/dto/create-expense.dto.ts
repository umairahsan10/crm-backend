import { IsString, IsNumber, IsPositive, IsDateString, IsOptional, IsEnum } from 'class-validator';
import { PaymentMethod, ProcessedByRole } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExpenseDto {
  @ApiProperty({
    description: 'Title of the expense',
    example: 'Office Stationery Purchase'
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Category of the expense',
    example: 'Office Supplies'
  })
  @IsString()
  category: string;

  @ApiProperty({
    description: 'Amount of the expense',
    example: 2500.75
  })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional({
    description: 'Date when the expense was paid (ISO 8601 format)',
    example: '2025-10-14T10:30:00Z'
  })
  @IsOptional()
  @IsDateString()
  paidOn?: string;

  @ApiPropertyOptional({
    description: 'Additional notes regarding the expense',
    example: 'Purchased stationery for HR department'
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Payment method used for the expense',
    enum: PaymentMethod,
    example: PaymentMethod.cash
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Role of the person who processed the expense',
    enum: ProcessedByRole,
    example: ProcessedByRole.Admin
  })
  @IsOptional()
  @IsEnum(ProcessedByRole)
  processedByRole?: ProcessedByRole;

  @ApiPropertyOptional({
    description: 'ID of the vendor associated with the expense',
    example: 12
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  vendorId?: number;
} 