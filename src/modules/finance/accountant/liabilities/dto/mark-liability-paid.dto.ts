import { IsNumber, IsOptional, IsPositive } from 'class-validator';

export class MarkLiabilityPaidDto {
  @IsNumber()
  @IsPositive()
  liability_id: number;

  @IsOptional()
  @IsNumber()
  transactionId?: number;
} 