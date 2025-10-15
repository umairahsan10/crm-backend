import { IsNumber, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentWays } from '@prisma/client';

export class MarkSalaryPaidDto {
  @ApiProperty({
    description: 'ID of the employee whose salary is being marked as paid',
    example: 123,
  })
  @IsNumber()
  employee_id: number;

  @ApiPropertyOptional({
    description: 'Payment method used for salary payment',
    enum: PaymentWays,
    example: PaymentWays.cash,
  })
  @IsOptional()
  @IsEnum(PaymentWays)
  type?: PaymentWays;
} 