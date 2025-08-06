import { IsInt, IsDateString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CheckoutDto {
  @Type(() => Number)
  @IsInt()
  employee_id: number;

  @IsDateString()
  date: string;

  @IsDateString()
  checkout: string;
} 