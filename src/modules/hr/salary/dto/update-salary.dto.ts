import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateSalaryDto {
  @IsInt()
  employee_id: number;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;
} 