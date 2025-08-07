import { IsNumber, IsEnum, IsOptional } from 'class-validator';
import { PaymentWays } from '@prisma/client';

export class MarkSalaryPaidDto {
  @IsNumber()
  employee_id: number;

  @IsOptional()
  @IsEnum(PaymentWays)
  type?: PaymentWays;
} 